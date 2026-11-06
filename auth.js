/*
 * WordMaster - accounts and sync
 * ------------------------------
 * 1. Checks if you are logged in (asks the server). If not -> shows the login screen.
 * 2. After login, copies your saved data from the server into localStorage.
 * 3. Only THEN loads script.js, so script.js works exactly as before.
 * 4. Every change that script.js writes to localStorage is sent to the server
 *    (with a short delay). If there is no connection, the change waits and is
 *    sent later, nothing is lost.
 *
 * Keys that start with "wm_" are internal and are never sent to the server.
 */
(function () {
    "use strict";

    var LS = window.localStorage;

    var USER_KEY = "wm_user";       // whose data is in this browser
    var DIRTY_KEY = "wm_dirty";     // keys that are not on the server yet
    var BACKUP_KEY = "wm_backup";   // safety copy if data had to be replaced

    var nativeSet = Storage.prototype.setItem;
    var nativeRemove = Storage.prototype.removeItem;
        var LOCAL_MODE_KEY = "wm_local_mode";
    var isGitHubPages = location.hostname.toLowerCase().endsWith(".github.io");

    var authed = false;
    var appLoaded = false;
    var pending = {};               // key -> string (save) | null (delete)
    var flushTimer = null;
    var inflight = null;
    var retryDelay = 5000;
    var statusEl = null;
    var inviteRequired = false;     // the server asks for an invite code when registering
    var statusKind = "saved";
    var infoNotice = "";


    // ============================================================
    // Small helpers
    // ============================================================

    function isSynced(key) {
        return typeof key === "string" && key.indexOf("wm_") !== 0;
    }

    function syncedKeys() {
        var keys = [];
        for (var i = 0; i < LS.length; i++) {
            var key = LS.key(i);
            if (isSynced(key)) keys.push(key);
        }
        return keys;
    }

    function readDirty() {
        try {
            var list = JSON.parse(LS.getItem(DIRTY_KEY) || "[]");
            return Array.isArray(list) ? list : [];
        } catch (error) {
            return [];
        }
    }

    function writeDirty(list) {
        try {
            if (list.length) LS.setItem(DIRTY_KEY, JSON.stringify(list));
            else LS.removeItem(DIRTY_KEY);
        } catch (error) { /* storage full: nothing more we can do */ }
    }

    function collectLocal() {
        var data = {};
        syncedKeys().forEach(function (key) {
            data[key] = LS.getItem(key);
        });
        return data;
    }

    function wipeLocal() {
        syncedKeys().forEach(function (key) {
            nativeRemove.call(LS, key);
        });
        try { LS.removeItem(DIRTY_KEY); } catch (error) {}
    }

    function backupLocal(owner) {
        try {
            LS.setItem(BACKUP_KEY, JSON.stringify({
                owner: owner,
                savedAt: new Date().toISOString(),
                data: collectLocal()
            }));
        } catch (error) { /* too big for the browser: skip the backup */ }
    }

    function applyServerData(items) {
        syncedKeys().forEach(function (key) {
            if (!(key in items)) nativeRemove.call(LS, key);
        });
        Object.keys(items).forEach(function (key) {
            nativeSet.call(LS, key, items[key]);
        });
    }

    async function api(method, path, body, options) {
        try {
            var init = {
                method: method,
                credentials: "same-origin",
                headers: {},
                keepalive: !!(options && options.keepalive)
            };
            if (body !== undefined) {
                init.headers["Content-Type"] = "application/json";
                init.body = JSON.stringify(body);
            }
            var response = await fetch(path, init);
            var data = null;
            try { data = await response.json(); } catch (error) {}
            return { ok: response.ok, status: response.status, data: data };
        } catch (error) {
            return { ok: false, status: 0, data: null };   // no connection
        }
    }

    // Turns a failed request into a message the user can act on
    function explainFailure(result, fallback) {
        if (result.status === 0) {
            return location.protocol === "file:"
                ? "Страница открыта как файл. Запусти start_wordmaster.bat и открой http://localhost:8000"
                : "Нет связи с сервером. Запущен ли start_wordmaster.bat? Чёрное окно должно быть открыто.";
        }
        if (result.data && result.data.message) return result.data.message;
        if (!result.data || result.status === 404 || result.status === 405 || result.status === 501) {
            return "Это не сервер WordMaster (код " + result.status + "). " +
                "Запусти start_wordmaster.bat и открой сайт по адресу http://localhost:8000 — " +
                "не через Live Server и не двойным кликом по index.html.";
        }
        return fallback || ("Ошибка (код " + result.status + "). Попробуй ещё раз.");
    }

    // "Show password" check box for one or more password fields
    function makeShowToggle(id, inputs) {
        var label = document.createElement("label");
        label.className = "wmShow";

        var box = document.createElement("input");
        box.type = "checkbox";
        box.id = id;
        box.addEventListener("change", function () {
            inputs.forEach(function (input) {
                input.type = box.checked ? "text" : "password";
            });
        });

        var text = document.createElement("span");
        text.textContent = "👁 Показать пароль";

        label.appendChild(box);
        label.appendChild(text);
        return label;
    }

    async function pushKeys(keys) {
        var items = {};
        keys.forEach(function (key) {
            items[key] = LS.getItem(key);                  // null = deleted
        });
        return api("PUT", "/api/data", { items: items });
    }


    // ============================================================
    // Sync: every localStorage change goes to the server
    // ============================================================

    function queue(key, value) {
        pending[key] = value;

        var dirty = readDirty();
        if (dirty.indexOf(key) === -1) {
            dirty.push(key);
            writeDirty(dirty);
        }

        setStatus("pending");

        clearTimeout(flushTimer);
        flushTimer = setTimeout(function () { flush(); }, 800);
    }

    Storage.prototype.setItem = function (key, value) {
        nativeSet.call(this, key, value);
        if (this === LS && authed && isSynced(String(key))) {
            queue(String(key), String(value));
        }
    };

    Storage.prototype.removeItem = function (key) {
        nativeRemove.call(this, key);
        if (this === LS && authed && isSynced(String(key))) {
            queue(String(key), null);
        }
    };

    async function flush(options) {
        clearTimeout(flushTimer);
        flushTimer = null;

        if (inflight) await inflight;

        var keys = Object.keys(pending);
        if (!keys.length) {
            if (authed) setStatus("saved");
            return true;
        }

        var items = pending;
        pending = {};

        inflight = api("PUT", "/api/data", { items: items }, options);
        var result = await inflight;
        inflight = null;

        if (result.ok) {
            var dirty = readDirty().filter(function (key) {
                return !(key in items) || (key in pending);
            });
            writeDirty(dirty);
            retryDelay = 5000;

            if (Object.keys(pending).length) {
                flushTimer = setTimeout(function () { flush(); }, 800);
            } else {
                setStatus("saved");
            }
            return true;
        }

        // failed: put the changes back (newer changes win)
        keys.forEach(function (key) {
            if (!(key in pending)) pending[key] = items[key];
        });

        if (result.status === 401) {
            sessionExpired();
            return false;
        }

        // 4xx (except 429) means the server refuses this data: retrying is pointless
        if (result.status >= 400 && result.status < 500 && result.status !== 429) {
            keys.forEach(function (key) { delete pending[key]; });
            writeDirty(readDirty().filter(function (key) {
                return keys.indexOf(key) === -1;
            }));
            setStatus("error", (result.data && result.data.message) || "сервер отклонил данные");
            return false;
        }

        setStatus("offline");
        flushTimer = setTimeout(function () { flush(); }, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 60000);
        return false;
    }

    function resumeDirty() {
        readDirty().forEach(function (key) {
            pending[key] = LS.getItem(key);
        });
        if (Object.keys(pending).length) {
            setStatus("pending");
            flushTimer = setTimeout(function () { flush(); }, 800);
        }
    }

    // Send everything that is waiting when the page is closed / hidden
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden" && authed) flush({ keepalive: true });
    });
    window.addEventListener("pagehide", function () {
        if (authed) flush({ keepalive: true });
    });
    window.addEventListener("online", function () {
        if (authed) flush();
    });

    function sessionExpired() {
        authed = false;
        showAuth("login", "Сессия закончилась. Войди снова — несохранённые изменения не потеряются.");
    }


    // ============================================================
    // Word pictures: shrink in the browser, keep on the server
    // ============================================================

    function loadImageFile(file) {
        return new Promise(function (resolve, reject) {
            var url = URL.createObjectURL(file);
            var img = new Image();
            img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new Error("Не удалось прочитать картинку."));
            };
            img.src = url;
        });
    }

    // returns a short link like "/api/image/ab12cd34ef567890"
    window.wmUploadImage = async function (file) {
        if (!file || !/^image\//.test(file.type || "")) {
            throw new Error("Выбери файл-картинку.");
        }

        var img = await loadImageFile(file);
        var longest = Math.max(img.naturalWidth, img.naturalHeight) || 1;
        var scale = Math.min(1, 480 / longest);        // at most 480 px
        var width = Math.max(1, Math.round(img.naturalWidth * scale));
        var height = Math.max(1, Math.round(img.naturalHeight * scale));

        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";                  // JPEG has no transparency
        context.fillRect(0, 0, width, height);
        context.drawImage(img, 0, 0, width, height);

        var blob = await new Promise(function (resolve) {
            canvas.toBlob(resolve, "image/jpeg", 0.82);
        });
        if (!blob) throw new Error("Не удалось сжать картинку.");

        var response;
        try {
            response = await fetch("/api/image", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "image/jpeg" },
                body: blob
            });
        } catch (error) {
            throw new Error("Нет связи с сервером.");
        }

        var data = null;
        try { data = await response.json(); } catch (error) {}

        if (response.status === 401) {
            sessionExpired();
            throw new Error("Сессия закончилась. Войди снова.");
        }
        if (!response.ok || !data || !data.url) {
            throw new Error((data && data.message) || "Сервер не принял картинку.");
        }
        return data.url;
    };


    // ============================================================
    // Styles + login screen
    // ============================================================

    var css = document.createElement("style");
    css.textContent =
        "#wmAuth{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;" +
        "padding:16px;background:linear-gradient(135deg,#0f172a,#1e1b4b 55%,#0f172a);overflow:auto;" +
        "font-family:Arial,Helvetica,sans-serif;}" +
        "#wmAuth .wmCard{width:min(92vw,400px);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);" +
        "border-radius:24px;padding:28px;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,.45);}" +
        "#wmAuth h1{margin:0 0 4px;font-size:30px;text-align:center;color:#fff;}" +
        "#wmAuth .wmSub{margin:0 0 20px;text-align:center;opacity:.75;font-size:14px;color:#fff;}" +
        "#wmAuth .wmTabs{display:flex;gap:8px;margin-bottom:16px;}" +
        "#wmAuth .wmTabs button{flex:1;padding:10px;font-size:15px;border-radius:12px;background:rgba(255,255,255,.1);" +
        "box-shadow:none;transform:none!important;opacity:.7;}" +
        "#wmAuth .wmTabs button.active{background:linear-gradient(135deg,#3b82f6,#8b5cf6);opacity:1;}" +
        "#wmAuth input{display:block;width:100%;box-sizing:border-box;margin:0 0 12px;padding:13px 14px;font-size:16px;" +
        "border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;outline:none;}" +
        "#wmAuth input::placeholder{color:rgba(255,255,255,.55);}" +
        "#wmAuth .wmSubmit{width:100%;padding:14px;font-size:17px;border-radius:14px;transform:none!important;}" +
        "#wmAuth .wmSubmit:disabled{opacity:.6;cursor:wait;}" +
        "#wmAuth .wmError{min-height:20px;margin:0 0 10px;color:#fca5a5;font-size:14px;}" +
        "#wmAuth .wmNote{margin:12px 0 0;font-size:13px;opacity:.7;text-align:center;color:#fff;}" +
        "#wmUserChip{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;margin:0 0 12px;" +
        "font-size:14px;color:#fff;}" +
        "#wmUserChip .wmStatus{opacity:.8;}" +
        "#wmUserChip button{width:auto;min-width:0;margin:0;padding:6px 14px;font-size:13px;border-radius:12px;" +
        "transform:none!important;box-shadow:none!important;}" +
        "#wmAccount{position:fixed;inset:0;z-index:99998;display:none;align-items:center;justify-content:center;" +
        "padding:16px;background:rgba(2,6,23,.82);overflow:auto;font-family:Arial,Helvetica,sans-serif;}" +
        "#wmAccount .wmCard{width:min(92vw,420px);background:#1e1b4b;border:1px solid rgba(255,255,255,.18);" +
        "border-radius:24px;padding:26px;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,.5);}" +
        "#wmAccount h1{margin:0 0 4px;font-size:26px;text-align:center;color:#fff;}" +
        "#wmAccount h3{margin:18px 0 10px;font-size:16px;color:#fff;}" +
        "#wmAccount p{color:#fff;}" +
        "#wmAccount .wmSub{margin:0 0 6px;text-align:center;opacity:.75;font-size:14px;}" +
        "#wmAccount input{display:block;width:100%;box-sizing:border-box;margin:0 0 10px;padding:12px 14px;font-size:16px;" +
        "border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;outline:none;}" +
        "#wmAccount input::placeholder{color:rgba(255,255,255,.55);}" +
        "#wmAccount button{width:100%;margin:0 0 8px;padding:12px;font-size:16px;border-radius:12px;transform:none!important;}" +
        "#wmAccount .wmDanger{background:linear-gradient(135deg,#dc2626,#991b1b);}" +
        "#wmAccount .wmClose{background:rgba(255,255,255,.14);box-shadow:none;}" +
        "#wmAccount .wmMsg{min-height:20px;margin:0 0 8px;font-size:14px;}" +
        "#wmAccount .wmWarn{font-size:13px;opacity:.75;margin:0 0 10px;}" +
        "#wmAccount hr{border:none;border-top:1px solid rgba(255,255,255,.18);margin:18px 0 0;}" +
        "#wmAuth .wmShow,#wmAccount .wmShow{display:flex;align-items:center;margin:0 0 12px;font-size:14px;" +
        "color:#fff;cursor:pointer;opacity:.9;}" +
        "#wmAuth .wmShow input,#wmAccount .wmShow input{display:inline-block;width:auto;margin:0 8px 0 0;padding:0;}";
    document.head.appendChild(css);

    var ui = null;
    var mode = "login";

    function buildAuthUI() {
        if (ui) return ui;

        var overlay = document.createElement("div");
        overlay.id = "wmAuth";

        var card = document.createElement("div");
        card.className = "wmCard";

        var title = document.createElement("h1");
        title.textContent = "📚 WordMaster";

        var sub = document.createElement("p");
        sub.className = "wmSub";
        sub.textContent = "Войди, чтобы твои слова были на любом устройстве";

        var tabs = document.createElement("div");
        tabs.className = "wmTabs";

        var tabLogin = document.createElement("button");
        tabLogin.type = "button";
        tabLogin.id = "wmTabLogin";
        tabLogin.textContent = "Вход";

        var tabRegister = document.createElement("button");
        tabRegister.type = "button";
        tabRegister.id = "wmTabRegister";
        tabRegister.textContent = "Регистрация";

        tabs.appendChild(tabLogin);
        tabs.appendChild(tabRegister);

        var form = document.createElement("form");
        form.id = "wmForm";

        var inUser = document.createElement("input");
        inUser.id = "wmUser";
        inUser.type = "text";
        inUser.placeholder = "Имя (буквы, цифры, . _ -)";
        inUser.autocomplete = "username";
        inUser.maxLength = 30;

        var inPass = document.createElement("input");
        inPass.id = "wmPass";
        inPass.type = "password";
        inPass.placeholder = "Пароль";
        inPass.maxLength = 128;

        var inInvite = document.createElement("input");
        inInvite.id = "wmInvite";
        inInvite.type = "text";
        inInvite.placeholder = "Код приглашения";
        inInvite.autocomplete = "off";
        inInvite.maxLength = 100;

        var inPass2 = document.createElement("input");
        inPass2.id = "wmPass2";
        inPass2.type = "password";
        inPass2.placeholder = "Повтори пароль";
        inPass2.autocomplete = "new-password";
        inPass2.maxLength = 128;

        var error = document.createElement("p");
        error.className = "wmError";
        error.setAttribute("role", "alert");

        var submit = document.createElement("button");
        submit.type = "submit";
        submit.className = "wmSubmit";
        submit.id = "wmSubmit";

        var note = document.createElement("p");
        note.className = "wmNote";

        form.appendChild(inUser);
        form.appendChild(inPass);
        form.appendChild(inPass2);
        form.appendChild(makeShowToggle("wmShowPass", [inPass, inPass2]));
        form.appendChild(inInvite);
        form.appendChild(error);
        form.appendChild(submit);

        card.appendChild(title);
        card.appendChild(sub);
        card.appendChild(tabs);
        card.appendChild(form);
        card.appendChild(note);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        tabLogin.addEventListener("click", function () { setMode("login"); });
        tabRegister.addEventListener("click", function () { setMode("register"); });
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            submitForm();
        });

        ui = {
            overlay: overlay, tabLogin: tabLogin, tabRegister: tabRegister,
            inUser: inUser, inPass: inPass, inPass2: inPass2, inInvite: inInvite,
            error: error, submit: submit, note: note
        };
        return ui;
    }

    function setMode(newMode) {
        mode = newMode;
        var form = buildAuthUI();

        var register = mode === "register";
        form.tabLogin.className = register ? "" : "active";
        form.tabRegister.className = register ? "active" : "";
        form.inPass2.style.display = register ? "block" : "none";
        form.inInvite.style.display = register && inviteRequired ? "block" : "none";
        form.inPass.autocomplete = register ? "new-password" : "current-password";
        form.submit.textContent = register ? "Создать аккаунт" : "Войти";
        form.error.textContent = "";

        var hasAnonymousData = !LS.getItem(USER_KEY) && syncedKeys().length > 0;
        form.note.textContent = register
            ? (hasAnonymousData
                ? "Слова и данные, которые уже есть в этом браузере, будут перенесены в новый аккаунт."
                : "Пароль: минимум 8 символов. Можно любые буквы (и заглавные), цифры и символы. " +
                  "Если забудешь, владелец сервера сможет поставить новый.")
            : "Пароль хранится на сервере в зашифрованном виде.";
    }

    function showAuth(newMode, message) {
        var form = buildAuthUI();
        setMode(newMode || "login");
        form.overlay.style.display = "flex";
        form.error.textContent = message || "";
        form.inPass.value = "";
        form.inPass2.value = "";

        var previous = LS.getItem(USER_KEY);
        if (previous && !form.inUser.value) form.inUser.value = previous;

        try { (form.inUser.value ? form.inPass : form.inUser).focus(); } catch (error) {}
    }

    function hideAuth() {
        if (ui) ui.overlay.style.display = "none";
    }

    async function submitForm() {
        var form = buildAuthUI();
        var username = form.inUser.value.trim();
        var password = form.inPass.value;

        form.error.textContent = "";

        if (!username || !password) {
            form.error.textContent = "Введи имя и пароль.";
            return;
        }
        if (mode === "register") {
            if (password.length < 8) {
                form.error.textContent = "Пароль: минимум 8 символов.";
                return;
            }
            if (password !== form.inPass2.value) {
                form.error.textContent = "Пароли не совпадают.";
                return;
            }
            if (inviteRequired && !form.inInvite.value.trim()) {
                form.error.textContent = "Введи код приглашения.";
                return;
            }
        }

        form.submit.disabled = true;

        var result;
        var uploaded = false;

        if (mode === "register") {
            var payload = { username: username, password: password };
            if (inviteRequired) payload.invite = form.inInvite.value.trim();
            // data that exists in this browser without an account moves into the new account
            if (!LS.getItem(USER_KEY)) {
                var local = collectLocal();
                if (Object.keys(local).length) {
                    payload.data = local;
                    uploaded = true;
                }
            }
            result = await api("POST", "/api/register", payload);
        } else {
            result = await api("POST", "/api/login", { username: username, password: password });
        }

        form.submit.disabled = false;

        if (!result.ok) {
            form.error.textContent = explainFailure(result);
            return;
        }

        hideAuth();

        if (appLoaded) {            // login after an expired session: restart cleanly
            location.reload();
            return;
        }

        await onAuthed(result.data.username, uploaded);
    }


    // ============================================================
    // After login
    // ============================================================

    async function onAuthed(username, alreadyUploaded) {
        var previous = LS.getItem(USER_KEY);
        var offlineWithLocal = false;

        if (!alreadyUploaded) {

            if (previous === username) {
                // push changes made while offline BEFORE we download anything
                var dirty = readDirty();
                if (dirty.length) {
                    var pushed = await pushKeys(dirty);
                    if (pushed.ok) writeDirty([]);
                    else offlineWithLocal = true;      // keep local data, retry later
                }
            } else if (previous) {
                // another account's data is still in this browser
                backupLocal(previous);
                wipeLocal();
            }

            if (!offlineWithLocal) {
                var pulled = await api("GET", "/api/data");

                if (pulled.status === 401) {
                    showAuth("login");
                    return;
                }

                if (!pulled.ok) {
                    if (previous === username) {
                        offlineWithLocal = true;       // use what this browser has
                    } else {
                        showAuth("login", "Не удалось загрузить данные с сервера. Попробуй ещё раз.");
                        return;
                    }
                } else {
                    var items = (pulled.data && pulled.data.items) || {};
                    var local = syncedKeys();

                    if (Object.keys(items).length === 0 && local.length &&
                        (previous === username || !previous)) {
                        await pushKeys(local);         // first device: upload what is here
                    } else {
                        if (!previous && local.length) {
                            backupLocal("no-account");
                            infoNotice = "Данные из этого браузера заменены данными аккаунта (копия сохранена).";
                        }
                        try {
                            applyServerData(items);
                        } catch (error) {
                            showAuth("login", "В браузере не хватает места для данных аккаунта.");
                            return;
                        }
                    }
                }
            }
        }

        LS.setItem(USER_KEY, username);
        authed = true;

        mountChip(username);

        if (offlineWithLocal) {
            resumeDirty();
            setStatus("offline");
        }

        loadApp();
    }

    function loadApp() {
        if (appLoaded) return;
        appLoaded = true;

        var script = document.createElement("script");
        script.src = "script.js";
        script.onerror = function () {
            alert("Не удалось загрузить script.js");
        };
        document.body.appendChild(script);
    }


    // ============================================================
    // Account panel: change password, delete account
    // ============================================================

    var accountUI = null;

    function makeEl(tag, props) {
        var el = document.createElement(tag);
        Object.keys(props || {}).forEach(function (key) { el[key] = props[key]; });
        return el;
    }

    function buildAccountUI(username) {
        if (accountUI) {
            accountUI.who.textContent = username;
            return accountUI;
        }

        var overlay = makeEl("div", { id: "wmAccount" });
        var card = makeEl("div", { className: "wmCard" });

        var title = makeEl("h1", { textContent: "👤 Аккаунт" });
        var who = makeEl("p", { className: "wmSub", textContent: username });

        var h3a = makeEl("h3", { textContent: "Сменить пароль" });
        var form = makeEl("form", { id: "wmPassForm" });
        var oldPass = makeEl("input", { id: "wmOldPass", type: "password", placeholder: "Текущий пароль", autocomplete: "current-password", maxLength: 128 });
        var newPass = makeEl("input", { id: "wmNewPass", type: "password", placeholder: "Новый пароль (минимум 8 символов)", autocomplete: "new-password", maxLength: 128 });
        var newPass2 = makeEl("input", { id: "wmNewPass2", type: "password", placeholder: "Повтори новый пароль", autocomplete: "new-password", maxLength: 128 });
        var msg = makeEl("p", { className: "wmMsg", id: "wmAccMsg" });
        var changeBtn = makeEl("button", { type: "submit", id: "wmChangePassBtn", textContent: "Сменить пароль" });
        form.appendChild(oldPass);
        form.appendChild(newPass);
        form.appendChild(newPass2);
        form.appendChild(makeShowToggle("wmShowAcc", [oldPass, newPass, newPass2]));
        form.appendChild(msg);
        form.appendChild(changeBtn);

        var hr = makeEl("hr");
        var h3b = makeEl("h3", { textContent: "Удалить аккаунт" });
        var warn = makeEl("p", {
            className: "wmWarn",
            textContent: "Все слова, наборы, эссе и картинки будут удалены с сервера навсегда. Отменить нельзя."
        });
        var delPass = makeEl("input", { id: "wmDeletePass", type: "password", placeholder: "Пароль для подтверждения", autocomplete: "current-password", maxLength: 128 });
        var delMsg = makeEl("p", { className: "wmMsg", id: "wmDelMsg" });
        var delBtn = makeEl("button", { type: "button", id: "wmDeleteBtn", className: "wmDanger", textContent: "🗑 Удалить аккаунт навсегда" });
        var closeBtn = makeEl("button", { type: "button", id: "wmAccountClose", className: "wmClose", textContent: "Закрыть" });

        var showDel = makeShowToggle("wmShowDel", [delPass]);

        [title, who, h3a, form, hr, h3b, warn, delPass, showDel, delMsg, delBtn, closeBtn].forEach(function (el) {
            card.appendChild(el);
        });
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            changePassword();
        });
        delBtn.addEventListener("click", deleteAccount);
        closeBtn.addEventListener("click", function () { overlay.style.display = "none"; });

        accountUI = {
            overlay: overlay, who: who, oldPass: oldPass, newPass: newPass, newPass2: newPass2,
            msg: msg, changeBtn: changeBtn, delPass: delPass, delMsg: delMsg, delBtn: delBtn
        };
        return accountUI;
    }

    function showMsg(el, text, good) {
        el.textContent = text;
        el.style.color = good ? "#86efac" : "#fca5a5";
    }

    function openAccount() {
        var panel = buildAccountUI(LS.getItem(USER_KEY) || "");
        panel.oldPass.value = "";
        panel.newPass.value = "";
        panel.newPass2.value = "";
        panel.delPass.value = "";
        showMsg(panel.msg, "", true);
        showMsg(panel.delMsg, "", true);
        panel.overlay.style.display = "flex";
    }

    async function changePassword() {
        var panel = buildAccountUI(LS.getItem(USER_KEY) || "");
        var oldValue = panel.oldPass.value;
        var newValue = panel.newPass.value;

        if (!oldValue || !newValue) {
            showMsg(panel.msg, "Заполни текущий и новый пароль.", false);
            return;
        }
        if (newValue.length < 8) {
            showMsg(panel.msg, "Новый пароль: минимум 8 символов.", false);
            return;
        }
        if (newValue !== panel.newPass2.value) {
            showMsg(panel.msg, "Новые пароли не совпадают.", false);
            return;
        }

        panel.changeBtn.disabled = true;
        var result = await api("POST", "/api/password", { old: oldValue, "new": newValue });
        panel.changeBtn.disabled = false;

        if (!result.ok) {
            showMsg(panel.msg,
                result.status === 0
                    ? "Нет связи с сервером."
                    : ((result.data && result.data.message) || "Не удалось сменить пароль."),
                false);
            return;
        }

        panel.oldPass.value = "";
        panel.newPass.value = "";
        panel.newPass2.value = "";
        showMsg(panel.msg, "✅ Пароль изменён. На других устройствах нужно войти заново.", true);
    }

    async function deleteAccount() {
        var panel = buildAccountUI(LS.getItem(USER_KEY) || "");
        var password = panel.delPass.value;

        if (!password) {
            showMsg(panel.delMsg, "Введи пароль для подтверждения.", false);
            return;
        }
        if (!confirm("Удалить аккаунт и ВСЕ данные навсегда? Это нельзя отменить.")) {
            return;
        }

        panel.delBtn.disabled = true;
        var result = await api("POST", "/api/delete-account", { password: password });
        panel.delBtn.disabled = false;

        if (!result.ok) {
            showMsg(panel.delMsg,
                result.status === 0
                    ? "Нет связи с сервером."
                    : ((result.data && result.data.message) || "Не удалось удалить аккаунт."),
                false);
            return;
        }

        authed = false;
        clearTimeout(flushTimer);
        pending = {};
        wipeLocal();
        try {
            LS.removeItem(USER_KEY);
            LS.removeItem(BACKUP_KEY);
        } catch (error) {}

        location.reload();
    }


    // ============================================================
    // User bar (name, sync status, logout)
    // ============================================================

    function setStatus(kind, detail) {
        statusKind = kind;
        if (!statusEl) return;

        var text = "";
        if (kind === "saved") text = "☁️ Сохранено";
        else if (kind === "pending") text = "⏳ Сохраняю…";
        else if (kind === "offline") text = "⚠ Нет связи — изменения сохранены на этом устройстве";
        else if (kind === "error") text = "⚠ Не синхронизировано: " + detail;

        statusEl.textContent = text;
    }

    function mountChip(username) {
        var old = document.getElementById("wmUserChip");
        if (old && old.parentNode) old.parentNode.removeChild(old);

        var chip = document.createElement("div");
        chip.id = "wmUserChip";

        var name = document.createElement("span");
        name.textContent = "👤 " + username;

        statusEl = document.createElement("span");
        statusEl.className = "wmStatus";

        var accountBtn = document.createElement("button");
        accountBtn.type = "button";
        accountBtn.id = "wmAccountBtn";
        accountBtn.textContent = "⚙️ Аккаунт";
        accountBtn.addEventListener("click", openAccount);

        var logoutBtn = document.createElement("button");
        logoutBtn.type = "button";
        logoutBtn.id = "wmLogout";
        logoutBtn.textContent = "Выйти";
        logoutBtn.addEventListener("click", logout);

        chip.appendChild(name);
        chip.appendChild(statusEl);
        chip.appendChild(accountBtn);
        chip.appendChild(logoutBtn);

        var header = document.querySelector("header");
        if (header) header.insertBefore(chip, header.firstChild);
        else document.body.insertBefore(chip, document.body.firstChild);

        setStatus(statusKind);

        if (infoNotice) {
            statusEl.textContent = "ℹ️ " + infoNotice;
            infoNotice = "";
            setTimeout(function () { setStatus(statusKind); }, 12000);
        }
    }

    async function logout() {
        setStatus("pending");

        var sent = await flush();

        if (!sent && !confirm(
            "Последние изменения не удалось отправить на сервер (нет связи).\n" +
            "Если выйти сейчас, они пропадут. Всё равно выйти?"
        )) {
            return;
        }

        authed = false;
        await api("POST", "/api/logout", {});

        wipeLocal();
        try { LS.removeItem(USER_KEY); } catch (error) {}

        location.reload();
    }


    // ============================================================
    // Start
    // ============================================================

    async function boot() {
        var config = await api("GET", "/api/config");
        if (config.ok && config.data) inviteRequired = !!config.data.invite_required;

        var me = await api("GET", "/api/me");

        if (me.ok) {
            await onAuthed(me.data.username, false);
            return;
        }

        // server not reachable but this browser has an account's data: work offline
        if (me.status === 0 && LS.getItem(USER_KEY)) {
            authed = true;
            mountChip(LS.getItem(USER_KEY));
            resumeDirty();
            setStatus("offline");
            loadApp();
            return;
        }

        showAuth(
            "login",
            me.status === 401 ? "" : explainFailure(me)
        );
    }

    boot();

})();
