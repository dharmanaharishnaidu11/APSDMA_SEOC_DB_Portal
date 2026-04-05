/* ==========================================================================
   SEOC Admin Panel — Staff registration, system status, export
   ========================================================================== */

window.SEOC = window.SEOC || {};

SEOC.admin = (function() {

    function render(param, container) {
        if (!SEOC.auth.canAdmin()) {
            container.innerHTML = '<div class="error-page"><h2>Access Denied</h2><p>Admin access required.</p></div>';
            return;
        }

        container.innerHTML =
            '<div class="page-header"><div class="page-icon">&#9881;</div><div><h2>Administration</h2><p>System status, data export, and management</p></div></div>' +
            '<div class="tabs">' +
                '<button class="tab active" data-tab="status" onclick="SEOC.admin.switchTab(\'status\')">System Status</button>' +
                '<button class="tab" data-tab="export" onclick="SEOC.admin.switchTab(\'export\')">Data Export</button>' +
            '</div>' +
            '<div class="tab-content active" id="tab-status"><div id="admin-status">Loading...</div></div>' +
            '<div class="tab-content" id="tab-export"><div id="admin-export"></div></div>';

        _loadStatus();
        _loadExport();
    }

    function switchTab(tab) {
        document.querySelectorAll(".tabs .tab").forEach(function(t) {
            t.classList.toggle("active", t.getAttribute("data-tab") === tab);
        });
        document.querySelectorAll(".tab-content").forEach(function(tc) { tc.classList.remove("active"); });
        var target = document.getElementById("tab-" + tab);
        if (target) target.classList.add("active");
    }

    function _loadStatus() {
        var el = document.getElementById("admin-status");
        var allMods = SEOC.modules.concat(SEOC.adminModules);

        var html = '<table style="width:100%;border-collapse:collapse;background:var(--seoc-surface);border:1px solid var(--seoc-border);border-radius:10px;overflow:hidden;margin-top:12px">' +
            '<thead><tr style="background:var(--seoc-surface-alt);border-bottom:2px solid var(--seoc-border)">' +
            '<th style="padding:10px;text-align:left">Service</th>' +
            '<th style="padding:10px;text-align:center">Status</th>' +
            '<th style="padding:10px;text-align:center">Records</th>' +
            '<th style="padding:10px;text-align:center">Pending</th>' +
            '</tr></thead><tbody id="status-tbody"></tbody></table>';
        el.innerHTML = html;

        var tbody = document.getElementById("status-tbody");

        allMods.forEach(function(mod) {
            var rowId = "status-" + mod.key;
            tbody.innerHTML += '<tr id="' + rowId + '" style="border-bottom:1px solid var(--seoc-border)">' +
                '<td style="padding:8px 10px">' + mod.icon + ' ' + mod.title + '</td>' +
                '<td style="padding:8px 10px;text-align:center" id="' + rowId + '-status">...</td>' +
                '<td style="padding:8px 10px;text-align:center" id="' + rowId + '-count">...</td>' +
                '<td style="padding:8px 10px;text-align:center" id="' + rowId + '-pending">...</td></tr>';

            var url = SEOC.getServiceUrl(mod);
            SEOC.queryCount(url, "1=1").then(function(c) {
                var sEl = document.getElementById(rowId + "-status");
                var cEl = document.getElementById(rowId + "-count");
                if (sEl) sEl.innerHTML = '<span style="background:var(--seoc-success);color:#fff;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600">Online</span>';
                if (cEl) cEl.textContent = c.toLocaleString();
            }).catch(function() {
                var sEl = document.getElementById(rowId + "-status");
                if (sEl) sEl.innerHTML = '<span style="background:var(--seoc-danger);color:#fff;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:600">Error</span>';
            });

            SEOC.queryCount(url, "entry_status='Pending'").then(function(c) {
                var pEl = document.getElementById(rowId + "-pending");
                if (pEl) pEl.textContent = c;
            });
        });
    }

    function _loadExport() {
        var el = document.getElementById("admin-export");
        var html = '<div style="background:var(--seoc-surface);border:1px solid var(--seoc-border);border-radius:10px;padding:24px;margin-top:12px;max-width:500px">' +
            '<h3 style="margin-bottom:16px;color:var(--seoc-primary)">Export Data as CSV</h3>' +
            '<div style="margin-bottom:12px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Module</label>' +
            '<select id="export-module" style="width:100%;padding:8px;border:1px solid var(--seoc-border);border-radius:6px;font-size:14px">';

        SEOC.modules.forEach(function(m) {
            html += '<option value="' + m.key + '">' + m.icon + ' ' + m.title + '</option>';
        });
        SEOC.adminModules.forEach(function(m) {
            html += '<option value="' + m.key + '">' + m.icon + ' ' + m.title + '</option>';
        });

        html += '</select></div>' +
            '<div style="margin-bottom:16px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Status Filter</label>' +
            '<select id="export-status" style="width:100%;padding:8px;border:1px solid var(--seoc-border);border-radius:6px;font-size:14px">' +
                '<option value="">All</option>' +
                '<option value="Pending">Pending only</option>' +
                '<option value="Approved">Approved only</option>' +
            '</select></div>' +
            '<button class="btn btn-primary" onclick="SEOC.admin.doExport()" style="width:100%">Download CSV</button></div>';
        el.innerHTML = html;
    }

    function doExport() {
        var modKey = document.getElementById("export-module").value;
        var status = document.getElementById("export-status").value;
        var mod = SEOC.getModule(modKey);
        if (!mod) return;

        var where = status ? "entry_status='" + status + "'" : "1=1";
        var url = SEOC.getServiceUrl(mod) + "/query?where=" + encodeURIComponent(where) +
            "&outFields=*&f=csv&token=" + SEOC.auth.getToken();
        window.open(url, "_blank");
        SEOC.toast("CSV download started");
    }

    return {
        render: render,
        switchTab: switchTab,
        doExport: doExport
    };
})();
