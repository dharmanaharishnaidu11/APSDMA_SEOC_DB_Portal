/* ==========================================================================
   SEOC Module View — Generic 3-tab module (Add New / View Data / Analytics)
   ========================================================================== */

window.SEOC = window.SEOC || {};

SEOC.module = (function() {
    var _currentMod = null;
    var _chartInstances = {};

    function render(moduleKey, container) {
        var mod = SEOC.getModule(moduleKey);
        if (!mod) {
            container.innerHTML = '<div class="error-page"><h2>Module not found: ' + moduleKey + '</h2></div>';
            return;
        }
        _currentMod = mod;

        container.innerHTML =
            '<div class="page-header">' +
                '<div class="page-icon" style="color:' + mod.color + '">' + mod.icon + '</div>' +
                '<div><h2>' + mod.title + '</h2><p>' + mod.desc + '</p></div>' +
            '</div>' +
            '<div class="kpi-bar" id="mod-kpi"></div>' +
            '<div class="tabs" id="mod-tabs">' +
                '<button class="tab active" data-tab="add" onclick="SEOC.module.switchTab(\'add\')">+ Add New</button>' +
                '<button class="tab" data-tab="view" onclick="SEOC.module.switchTab(\'view\')">View Data</button>' +
                '<button class="tab" data-tab="analytics" onclick="SEOC.module.switchTab(\'analytics\')">Analytics</button>' +
            '</div>' +
            '<div class="tab-content active" id="tab-add">' +
                '<div class="survey-container" id="survey-embed">Loading form...</div>' +
            '</div>' +
            '<div class="tab-content" id="tab-view">' +
                '<div class="toolbar" id="view-toolbar"></div>' +
                '<div class="table-container" id="table-embed"></div>' +
            '</div>' +
            '<div class="tab-content" id="tab-analytics">' +
                '<div class="kpi-bar" id="analytics-kpi"></div>' +
                '<div class="charts-row">' +
                    '<div class="chart-card"><h3>Records by District</h3><canvas id="chart-district"></canvas></div>' +
                    '<div class="chart-card"><h3>Trend (Last 30 Days)</h3><canvas id="chart-trend"></canvas></div>' +
                '</div>' +
            '</div>';

        _loadModuleKPIs(mod);
        _loadSurvey(mod);
    }

    function switchTab(tabName) {
        document.querySelectorAll("#mod-tabs .tab").forEach(function(t) {
            t.classList.toggle("active", t.getAttribute("data-tab") === tabName);
        });
        document.querySelectorAll(".tab-content").forEach(function(tc) {
            tc.classList.remove("active");
        });
        var target = document.getElementById("tab-" + tabName);
        if (target) target.classList.add("active");

        if (tabName === "view") _loadTable(_currentMod);
        if (tabName === "analytics") _loadAnalytics(_currentMod);
    }

    function _loadModuleKPIs(mod) {
        var kpiEl = document.getElementById("mod-kpi");
        var url = SEOC.getServiceUrl(mod);
        var promises = (mod.kpiFields || []).map(function(kpi) {
            return SEOC.queryCount(url, kpi.field);
        });

        Promise.all(promises).then(function(counts) {
            var html = "";
            (mod.kpiFields || []).forEach(function(kpi, i) {
                var cls = kpi.label.indexOf("Pending") >= 0 ? "warning" : "";
                html += '<div class="kpi-card"><div class="kpi-icon">' + (kpi.icon || "") + '</div>' +
                    '<div class="kpi-value ' + cls + '">' + (counts[i] || 0).toLocaleString() + '</div>' +
                    '<div class="kpi-label">' + kpi.label + '</div></div>';
            });
            kpiEl.innerHTML = html;
        });
    }

    function _loadSurvey(mod) {
        SEOC.renderForm(mod.key, "survey-embed", function() {
            _loadModuleKPIs(mod);
        });
    }

    function _loadTable(mod) {
        var tableEl = document.getElementById("table-embed");
        var toolbarEl = document.getElementById("view-toolbar");
        if (!tableEl) return;

        // Build toolbar — row 1: filters, row 2: date range
        var curYear = new Date().getFullYear();
        var toolbarHtml = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;width:100%">' +
            '<select id="filter-year"><option value="">All Years</option>';
        for (var y = curYear; y >= 2015; y--) {
            toolbarHtml += '<option value="' + y + '">' + y + '</option>';
        }
        toolbarHtml += '</select>' +
            '<select id="filter-district"><option value="">All Districts</option></select>' +
            '<select id="filter-status">' +
                '<option value="">All Status</option>' +
                '<option value="Pending">Pending</option>' +
                '<option value="Approved">Approved</option>' +
                '<option value="Rejected">Rejected</option>' +
            '</select>' +
            '<label style="font-size:12px;color:var(--seoc-text-muted)">From</label>' +
            '<input type="date" id="filter-date-from" class="form-input" style="padding:5px 8px;width:auto">' +
            '<label style="font-size:12px;color:var(--seoc-text-muted)">To</label>' +
            '<input type="date" id="filter-date-to" class="form-input" style="padding:5px 8px;width:auto">' +
            '<button class="btn btn-primary" onclick="SEOC.module.applyFilter()">Apply</button>' +
            '<button class="btn btn-outline" onclick="SEOC.module.clearFilter()">Clear</button>';

        if (SEOC.auth.canExport()) {
            toolbarHtml += '<button class="btn btn-outline" onclick="SEOC.module.exportCSV()" style="margin-left:auto">Export CSV</button>';
        }
        toolbarHtml += '</div>';
        toolbarEl.innerHTML = toolbarHtml;

        // Populate district dropdown
        var distSelect = document.getElementById("filter-district");
        SEOC.districts.forEach(function(d) {
            distSelect.innerHTML += '<option value="' + d + '">' + d + '</option>';
        });

        // Load FeatureTable with default (no filter)
        _buildTable(mod, "1=1");
    }

    // ── Custom Data Table (replaces broken FeatureTable widget) ──
    var _tablePage = 0;
    var _tablePageSize = 25;
    var _tableData = [];

    function _buildTable(mod, where) {
        var tableEl = document.getElementById("table-embed");
        if (!tableEl) return;
        _tablePage = 0;
        _tableData = [];

        tableEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--seoc-text-muted)"><div class="spinner" style="margin:0 auto"></div><p style="margin-top:8px">Loading records...</p></div>';

        var cols = mod.keyColumns || [];
        var outFields = cols.concat(["objectid", "entered_by"]).join(",");
        var url = SEOC.getServiceUrl(mod) + "/query?where=" + encodeURIComponent(where || "1=1") +
            "&outFields=" + encodeURIComponent(outFields) +
            "&orderByFields=" + encodeURIComponent("objectid DESC") +
            "&resultRecordCount=2000&f=json&token=" + SEOC.auth.getToken();

        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.error) throw new Error(d.error.message || "Query failed");
                _tableData = (d.features || []).map(function(f) { return f.attributes; });
                _renderDataTable(mod, tableEl);
            })
            .catch(function(err) {
                tableEl.innerHTML = '<div style="padding:20px;color:var(--seoc-danger)">Error: ' + err.message + '</div>';
            });
    }

    function _renderDataTable(mod, tableEl) {
        var cols = mod.keyColumns || [];
        var data = _tableData;
        var start = _tablePage * _tablePageSize;
        var pageData = data.slice(start, start + _tablePageSize);
        var totalPages = Math.ceil(data.length / _tablePageSize);

        var html = '<div style="padding:8px 12px;font-size:13px;color:var(--seoc-text-secondary);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--seoc-border)">' +
            '<span><strong>' + data.length + '</strong> record(s) found</span>' +
            '<span>Page ' + (_tablePage + 1) + ' of ' + Math.max(totalPages, 1) + '</span></div>';

        html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';

        // Header
        html += '<thead><tr style="background:var(--seoc-surface-alt);border-bottom:2px solid var(--seoc-border)">';
        html += '<th style="padding:8px 10px;text-align:left;font-weight:600;white-space:nowrap">#</th>';
        cols.forEach(function(c) {
            var label = c.replace(/_/g, " ").replace(/\b\w/g, function(l) { return l.toUpperCase(); });
            html += '<th style="padding:8px 10px;text-align:left;font-weight:600;white-space:nowrap">' + label + '</th>';
        });
        html += '<th style="padding:8px 10px;text-align:left;font-weight:600">By</th>';
        html += '</tr></thead><tbody>';

        // Rows
        if (pageData.length === 0) {
            html += '<tr><td colspan="' + (cols.length + 2) + '" style="padding:30px;text-align:center;color:var(--seoc-text-muted)">No records found</td></tr>';
        }
        pageData.forEach(function(row, idx) {
            var bg = idx % 2 === 0 ? "" : "background:var(--seoc-surface-alt);";
            var oid = row.objectid;
            html += '<tr style="border-bottom:1px solid var(--seoc-border);cursor:pointer;' + bg + '" onclick="SEOC.module.openRecord(' + oid + ')" title="Click to view details">';
            html += '<td style="padding:6px 10px;color:var(--seoc-text-muted)">' + (start + idx + 1) + '</td>';
            cols.forEach(function(c) {
                var val = row[c];
                if (val === null || val === undefined) val = "";
                if (typeof val === "number" && val > 946684800000 && val < 2524608000000) {
                    val = new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                }
                if (c === "entry_status") {
                    var statusColor = val === "Approved" ? "var(--seoc-success)" : val === "Rejected" ? "var(--seoc-danger)" : "var(--seoc-warning)";
                    val = '<span style="background:' + statusColor + ';color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">' + val + '</span>';
                }
                html += '<td style="padding:6px 10px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + val + '</td>';
            });
            html += '<td style="padding:6px 10px;font-size:11px;color:var(--seoc-text-muted)">' + (row.entered_by || "") + '</td>';
            html += '</tr>';
        });

        html += '</tbody></table></div>';

        // Pagination
        if (totalPages > 1) {
            html += '<div style="display:flex;justify-content:center;gap:8px;padding:12px;border-top:1px solid var(--seoc-border)">';
            html += '<button class="btn btn-outline" ' + (_tablePage <= 0 ? 'disabled' : '') +
                ' onclick="SEOC.module.prevPage()" style="padding:4px 14px;font-size:12px">&laquo; Prev</button>';
            html += '<button class="btn btn-outline" ' + (_tablePage >= totalPages - 1 ? 'disabled' : '') +
                ' onclick="SEOC.module.nextPage()" style="padding:4px 14px;font-size:12px">Next &raquo;</button>';
            html += '</div>';
        }

        tableEl.innerHTML = html;
    }

    function applyFilter() {
        if (!_currentMod) return;
        var district = document.getElementById("filter-district").value;
        var status = document.getElementById("filter-status").value;
        var year = document.getElementById("filter-year").value;
        var dateFrom = document.getElementById("filter-date-from").value;
        var dateTo = document.getElementById("filter-date-to").value;
        var dateField = _currentMod.dateField || "incident_date";

        var clauses = [];
        if (district) clauses.push("district='" + district.replace(/'/g, "''") + "'");
        if (status) clauses.push("entry_status='" + status + "'");
        if (year && !dateFrom && !dateTo) {
            clauses.push(dateField + ">='" + year + "-01-01' AND " + dateField + "<'" + (parseInt(year)+1) + "-01-01'");
        }
        if (dateFrom) {
            clauses.push(dateField + ">='" + dateFrom + "'");
        }
        if (dateTo) {
            clauses.push(dateField + "<='" + dateTo + "'");
        }

        var where = clauses.length > 0 ? clauses.join(" AND ") : "1=1";
        _buildTable(_currentMod, where);
    }

    function clearFilter() {
        document.getElementById("filter-district").value = "";
        document.getElementById("filter-status").value = "";
        document.getElementById("filter-year").value = "";
        document.getElementById("filter-date-from").value = "";
        document.getElementById("filter-date-to").value = "";
        _buildTable(_currentMod, "1=1");
    }

    function exportCSV() {
        if (!_currentMod) return;
        var url = SEOC.getServiceUrl(_currentMod) +
            "/query?where=1%3D1&outFields=*&f=csv&token=" + SEOC.auth.getToken();
        window.open(url, "_blank");
    }

    function _loadAnalytics(mod) {
        // Destroy old charts
        Object.keys(_chartInstances).forEach(function(k) {
            if (_chartInstances[k]) _chartInstances[k].destroy();
        });
        _chartInstances = {};

        var url = SEOC.getServiceUrl(mod);

        // Analytics KPIs
        var aKpi = document.getElementById("analytics-kpi");
        Promise.all([
            SEOC.queryCount(url, "1=1"),
            SEOC.queryCount(url, "entry_status='Pending'"),
            SEOC.queryCount(url, "entry_status='Approved'")
        ]).then(function(counts) {
            aKpi.innerHTML =
                '<div class="kpi-card"><div class="kpi-value">' + counts[0] + '</div><div class="kpi-label">Total</div></div>' +
                '<div class="kpi-card"><div class="kpi-value warning">' + counts[1] + '</div><div class="kpi-label">Pending</div></div>' +
                '<div class="kpi-card"><div class="kpi-value success">' + counts[2] + '</div><div class="kpi-label">Approved</div></div>';
        });

        // District chart
        SEOC.queryGroupStats(url, "district", "1=1").then(function(data) {
            var ctx = document.getElementById("chart-district");
            if (!ctx || typeof Chart === "undefined") return;
            var labels = Object.keys(data).slice(0, 15);
            var values = labels.map(function(k) { return data[k]; });
            _chartInstances.district = new Chart(ctx, {
                type: "bar",
                data: { labels: labels, datasets: [{ data: values, backgroundColor: mod.color, borderRadius: 4 }] },
                options: {
                    responsive: true,
                    indexAxis: "y",
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true } }
                }
            });
        });

        // Trend chart (group by date)
        if (mod.dateField) {
            SEOC.queryGroupStats(url, mod.dateField, "1=1").then(function(data) {
                var ctx = document.getElementById("chart-trend");
                if (!ctx || typeof Chart === "undefined") return;
                var sorted = Object.keys(data).sort();
                var labels = sorted.map(function(k) {
                    if (typeof k === "number" || !isNaN(k)) {
                        var d = new Date(parseInt(k));
                        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                    }
                    return k;
                });
                var values = sorted.map(function(k) { return data[k]; });
                _chartInstances.trend = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            borderColor: mod.color,
                            backgroundColor: mod.color + "33",
                            fill: true,
                            tension: 0.3,
                            pointRadius: 3
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });
            });
        }
    }

    // ── Detail Sections per Module ──

    function _getDetailSections(moduleKey) {
        var defs = {
            lightning: [
                { title: "Incident Information", fields: ["incident_date", "incident_time"] },
                { title: "Victim Details", fields: ["victim_name", "aadhar_number", "gender", "age", "occupation", "death_location", "economic_status"] },
                { title: "Location", fields: ["district", "mandal", "village", "habitation", "location_details"] },
                { title: "Next of Kin", fields: ["kin_name", "kin_phone", "kin_relation"] },
                { title: "Alert Information", fields: ["cap_alert_sent", "cap_alert_time", "whatsapp_alert"] },
                { title: "Ex-Gratia Payment", fields: ["payment_status", "sanction_order", "exgratia_amount", "cfms_bill_no"] },
                { title: "Remarks", fields: ["remarks"] }
            ],
            drowning: [
                { title: "Incident Information", fields: ["incident_date", "incident_time"] },
                { title: "Event Details", fields: ["incident_description", "water_body_type", "water_body_name", "report_source"] },
                { title: "Location", fields: ["district", "mandal", "village", "location_details"] },
                { title: "Victim Count", fields: ["total_victims", "persons_saved", "persons_died", "persons_missing"] },
                { title: "Rescue", fields: ["rescue_by"] },
                { title: "Remarks", fields: ["remarks"] }
            ],
            floods: [
                { title: "Report Period", fields: ["report_date", "report_time", "report_shift"] },
                { title: "Location", fields: ["district", "mandal"] },
                { title: "Impact Summary", fields: ["mandals_affected", "villages_affected", "villages_inundated", "population_affected", "lives_lost", "cattle_lost"] },
                { title: "House Damage", fields: ["houses_fully_pucca", "houses_fully_kutcha", "houses_fully_huts", "houses_partly_pucca", "houses_partly_kutcha", "houses_partly_huts"] },
                { title: "Infrastructure", fields: ["electric_poles", "roads_damaged_km", "bridges_damaged", "tanks_breached", "bunds_breached"] },
                { title: "Crop Damage", fields: ["crop_area_ha", "crop_loss_crores"] },
                { title: "Relief Operations", fields: ["sdrf_teams", "ndrf_teams", "boats_deployed", "relief_camps", "people_in_camps", "people_evacuated", "medical_camps", "food_packets"] },
                { title: "Remarks", fields: ["remarks"] }
            ],
            calls: [
                { title: "Call Information", fields: ["call_date", "call_time", "call_source", "caller_name", "caller_phone"] },
                { title: "Event Details", fields: ["event_type", "event_info"] },
                { title: "Location", fields: ["district", "mandal", "village", "location_details"] },
                { title: "Victim & Response", fields: ["victim_name_age", "num_persons", "bodies_traced", "persons_missing", "persons_saved"] },
                { title: "Team & Closure", fields: ["team_deployed", "info_passed_time", "erss_closing_time"] },
                { title: "Remarks", fields: ["remarks"] }
            ],
            rescue: [
                { title: "Request Details", fields: ["request_received", "request_from", "team_dispatched"] },
                { title: "Location", fields: ["district", "mandal", "village", "water_body_name", "location_details"] },
                { title: "Team Details", fields: ["force_type", "battalion", "num_teams", "team_strength", "incharge_name", "incharge_phone", "equipment"] },
                { title: "Operation", fields: ["event_nature", "rescue_datetime"] },
                { title: "Rescue Outcome", fields: ["males_rescued", "females_rescued", "children_rescued", "persons_survived", "deaths"] },
                { title: "Closure", fields: ["team_closed_date"] },
                { title: "Remarks", fields: ["remarks"] }
            ],
            heatwave: [
                { title: "Observation", fields: ["observation_date", "observation_time"] },
                { title: "Location", fields: ["district", "mandal", "village", "location_details"] },
                { title: "Temperature Data", fields: ["max_temperature", "min_temperature", "humidity_percent", "heatwave_declared", "severe_heatwave"] },
                { title: "Impact", fields: ["heat_casualties", "hospitalizations"] },
                { title: "Remarks", fields: ["remarks"] }
            ],
            reservoir: [
                { title: "Reading Info", fields: ["reading_date", "reading_time"] },
                { title: "Dam / Barrage", fields: ["river_system", "dam_name", "district", "mandal", "village"] },
                { title: "Water Levels", fields: ["water_level_ft", "water_level_m", "inflow_cusecs", "outflow_cusecs", "storage_tmc", "gates_opened", "flood_warning"] },
                { title: "Remarks", fields: ["remarks"] }
            ],
            dsr: [
                { title: "Report Info", fields: ["report_date", "report_time", "disaster_type"] },
                { title: "Location", fields: ["district", "mandal", "village", "location_details"] },
                { title: "Casualties & Damage", fields: ["deaths", "injuries", "missing", "property_damage_crores", "crop_damage_ha", "infra_damage_crores"] },
                { title: "Remarks", fields: ["remarks"] }
            ],
            staff: [
                { title: "Personal Details", fields: ["full_name", "date_of_birth", "gender", "employee_id"] },
                { title: "APSDMA Posting", fields: ["designation", "section_wing", "posting_type", "date_of_joining", "staff_status", "shift_duty"] },
                { title: "Contact", fields: ["mobile_primary", "mobile_alternate", "whatsapp_number", "email_official", "seoc_intercom"] },
                { title: "Portal Access", fields: ["portal_role", "assigned_modules", "portal_username", "account_created"] },
                { title: "Remarks", fields: ["remarks"] }
            ]
        };
        return defs[moduleKey] || [{ title: "Details", fields: Object.keys({}) }];
    }

    // ── Record Detail Modal ──

    function openRecord(objectId) {
        if (!_currentMod) return;

        // Fetch full record (outSR=4326 for lat/lon coordinates)
        var url = SEOC.getServiceUrl(_currentMod) + "/query?where=" +
            encodeURIComponent("objectid=" + objectId) +
            "&outFields=*&outSR=4326&returnGeometry=true&f=json&token=" + SEOC.auth.getToken();

        fetch(url).then(function(r) { return r.json(); })
            .then(function(d) {
                var features = d.features || [];
                if (features.length === 0) { SEOC.toast("Record not found", "error"); return; }

                var attrs = features[0].attributes;
                var geom = features[0].geometry;
                _showDetailModal(attrs, geom, objectId);
            })
            .catch(function(err) { SEOC.toast("Error: " + err.message, "error"); });
    }

    function _showDetailModal(attrs, geom, objectId) {
        var mod = _currentMod;

        // Build modal HTML
        var html = '<div class="record-modal-overlay" id="record-modal" onclick="if(event.target===this)SEOC.module.closeRecord()">';
        html += '<div class="record-modal">';

        // Header
        html += '<div class="record-modal-header">' +
            '<div><span style="font-size:24px">' + mod.icon + '</span> ' +
            '<strong style="font-size:16px">' + mod.title + '</strong>' +
            '<span style="margin-left:12px;font-size:12px;color:var(--seoc-text-muted)">ID: ' + objectId + '</span></div>' +
            '<button onclick="SEOC.module.closeRecord()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--seoc-text-muted)">&times;</button>' +
            '</div>';

        // Status bar + Edit button
        var status = attrs.entry_status || "Pending";
        var statusColor = status === "Approved" ? "var(--seoc-success)" : status === "Rejected" ? "var(--seoc-danger)" : "var(--seoc-warning)";
        html += '<div style="padding:8px 20px;background:var(--seoc-surface-alt);border-bottom:1px solid var(--seoc-border);display:flex;gap:16px;align-items:center;font-size:13px;flex-wrap:wrap">' +
            '<span style="background:' + statusColor + ';color:#fff;padding:3px 12px;border-radius:4px;font-weight:600">' + status + '</span>' +
            '<span>Entered by: <strong>' + (attrs.entered_by || "—") + '</strong></span>' +
            (attrs.approved_by ? '<span>Approved by: <strong>' + attrs.approved_by + '</strong></span>' : '') +
            '<button class="btn btn-primary" onclick="SEOC.module.editRecord(' + objectId + ')" style="margin-left:auto;padding:5px 16px;font-size:12px">Edit Record</button>' +
            '</div>';

        // Organized fields by section
        html += '<div class="record-modal-body">';

        var skipFields = ['objectid', 'globalid', 'entry_status', 'entered_by', 'approved_by', 'entry_datetime'];

        // Define sections per module
        var sections = _getDetailSections(mod.key);

        sections.forEach(function(section) {
            var sectionHtml = '';
            var hasData = false;

            section.fields.forEach(function(key) {
                var val = attrs[key];
                if (val === null || val === undefined || val === "") return;
                hasData = true;

                // Format dates
                if (typeof val === "number" && val > 946684800000 && val < 2524608000000) {
                    val = new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                }

                var label = key.replace(/_/g, " ").replace(/\b\w/g, function(l) { return l.toUpperCase(); });

                sectionHtml += '<div class="record-field">' +
                    '<div class="record-field-label">' + label + '</div>' +
                    '<div class="record-field-value">' + val + '</div></div>';
            });

            if (hasData) {
                html += '<div class="record-section-title">' + section.title + '</div>' +
                    '<div class="record-fields">' + sectionHtml + '</div>';
            }
        });

        // Any remaining fields not in sections
        var usedFields = [];
        sections.forEach(function(s) { usedFields = usedFields.concat(s.fields); });
        var extraHtml = '';
        Object.keys(attrs).forEach(function(key) {
            if (skipFields.indexOf(key) >= 0 || usedFields.indexOf(key) >= 0) return;
            var val = attrs[key];
            if (val === null || val === undefined || val === "") return;
            if (typeof val === "number" && val > 946684800000 && val < 2524608000000) {
                val = new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
            }
            var label = key.replace(/_/g, " ").replace(/\b\w/g, function(l) { return l.toUpperCase(); });
            extraHtml += '<div class="record-field"><div class="record-field-label">' + label + '</div>' +
                '<div class="record-field-value">' + val + '</div></div>';
        });
        if (extraHtml) {
            html += '<div class="record-section-title">Other Details</div><div class="record-fields">' + extraHtml + '</div>';
        }

        // Map with location pin
        if (geom && geom.x && geom.y) {
            html += '<div class="record-section-title">Location</div>' +
                '<div id="detail-map" style="height:250px;border-radius:8px;border:1px solid var(--seoc-border);margin-bottom:16px"></div>' +
                '<div style="font-size:12px;color:var(--seoc-text-muted);margin-bottom:16px">Lat: ' + geom.y.toFixed(6) + ', Lon: ' + geom.x.toFixed(6) + '</div>';
        }

        // Attachments section
        html += '<div class="record-section-title">Attachments</div>' +
            '<div id="detail-attachments" style="margin-bottom:16px"><div class="spinner" style="width:20px;height:20px;margin:8px 0"></div> Loading...</div>';

        html += '</div>'; // modal-body
        html += '</div>'; // modal
        html += '</div>'; // overlay

        document.body.insertAdjacentHTML('beforeend', html);

        // Load map and attachments after DOM renders
        setTimeout(function() {
            if (geom && geom.x && geom.y) {
                _loadDetailMap(geom);
            }
            _loadAttachments(objectId);
        }, 300);
    }

    function _loadDetailMap(geom) {
        var mapDiv = document.getElementById("detail-map");
        if (!mapDiv) return;

        // Use a simple Leaflet/OpenStreetMap embed (more reliable than ArcGIS MapView in modals)
        var lat = geom.y.toFixed(6);
        var lon = geom.x.toFixed(6);
        mapDiv.innerHTML = '<iframe width="100%" height="100%" frameborder="0" style="border-radius:8px" ' +
            'src="https://www.openstreetmap.org/export/embed.html?bbox=' +
            (parseFloat(lon)-0.02) + ',' + (parseFloat(lat)-0.015) + ',' +
            (parseFloat(lon)+0.02) + ',' + (parseFloat(lat)+0.015) +
            '&layer=mapnik&marker=' + lat + ',' + lon + '" ' +
            'allowfullscreen></iframe>';
    }

    function _loadAttachments(objectId) {
        var container = document.getElementById("detail-attachments");
        if (!container) return;

        var url = SEOC.getServiceUrl(_currentMod) + "/" + objectId + "/attachments?f=json&token=" + SEOC.auth.getToken();

        fetch(url).then(function(r) { return r.json(); })
            .then(function(d) {
                var attachments = d.attachmentInfos || [];
                if (attachments.length === 0) {
                    container.innerHTML = '<div style="color:var(--seoc-text-muted);font-size:13px;padding:8px 0">No attachments</div>';
                    return;
                }

                var html = '<div class="attachment-grid">';
                attachments.forEach(function(att) {
                    var rawUrl = SEOC.getServiceUrl(_currentMod) + "/" + objectId + "/attachments/" + att.id + "?token=" + SEOC.auth.getToken();
                    var isImage = /\.(jpg|jpeg|png|gif|bmp)$/i.test(att.name);
                    var isPdf = /\.pdf$/i.test(att.name);
                    var sizeKB = Math.round((att.size || 0) / 1024);
                    var icon = isPdf ? "&#128196;" : isImage ? "&#128247;" : "&#128206;";
                    html += '<div class="attachment-card">';
                    if (isImage) {
                        html += '<div class="attachment-preview"><img src="' + rawUrl + '" alt="' + att.name + '" onerror="this.parentElement.innerHTML=\'&#128247;\'"></div>';
                    } else {
                        html += '<div class="attachment-preview attachment-icon">' + icon + '</div>';
                    }
                    html += '<div class="attachment-info">' +
                        '<div class="attachment-name" title="' + att.name + '">' + att.name + '</div>' +
                        '<div class="attachment-size">' + sizeKB + ' KB</div>' +
                        '</div>' +
                        '<div class="attachment-actions">' +
                        '<button class="btn btn-primary" style="padding:5px 12px;font-size:12px" onclick="SEOC.module.viewAttachment(\'' + rawUrl + '\',\'' + att.name.replace(/'/g,"\\'") + '\')">View</button>' +
                        '<button class="btn btn-outline" style="padding:5px 12px;font-size:12px" onclick="SEOC.module.downloadAttachment(\'' + rawUrl + '\',\'' + att.name.replace(/'/g,"\\'") + '\')">Download</button>' +
                        '</div></div>';
                });
                html += '</div>';
                container.innerHTML = html;
            })
            .catch(function(err) {
                container.innerHTML = '<div style="color:var(--seoc-danger);font-size:13px">Failed to load attachments: ' + err.message + '</div>';
            });
    }

    function closeRecord() {
        var modal = document.getElementById("record-modal");
        if (modal) modal.remove();
    }

    // ── View attachment with correct MIME type ──
    function viewAttachment(url, filename) {
        var ext = filename.split('.').pop().toLowerCase();
        var mimeMap = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', doc: 'application/msword' };
        var mime = mimeMap[ext] || 'application/octet-stream';

        fetch(url).then(function(r) { return r.blob(); })
            .then(function(blob) {
                var properBlob = new Blob([blob], { type: mime });
                var blobUrl = URL.createObjectURL(properBlob);
                window.open(blobUrl, '_blank');
            })
            .catch(function() { window.open(url, '_blank'); });
    }

    // ── Download attachment ──
    function downloadAttachment(url, filename) {
        fetch(url).then(function(r) { return r.blob(); })
            .then(function(blob) {
                var a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename;
                a.click();
            })
            .catch(function() { window.open(url, '_blank'); });
    }

    // ── Edit Record ──
    function editRecord(objectId) {
        if (!_currentMod) return;
        closeRecord();

        // Switch to Add New tab and load form with existing data
        switchTab('add');

        var url = SEOC.getServiceUrl(_currentMod) + "/query?where=" +
            encodeURIComponent("objectid=" + objectId) +
            "&outFields=*&outSR=4326&f=json&token=" + SEOC.auth.getToken();

        fetch(url).then(function(r) { return r.json(); })
            .then(function(d) {
                var features = d.features || [];
                if (features.length === 0) return;
                var attrs = features[0].attributes;

                // Set form to edit mode
                SEOC._editObjectId = objectId;

                // Wait for form to render
                setTimeout(function() {
                    var form = document.getElementById("seoc-form");
                    if (!form) return;

                    // Fill form fields with existing data
                    Object.keys(attrs).forEach(function(key) {
                        var val = attrs[key];
                        if (val === null || val === undefined) return;

                        var input = form.querySelector('[name="' + key + '"]');
                        if (!input) return;

                        if (input.type === 'date' && typeof val === 'number') {
                            input.value = new Date(val).toISOString().split('T')[0];
                        } else if (input.tagName === 'SELECT') {
                            for (var i = 0; i < input.options.length; i++) {
                                if (input.options[i].value === String(val) || input.options[i].value.toLowerCase() === String(val).toLowerCase()) {
                                    input.value = input.options[i].value;
                                    input.dispatchEvent(new Event('change'));
                                    break;
                                }
                            }
                        } else {
                            input.value = val;
                        }
                    });

                    // Change submit button to "Update Record"
                    var btn = document.getElementById("btn-submit");
                    if (btn) {
                        btn.textContent = "Update Record";
                        btn.style.background = "var(--seoc-success)";
                    }

                    // Show editing indicator
                    var formEl = document.getElementById("survey-embed");
                    if (formEl) {
                        var editBanner = document.createElement('div');
                        editBanner.style.cssText = 'background:#ebf8ff;border:1px solid var(--seoc-accent);border-radius:8px;padding:10px 16px;margin-bottom:16px;font-size:13px;display:flex;align-items:center;gap:8px';
                        editBanner.innerHTML = '<strong style="color:var(--seoc-accent)">Editing Record #' + objectId + '</strong>' +
                            '<button class="btn btn-outline" onclick="SEOC._editObjectId=null;SEOC.module.switchTab(\'add\')" style="margin-left:auto;padding:3px 12px;font-size:11px">Cancel Edit</button>';
                        formEl.insertBefore(editBanner, formEl.firstChild);
                    }

                    SEOC.toast("Editing record #" + objectId);
                }, 500);
            });
    }

    function nextPage() {
        _tablePage++;
        var tableEl = document.getElementById("table-embed");
        if (tableEl && _currentMod) _renderDataTable(_currentMod, tableEl);
    }

    function prevPage() {
        if (_tablePage > 0) _tablePage--;
        var tableEl = document.getElementById("table-embed");
        if (tableEl && _currentMod) _renderDataTable(_currentMod, tableEl);
    }

    return {
        render: render,
        switchTab: switchTab,
        applyFilter: applyFilter,
        clearFilter: clearFilter,
        exportCSV: exportCSV,
        nextPage: nextPage,
        prevPage: prevPage,
        openRecord: openRecord,
        closeRecord: closeRecord,
        viewAttachment: viewAttachment,
        downloadAttachment: downloadAttachment,
        editRecord: editRecord
    };
})();
