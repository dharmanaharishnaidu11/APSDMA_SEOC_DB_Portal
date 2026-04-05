/* ==========================================================================
   SEOC Utilities — Query helpers, toast, shared functions
   Must load AFTER seoc-config.js and seoc-auth.js, BEFORE other modules
   ========================================================================== */

window.SEOC = window.SEOC || {};

// Toast notification
SEOC.toast = function(message, type) {
    var toast = document.createElement("div");
    toast.className = "toast" + (type === "error" ? " error" : "");
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3500);
};

// Query record count
SEOC.queryCount = function(serviceUrl, where) {
    var url = serviceUrl + "/query?where=" + encodeURIComponent(where || "1=1") +
        "&returnCountOnly=true&f=json&token=" + SEOC.auth.getToken();
    return fetch(url).then(function(r) { return r.json(); })
        .then(function(d) { return d.count || 0; })
        .catch(function() { return 0; });
};

// Query with outStatistics
SEOC.queryStats = function(serviceUrl, field, statType, where) {
    var stats = JSON.stringify([{ statisticType: statType || "count", onStatisticField: field, outStatisticFieldName: "stat_result" }]);
    var url = serviceUrl + "/query?where=" + encodeURIComponent(where || "1=1") +
        "&outStatistics=" + encodeURIComponent(stats) + "&f=json&token=" + SEOC.auth.getToken();
    return fetch(url).then(function(r) { return r.json(); })
        .then(function(d) { return (d.features && d.features[0]) ? d.features[0].attributes.stat_result : 0; })
        .catch(function() { return 0; });
};

// Query with GROUP BY
SEOC.queryGroupStats = function(serviceUrl, groupField, where) {
    var stats = JSON.stringify([{ statisticType: "count", onStatisticField: "objectid", outStatisticFieldName: "cnt" }]);
    var url = serviceUrl + "/query?where=" + encodeURIComponent(where || "1=1") +
        "&groupByFieldsForStatistics=" + encodeURIComponent(groupField) +
        "&outStatistics=" + encodeURIComponent(stats) +
        "&orderByFields=" + encodeURIComponent("cnt DESC") +
        "&f=json&token=" + SEOC.auth.getToken();
    return fetch(url).then(function(r) { return r.json(); })
        .then(function(d) {
            var result = {};
            (d.features || []).forEach(function(f) {
                var key = f.attributes[groupField] || "Unknown";
                result[key] = f.attributes.cnt;
            });
            return result;
        })
        .catch(function() { return {}; });
};
