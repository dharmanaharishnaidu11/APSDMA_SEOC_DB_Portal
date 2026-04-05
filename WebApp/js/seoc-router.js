/* ==========================================================================
   SEOC Data Entry Portal — Hash-based SPA Router
   ========================================================================== */

window.SEOC = window.SEOC || {};

SEOC.router = (function() {
    var _routes = {};
    var _currentRoute = null;

    function register(pattern, handler) {
        _routes[pattern] = handler;
    }

    function navigate(hash) {
        if (hash.charAt(0) !== "#") hash = "#" + hash;
        window.location.hash = hash;
    }

    function _resolve() {
        var hash = window.location.hash.replace(/^#\/?/, "") || "dashboard";
        var parts = hash.split("/");
        var route = parts[0];
        var param = parts.slice(1).join("/") || null;

        if (_currentRoute === hash) return;
        _currentRoute = hash;

        // Update active nav
        document.querySelectorAll(".nav-item").forEach(function(el) {
            el.classList.remove("active");
            var href = (el.getAttribute("href") || "").replace(/^#\/?/, "");
            if (href === hash || (route === "module" && href === "module/" + param)) {
                el.classList.add("active");
            }
        });

        var content = document.getElementById("main-content");
        if (!content) return;

        // Close mobile sidebar
        var sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.remove("open");

        if (_routes[route]) {
            content.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
            try {
                _routes[route](param, content);
            } catch (e) {
                content.innerHTML = '<div class="error-page"><h2>Error</h2><p>' + e.message + '</p></div>';
            }
        } else {
            content.innerHTML = '<div class="error-page"><h2>Page Not Found</h2><p>Route: ' + hash + '</p></div>';
        }
    }

    function init() {
        window.addEventListener("hashchange", _resolve);
        _resolve();
    }

    function getCurrentRoute() {
        return _currentRoute;
    }

    return {
        register: register,
        navigate: navigate,
        init: init,
        getCurrentRoute: getCurrentRoute
    };
})();
