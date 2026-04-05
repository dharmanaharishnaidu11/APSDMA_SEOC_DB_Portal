# APSDMA SEOC One-Stop Data Entry Portal

**Andhra Pradesh State Disaster Management Authority (APSDMA)**
**State Emergency Operations Centre (SEOC) — Data Entry Portal**

Unified ArcGIS Enterprise-based data entry portal replacing scattered Excel spreadsheets for disaster management operations across 28 districts of Andhra Pradesh.

## Architecture

```
Operators (Browser: DEOs, Duty Officers, Incharge, Admin)
        │ HTTPS 443
        ▼
VM1 (192.168.8.24) — ArcGIS Enterprise 10.91
  IIS + Portal for ArcGIS + ArcGIS Server + Data Store
  ├── /seoc/       (custom SPA — WebApp/)
  └── /seoc-api/   (Python backup API — WebApp/api/)
        │ TCP 5432
        ▼
VM2 (192.168.9.35) — PostgreSQL 13 + PostGIS 3.1.4
  Enterprise Geodatabase: apsdma_2026
  30+ schemas, 500+ tables, 28 Districts, 688 Mandals, 18,392 Villages
```

## Repository Structure

```
APSDMA_SEOC_DB_Portal/
├── README.md                      — this file
├── config.example.json            — template for config.json (credentials)
├── _config_loader.py              — shared config loader for Python scripts
│
├── WebApp/                        — Live SPA deployed at C:\inetpub\wwwroot\seoc\
│   ├── index.html                 — SPA shell with login
│   ├── PORTAL_REFERENCE.md        — complete reference doc (also in Docs/)
│   ├── css/
│   │   └── seoc-theme.css         — full design system
│   ├── js/                        — 9 JS modules (~3,500 lines)
│   │   ├── seoc-config.js         — service URLs, form IDs, modules metadata
│   │   ├── seoc-auth.js           — Portal token auth + role detection
│   │   ├── seoc-router.js         — hash-based SPA router
│   │   ├── seoc-utils.js          — query helpers, toast
│   │   ├── seoc-dashboard.js      — KPIs, charts, map
│   │   ├── seoc-module.js         — generic 3-tab module view
│   │   ├── seoc-forms.js          — 9 form defs, renderer, dual-write submit
│   │   ├── seoc-approval.js       — approval queue
│   │   └── seoc-admin.js          — admin panel
│   ├── lib/
│   │   ├── chart.min.js           — Chart.js 4.x
│   │   └── xlsx.min.js            — SheetJS
│   └── api/                       — Python backup API (dual-write to PostgreSQL)
│       ├── seoc_api.py            — HTTP server on 127.0.0.1:8099
│       ├── config.example.json    — template (real config.json is gitignored)
│       └── install_service.bat    — Windows Task Scheduler installer
│
├── Survey123_Forms/               — XLSForm source of truth (9 forms)
│   ├── SEOC_Lightning_Death.xlsx
│   ├── SEOC_Drowning_Incident.xlsx
│   ├── SEOC_Flood_Damage.xlsx
│   ├── SEOC_Emergency_Calls.xlsx
│   ├── SEOC_Rescue_Operation.xlsx
│   ├── SEOC_HeatWave.xlsx
│   ├── SEOC_Reservoir_Levels.xlsx
│   ├── SEOC_DSR.xlsx
│   ├── SEOC_Staff_Registration.xlsx
│   ├── create_forms.py            — XLSForm generator script
│   └── create_staff_form.py
│
├── Database/                      — PostgreSQL schema creation
│   ├── create_seoc_database.py    — creates seoc.* tables + indexes
│   └── publish_services_v2.py     — publishes feature services to Portal
│
├── Data_Migration/                — Historical data import
│   ├── all_deaths_extracted.csv   — 648 lightning deaths (historical)
│   ├── filled_coords_all.csv      — coordinate lookup
│   ├── survey123_choices.csv      — dropdown values
│   ├── upload_to_arcgis.py        — imports CSV → feature services
│   ├── upload_drowning_rescue.py  — drowning + rescue historical data
│   └── upload_all_remaining.py    — SDRF/NDRF deployments, DSR, incidents
│
├── Portal_Config/                 — ArcGIS Portal artifacts
│   ├── portal_form_items.json     — Survey123 item IDs
│   ├── portal_services.json       — feature service item IDs
│   ├── portal_groups.json         — 3 group IDs for RBAC
│   └── index.html                 — legacy link-launcher (replaced by WebApp/)
│
└── Docs/
    ├── PORTAL_REFERENCE.md        — complete architecture + file reference
    ├── BUILD_PLAN.md              — original design doc (the "why" behind WebApp)
    └── DEPLOYMENT_GUIDE.md        — step-by-step deployment
```

## Quick Start

### Prerequisites
- Windows Server 2019+, IIS, Python 3.12
- ArcGIS Enterprise 10.91 (Portal + Server + Data Store)
- PostgreSQL 13 + PostGIS 3.1.4 on a separate VM

### 1. Clone & Configure
```bash
git clone https://github.com/dharmanaharishnaidu11/APSDMA_SEOC_DB_Portal.git
cd APSDMA_SEOC_DB_Portal

# Create real config from template
cp config.example.json config.json
# Edit config.json and set your DB + Portal credentials
```

### 2. Provision database (run on VM1 or wherever has network access to VM2)
```bash
python Database/create_seoc_database.py
```

### 3. Publish Survey123 forms + feature services
- Use Survey123 Connect to publish XLSForms from `Survey123_Forms/`
- Or run: `python Database/publish_services_v2.py`

### 4. Deploy the web app
```bash
# Copy WebApp contents to IIS
xcopy /E /I WebApp\* C:\inetpub\wwwroot\seoc\
cd C:\inetpub\wwwroot\seoc\api
copy config.example.json config.json
# Edit config.json with DB credentials

# Install backup API as Windows scheduled task
install_service.bat
```

### 5. Create Portal accounts
Log into the ArcGIS Portal as admin and create users per the roles in `Docs/DEPLOYMENT_GUIDE.md`.

## Features

### 9 Disaster Modules
| # | Module | Purpose |
|---|--------|---------|
| 1 | Lightning Deaths | Lightning/thunderbolt death proforma with ex-gratia tracking |
| 2 | Drowning Incidents | Drowning incident reports with victim details |
| 3 | Flood Damage | Flood damage report (45 fields, 3× daily) |
| 4 | Emergency Calls | 112/1070 emergency call log |
| 5 | SDRF/NDRF Rescue | Search and rescue operations |
| 6 | Heat Wave | Temperature/humidity monitoring & alerts |
| 7 | Reservoir Levels | Dam/river water level with flood warning |
| 8 | Daily Situation Report | Multi-disaster NDMA submission |
| 9 | Staff Registration | APSDMA staff + portal role management |

### User Roles (10 Logins)
| Role | Count | Permissions |
|------|-------|-------------|
| Admin | 2 | Full control, manage users & forms, delete records |
| SEOC Incharge | 1 | Approve all, view all, dashboards |
| Duty Officer | 2 | Ratify/approve DEO entries, export data |
| DEO | 5 | Enter data, view own records |

### Key Capabilities
- **Dual-write architecture**: Every submission goes to both ArcGIS Feature Service AND PostgreSQL (with retry queue on DB failure)
- **Role-based UI**: Nav items, buttons, and actions shown based on ArcGIS group membership
- **Approval workflow**: Pending → Approved/Rejected with bulk actions
- **Custom native forms**: No Survey123 iframes — direct-submit HTML forms with field validation
- **Excel/CSV import**: Bulk pre-fill forms from spreadsheet
- **Map picker**: Click-to-set-location + reverse geocoding
- **Attachments**: PDF, photos, Excel, Word (up to 10 MB each)
- **Cascading geography**: District → Mandal → Village dropdowns from PostGIS (28 districts, 688 mandals, 18,392 villages)
- **Record detail modal**: OpenStreetMap pin, attachments gallery, edit-in-place
- **Analytics**: Per-module charts (district bar, trend line) via server-side `outStatistics`
- **CSV export**: Filterable data export for DO/Admin roles

## Security

- All credentials live in `config.json` at the repo root (gitignored)
- Python scripts load via `_config_loader.py`
- SPA uses per-user Portal token authentication with 120-minute expiry and auto-refresh
- Role detection via ArcGIS Portal group membership
- No hardcoded credentials in source code

## Documentation

- **[Docs/PORTAL_REFERENCE.md](Docs/PORTAL_REFERENCE.md)** — Complete architecture, file map, backend internals
- **[Docs/BUILD_PLAN.md](Docs/BUILD_PLAN.md)** — Original design document explaining architectural decisions
- **[Docs/DEPLOYMENT_GUIDE.md](Docs/DEPLOYMENT_GUIDE.md)** — Step-by-step deployment instructions

---

*Government of Andhra Pradesh — APSDMA — GIS Cell*
