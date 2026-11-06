#!/usr/bin/env python3
"""
WordMaster - tool for the OWNER of the server (you).

    python admin.py list                        show all accounts (no passwords)
    python admin.py reset-password NAME         give NAME a new temporary password
    python admin.py reset-password NAME NEWPASS (or choose the password yourself)
    python admin.py delete-user NAME            delete an account with all its data

Passwords of users are stored as one-way hashes: nobody (not even you) can read
them. If a friend forgets the password, use reset-password and send the new
temporary password; they can change it in the "Account" panel after login.

Uses the same database as server.py (set WORDMASTER_DB if you moved it).
Works while the server is running.
"""

import secrets
import sys
import time

import server


def connect():
    if not server.DB_PATH.exists():
        sys.exit("Database not found: %s\n(start server.py once first)" % server.DB_PATH)
    return server.db()


def find_user(conn, name):
    row = conn.execute(
        "SELECT id, username FROM users WHERE username_lc = ?", (name.strip().lower(),)
    ).fetchone()
    if not row:
        sys.exit("No such user: %s" % name)
    return row


def cmd_list():
    conn = connect()
    rows = conn.execute(
        "SELECT u.id, u.username, u.created_at,"
        " (SELECT COUNT(*) FROM user_data d WHERE d.user_id = u.id),"
        " (SELECT COALESCE(SUM(LENGTH(value)), 0) FROM user_data d WHERE d.user_id = u.id),"
        " (SELECT COUNT(*) FROM images i WHERE i.user_id = u.id),"
        " (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > ?)"
        " FROM users u ORDER BY u.id",
        (int(time.time()),),
    ).fetchall()
    conn.close()
    if not rows:
        print("No accounts yet.")
        return
    print("%-24s %-12s %8s %8s %9s" % ("username", "created", "data KB", "pictures", "logged in"))
    for _id, name, created, keys, chars, images, sessions in rows:
        print("%-24s %-12s %8d %8d %9d" % (
            name, time.strftime("%Y-%m-%d", time.localtime(created)),
            chars // 1000, images, sessions))
    print("\nTotal accounts: %d" % len(rows))


def cmd_reset(name, new_password=None):
    conn = connect()
    user_id, username = find_user(conn, name)
    password = new_password or secrets.token_urlsafe(9)
    if not 8 <= len(password) <= 128:
        sys.exit("The password must be 8-128 characters.")
    conn.execute("UPDATE users SET pw = ? WHERE id = ?", (server.hash_password(password), user_id))
    conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))   # log out everywhere
    conn.commit()
    conn.close()
    print("New password for %s:" % username)
    print()
    print("    %s" % password)
    print()
    print("All devices of this user were logged out. Tell them to change the password")
    print("after login (button 'Account').")


def cmd_delete(name):
    conn = connect()
    user_id, username = find_user(conn, name)
    typed = input("This deletes '%s' with ALL words, essays and pictures.\n"
                  "Type the username again to confirm: " % username)
    if typed.strip().lower() != username.lower():
        sys.exit("Cancelled.")
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    print("Deleted: %s" % username)


def main(argv):
    if len(argv) >= 2 and argv[1] == "list":
        return cmd_list()
    if len(argv) in (3, 4) and argv[1] == "reset-password":
        return cmd_reset(argv[2], argv[3] if len(argv) == 4 else None)
    if len(argv) == 3 and argv[1] == "delete-user":
        return cmd_delete(argv[2])
    print(__doc__)


if __name__ == "__main__":
    main(sys.argv)
