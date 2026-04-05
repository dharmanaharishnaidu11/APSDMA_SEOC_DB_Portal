/* ==========================================================================
   SEOC Forms — Custom HTML form definitions for all 9 modules
   Replaces Survey123 iframe with native forms that submit via REST API
   ========================================================================== */

window.SEOC = window.SEOC || {};

// ── Form Field Definitions ──
// type: text | number | date | time | select | textarea | file
// options: [{value, label}] for selects

SEOC.formDefs = {

    lightning: {
        sections: [
            { title: "Incident Information", fields: [
                { name: "incident_date", label: "Date of Incident", type: "date", required: true },
                { name: "incident_time", label: "Time of Incident", type: "time", hint: "e.g. 15:30" }
            ]},
            { title: "Location", fields: [
                { name: "district", label: "District", type: "district", required: true },
                { name: "mandal", label: "Mandal", type: "mandal", required: true },
                { name: "village", label: "Village", type: "village" },
                { name: "location_details", label: "Specific Location", type: "text", hint: "Road, landmark, etc." }
            ]},
            { title: "Victim Details", fields: [
                { name: "victim_name", label: "Name of the Deceased", type: "text", required: true },
                { name: "aadhar_number", label: "Aadhar Number", type: "aadhar", hint: "12 digit Aadhar number" },
                { name: "gender", label: "Gender", type: "select", required: true, options: [
                    { value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }
                ]},
                { name: "age", label: "Age (Years)", type: "number" },
                { name: "occupation", label: "Occupation", type: "text" },
                { name: "death_location", label: "Location of Death", type: "select", required: true, options: [
                    { value: "open_field", label: "Open Field / Open Area" }, { value: "under_tree", label: "Under Tree" },
                    { value: "near_shed", label: "Near Shed / Beside Shed" }, { value: "on_house", label: "On House / Terrace" },
                    { value: "shock", label: "Sound Shock" }, { value: "other", label: "Other" }
                ]},
                { name: "economic_status", label: "Economic Status", type: "select", options: [
                    { value: "bpl", label: "BPL" }, { value: "apl", label: "APL" }
                ]}
            ]},
            { title: "Deceased Photo", fields: [
                { name: "deceased_photo", label: "Photo of Deceased", type: "photo", hint: "Passport size photo (JPEG/PNG, max 5MB)" }
            ]},
            { title: "Next of Kin", fields: [
                { name: "kin_name", label: "Next of Kin Name", type: "alpha", hint: "Alphabets only" },
                { name: "kin_phone", label: "Phone Number", type: "phone", hint: "10 digit mobile number" },
                { name: "kin_relation", label: "Relation to Deceased", type: "select", options: [
                    { value: "Father", label: "Father" }, { value: "Mother", label: "Mother" },
                    { value: "Wife", label: "Wife" }, { value: "Husband", label: "Husband" },
                    { value: "Son", label: "Son" }, { value: "Daughter", label: "Daughter" },
                    { value: "Brother", label: "Brother" }, { value: "Sister", label: "Sister" },
                    { value: "Father-in-law", label: "Father-in-law" }, { value: "Mother-in-law", label: "Mother-in-law" },
                    { value: "Son-in-law", label: "Son-in-law" }, { value: "Daughter-in-law", label: "Daughter-in-law" },
                    { value: "Uncle", label: "Uncle" }, { value: "Aunt", label: "Aunt" },
                    { value: "Grandfather", label: "Grandfather" }, { value: "Grandmother", label: "Grandmother" },
                    { value: "Nephew", label: "Nephew" }, { value: "Niece", label: "Niece" },
                    { value: "Cousin", label: "Cousin" }, { value: "Friend", label: "Friend" },
                    { value: "Neighbour", label: "Neighbour" }, { value: "Other", label: "Other (specify in remarks)" }
                ]}
            ]},
            { title: "Alert & Payment", fields: [
                { name: "cap_alert_sent", label: "CAP Alert Sent?", type: "select", options: [
                    { value: "yes", label: "Yes" }, { value: "no", label: "No" }
                ]},
                { name: "whatsapp_alert", label: "WhatsApp Alert?", type: "select", options: [
                    { value: "yes", label: "Yes" }, { value: "no", label: "No" }
                ]},
                { name: "payment_status", label: "Payment Status", type: "select", options: [
                    { value: "pending", label: "Pending" }, { value: "sanctioned", label: "Sanctioned" }, { value: "disbursed", label: "Disbursed" }
                ]},
                { name: "exgratia_amount", label: "Ex-Gratia Amount (Rs.)", type: "number" },
                { name: "cfms_bill_no", label: "CFMS Bill Number", type: "text" }
            ]},
            { title: "Remarks", fields: [
                { name: "remarks", label: "Remarks", type: "textarea" }
            ]}
        ]
    },

    drowning: {
        sections: [
            { title: "Incident Information", fields: [
                { name: "incident_date", label: "Date of Incident", type: "date", required: true },
                { name: "incident_time", label: "Time", type: "time" }
            ]},
            { title: "Location", fields: [
                { name: "district", label: "District", type: "district", required: true },
                { name: "mandal", label: "Mandal", type: "mandal", required: true },
                { name: "village", label: "Village", type: "village" },
                { name: "location_details", label: "Specific Location", type: "text" }
            ]},
            { title: "Event Details", fields: [
                { name: "incident_description", label: "Incident Description", type: "textarea", required: true },
                { name: "water_body_type", label: "Water Body Type", type: "select", required: true, options: [
                    { value: "river", label: "River" }, { value: "canal", label: "Canal" }, { value: "tank", label: "Tank/Pond" },
                    { value: "reservoir", label: "Reservoir" }, { value: "sea", label: "Sea/Beach" }, { value: "well", label: "Well" },
                    { value: "quarry", label: "Quarry" }, { value: "other", label: "Other" }
                ]},
                { name: "water_body_name", label: "Name of Water Body", type: "text" },
                { name: "report_source", label: "Report Source", type: "select", options: [
                    { value: "seoc", label: "SEOC" }, { value: "112_call", label: "112 Call" }, { value: "1070_call", label: "1070 Call" },
                    { value: "collector", label: "District Collector" }, { value: "other", label: "Other" }
                ]}
            ]},
            { title: "Victim Count", fields: [
                { name: "total_victims", label: "Total Victims", type: "number", required: true },
                { name: "persons_saved", label: "Persons Saved", type: "number", default: "0" },
                { name: "persons_died", label: "Persons Died", type: "number", default: "0" },
                { name: "persons_missing", label: "Missing", type: "number", default: "0" }
            ]},
            { title: "Remarks", fields: [
                { name: "remarks", label: "Remarks", type: "textarea" }
            ]}
        ]
    },

    floods: {
        sections: [
            { title: "Report Period", fields: [
                { name: "report_date", label: "Report Date", type: "date", required: true },
                { name: "report_shift", label: "Reporting Shift", type: "select", required: true, options: [
                    { value: "morning", label: "Morning (06:00)" }, { value: "afternoon", label: "Afternoon (14:00)" }, { value: "night", label: "Night (22:00)" }
                ]}
            ]},
            { title: "Location", fields: [
                { name: "district", label: "District", type: "district", required: true },
                { name: "mandal", label: "Mandal", type: "mandal" }
            ]},
            { title: "Impact Summary", fields: [
                { name: "mandals_affected", label: "Mandals Affected", type: "number", default: "0" },
                { name: "villages_affected", label: "Villages Affected", type: "number", default: "0" },
                { name: "population_affected", label: "Population Affected", type: "number", default: "0" },
                { name: "lives_lost", label: "Lives Lost", type: "number", default: "0" },
                { name: "cattle_lost", label: "Cattle Lost", type: "number", default: "0" }
            ]},
            { title: "House Damage", fields: [
                { name: "houses_fully_pucca", label: "Fully Damaged - Pucca", type: "number", default: "0" },
                { name: "houses_fully_kutcha", label: "Fully Damaged - Kutcha", type: "number", default: "0" },
                { name: "houses_fully_huts", label: "Fully Damaged - Huts", type: "number", default: "0" },
                { name: "houses_partly_pucca", label: "Partly Damaged - Pucca", type: "number", default: "0" },
                { name: "houses_partly_kutcha", label: "Partly Damaged - Kutcha", type: "number", default: "0" }
            ]},
            { title: "Relief Operations", fields: [
                { name: "sdrf_teams", label: "SDRF Teams", type: "number", default: "0" },
                { name: "ndrf_teams", label: "NDRF Teams", type: "number", default: "0" },
                { name: "people_evacuated", label: "People Evacuated", type: "number", default: "0" },
                { name: "relief_camps", label: "Relief Camps", type: "number", default: "0" },
                { name: "food_packets", label: "Food Packets", type: "number", default: "0" }
            ]},
            { title: "Remarks", fields: [
                { name: "remarks", label: "Remarks", type: "textarea" }
            ]}
        ]
    },

    calls: {
        sections: [
            { title: "Call Information", fields: [
                { name: "call_date", label: "Call Date", type: "date", required: true },
                { name: "call_time", label: "Call Time", type: "time" },
                { name: "call_source", label: "Call Source", type: "select", required: true, options: [
                    { value: "112a", label: "112 A" }, { value: "112b", label: "112 B" }, { value: "1070", label: "1070" }
                ]},
                { name: "caller_name", label: "Caller Name", type: "text" },
                { name: "caller_phone", label: "Caller Phone", type: "text", required: true },
                { name: "event_type", label: "Event Type", type: "select", required: true, options: [
                    { value: "drowning", label: "Drowning" }, { value: "fire", label: "Fire" }, { value: "flood", label: "Flood/Heavy Rain" },
                    { value: "lightning", label: "Lightning" }, { value: "road_accident", label: "Road Accident" },
                    { value: "building_collapse", label: "Building Collapse" }, { value: "tree_fall", label: "Tree Fall" },
                    { value: "electrocution", label: "Electrocution" }, { value: "boat_capsize", label: "Boat Capsize" },
                    { value: "animal_attack", label: "Animal Attack" }, { value: "other", label: "Other" }
                ]},
                { name: "event_info", label: "Event Description", type: "textarea", required: true }
            ]},
            { title: "Location", fields: [
                { name: "district", label: "District", type: "district", required: true },
                { name: "mandal", label: "Mandal", type: "mandal" },
                { name: "village", label: "Village", type: "village" }
            ]},
            { title: "Victim & Response", fields: [
                { name: "victim_name_age", label: "Victim Name & Age", type: "text" },
                { name: "num_persons", label: "Persons Involved", type: "number" },
                { name: "persons_saved", label: "Persons Saved", type: "number", default: "0" },
                { name: "bodies_traced", label: "Bodies Traced", type: "number", default: "0" },
                { name: "persons_missing", label: "Missing", type: "number", default: "0" },
                { name: "team_deployed", label: "Team Deployed", type: "text" }
            ]},
            { title: "Remarks", fields: [
                { name: "remarks", label: "Remarks", type: "textarea" }
            ]}
        ]
    },

    rescue: {
        sections: [
            { title: "Request Details", fields: [
                { name: "request_received", label: "Request Received", type: "date", required: true },
                { name: "request_from", label: "Request From", type: "text", hint: "e.g. Collector, Kurnool" },
                { name: "team_dispatched", label: "Team Dispatched Date", type: "date" }
            ]},
            { title: "Location", fields: [
                { name: "district", label: "District", type: "district", required: true },
                { name: "mandal", label: "Mandal", type: "mandal" },
                { name: "village", label: "Village", type: "village" },
                { name: "water_body_name", label: "River/Canal/Tank Name", type: "text" }
            ]},
            { title: "Team Details", fields: [
                { name: "force_type", label: "Force Type", type: "select", required: true, options: [
                    { value: "sdrf", label: "SDRF" }, { value: "ndrf", label: "NDRF" }, { value: "navy", label: "Navy" },
                    { value: "coast_guard", label: "Coast Guard" }, { value: "army", label: "Army" }
                ]},
                { name: "battalion", label: "Battalion / Unit", type: "text" },
                { name: "num_teams", label: "No. of Teams", type: "number" },
                { name: "team_strength", label: "Team Strength", type: "number" },
                { name: "event_nature", label: "Nature of Event", type: "select", required: true, options: [
                    { value: "drowning", label: "Drowning" }, { value: "flood", label: "Flood Rescue" }, { value: "cyclone", label: "Cyclone" },
                    { value: "boat_capsize", label: "Boat Capsize" }, { value: "landslide", label: "Landslide" }, { value: "other", label: "Other" }
                ]}
            ]},
            { title: "Rescue Outcome", fields: [
                { name: "males_rescued", label: "Males Rescued", type: "number", default: "0" },
                { name: "females_rescued", label: "Females Rescued", type: "number", default: "0" },
                { name: "children_rescued", label: "Children Rescued", type: "number", default: "0" },
                { name: "deaths", label: "Deaths", type: "number", default: "0" }
            ]},
            { title: "Remarks", fields: [
                { name: "remarks", label: "Remarks", type: "textarea" }
            ]}
        ]
    },

    heatwave: {
        sections: [
            { title: "Observation", fields: [
                { name: "observation_date", label: "Observation Date", type: "date", required: true },
                { name: "observation_time", label: "Time", type: "time" }
            ]},
            { title: "Location", fields: [
                { name: "district", label: "District", type: "district", required: true },
                { name: "mandal", label: "Mandal", type: "mandal", required: true }
            ]},
            { title: "Temperature Data", fields: [
                { name: "max_temperature", label: "Max Temperature (\u00B0C)", type: "number", required: true },
                { name: "min_temperature", label: "Min Temperature (\u00B0C)", type: "number" },
                { name: "humidity_percent", label: "Humidity (%)", type: "number" },
                { name: "heatwave_declared", label: "Heatwave Declared?", type: "select", options: [
                    { value: "yes", label: "Yes" }, { value: "no", label: "No" }
                ]},
                { name: "heat_casualties", label: "Heat Casualties", type: "number", default: "0" }
            ]},
            { title: "Remarks", fields: [
                { name: "remarks", label: "Remarks", type: "textarea" }
            ]}
        ]
    },

    reservoir: {
        sections: [
            { title: "Reading Info", fields: [
                { name: "reading_date", label: "Reading Date", type: "date", required: true },
                { name: "reading_time", label: "Time", type: "time" }
            ]},
            { title: "Dam / Barrage", fields: [
                { name: "river_system", label: "River System", type: "select", required: true, options: [
                    { value: "krishna", label: "Krishna" }, { value: "godavari", label: "Godavari" },
                    { value: "penna", label: "Penna" }, { value: "tungabhadra", label: "Tungabhadra" },
                    { value: "vamsadhara", label: "Vamsadhara" }, { value: "nagavalli", label: "Nagavalli" }
                ]},
                { name: "dam_name", label: "Dam / Barrage Name", type: "select", required: true, options: [
                    { value: "srisailam", label: "Srisailam" }, { value: "nagarjuna_sagar", label: "Nagarjuna Sagar" },
                    { value: "pulichintala", label: "Pulichintala" }, { value: "prakasam_barrage", label: "Prakasam Barrage" },
                    { value: "somasila", label: "Somasila" }, { value: "kandaleru", label: "Kandaleru" },
                    { value: "dowleswaram", label: "Dowleswaram" }, { value: "polavaram", label: "Polavaram" },
                    { value: "tungabhadra_dam", label: "Tungabhadra Dam" }, { value: "other", label: "Other" }
                ]}
            ]},
            { title: "Water Levels", fields: [
                { name: "water_level_ft", label: "Water Level (Feet)", type: "number" },
                { name: "inflow_cusecs", label: "Inflow (Cusecs)", type: "number" },
                { name: "outflow_cusecs", label: "Outflow (Cusecs)", type: "number" },
                { name: "storage_tmc", label: "Storage (TMC)", type: "number" },
                { name: "gates_opened", label: "Gates Opened", type: "number" },
                { name: "flood_warning", label: "Flood Warning", type: "select", options: [
                    { value: "normal", label: "Normal" }, { value: "first", label: "1st Warning" },
                    { value: "second", label: "2nd Warning" }, { value: "third", label: "3rd Warning" },
                    { value: "danger", label: "Danger Level" }
                ]}
            ]},
            { title: "Remarks", fields: [
                { name: "remarks", label: "Remarks", type: "textarea" }
            ]}
        ]
    },

    dsr: {
        sections: [
            { title: "Report Info", fields: [
                { name: "report_date", label: "Report Date", type: "date", required: true },
                { name: "report_time", label: "Time", type: "time" },
                { name: "disaster_type", label: "Disaster Type", type: "select", required: true, options: [
                    { value: "flood", label: "Flood / Heavy Rains" }, { value: "cyclone", label: "Cyclone" },
                    { value: "lightning", label: "Lightning" }, { value: "drowning", label: "Drowning" },
                    { value: "heatwave", label: "Heat Wave" }, { value: "fire", label: "Fire" },
                    { value: "landslide", label: "Landslide" }, { value: "building_collapse", label: "Building Collapse" },
                    { value: "electrocution", label: "Electrocution" }, { value: "snake_bite", label: "Snake Bite" },
                    { value: "other", label: "Other" }
                ]}
            ]},
            { title: "Location", fields: [
                { name: "district", label: "District", type: "district", required: true },
                { name: "mandal", label: "Mandal", type: "mandal" },
                { name: "village", label: "Village", type: "village" }
            ]},
            { title: "Casualties & Damage", fields: [
                { name: "deaths", label: "Deaths", type: "number", default: "0" },
                { name: "injuries", label: "Injuries", type: "number", default: "0" },
                { name: "missing", label: "Missing", type: "number", default: "0" },
                { name: "property_damage_crores", label: "Property Damage (Crores)", type: "number", default: "0" },
                { name: "crop_damage_ha", label: "Crop Damage (Ha)", type: "number", default: "0" }
            ]},
            { title: "Remarks", fields: [
                { name: "remarks", label: "Remarks", type: "textarea" }
            ]}
        ]
    },

    staff: {
        sections: [
            { title: "Personal Details", fields: [
                { name: "full_name", label: "Full Name", type: "text", required: true },
                { name: "gender", label: "Gender", type: "select", options: [
                    { value: "male", label: "Male" }, { value: "female", label: "Female" }
                ]},
                { name: "employee_id", label: "Employee ID", type: "text" },
                { name: "designation", label: "Designation", type: "select", required: true, options: [
                    { value: "seoc_incharge", label: "SEOC Incharge" }, { value: "seoc_duty_officer", label: "Duty Officer" },
                    { value: "deo", label: "Data Entry Operator" }, { value: "gis_analyst", label: "GIS Analyst" },
                    { value: "it_admin", label: "IT Administrator" }, { value: "constable", label: "Constable" },
                    { value: "consultant", label: "Consultant" }, { value: "other", label: "Other" }
                ]}
            ]},
            { title: "Contact", fields: [
                { name: "mobile_primary", label: "Mobile (Primary)", type: "text", required: true },
                { name: "email_official", label: "Email (Official)", type: "text" }
            ]},
            { title: "Portal Access", fields: [
                { name: "portal_role", label: "Portal Role", type: "select", required: true, options: [
                    { value: "admin", label: "Admin" }, { value: "duty_officer", label: "Duty Officer" },
                    { value: "deo", label: "DEO" }, { value: "viewer", label: "Viewer" }
                ]},
                { name: "portal_username", label: "Portal Username", type: "text", required: true },
                { name: "staff_status", label: "Status", type: "select", options: [
                    { value: "active", label: "Active" }, { value: "on_leave", label: "On Leave" }, { value: "transferred", label: "Transferred" }
                ]}
            ]},
            { title: "Remarks", fields: [
                { name: "remarks", label: "Remarks", type: "textarea" }
            ]}
        ]
    }
};

// ── Mandals data (loaded on first use) ──
SEOC._mandals = null;

SEOC.loadMandals = function() {
    if (SEOC._mandals) return Promise.resolve(SEOC._mandals);
    var url = SEOC.config.SERVICE_BASE + "/../../../rest/services/Hosted/AP_Mandals_688/FeatureServer/0/query" +
        "?where=1%3D1&outFields=mandal_name,district_name&resultRecordCount=2000&f=json&token=" + SEOC.auth.getToken();
    return fetch(url).then(function(r) { return r.json(); })
        .then(function(d) {
            SEOC._mandals = {};
            (d.features || []).forEach(function(f) {
                var dist = f.attributes.district_name;
                var mand = f.attributes.mandal_name;
                if (!SEOC._mandals[dist]) SEOC._mandals[dist] = [];
                SEOC._mandals[dist].push(mand);
            });
            // Sort mandals
            Object.keys(SEOC._mandals).forEach(function(d) {
                SEOC._mandals[d].sort();
            });
            return SEOC._mandals;
        })
        .catch(function() { return {}; });
};

// ── Picked location from map ──
SEOC._pickedLocation = null;

// ── Form Renderer ──

SEOC.renderForm = function(moduleKey, containerId, onSuccess) {
    var def = SEOC.formDefs[moduleKey];
    if (!def) { document.getElementById(containerId).innerHTML = '<p>No form defined for ' + moduleKey + '</p>'; return; }

    SEOC._pickedLocation = null;
    var mod = SEOC.getModule(moduleKey);
    var html = '<form id="seoc-form" class="seoc-form" onsubmit="return false;">';

    // ── Excel Import Bar ──
    html += '<div class="form-import-bar">' +
        '<label class="btn btn-outline" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">' +
            '<span>&#128196;</span> Import from Excel/CSV' +
            '<input type="file" id="import-file" accept=".xlsx,.xls,.csv" style="display:none" onchange="SEOC._importFile(\'' + moduleKey + '\')">' +
        '</label>' +
        '<span id="import-status" style="font-size:12px;color:var(--seoc-text-muted);margin-left:8px"></span>' +
    '</div>';

    def.sections.forEach(function(section) {
        html += '<div class="form-section"><div class="form-section-title">' + section.title + '</div>';
        html += '<div class="form-grid">';
        section.fields.forEach(function(f) {
            html += SEOC._renderField(f);
        });
        html += '</div></div>';
    });

    // ── Map Location Picker ──
    html += '<div class="form-section"><div class="form-section-title">Location on Map</div>' +
        '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:8px">' +
            '<div class="form-group" style="flex:1;min-width:120px">' +
                '<label class="form-label">Latitude</label>' +
                '<input type="number" step="any" id="pick-lat" name="_latitude" class="form-input" placeholder="e.g. 16.5167" ' +
                'oninput="SEOC._onManualCoords()">' +
            '</div>' +
            '<div class="form-group" style="flex:1;min-width:120px">' +
                '<label class="form-label">Longitude</label>' +
                '<input type="number" step="any" id="pick-lon" name="_longitude" class="form-input" placeholder="e.g. 80.6167" ' +
                'oninput="SEOC._onManualCoords()">' +
            '</div>' +
            '<div class="form-group" style="flex:2;min-width:200px">' +
                '<label class="form-label">Address (auto-filled from map)</label>' +
                '<input type="text" id="pick-address" class="form-input" placeholder="Click map or enter lat/lon" readonly>' +
            '</div>' +
        '</div>' +
        '<div id="form-map" style="height:280px;border-radius:8px;border:1px solid var(--seoc-border)"></div>' +
        '<div class="form-hint" style="margin-top:4px">Click on map to set location, or type lat/lon manually above</div>' +
        '</div>';

    // ── File Attachments ──
    html += '<div class="form-section"><div class="form-section-title">Attachments (PDF, Photos, Documents)</div>' +
        '<div class="form-grid">' +
            '<div class="form-group"><label class="form-label">Upload File 1</label>' +
                '<input type="file" name="attachment_1" class="form-input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"></div>' +
            '<div class="form-group"><label class="form-label">Upload File 2</label>' +
                '<input type="file" name="attachment_2" class="form-input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"></div>' +
            '<div class="form-group"><label class="form-label">Upload File 3</label>' +
                '<input type="file" name="attachment_3" class="form-input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"></div>' +
        '</div>' +
        '<div class="form-hint">Max 10 MB per file. Supported: PDF, JPEG, PNG, Word, Excel</div></div>';

    html += '<div class="form-actions">' +
        '<button type="button" class="btn btn-primary btn-lg" id="btn-submit" onclick="SEOC._submitForm(\'' + moduleKey + '\')">Submit Record</button>' +
        '<button type="button" class="btn btn-outline" onclick="SEOC._resetForm()">Clear Form</button>' +
        '<span id="submit-status" style="font-size:12px;color:var(--seoc-text-muted);margin-left:auto"></span>' +
        '</div></form>';

    document.getElementById(containerId).innerHTML = html;

    // Wire up district → mandal cascade
    SEOC._wireDistrictMandal();

    // Initialize map picker
    SEOC._initMapPicker();
};

SEOC._renderField = function(f) {
    var req = f.required ? ' <span style="color:var(--seoc-danger)">*</span>' : '';
    var hint = f.hint ? '<div class="form-hint">' + f.hint + '</div>' : '';
    var html = '<div class="form-group">';
    html += '<label class="form-label">' + f.label + req + '</label>';

    if (f.type === "text") {
        html += '<input type="text" name="' + f.name + '" class="form-input"' +
            (f.required ? ' required' : '') + (f.default ? ' value="' + f.default + '"' : '') + '>';
    } else if (f.type === "number") {
        html += '<input type="number" step="any" name="' + f.name + '" class="form-input"' +
            (f.required ? ' required' : '') + ' value="' + (f.default || '') + '">';
    } else if (f.type === "date") {
        var today = new Date().toISOString().split('T')[0];
        html += '<input type="date" name="' + f.name + '" class="form-input" value="' + today + '"' +
            (f.required ? ' required' : '') + '>';
    } else if (f.type === "time") {
        html += '<input type="time" name="' + f.name + '" class="form-input">';
    } else if (f.type === "select") {
        html += '<select name="' + f.name + '" class="form-input"' + (f.required ? ' required' : '') + '>';
        html += '<option value="">-- Select --</option>';
        (f.options || []).forEach(function(o) {
            html += '<option value="' + o.value + '">' + o.label + '</option>';
        });
        html += '</select>';
    } else if (f.type === "district") {
        html += '<select name="' + f.name + '" class="form-input" id="form-district"' + (f.required ? ' required' : '') + '>';
        html += '<option value="">-- Select District --</option>';
        SEOC.districts.forEach(function(d) {
            html += '<option value="' + d + '">' + d + '</option>';
        });
        html += '</select>';
    } else if (f.type === "mandal") {
        html += '<select name="' + f.name + '" class="form-input" id="form-mandal"' + (f.required ? ' required' : '') + '>';
        html += '<option value="">-- Select Mandal --</option>';
        html += '</select>';
    } else if (f.type === "village") {
        html += '<select name="' + f.name + '" class="form-input" id="form-village">';
        html += '<option value="">-- Select Village --</option>';
        html += '</select>';
    } else if (f.type === "textarea") {
        html += '<textarea name="' + f.name + '" class="form-input form-textarea" rows="3"></textarea>';
    } else if (f.type === "aadhar") {
        html += '<input type="text" name="' + f.name + '" class="form-input" placeholder="____ ____ ____" maxlength="14"' +
            ' oninput="this.value=this.value.replace(/[^0-9]/g,\'\').replace(/(\\d{4})(?=\\d)/g,\'$1 \').trim()"' +
            ' pattern="\\d{4}\\s\\d{4}\\s\\d{4}" title="Enter 12 digit Aadhar number">';
    } else if (f.type === "alpha") {
        html += '<input type="text" name="' + f.name + '" class="form-input"' +
            ' oninput="this.value=this.value.replace(/[^a-zA-Z\\s.]/g,\'\')"' +
            ' placeholder="Alphabets only"' +
            (f.required ? ' required' : '') + '>';
    } else if (f.type === "phone") {
        html += '<input type="tel" name="' + f.name + '" class="form-input" placeholder="9876543210" maxlength="10"' +
            ' oninput="this.value=this.value.replace(/[^0-9]/g,\'\')"' +
            ' pattern="[0-9]{10}" title="Enter 10 digit mobile number">';
    } else if (f.type === "photo") {
        html += '<div class="photo-upload-area">' +
            '<input type="file" name="' + f.name + '" class="form-input" accept="image/jpeg,image/png" ' +
            'onchange="SEOC._previewPhoto(this)">' +
            '<div id="photo-preview-' + f.name + '" class="photo-preview"></div></div>';
    }

    html += hint + '</div>';
    return html;
};

// ── Villages data (loaded per mandal) ──
SEOC._villages = {};
SEOC._villageServiceUrl = "https://apsdmagis.ap.gov.in/gisserver/rest/services/Hosted/Admin_Bnds/FeatureServer/2";

// Load villages from PostgreSQL backup API (admin.ap_villages — 28 districts, 18392 villages, matching names)
SEOC.loadVillages = function(district, mandal) {
    var key = district + "|" + mandal;
    if (SEOC._villages[key]) return Promise.resolve(SEOC._villages[key]);

    return fetch("https://apsdmagis.ap.gov.in/seoc-api/villages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district: district, mandal: mandal })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
        var villages = d.villages || [];
        SEOC._villages[key] = villages;
        return villages;
    })
    .catch(function() {
        // Fallback: try ArcGIS hosted service
        var where = "district='" + district.replace(/'/g, "''") + "' AND mandal='" + mandal.replace(/'/g, "''") + "'";
        var url = SEOC._villageServiceUrl + "/query?where=" + encodeURIComponent(where) +
            "&outFields=village&orderByFields=village&resultRecordCount=500&f=json&token=" + SEOC.auth.getToken();
        return fetch(url).then(function(r) { return r.json(); })
            .then(function(d) {
                var villages = (d.features || []).map(function(f) { return f.attributes.village; }).filter(Boolean);
                villages = villages.filter(function(v, i, a) { return a.indexOf(v) === i; });
                villages.sort();
                SEOC._villages[key] = villages;
                return villages;
            })
            .catch(function() { return []; });
    });
};

SEOC._wireDistrictMandal = function() {
    var distSelect = document.getElementById("form-district");
    if (!distSelect) return;

    distSelect.addEventListener("change", function() {
        // Reset mandal and village
        var mandalSelect = document.getElementById("form-mandal");
        var villageSelect = document.getElementById("form-village");
        if (mandalSelect) {
            mandalSelect.innerHTML = '<option value="">Loading...</option>';
        }
        if (villageSelect) {
            villageSelect.innerHTML = '<option value="">-- Select Village --</option>';
        }

        SEOC.loadMandals().then(function(data) {
            var mandals = data[distSelect.value] || [];
            if (mandalSelect) {
                mandalSelect.innerHTML = '<option value="">-- Select Mandal --</option>';
                mandals.forEach(function(m) {
                    mandalSelect.innerHTML += '<option value="' + m + '">' + m + '</option>';
                });
            }
        });
    });

    // Mandal → Village cascade
    var mandalSelect = document.getElementById("form-mandal");
    if (mandalSelect) {
        mandalSelect.addEventListener("change", function() {
            var villageSelect = document.getElementById("form-village");
            if (!villageSelect) return;
            var dist = distSelect.value;
            var mand = mandalSelect.value;
            if (!dist || !mand) {
                villageSelect.innerHTML = '<option value="">-- Select Village --</option>';
                return;
            }
            villageSelect.innerHTML = '<option value="">Loading...</option>';
            SEOC.loadVillages(dist, mand).then(function(villages) {
                villageSelect.innerHTML = '<option value="">-- Select Village --</option>';
                villages.forEach(function(v) {
                    villageSelect.innerHTML += '<option value="' + v + '">' + v + '</option>';
                });
                // Add "Other" at the end
                villageSelect.innerHTML += '<option value="__other__">Other (type manually)</option>';
            });
        });
    }

    // Handle "Other" village selection
    var villageSelect = document.getElementById("form-village");
    if (villageSelect) {
        villageSelect.addEventListener("change", function() {
            if (villageSelect.value === "__other__") {
                var custom = prompt("Enter village name:");
                if (custom) {
                    var opt = document.createElement("option");
                    opt.value = custom;
                    opt.text = custom;
                    opt.selected = true;
                    villageSelect.insertBefore(opt, villageSelect.lastElementChild);
                } else {
                    villageSelect.value = "";
                }
            }
        });
    }
};

// ── Manual coordinate entry ──
SEOC._onManualCoords = function() {
    var lat = parseFloat(document.getElementById("pick-lat").value);
    var lon = parseFloat(document.getElementById("pick-lon").value);
    if (isNaN(lat) || isNaN(lon)) return;
    if (lat < 10 || lat > 22 || lon < 75 || lon > 86) return; // rough AP bounds

    SEOC._pickedLocation = { lat: lat, lon: lon };

    // Reverse geocode
    fetch("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=" +
        lon + "," + lat + "&f=json&langCode=en")
        .then(function(r) { return r.json(); })
        .then(function(d) {
            var addr = d.address ? (d.address.LongLabel || d.address.ShortLabel || "") : "";
            var addrEl = document.getElementById("pick-address");
            if (addrEl) addrEl.value = addr;
        }).catch(function() {});
};

// ── Map Picker (ArcGIS JS API) ──

SEOC._initMapPicker = function() {
    require([
        "esri/Map", "esri/views/MapView", "esri/Graphic",
        "esri/layers/GraphicsLayer", "esri/geometry/Point"
    ], function(Map, MapView, Graphic, GraphicsLayer, Point) {
        var pinLayer = new GraphicsLayer();
        var map = new Map({ basemap: "osm", layers: [pinLayer] });

        var view = new MapView({
            container: "form-map",
            map: map,
            center: SEOC.config.AP_CENTER,
            zoom: SEOC.config.AP_ZOOM
        });

        view.on("click", function(event) {
            var lat = Math.round(event.mapPoint.latitude * 1000000) / 1000000;
            var lon = Math.round(event.mapPoint.longitude * 1000000) / 1000000;

            SEOC._pickedLocation = { lat: lat, lon: lon };
            document.getElementById("pick-lat").value = lat;
            document.getElementById("pick-lon").value = lon;

            // Drop pin
            pinLayer.removeAll();
            pinLayer.add(new Graphic({
                geometry: new Point({ longitude: lon, latitude: lat }),
                symbol: { type: "simple-marker", color: [220, 50, 50], size: 12, outline: { color: [255,255,255], width: 2 } }
            }));

            // Reverse geocode using ArcGIS
            var rgUrl = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode" +
                "?location=" + lon + "," + lat + "&f=json&langCode=en";
            fetch(rgUrl).then(function(r) { return r.json(); })
                .then(function(d) {
                    var addr = d.address ? (d.address.LongLabel || d.address.ShortLabel || "") : "";
                    var addrEl = document.getElementById("pick-address");
                    if (addrEl) addrEl.value = addr;
                    // Auto-fill location_details if empty
                    var locInput = document.querySelector('input[name="location_details"]');
                    if (locInput && !locInput.value && addr) {
                        locInput.value = addr.split(",")[0];
                    }
                }).catch(function() {});
        });

        view.ui.move("zoom", "bottom-right");
    });
};

// ── Excel/CSV Import ──

SEOC._importFile = function(moduleKey) {
    var fileInput = document.getElementById("import-file");
    var statusEl = document.getElementById("import-status");
    if (!fileInput.files[0]) return;

    var file = fileInput.files[0];
    statusEl.textContent = "Reading " + file.name + "...";

    if (typeof XLSX === "undefined") {
        statusEl.textContent = "Excel library not loaded";
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var wb = XLSX.read(e.target.result, { type: "array" });
            var sheet = wb.Sheets[wb.SheetNames[0]];
            var rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            if (rows.length === 0) {
                statusEl.textContent = "No data found in file";
                return;
            }

            // Auto-fill form from first row
            var row = rows[0];
            var filled = 0;
            var form = document.getElementById("seoc-form");
            Object.keys(row).forEach(function(col) {
                var val = row[col];
                if (val === "" || val === null) return;

                // Try exact match first, then fuzzy match
                var fieldName = col.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");
                var input = form.querySelector('[name="' + fieldName + '"]') ||
                            form.querySelector('[name="' + col + '"]');

                if (!input) {
                    // Fuzzy: try matching label text
                    var def = SEOC.formDefs[moduleKey];
                    if (def) {
                        def.sections.forEach(function(s) {
                            s.fields.forEach(function(f) {
                                if (f.label.toLowerCase() === col.toLowerCase() ||
                                    f.name === fieldName) {
                                    input = form.querySelector('[name="' + f.name + '"]');
                                }
                            });
                        });
                    }
                }

                if (input) {
                    if (input.tagName === "SELECT") {
                        // Try to match option value or text
                        for (var i = 0; i < input.options.length; i++) {
                            if (input.options[i].value.toLowerCase() === String(val).toLowerCase() ||
                                input.options[i].text.toLowerCase() === String(val).toLowerCase()) {
                                input.value = input.options[i].value;
                                input.dispatchEvent(new Event('change'));
                                filled++;
                                break;
                            }
                        }
                    } else {
                        input.value = val;
                        filled++;
                    }
                }
            });

            statusEl.textContent = "Filled " + filled + " fields from " + file.name +
                (rows.length > 1 ? " (row 1 of " + rows.length + " — submit one at a time)" : "");
        } catch (err) {
            statusEl.textContent = "Error reading file: " + err.message;
        }
    };
    reader.readAsArrayBuffer(file);
};

// ── Submit: Dual-write to ArcGIS + PostgreSQL ──

SEOC._submitForm = function(moduleKey) {
    var form = document.getElementById("seoc-form");
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var btn = document.getElementById("btn-submit");
    var statusEl = document.getElementById("submit-status");
    btn.disabled = true;
    btn.textContent = "Submitting...";
    statusEl.textContent = "";

    var mod = SEOC.getModule(moduleKey);
    var formData = new FormData(form);
    var attributes = {
        entry_status: "Pending",
        entered_by: SEOC.auth.getUser().username
    };

    // Collect form values (skip file/photo fields — those go as attachments)
    var fileFields = [];
    var def = SEOC.formDefs[moduleKey];
    def.sections.forEach(function(section) {
        section.fields.forEach(function(f) {
            if (f.type === "photo" || f.type === "file") {
                fileFields.push(f.name);
                return;
            }
            var val = formData.get(f.name);
            if (val === "" || val === null || val === undefined) return;
            // Skip if val is a File object
            if (typeof val === "object" && val.name) return;
            // Strip spaces from Aadhar
            if (f.type === "aadhar") { val = val.replace(/\s/g, ""); }
            if (f.type === "number") {
                attributes[f.name] = parseFloat(val);
            } else if (f.type === "date") {
                attributes[f.name] = new Date(val).getTime();
            } else {
                attributes[f.name] = val;
            }
        });
    });

    // Add geometry from map picker
    var feature = { attributes: attributes };
    if (SEOC._pickedLocation) {
        feature.geometry = {
            x: SEOC._pickedLocation.lon,
            y: SEOC._pickedLocation.lat,
            spatialReference: { wkid: 4326 }
        };
    }

    // Collect attachment files (including deceased photo and file uploads)
    var attachmentFiles = [];
    ["attachment_1", "attachment_2", "attachment_3"].concat(fileFields).forEach(function(name) {
        var input = form.querySelector('input[name="' + name + '"]');
        if (input && input.files && input.files[0]) {
            attachmentFiles.push(input.files[0]);
        }
    });

    var serviceUrl = SEOC.getServiceUrl(mod);

    // ── Step 1: Submit to ArcGIS Feature Service (add or update) ──
    var isEdit = !!SEOC._editObjectId;
    if (isEdit) {
        feature.attributes.objectid = SEOC._editObjectId;
    }
    statusEl.textContent = isEdit ? "Updating..." : "Saving to ArcGIS...";

    var endpoint = isEdit ? "/updateFeatures" : "/addFeatures";
    var paramKey = isEdit ? "features" : "features";
    var params = new URLSearchParams({
        features: JSON.stringify([feature]),
        f: "json",
        token: SEOC.auth.getToken()
    });

    fetch(serviceUrl + endpoint, { method: "POST", body: params })
        .then(function(r) { return r.json(); })
        .then(function(d) {
            var results = d.addResults || d.updateResults || [];
            if (!results.length || !results[0].success) {
                var errMsg = (results[0] && results[0].error) ? results[0].error.description : "Unknown error";
                throw new Error(errMsg);
            }

            var objectId = results[0].objectId || SEOC._editObjectId;
            statusEl.textContent = "Saved to ArcGIS (ID: " + objectId + ")";

            // ── Step 2: Upload attachments ──
            var attachPromises = attachmentFiles.map(function(file) {
                var fd = new FormData();
                fd.append("attachment", file);
                fd.append("f", "json");
                fd.append("token", SEOC.auth.getToken());
                return fetch(serviceUrl + "/" + objectId + "/addAttachment", { method: "POST", body: fd })
                    .then(function(r) { return r.json(); })
                    .catch(function() { return { error: "Upload failed" }; });
            });

            return Promise.all(attachPromises).then(function(attResults) {
                var uploaded = attResults.filter(function(r) { return r.addAttachmentResult && r.addAttachmentResult.success; }).length;
                if (uploaded > 0) statusEl.textContent += " + " + uploaded + " file(s)";
                return objectId;
            });
        })
        .then(function(objectId) {
            // ── Step 3: Backup to PostgreSQL ──
            statusEl.textContent += " | Saving backup...";
            return fetch("https://apsdmagis.ap.gov.in/seoc-api/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ module: moduleKey, attributes: attributes })
            })
            .then(function(r) { return r.json(); })
            .then(function(pgResult) {
                if (pgResult.success) {
                    statusEl.textContent += " DB backup OK";
                } else {
                    statusEl.textContent += " DB backup: " + (pgResult.error || "warning");
                }
            })
            .catch(function() {
                // PostgreSQL backup failure is non-fatal
                statusEl.textContent += " (DB backup unavailable)";
            });
        })
        .then(function() {
            SEOC.toast(isEdit ? "Record updated!" : "Record submitted successfully!");
            SEOC._editObjectId = null;
            SEOC._resetForm();
            btn.disabled = false;
            btn.textContent = "Submit Record";
        })
        .catch(function(err) {
            SEOC.toast("Submit failed: " + err.message, "error");
            statusEl.textContent = "Error: " + err.message;
            btn.disabled = false;
            btn.textContent = "Submit Record";
        });
};

SEOC._previewPhoto = function(input) {
    var preview = document.getElementById('photo-preview-' + input.name);
    if (!preview) return;
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:150px;max-height:180px;border-radius:8px;border:1px solid var(--seoc-border);margin-top:8px">';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.innerHTML = '';
    }
};

SEOC._resetForm = function() {
    var form = document.getElementById("seoc-form");
    if (form) form.reset();
    SEOC._pickedLocation = null;
    var latEl = document.getElementById("pick-lat");
    var lonEl = document.getElementById("pick-lon");
    var addrEl = document.getElementById("pick-address");
    if (latEl) latEl.value = "";
    if (lonEl) lonEl.value = "";
    if (addrEl) addrEl.textContent = "";
    // Reset date to today
    if (form) form.querySelectorAll('input[type="date"]').forEach(function(el) {
        el.value = new Date().toISOString().split('T')[0];
    });
};
