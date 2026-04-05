/* ==========================================================================
   SEOC Dashboard — KPI Cards, Module Grid, Map, Charts, Activity Feed
   ========================================================================== */

window.SEOC = window.SEOC || {};

SEOC.dashboard = (function() {
    var _chartInstances = {};

    function render(param, container) {
        container.innerHTML =
            '<div class="page-header"><div class="page-icon">&#127968;</div><div><h2>Dashboard</h2><p>SEOC Data Entry Portal Overview</p></div></div>' +
            '<div class="kpi-bar" id="dash-kpi"></div>' +
            '<div class="module-grid" id="dash-modules"></div>' +
            '<div class="charts-row">' +
                '<div class="chart-card"><h3>Records by Module</h3><canvas id="chart-by-module"></canvas></div>' +
                '<div class="chart-card"><h3>Pending vs Approved</h3><canvas id="chart-status"></canvas></div>' +
            '</div>' +
            '<div class="map-container" id="dash-map"></div>' +
            '<div class="activity-feed" id="dash-activity"><h3>Recent Activity</h3><p style="color:var(--seoc-text-muted);font-size:13px;">Loading...</p></div>';

        _loadKPIs();
        _loadModuleCards();
        _loadCharts();
        _loadMap();
        _loadActivity();
    }

    function _loadKPIs() {
        var kpiEl = document.getElementById("dash-kpi");
        var allMods = SEOC.modules.concat(SEOC.auth.canAdmin() ? SEOC.adminModules : []);

        var totalP = Promise.all(allMods.map(function(m) {
            return SEOC.queryCount(SEOC.getServiceUrl(m), "1=1");
        }));
        var pendingP = Promise.all(allMods.map(function(m) {
            return SEOC.queryCount(SEOC.getServiceUrl(m), "entry_status='Pending'");
        }));

        Promise.all([totalP, pendingP]).then(function(results) {
            var total = results[0].reduce(function(a, b) { return a + b; }, 0);
            var pending = results[1].reduce(function(a, b) { return a + b; }, 0);
            var approved = total - pending;

            kpiEl.innerHTML =
                _kpiCard(total, "Total Records", "", "&#128202;") +
                _kpiCard(pending, "Pending Approval", "warning", "&#9203;") +
                _kpiCard(approved, "Approved", "success", "&#9989;") +
                _kpiCard(allMods.length, "Active Modules", "", "&#128218;");

            // Update nav badge
            var badge = document.getElementById("nav-pending-count");
            if (badge && pending > 0) {
                badge.textContent = pending;
                badge.style.display = "";
            }
        });
    }

    function _kpiCard(value, label, cls, icon) {
        return '<div class="kpi-card"><div class="kpi-icon">' + icon + '</div>' +
            '<div class="kpi-value ' + cls + '">' + (value || 0).toLocaleString() + '</div>' +
            '<div class="kpi-label">' + label + '</div></div>';
    }

    function _loadModuleCards() {
        var grid = document.getElementById("dash-modules");
        var html = "";

        SEOC.modules.forEach(function(mod) {
            var cardId = "card-" + mod.key;
            html += '<div class="module-card" style="border-left:4px solid ' + mod.color + '" onclick="SEOC.router.navigate(\'module/' + mod.key + '\')">' +
                '<div class="card-badge" id="badge-' + mod.key + '" style="display:none"></div>' +
                '<div class="card-icon">' + mod.icon + '</div>' +
                '<div class="card-title">' + mod.title + '</div>' +
                '<div class="card-desc">' + mod.desc + '</div>' +
                '<div class="card-stats">' +
                    '<div><div class="card-stat-value" id="count-' + mod.key + '">-</div><div class="card-stat-label">Records</div></div>' +
                    '<div><div class="card-stat-value" id="pending-' + mod.key + '" style="color:var(--seoc-warning)">-</div><div class="card-stat-label">Pending</div></div>' +
                '</div></div>';
        });
        grid.innerHTML = html;

        // Fetch counts for each module
        SEOC.modules.forEach(function(mod) {
            var url = SEOC.getServiceUrl(mod);
            SEOC.queryCount(url, "1=1").then(function(c) {
                var el = document.getElementById("count-" + mod.key);
                if (el) el.textContent = c.toLocaleString();
            });
            SEOC.queryCount(url, "entry_status='Pending'").then(function(c) {
                var el = document.getElementById("pending-" + mod.key);
                if (el) el.textContent = c;
                if (c > 0) {
                    var badge = document.getElementById("badge-" + mod.key);
                    if (badge) { badge.textContent = c + " Pending"; badge.style.display = ""; }
                }
            });
        });
    }

    function _loadCharts() {
        if (typeof Chart === "undefined") return;

        // Destroy old charts
        Object.keys(_chartInstances).forEach(function(k) { _chartInstances[k].destroy(); });
        _chartInstances = {};

        var labels = [];
        var colors = [];
        SEOC.modules.forEach(function(m) { labels.push(m.title.replace("SDRF / NDRF ", "")); colors.push(m.color); });

        // Records by module
        Promise.all(SEOC.modules.map(function(m) {
            return SEOC.queryCount(SEOC.getServiceUrl(m), "1=1");
        })).then(function(counts) {
            var ctx = document.getElementById("chart-by-module");
            if (!ctx) return;
            _chartInstances.byModule = new Chart(ctx, {
                type: "bar",
                data: { labels: labels, datasets: [{ data: counts, backgroundColor: colors, borderRadius: 4 }] },
                options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        });

        // Pending vs Approved
        Promise.all([
            Promise.all(SEOC.modules.map(function(m) { return SEOC.queryCount(SEOC.getServiceUrl(m), "entry_status='Pending'"); })),
            Promise.all(SEOC.modules.map(function(m) { return SEOC.queryCount(SEOC.getServiceUrl(m), "entry_status='Approved'"); }))
        ]).then(function(results) {
            var pending = results[0];
            var approved = results[1];
            var ctx = document.getElementById("chart-status");
            if (!ctx) return;
            _chartInstances.status = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        { label: "Pending", data: pending, backgroundColor: "#d69e2e", borderRadius: 4 },
                        { label: "Approved", data: approved, backgroundColor: "#38a169", borderRadius: 4 }
                    ]
                },
                options: { responsive: true, plugins: { legend: { position: "top" } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
            });
        });
    }

    function _loadMap() {
        var mapDiv = document.getElementById("dash-map");
        if (!mapDiv) return;

        require([
            "esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer"
        ], function(Map, MapView, FeatureLayer) {
            var map = new Map({ basemap: "gray-vector" });

            var view = new MapView({
                container: "dash-map",
                map: map,
                center: SEOC.config.AP_CENTER,
                zoom: SEOC.config.AP_ZOOM,
                constraints: { minZoom: 6, maxZoom: 14 }
            });

            // Add each module as a layer
            var layers = SEOC.modules.map(function(mod) {
                return new FeatureLayer({
                    url: SEOC.getServiceUrl(mod),
                    title: mod.title,
                    visible: true,
                    popupTemplate: {
                        title: mod.icon + " " + mod.title,
                        content: [{
                            type: "fields",
                            fieldInfos: (mod.keyColumns || []).slice(0, 5).map(function(f) {
                                return { fieldName: f, label: f.replace(/_/g, " ") };
                            })
                        }]
                    }
                });
            });
            map.layers.addMany(layers);

            view.ui.move("zoom", "bottom-right");
        });
    }

    function _loadActivity() {
        var feedEl = document.getElementById("dash-activity");
        if (!feedEl) return;

        // Fetch last 5 records from each module (most recent first)
        var promises = SEOC.modules.map(function(mod) {
            var url = SEOC.getServiceUrl(mod) + "/query?where=1%3D1&outFields=" +
                encodeURIComponent("objectid,district,entry_status,entered_by," + (mod.dateField || "created_at")) +
                "&orderByFields=" + encodeURIComponent("objectid DESC") +
                "&resultRecordCount=3&f=json&token=" + SEOC.auth.getToken();
            return fetch(url).then(function(r) { return r.json(); })
                .then(function(d) {
                    return (d.features || []).map(function(f) {
                        f.attributes._module = mod;
                        return f;
                    });
                })
                .catch(function() { return []; });
        });

        Promise.all(promises).then(function(results) {
            var all = [].concat.apply([], results);
            all.sort(function(a, b) { return (b.attributes.objectid || 0) - (a.attributes.objectid || 0); });
            all = all.slice(0, 15);

            if (all.length === 0) {
                feedEl.innerHTML = '<h3>Recent Activity</h3><p style="color:var(--seoc-text-muted);font-size:13px;">No records yet</p>';
                return;
            }

            var html = '<h3>Recent Activity</h3>';
            all.forEach(function(f) {
                var a = f.attributes;
                var mod = a._module;
                var status = a.entry_status || "Pending";
                var district = a.district || "";
                var by = a.entered_by || "";
                html += '<div class="activity-item">' +
                    '<span class="activity-icon">' + mod.icon + '</span>' +
                    '<span class="activity-text"><strong>' + mod.title + '</strong> &mdash; ' + district +
                    (by ? ' by ' + by : '') + '</span>' +
                    '<span class="activity-time">' + status + '</span></div>';
            });
            feedEl.innerHTML = html;
        });
    }

    return { render: render };
})();
