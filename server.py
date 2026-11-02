#!/usr/bin/env python3
"""
WordMaster server
=================
* serves the site (index.html, style.css, script.js, auth.js ...)
* accounts: register / login / logout (password hashed with scrypt, random session token)
* stores every user's data (words, sets, essays, stats ...) in a SQLite file

Only the Python standard library is used - nothing to install.

Run:    python server.py
Open:   http://localhost:8000

Settings (optional environment variables):
    PORT=8000            port
    HOST=0.0.0.0         0.0.0.0 = reachable from other devices in your network,
                         127.0.0.1 = only this computer
    SECURE_COOKIE=1      set it when the site is behind HTTPS
    TRUST_PROXY=1        set it only when a reverse proxy (nginx, Caddy) is in front
    WORDMASTER_DB=path   where to keep the database file
"""

import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import socket
import sqlite3
import threading
import time
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("WORDMASTER_DB", BASE_DIR / "wordmaster.db"))
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8000"))
SECURE_COOKIE = os.environ.get("SECURE_COOKIE") == "1"
TRUST_PROXY = os.environ.get("TRUST_PROXY") == "1"

COOKIE_NAME = "wm_session"
SESSION_SECONDS = 30 * 24 * 3600

MAX_BODY = 12 * 1024 * 1024          # one request
MAX_VALUE_CHARS = 5_500_000          # one stored key (browser limit is about 5 MB anyway)
MAX_USER_CHARS = 40_000_000          # everything of one user
MAX_ITEMS_PER_REQUEST = 200

USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]{3,30}$")
KEY_RE = re.compile(r"^[A-Za-z0-9_.:-]{1,80}$")

# Files that the web server is allowed to hand out (nothing else: no .py, no .db)
STATIC_EXTENSIONS = {
    ".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".ico", ".mp3", ".wav", ".ogg", ".woff", ".woff2", ".ttf",
}

# ------------------------------------------------------------------ database

def db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = db()
    conn.execute("PRAGMA journal_mode = WAL")
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT NOT NULL,
            username_lc TEXT NOT NULL UNIQUE,
            pw          TEXT NOT NULL,
            created_at  INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS user_data (
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            key        TEXT NOT NULL,
            value      TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (user_id, key)
        );
        """
    )
    conn.commit()
    conn.close()


# ------------------------------------------------------------------ passwords

def hash_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=2 ** 14, r=8, p=1, dklen=32
    )
    return "scrypt$%s$%s" % (salt.hex(), digest.hex())


def check_password(password, stored):
    try:
        scheme, salt_hex, digest_hex = stored.split("$")
        if scheme != "scrypt":
            return False
        expected = hash_password(password, bytes.fromhex(salt_hex))
        return hmac.compare_digest(expected, stored)
    except Exception:
        return False


# a fake hash, so a wrong username takes as long as a wrong password
DUMMY_HASH = hash_password("dummy-password-for-timing")


def token_hash(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ------------------------------------------------------------------ rate limit

_attempts = {}
_attempts_lock = threading.Lock()


def _recent(key, window):
    now = time.time()
    items = [t for t in _attempts.get(key, []) if now - t < window]
    _attempts[key] = items
    return items


def is_blocked(key, limit, window):
    with _attempts_lock:
        return len(_recent(key, window)) >= limit


def add_attempt(key, window):
    with _attempts_lock:
        _recent(key, window).append(time.time())


def clear_attempts(key):
    with _attempts_lock:
        _attempts.pop(key, None)


# ------------------------------------------------------------------ helpers

class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def validate_items(items, allow_null):
    """items = {key: string (or None when allow_null)}"""
    if not isinstance(items, dict):
        raise ApiError(400, "bad_data", "Неверный формат данных.")
    if len(items) > MAX_ITEMS_PER_REQUEST:
        raise ApiError(400, "too_many", "Слишком много ключей за один запрос.")
    clean = {}
    for key, value in items.items():
        if not isinstance(key, str) or not KEY_RE.match(key) or key.startswith("wm_"):
            raise ApiError(400, "bad_key", "Недопустимое имя ключа.")
        if value is None and allow_null:
            clean[key] = None
            continue
        if not isinstance(value, str):
            raise ApiError(400, "bad_value", "Значение должно быть строкой.")
        if len(value) > MAX_VALUE_CHARS:
            raise ApiError(413, "too_big", "Данные слишком большие.")
        clean[key] = value
    return clean


def write_items(conn, user_id, items):
    now = int(time.time())
    for key, value in items.items():
        if value is None:
            conn.execute(
                "DELETE FROM user_data WHERE user_id = ? AND key = ?", (user_id, key)
            )
        else:
            conn.execute(
                "INSERT INTO user_data (user_id, key, value, updated_at) VALUES (?,?,?,?) "
                "ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, "
                "updated_at = excluded.updated_at",
                (user_id, key, value, now),
            )
    total = conn.execute(
        "SELECT COALESCE(SUM(LENGTH(value)), 0) FROM user_data WHERE user_id = ?",
        (user_id,),
    ).fetchone()[0]
    if total > MAX_USER_CHARS:
        raise ApiError(413, "quota", "Превышен лимит хранилища аккаунта.")


# ------------------------------------------------------------------ http handler

class Handler(BaseHTTPRequestHandler):
    server_version = "WordMaster"
    sys_version = ""

    # ---- logging without bodies (never log passwords)
    def log_message(self, fmt, *args):
        print("%s  %s" % (self.log_date_time_string(), fmt % args))

    # ---- basic output
    def _send(self, status, body=b"", content_type="application/json; charset=utf-8",
              extra_headers=None, send_body=True):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")
        for name, value in (extra_headers or []):
            self.send_header(name, value)
        self.end_headers()
        if send_body:
            self.wfile.write(body)

    def _json(self, status, payload, extra_headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers = [("Cache-Control", "no-store")] + (extra_headers or [])
        self._send(status, body, extra_headers=headers)

    def _client_ip(self):
        if TRUST_PROXY:
            forwarded = self.headers.get("X-Forwarded-For", "")
            if forwarded:
                return forwarded.split(",")[0].strip()
        return self.client_address[0]

    # ---- request reading
    def _read_json(self):
        content_type = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        if content_type != "application/json":
            raise ApiError(415, "bad_type", "Нужен Content-Type: application/json.")
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ApiError(400, "bad_length", "Неверная длина запроса.")
        if length <= 0:
            raise ApiError(400, "empty", "Пустой запрос.")
        if length > MAX_BODY:
            raise ApiError(413, "too_big", "Запрос слишком большой.")
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            raise ApiError(400, "bad_json", "Неверный JSON.")
        if not isinstance(data, dict):
            raise ApiError(400, "bad_json", "Неверный JSON.")
        return data

    def _check_origin(self):
        """Protects against requests sent from other websites (CSRF)."""
        origin = self.headers.get("Origin")
        if not origin:
            return
        host = self.headers.get("Host", "")
        if urlparse(origin).netloc != host:
            raise ApiError(403, "bad_origin", "Запрос с другого сайта отклонён.")

    # ---- sessions
    def _session_user(self):
        cookie_header = self.headers.get("Cookie")
        if not cookie_header:
            return None
        try:
            cookie = SimpleCookie(cookie_header)
        except Exception:
            return None
        morsel = cookie.get(COOKIE_NAME)
        if not morsel:
            return None
        conn = db()
        try:
            row = conn.execute(
                "SELECT users.id, users.username FROM sessions "
                "JOIN users ON users.id = sessions.user_id "
                "WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
                (token_hash(morsel.value), int(time.time())),
            ).fetchone()
        finally:
            conn.close()
        return {"id": row[0], "username": row[1]} if row else None

    def _require_user(self):
        user = self._session_user()
        if not user:
            raise ApiError(401, "not_logged_in", "Нужно войти в аккаунт.")
        return user

    def _cookie_header(self, token, max_age):
        parts = [
            "%s=%s" % (COOKIE_NAME, token),
            "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=%d" % max_age,
        ]
        if SECURE_COOKIE:
            parts.append("Secure")
        return ("Set-Cookie", "; ".join(parts))

    def _new_session(self, conn, user_id):
        token = secrets.token_urlsafe(32)
        now = int(time.time())
        conn.execute("DELETE FROM sessions WHERE expires_at < ?", (now,))
        conn.execute(
            "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?,?,?,?)",
            (token_hash(token), user_id, now, now + SESSION_SECONDS),
        )
        return token

    # ---- routing
    def do_GET(self):
        self._dispatch("GET")

    def do_HEAD(self):
        self._dispatch("HEAD")

    def do_POST(self):
        self._dispatch("POST")

    def do_PUT(self):
        self._dispatch("PUT")

    def do_DELETE(self):
        self._dispatch("DELETE")

    def _dispatch(self, method):
        path = urlparse(self.path).path
        try:
            if path.startswith("/api/"):
                if method in ("POST", "PUT", "DELETE"):
                    self._check_origin()
                self._api(method, path)
            elif method in ("GET", "HEAD"):
                self._static(path, send_body=(method == "GET"))
            else:
                raise ApiError(405, "method", "Метод не поддерживается.")
        except ApiError as error:
            self._json(error.status, {"error": error.code, "message": error.message})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as error:  # never show internal details to the browser
            print("ERROR:", repr(error))
            try:
                self._json(500, {"error": "server", "message": "Ошибка сервера."})
            except Exception:
                pass

    # ---- API
    def _api(self, method, path):
        if path == "/api/me" and method == "GET":
            user = self._require_user()
            return self._json(200, {"username": user["username"]})

        if path == "/api/register" and method == "POST":
            return self._register()

        if path == "/api/login" and method == "POST":
            return self._login()

        if path == "/api/logout" and method == "POST":
            return self._logout()

        if path == "/api/data" and method == "GET":
            user = self._require_user()
            conn = db()
            try:
                rows = conn.execute(
                    "SELECT key, value FROM user_data WHERE user_id = ?", (user["id"],)
                ).fetchall()
            finally:
                conn.close()
            return self._json(200, {"items": {key: value for key, value in rows}})

        if path == "/api/data" and method == "PUT":
            user = self._require_user()
            body = self._read_json()
            items = validate_items(body.get("items"), allow_null=True)
            conn = db()
            try:
                write_items(conn, user["id"], items)
                conn.commit()
            except Exception:
                conn.rollback()
                raise
            finally:
                conn.close()
            return self._json(200, {"ok": True})

        raise ApiError(404, "not_found", "Не найдено.")

    def _credentials(self, body):
        username = body.get("username")
        password = body.get("password")
        if not isinstance(username, str) or not isinstance(password, str):
            raise ApiError(400, "bad_credentials", "Введи имя и пароль.")
        return username.strip(), password

    def _register(self):
        ip = self._client_ip()
        if is_blocked("reg:" + ip, 10, 3600):
            raise ApiError(429, "rate_limit", "Слишком много регистраций. Попробуй позже.")

        body = self._read_json()
        username, password = self._credentials(body)

        if not USERNAME_RE.match(username):
            raise ApiError(
                400, "bad_username",
                "Имя: 3–30 символов, только латиница, цифры, точка, дефис, подчёркивание.",
            )
        if len(password) < 8:
            raise ApiError(400, "weak_password", "Пароль: минимум 8 символов.")
        if len(password) > 128:
            raise ApiError(400, "long_password", "Пароль слишком длинный (максимум 128).")

        initial = {}
        if body.get("data") is not None:
            initial = validate_items(body.get("data"), allow_null=False)

        add_attempt("reg:" + ip, 3600)

        conn = db()
        try:
            try:
                cursor = conn.execute(
                    "INSERT INTO users (username, username_lc, pw, created_at) VALUES (?,?,?,?)",
                    (username, username.lower(), hash_password(password), int(time.time())),
                )
            except sqlite3.IntegrityError:
                raise ApiError(409, "username_taken", "Это имя уже занято.")
            user_id = cursor.lastrowid
            if initial:
                write_items(conn, user_id, initial)
            token = self._new_session(conn, user_id)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

        self._json(
            200, {"username": username},
            extra_headers=[self._cookie_header(token, SESSION_SECONDS)],
        )

    def _login(self):
        ip = self._client_ip()
        body = self._read_json()
        username, password = self._credentials(body)
        key = "login:%s:%s" % (ip, username.lower())
        ip_key = "loginip:" + ip

        if is_blocked(key, 5, 300) or is_blocked(ip_key, 40, 300):
            raise ApiError(
                429, "rate_limit", "Слишком много попыток. Подожди 5 минут и попробуй снова."
            )

        conn = db()
        try:
            row = conn.execute(
                "SELECT id, username, pw FROM users WHERE username_lc = ?",
                (username.lower(),),
            ).fetchone()
            stored = row[2] if row else DUMMY_HASH
            ok = check_password(password, stored) and row is not None
            if not ok:
                add_attempt(key, 300)
                add_attempt(ip_key, 300)
                raise ApiError(401, "bad_login", "Неверное имя или пароль.")
            clear_attempts(key)
            token = self._new_session(conn, row[0])
            conn.commit()
        finally:
            conn.close()

        self._json(
            200, {"username": row[1]},
            extra_headers=[self._cookie_header(token, SESSION_SECONDS)],
        )

    def _logout(self):
        cookie_header = self.headers.get("Cookie")
        if cookie_header:
            try:
                morsel = SimpleCookie(cookie_header).get(COOKIE_NAME)
            except Exception:
                morsel = None
            if morsel:
                conn = db()
                try:
                    conn.execute(
                        "DELETE FROM sessions WHERE token_hash = ?", (token_hash(morsel.value),)
                    )
                    conn.commit()
                finally:
                    conn.close()
        self._json(200, {"ok": True}, extra_headers=[self._cookie_header("", 0)])

    # ---- static files
    def _static(self, path, send_body):
        path = unquote(path)
        if path == "/":
            path = "/index.html"
        if "\x00" in path or "\\" in path:
            raise ApiError(404, "not_found", "Не найдено.")
        parts = [p for p in path.split("/") if p]
        if not parts or any(p.startswith(".") for p in parts):
            raise ApiError(404, "not_found", "Не найдено.")
        target = (BASE_DIR.joinpath(*parts)).resolve()
        try:
            target.relative_to(BASE_DIR)
        except ValueError:
            raise ApiError(404, "not_found", "Не найдено.")
        if target.suffix.lower() not in STATIC_EXTENSIONS or not target.is_file():
            raise ApiError(404, "not_found", "Не найдено.")

        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        if target.suffix.lower() == ".js":
            content_type = "text/javascript"
        if content_type.startswith("text/") or content_type in ("image/svg+xml",):
            content_type += "; charset=utf-8"

        body = target.read_bytes()
        self._send(
            200, body, content_type,
            extra_headers=[("Cache-Control", "no-cache")],  # always check for a new version
            send_body=send_body,
        )


# ------------------------------------------------------------------ start

def lan_address():
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("10.255.255.255", 1))
        address = sock.getsockname()[0]
        sock.close()
        return address
    except Exception:
        return None


def main():
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print("WordMaster server is running.")
    print("  On this computer:  http://localhost:%d" % PORT)
    if HOST == "0.0.0.0":
        address = lan_address()
        if address:
            print("  Other devices in the same Wi-Fi:  http://%s:%d" % (address, PORT))
    print("  Database file:     %s" % DB_PATH)
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
