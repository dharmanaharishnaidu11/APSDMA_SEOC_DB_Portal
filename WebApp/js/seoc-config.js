/* ==========================================================================
   SEOC Data Entry Portal — Configuration
   All service URLs, form IDs, group IDs, module metadata
   ========================================================================== */

window.SEOC = window.SEOC || {};

SEOC.config = {
    PORTAL_URL: "https://apsdmagis.ap.gov.in/gisportal",
    SERVER_URL: "https://apsdmagis.ap.gov.in/gisserver",
    SERVICE_BASE: "https://apsdmagis.ap.gov.in/gisserver/rest/services/Hosted",

    AP_CENTER: [80.0, 16.0],
    AP_ZOOM: 7,

    TOKEN_EXPIRATION: 120,
    TOKEN_REFRESH_MS: 5400000,
    DATA_REFRESH_MS: 60000,

    GROUPS: {
        SEOC_Admins: "537b68e430854f32b3bef7cdb4a1c1fe",
        SEOC_DutyOfficers: "686f65c4fb82451891f1d403ba94b8ec",
        SEOC_DEOs: "cf51a56f1e674c37868f65650b7f72f0"
    },

    ROLES: {
        ADMIN: "Admin",
        INCHARGE: "SEOC Incharge",
        DUTY_OFFICER: "Duty Officer",
        DEO: "DEO"
    }
};

SEOC.modules = [
    {
        key: "lightning",
        icon: "\u26A1",
        title: "Lightning Deaths",
        desc: "Lightning/thunderbolt death reports with victim details, ex-gratia tracking",
        formId: "97534e1cd6624cd48a0a07006b1f0dd4",
        serviceId: "5404875609374ac3b10e4de53bf19b4a",
        serviceName: "SEOC_Lightning_Deaths",
        color: "#d69e2e",
        dateField: "incident_date",
        kpiFields: [
            { field: "1=1", label: "Total Deaths", icon: "\u2620\uFE0F" },
            { field: "payment_status='pending'", label: "Pending Ex-Gratia", icon: "\uD83D\uDCB0" },
            { field: "entry_status='Pending'", label: "Pending Approval", icon: "\u23F3" }
        ],
        keyColumns: ["incident_date", "victim_name", "district", "mandal", "age", "gender", "payment_status", "entry_status"]
    },
    {
        key: "drowning",
        icon: "\uD83C\uDF0A",
        title: "Drowning Incidents",
        desc: "Drowning incident reports with victim details and rescue information",
        formId: "ce6f0215de05416dab8c56e5d8e5bd0f",
        serviceId: "90f7155cc4e841e5a84bb0066930223b",
        serviceName: "SEOC_Drowning_Incidents",
        color: "#3182ce",
        dateField: "incident_date",
        kpiFields: [
            { field: "1=1", label: "Total Incidents", icon: "\uD83C\uDF0A" },
            { field: "entry_status='Pending'", label: "Pending Approval", icon: "\u23F3" }
        ],
        keyColumns: ["incident_date", "district", "mandal", "water_body_type", "total_victims", "persons_died", "entry_status"]
    },
    {
        key: "floods",
        icon: "\uD83C\uDF27\uFE0F",
        title: "Flood Damage",
        desc: "Flood damage reports \u2014 houses, infrastructure, crops, relief operations",
        formId: "a6168fd70cc84ee89a4fc905ee0003f1",
        serviceId: "7bfc92c5253e456ca1c4551154b692c2",
        serviceName: "SEOC_Flood_Damage",
        color: "#2b6cb0",
        dateField: "report_date",
        kpiFields: [
            { field: "1=1", label: "Total Reports", icon: "\uD83D\uDCCB" },
            { field: "entry_status='Pending'", label: "Pending Approval", icon: "\u23F3" }
        ],
        keyColumns: ["report_date", "report_shift", "district", "lives_lost", "people_evacuated", "villages_affected", "entry_status"]
    },
    {
        key: "calls",
        icon: "\uD83D\uDCDE",
        title: "Emergency Calls",
        desc: "Emergency call log from 112 and 1070 disaster hotlines",
        formId: "4f5ab52fc5ee4d6187439cf905e03c5e",
        serviceId: "b866f6ae39b9496481eab1fe77d84047",
        serviceName: "SEOC_Emergency_Calls",
        color: "#e53e3e",
        dateField: "call_date",
        kpiFields: [
            { field: "1=1", label: "Total Calls", icon: "\uD83D\uDCDE" },
            { field: "entry_status='Pending'", label: "Pending Approval", icon: "\u23F3" }
        ],
        keyColumns: ["call_date", "call_source", "event_type", "district", "caller_name", "persons_saved", "entry_status"]
    },
    {
        key: "rescue",
        icon: "\uD83D\uDE81",
        title: "SDRF / NDRF Rescue",
        desc: "Search and rescue operation details for SDRF, NDRF, Navy, Coast Guard",
        formId: "144d8a53e76d422aa3cac6c17219c767",
        serviceId: "a7c8588197614ba8b0f53e485ccc392a",
        serviceName: "SEOC_Rescue_Operations",
        color: "#38a169",
        dateField: "request_received",
        kpiFields: [
            { field: "1=1", label: "Total Ops", icon: "\uD83D\uDE81" },
            { field: "entry_status='Pending'", label: "Pending Approval", icon: "\u23F3" }
        ],
        keyColumns: ["request_received", "force_type", "district", "event_nature", "males_rescued", "females_rescued", "deaths", "entry_status"]
    },
    {
        key: "heatwave",
        icon: "\uD83C\uDF21\uFE0F",
        title: "Heat Wave Monitoring",
        desc: "Temperature and humidity monitoring for heat wave alerts",
        formId: "0145106121aa41e2b8a7d2d2cf4c8c43",
        serviceId: "f3ab5d5759f54874b9bb89fb785af0af",
        serviceName: "SEOC_HeatWave",
        color: "#dd6b20",
        dateField: "observation_date",
        kpiFields: [
            { field: "1=1", label: "Total Observations", icon: "\uD83C\uDF21\uFE0F" },
            { field: "heatwave_declared='yes'", label: "Heatwave Days", icon: "\uD83D\uDD25" },
            { field: "entry_status='Pending'", label: "Pending Approval", icon: "\u23F3" }
        ],
        keyColumns: ["observation_date", "district", "mandal", "max_temperature", "humidity_percent", "heatwave_declared", "entry_status"]
    },
    {
        key: "reservoir",
        icon: "\uD83D\uDCA7",
        title: "Reservoir / River Levels",
        desc: "Dam and river water level monitoring with flood warning levels",
        formId: "3d8bd16e4a924cc5b9537a639e4d70ee",
        serviceId: "8ed65eaaefa1476695b7ae8ba77d287d",
        serviceName: "SEOC_Reservoir_Levels",
        color: "#319795",
        dateField: "reading_date",
        kpiFields: [
            { field: "1=1", label: "Total Readings", icon: "\uD83D\uDCA7" },
            { field: "flood_warning<>'normal' AND flood_warning IS NOT NULL", label: "Flood Warnings", icon: "\u26A0\uFE0F" },
            { field: "entry_status='Pending'", label: "Pending Approval", icon: "\u23F3" }
        ],
        keyColumns: ["reading_date", "dam_name", "river_system", "water_level_ft", "inflow_cusecs", "outflow_cusecs", "flood_warning", "entry_status"]
    },
    {
        key: "dsr",
        icon: "\uD83D\uDCCB",
        title: "Daily Situation Report",
        desc: "Multi-disaster daily situation report for NDMA submission",
        formId: "062ab9df26a34706abdb22ad2b44e3a3",
        serviceId: "424f0f5c618c4b00acf94738b9a21aff",
        serviceName: "SEOC_DSR",
        color: "#805ad5",
        dateField: "report_date",
        kpiFields: [
            { field: "1=1", label: "Total Reports", icon: "\uD83D\uDCCB" },
            { field: "entry_status='Pending'", label: "Pending Approval", icon: "\u23F3" }
        ],
        keyColumns: ["report_date", "disaster_type", "district", "deaths", "injuries", "property_damage_crores", "entry_status"]
    }
];

SEOC.adminModules = [
    {
        key: "staff",
        icon: "\uD83D\uDC64",
        title: "Staff Registration",
        desc: "Register APSDMA staff and assign portal roles",
        formId: "a01c4f7327314257bac6bd966ca2c420",
        serviceId: "b36ecbb6a0fa4f4e8673328d779e5622",
        serviceName: "SEOC_Staff_Registration",
        color: "#4a5568",
        dateField: "registration_date",
        kpiFields: [
            { field: "1=1", label: "Total Staff", icon: "\uD83D\uDC64" },
            { field: "staff_status='active'", label: "Active", icon: "\u2705" }
        ],
        keyColumns: ["full_name", "designation", "section_wing", "mobile_primary", "portal_role", "staff_status", "entry_status"]
    }
];

SEOC.getModule = function(key) {
    var all = SEOC.modules.concat(SEOC.adminModules);
    for (var i = 0; i < all.length; i++) {
        if (all[i].key === key) return all[i];
    }
    return null;
};

SEOC.getServiceUrl = function(mod) {
    return SEOC.config.SERVICE_BASE + "/" + mod.serviceName + "/FeatureServer/0";
};

SEOC.districts = [
    "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya",
    "Bapatla", "Chittoor", "Dr.B.R.Ambedkar Konaseema", "East Godavari",
    "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool", "Markapuram",
    "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Polavaram",
    "Prakasam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai",
    "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram",
    "West Godavari", "Y.S.R.Kadapa"
];
