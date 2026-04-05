/* ==========================================================================
   SEOC Data Entry Portal — Authentication
   Per-user token generation + group-based role detection
   ========================================================================== */

window.SEOC = window.SEOC || {};

SEOC.auth = (function() {
    var _token = null;
    var _expires = 0;
    var _refreshTimer = null;
    var _user = null;

    function login(username, password) {
        var url = SEOC.config.PORTAL_URL + "/sharing/rest/generateToken";
        var params = new URLSearchParams({
            username: username,
            password: password,
            client: "referer",
            referer: window.location.origin || "https://apsdmagis.ap.gov.in",
            expiration: SEOC.config.TOKEN_EXPIRATION,
            f: "json"
        });

        return fetch(url, { method: "POST", body: params })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (!data.token) {
                    var msg = (data.error && data.error.message) || "Invalid credentials";
                    throw new Error(msg);
                }
                _token = data.token;
                _expires = data.expires || (Date.now() + SEOC.config.TOKEN_EXPIRATION * 60000);
                return _fetchUserProfile(username);
            });
    }

    function _fetchUserProfile(username) {
        var url = SEOC.config.PORTAL_URL + "/sharing/rest/community/self";
        return fetch(url + "?f=json&token=" + _token)
            .then(function(r) { return r.json(); })
            .then(function(profile) {
                var groups = (profile.groups || []).map(function(g) { return g.id; });
                var role = _detectRole(groups, profile.role);

                _user = {
                    username: profile.username || username,
                    fullName: profile.fullName || username,
                    role: role,
                    portalRole: profile.role,
                    groups: groups
                };

                sessionStorage.setItem("seoc_token", _token);
                sessionStorage.setItem("seoc_expires", String(_expires));
                sessionStorage.setItem("seoc_user", JSON.stringify(_user));

                _startAutoRefresh();
                return _user;
            });
    }

    function _detectRole(groupIds, portalRole) {
        var cfg = SEOC.config.GROUPS;
        if (portalRole === "org_admin" || groupIds.indexOf(cfg.SEOC_Admins) >= 0) {
            return SEOC.config.ROLES.ADMIN;
        }
        if (groupIds.indexOf(cfg.SEOC_DutyOfficers) >= 0) {
            return SEOC.config.ROLES.DUTY_OFFICER;
        }
        if (groupIds.indexOf(cfg.SEOC_DEOs) >= 0) {
            return SEOC.config.ROLES.DEO;
        }
        return SEOC.config.ROLES.DEO;
    }

    function _startAutoRefresh() {
        if (_refreshTimer) clearInterval(_refreshTimer);
        var refreshIn = Math.max((_expires - Date.now()) * 0.8, 60000);
        _refreshTimer = setTimeout(function() {
            _refreshToken();
        }, refreshIn);
    }

    function _refreshToken() {
        if (!_user) return;
        var url = SEOC.config.PORTAL_URL + "/sharing/rest/generateToken";
        var params = new URLSearchParams({
            username: _user.username,
            token: _token,
            client: "referer",
            referer: window.location.origin || "https://apsdmagis.ap.gov.in",
            expiration: SEOC.config.TOKEN_EXPIRATION,
            f: "json"
        });

        fetch(url, { method: "POST", body: params })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data.token) {
                    _token = data.token;
                    _expires = data.expires || (Date.now() + SEOC.config.TOKEN_EXPIRATION * 60000);
                    sessionStorage.setItem("seoc_token", _token);
                    sessionStorage.setItem("seoc_expires", String(_expires));
                    _startAutoRefresh();
                }
            })
            .catch(function() {
                logout();
            });
    }

    function restoreSession() {
        var token = sessionStorage.getItem("seoc_token");
        var expires = parseInt(sessionStorage.getItem("seoc_expires") || "0");
        var userJson = sessionStorage.getItem("seoc_user");

        if (token && expires > Date.now() && userJson) {
            _token = token;
            _expires = expires;
            _user = JSON.parse(userJson);
            _startAutoRefresh();
            return true;
        }
        return false;
    }

    function registerWithIdentityManager(IdentityManager) {
        if (!_token) return;
        // Register for all URL patterns the FeatureTable/MapView might use
        var servers = [
            SEOC.config.SERVER_URL,
            SEOC.config.PORTAL_URL,
            SEOC.config.SERVER_URL + "/rest/services",
            SEOC.config.SERVICE_BASE,
            "https://apsdmagis.ap.gov.in/gisserver",
            "https://apsdmagis.ap.gov.in/gisportal"
        ];
        servers.forEach(function(s) {
            try { IdentityManager.registerToken({ server: s, token: _token }); } catch(e) {}
        });
    }

    function logout() {
        _token = null;
        _expires = 0;
        _user = null;
        if (_refreshTimer) clearTimeout(_refreshTimer);
        sessionStorage.removeItem("seoc_token");
        sessionStorage.removeItem("seoc_expires");
        sessionStorage.removeItem("seoc_user");
        window.location.hash = "";
        window.location.reload();
    }

    function getToken() { return _token; }
    function getUser() { return _user; }
    function isLoggedIn() { return !!_token && _expires > Date.now(); }

    function canApprove() {
        if (!_user) return false;
        var r = _user.role;
        return r === SEOC.config.ROLES.ADMIN || r === SEOC.config.ROLES.DUTY_OFFICER || r === SEOC.config.ROLES.INCHARGE;
    }

    function canAdmin() {
        return _user && _user.role === SEOC.config.ROLES.ADMIN;
    }

    function canViewAll() {
        return canApprove();
    }

    function canDelete() {
        return canAdmin();
    }

    function canExport() {
        return canApprove();
    }

    return {
        login: login,
        logout: logout,
        restoreSession: restoreSession,
        registerWithIdentityManager: registerWithIdentityManager,
        getToken: getToken,
        getUser: getUser,
        isLoggedIn: isLoggedIn,
        canApprove: canApprove,
        canAdmin: canAdmin,
        canViewAll: canViewAll,
        canDelete: canDelete,
        canExport: canExport
    };
})();
