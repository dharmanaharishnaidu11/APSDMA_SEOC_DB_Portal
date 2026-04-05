/* ==========================================================================
   SEOC Approval Queue — Pending records, approve/reject workflow
   ========================================================================== */

window.SEOC = window.SEOC || {};

SEOC.approval = (function() {
    var _records = [];
    var _filterModule = "";

    function render(param, container) {
        if (!SEOC.auth.canApprove()) {
            container.innerHTML = '<div class="error-page"><h2>Access Denied</h2><p>You do not have permission to approve records.</p></div>';
            return;
        }

        container.innerHTML =
            '<div class="page-header"><div class="page-icon">&#9745;</div><div><h2>Approval Queue</h2><p>Review and approve pending records across all modules</p></div></div>' +
            '<div class="toolbar">' +
                '<select id="approval-module-filter" onchange="SEOC.approval.filterByModule(this.value)">' +
                    '<option value="">All Modules</option>' +
                '</select>' +
                '<button class="btn btn-success" onclick="SEOC.approval.bulkApprove()">Approve Selected</button>' +
                '<button class="btn btn-outline" onclick="SEOC.approval.refresh()">Refresh</button>' +
                '<span id="approval-count" style="margin-left:auto;font-size:13px;color:var(--seoc-text-muted)"></span>' +
            '</div>' +
            '<div id="approval-list"></div>';

        // Populate module filter
        var select = document.getElementById("approval-module-filter");
        SEOC.modules.forEach(function(m) {
            select.innerHTML += '<option value="' + m.key + '">' + m.icon + " " + m.title + '</option>';
        });

        _loadPending();
    }

    function _loadPending() {
        var listEl = document.getElementById("approval-list");
        listEl.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
        _records = [];

        var mods = SEOC.modules;
        if (_filterModule) {
            var m = SEOC.getModule(_filterModule);
            mods = m ? [m] : [];
        }

        var promises = mods.map(function(mod) {
            var url = SEOC.getServiceUrl(mod) +
                "/query?where=" + encodeURIComponent("entry_status='Pending'") +
                "&outFields=*&orderByFields=" + encodeURIComponent("objectid DESC") +
                "&resultRecordCount=50&f=json&token=" + SEOC.auth.getToken();
            return fetch(url).then(function(r) { return r.json(); })
                .then(function(d) {
                    return (d.features || []).map(function(f) {
                        f.attributes._moduleKey = mod.key;
                        f.attributes._moduleName = mod.title;
                        f.attributes._moduleIcon = mod.icon;
                        f.attributes._serviceUrl = SEOC.getServiceUrl(mod);
                        return f;
                    });
                })
                .catch(function() { return []; });
        });

        Promise.all(promises).then(function(results) {
            _records = [].concat.apply([], results);
            _records.sort(function(a, b) { return (b.attributes.objectid || 0) - (a.attributes.objectid || 0); });
            _renderList();
        });
    }

    function _renderList() {
        var listEl = document.getElementById("approval-list");
        var countEl = document.getElementById("approval-count");

        if (_records.length === 0) {
            listEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--seoc-text-muted)">' +
                '<div style="font-size:48px;margin-bottom:12px">&#9989;</div>' +
                '<p>No pending records to review</p></div>';
            countEl.textContent = "0 pending";
            return;
        }

        countEl.textContent = _records.length + " pending record(s)";

        var html = '<table style="width:100%;border-collapse:collapse;background:var(--seoc-surface);border:1px solid var(--seoc-border);border-radius:10px;overflow:hidden">' +
            '<thead><tr style="background:var(--seoc-surface-alt);border-bottom:2px solid var(--seoc-border)">' +
            '<th style="padding:10px;text-align:left;width:30px"><input type="checkbox" id="select-all" onchange="SEOC.approval.toggleAll(this.checked)"></th>' +
            '<th style="padding:10px;text-align:left">Module</th>' +
            '<th style="padding:10px;text-align:left">District</th>' +
            '<th style="padding:10px;text-align:left">Key Info</th>' +
            '<th style="padding:10px;text-align:left">Entered By</th>' +
            '<th style="padding:10px;text-align:left">Status</th>' +
            '<th style="padding:10px;text-align:center">Actions</th>' +
            '</tr></thead><tbody>';

        _records.forEach(function(f, idx) {
            var a = f.attributes;
            var keyInfo = a.victim_name || a.caller_name || a.dam_name || a.disaster_type || a.force_type || a.water_body_type || "-";
            html += '<tr style="border-bottom:1px solid var(--seoc-border)" id="row-' + idx + '">' +
                '<td style="padding:8px 10px"><input type="checkbox" class="approval-check" data-idx="' + idx + '"></td>' +
                '<td style="padding:8px 10px"><span style="font-size:16px">' + a._moduleIcon + '</span> ' + a._moduleName + '</td>' +
                '<td style="padding:8px 10px">' + (a.district || "-") + '</td>' +
                '<td style="padding:8px 10px">' + keyInfo + '</td>' +
                '<td style="padding:8px 10px">' + (a.entered_by || "-") + '</td>' +
                '<td style="padding:8px 10px"><span style="background:var(--seoc-warning);color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">Pending</span></td>' +
                '<td style="padding:8px 10px;text-align:center" class="approval-actions">' +
                    '<button class="btn btn-success" onclick="SEOC.approval.approve(' + idx + ')">Approve</button> ' +
                    '<button class="btn btn-danger" onclick="SEOC.approval.reject(' + idx + ')">Reject</button>' +
                '</td></tr>';
        });

        html += '</tbody></table>';
        listEl.innerHTML = html;
    }

    function approve(idx) {
        var rec = _records[idx];
        if (!rec) return;
        _updateStatus(rec, idx, "Approved");
    }

    function reject(idx) {
        var rec = _records[idx];
        if (!rec) return;
        var reason = prompt("Rejection reason:");
        if (reason === null) return;
        _updateStatus(rec, idx, "Rejected", reason);
    }

    function _updateStatus(rec, idx, status, reason) {
        var a = rec.attributes;
        var update = {
            attributes: {
                objectid: a.objectid,
                entry_status: status,
                approved_by: SEOC.auth.getUser().username
            }
        };
        if (reason) update.attributes.remarks = (a.remarks ? a.remarks + " | " : "") + "Rejected: " + reason;

        var url = a._serviceUrl + "/applyEdits";
        var params = new URLSearchParams({
            updates: JSON.stringify([update]),
            f: "json",
            token: SEOC.auth.getToken()
        });

        fetch(url, { method: "POST", body: params })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                var results = d.updateResults || [];
                if (results.length > 0 && results[0].success) {
                    SEOC.toast(a._moduleName + " record " + status.toLowerCase());
                    var row = document.getElementById("row-" + idx);
                    if (row) row.style.display = "none";
                    _records.splice(idx, 1);
                    var countEl = document.getElementById("approval-count");
                    if (countEl) countEl.textContent = _records.length + " pending record(s)";
                } else {
                    SEOC.toast("Update failed", "error");
                }
            })
            .catch(function() { SEOC.toast("Network error", "error"); });
    }

    function bulkApprove() {
        var checks = document.querySelectorAll(".approval-check:checked");
        if (checks.length === 0) { SEOC.toast("Select records first", "error"); return; }
        if (!confirm("Approve " + checks.length + " record(s)?")) return;

        checks.forEach(function(cb) {
            var idx = parseInt(cb.getAttribute("data-idx"));
            approve(idx);
        });
    }

    function toggleAll(checked) {
        document.querySelectorAll(".approval-check").forEach(function(cb) { cb.checked = checked; });
    }

    function filterByModule(key) {
        _filterModule = key;
        _loadPending();
    }

    function refresh() {
        _loadPending();
    }

    return {
        render: render,
        approve: approve,
        reject: reject,
        bulkApprove: bulkApprove,
        toggleAll: toggleAll,
        filterByModule: filterByModule,
        refresh: refresh
    };
})();
