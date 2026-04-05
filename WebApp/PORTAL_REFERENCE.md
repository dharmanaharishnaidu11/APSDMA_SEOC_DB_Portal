# SEOC Data Entry Portal — Complete Reference

**Andhra Pradesh State Disaster Management Authority (APSDMA)**
**State Emergency Operations Centre (SEOC)**

Last updated: 2026-04-05

---

## 1. Purpose

Unified data-entry portal replacing scattered Excel spreadsheets for disaster management operations across 28 districts of Andhra Pradesh. Covers 9 disaster modules (Lightning, Drowning, Floods, Emergency Calls, Rescue Ops, Heat Wave, Reservoir Levels, Daily Situation Report, Staff Registration).

---

## 2. Infrastructure Topology

```
┌───────────────────────────────────────────────────────────────────┐
│  End users (browser: DEOs, Duty Officers, Incharge, Admin)        │
│  URL: https://apsdmagis.ap.gov.in/seoc/                           │
└──────────────────────────┬────────────────────────────────────────┘
                           │ HTTPS 443
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│  VM1 — APSDMAGIS (192.168.8.24)                                   │
│  Windows Server 2019 Datacenter                                    │
│                                                                    │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │ IIS          │  │ ArcGIS          │  │ Python Backup API   │  │
│  │ wwwroot/seoc │  │ Enterprise 10.91│  │ 127.0.0.1:8099      │  │
│  │ (SPA)        │  │ Portal + Server │  │ (Task Scheduler)    │  │
│  │              │  │ Data Store      │  │                     │  │
│  └──────┬───────┘  └────────┬────────┘  └──────────┬──────────┘  │
│         │                   │                      │              │
│         └───────────────────┼──────────────────────┘              │
│                             │                                      │
└─────────────────────────────┼──────────────────────────────────────┘
                              │ TCP 5432
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│  VM2 — Database Server (192.168.9.35)                             │
│  PostgreSQL 13 + PostGIS 3.1.4                                    │
│  Database: apsdma_2026                                            │
│  Schema: seoc (10 tables + attachments + indexes)                 │
│  Also hosts: admin.ap_villages, admin.ap_districts_28,            │
│              admin.ap_mandals (688 mandals, 18392 villages)       │
└───────────────────────────────────────────────────────────────────┘
```

**Dual-write architecture**: Every form submission goes to **both** ArcGIS Feature Service AND PostgreSQL (via the Python API at `seoc-api`). PostgreSQL failure is non-fatal; failed inserts are queued to `retry_queue.jsonl` and retried every 5 minutes.

---

## 3. Frontend — Single-Page Application

### 3.1 Location
`C:\inetpub\wwwroot\seoc\` — served by IIS. **Not currently in any git repo.**

### 3.2 File tree (3,828 total lines)

```
c:\inetpub\wwwroot\seoc\
├── index.html                    199 lines — SPA shell, login overlay, boot
├── css/
│   └── seoc-theme.css            547 lines — full design system
├── js/
│   ├── seoc-config.js            207 lines — service URLs, form IDs, modules[9], districts[28]
│   ├── seoc-auth.js              196 lines — Portal token auth, role detection, auto-refresh
│   ├── seoc-router.js             72 lines — hash-based SPA router
│   ├── seoc-utils.js              54 lines — toast, queryCount, queryStats, queryGroupStats
│   ├── seoc-dashboard.js         237 lines — KPIs, module cards, charts, ArcGIS map
│   ├── seoc-module.js            734 lines — 3-tab module view (Add/View/Analytics + record modal)
│   ├── seoc-forms.js             971 lines — 9 form defs, renderer, validation, Excel import, dual-write submit
│   ├── seoc-approval.js          202 lines — approval queue, bulk approve/reject
│   └── seoc-admin.js             121 lines — system status, CSV export
├── lib/
│   ├── chart.min.js                      — Chart.js 4.x
│   └── xlsx.min.js                       — SheetJS (Excel import/export)
└── api/
    ├── seoc_api.py               288 lines — Python HTTP backend
    ├── install_service.bat         22 lines — Windows Task Scheduler installer
    └── logs/
        ├── seoc_api.log                    — runtime log
        ├── transactions.jsonl              — every insert/update audit entry
        └── retry_queue.jsonl               — failed inserts awaiting retry
```

### 3.3 External dependencies (CDN)
- **ArcGIS JS API 4.28**: `https://js.arcgis.com/4.28/` (Map, MapView, FeatureLayer, IdentityManager, Graphic)
- **Google Fonts**: Inter, Plus Jakarta Sans
- **ArcGIS World Geocode**: reverse geocoding for lat/lon → address

### 3.4 Authentication flow (seoc-auth.js)

1. User enters credentials in `.login-overlay` → `POST /gisportal/sharing/rest/generateToken`
2. Token expires every **120 minutes** (`SEOC.config.TOKEN_EXPIRATION`)
3. Fetch `/sharing/rest/community/self?f=json&token=...` to get user's groups
4. Map group IDs → role:
   - `SEOC_Admins` (`537b68e430854f32b3bef7cdb4a1c1fe`) → **Admin**
   - `SEOC_DutyOfficers` (`686f65c4fb82451891f1d403ba94b8ec`) → **Duty Officer**
   - `SEOC_DEOs` (`cf51a56f1e674c37868f65650b7f72f0`) → **DEO**
   - `org_admin` portal role also → **Admin**
5. Store `{token, expires, user}` in `sessionStorage` as `seoc_token`, `seoc_expires`, `seoc_user`
6. Register token with ArcGIS `IdentityManager` for all Map/FeatureLayer requests
7. Auto-refresh at **80% of TTL** (≈96 minutes) via `_startAutoRefresh()`
8. `restoreSession()` on page reload — no re-login needed until token expires

**No hardcoded credentials** — every user authenticates against Portal with their own account.

### 3.5 Routing (seoc-router.js)
Hash-based, 4 routes:
- `#dashboard` — default (SEOC.dashboard.render)
- `#module/{key}` — per-disaster module (SEOC.module.render)
- `#approvals` — pending queue (SEOC.approval.render), visible only if `canApprove()`
- `#admin` — admin panel (SEOC.admin.render), visible only if `canAdmin()`

### 3.6 Role-based permissions (seoc-auth.js)

| Feature            | DEO | Duty Officer | Incharge | Admin |
|--------------------|-----|--------------|----------|-------|
| Dashboard          | ✓   | ✓            | ✓        | ✓     |
| Add records        | ✓   | ✓            | ✓        | ✓     |
| View all records   | ✓*  | ✓            | ✓        | ✓     |
| Approve/Reject     | ✗   | ✓            | ✓        | ✓     |
| Delete records     | ✗   | ✗            | ✗        | ✓     |
| CSV export         | ✗   | ✓            | ✓        | ✓     |
| Staff Registration | ✗   | ✗            | ✗        | ✓     |
| Admin panel        | ✗   | ✗            | ✗        | ✓     |

*Current code shows all records to all users; filtering by `entered_by` for DEOs is per the plan but may not be enforced in every view.

### 3.7 Dashboard (seoc-dashboard.js)
- **KPI bar**: Total records, Pending, Approved, Active modules
- **Module grid**: 9 cards, each shows record count + pending count + color-coded border
- **Charts** (Chart.js): Records by module (bar), Pending vs Approved (stacked bar)
- **Map**: ArcGIS MapView, gray-vector basemap, centered on AP (80.0, 16.0, zoom 7), all 9 feature layers added via `map.layers.addMany(layers)` *(fixed 2026-04-05 from broken `map.add(layer)`)*
- **Activity feed**: Last 15 records across modules, sorted by objectid DESC

### 3.8 Module view — generic 3-tab template (seoc-module.js)

Every module (`#module/{key}`) uses the same template with 3 tabs:

**Tab 1: Add New**
- Custom HTML form rendered from `SEOC.formDefs[moduleKey]` (seoc-forms.js)
- Field types: text, number, date, time, select, textarea, district, mandal, village, aadhar, phone, alpha, photo, file
- District → Mandal → Village cascading dropdowns (mandals from ArcGIS AP_Mandals_688 service; villages from PostgreSQL `admin.ap_villages` via backup API, with ArcGIS fallback)
- Map picker with click-to-set-location + manual lat/lon entry + ArcGIS reverse geocoding
- Excel/CSV bulk import (uses SheetJS) — auto-fills form from row 1 via fuzzy field matching
- 3 file attachment slots (PDF, images, DOC, XLS)
- Optional deceased photo for lightning module with live preview
- Submit → **dual-write**: ArcGIS Feature Service `/addFeatures` → attachments via `/addAttachment` → PostgreSQL backup via `seoc-api/` POST
- Edit mode: `SEOC._editObjectId` set from record modal → form pre-filled → submit uses `/updateFeatures`

**Tab 2: View Data**
- Custom paginated data table (25/page) replacing broken ArcGIS FeatureTable widget
- Filter toolbar: Year, District, Status (All/Pending/Approved/Rejected), Date range From/To, Apply, Clear
- Export CSV button (visible if `canExport()`)
- Row click → record detail modal (`openRecord(objectId)`)

**Record detail modal**:
- Fetches full record with geometry (`outSR=4326&returnGeometry=true`)
- Fields grouped into per-module sections (`_getDetailSections(key)`)
- Status badge, entered_by, approved_by, Edit button
- OpenStreetMap embed iframe with location pin
- Attachments grid with View/Download (fetches blob, sets correct MIME, uses blob URL)

**Tab 3: Analytics**
- 3 KPI cards (Total, Pending, Approved)
- Horizontal bar chart: top 15 districts
- Line chart: records over time (grouped by module's `dateField`)
- Uses `outStatistics` queries for server-side aggregation

### 3.9 Approval queue (seoc-approval.js)
- Visible only to DO / Incharge / Admin
- Fetches `entry_status='Pending'` across all 9 modules
- Sortable table with checkboxes for bulk actions
- Approve → `applyEdits` with `entry_status='Approved', approved_by=currentUser`
- Reject → prompts for reason, appends to `remarks`, sets `entry_status='Rejected'`

### 3.10 Admin panel (seoc-admin.js)
- **System Status tab**: live ping of all 10 feature services (9 modules + Staff), shows Online/Error + record count + pending count
- **Data Export tab**: module picker + status filter → opens ArcGIS CSV query URL in new tab
- Access restricted via `canAdmin()` check — DEOs/DOs get "Access Denied"

---

## 4. Backend — Python Dual-Write API

### 4.1 Location
`C:\inetpub\wwwroot\seoc\api\seoc_api.py` (288 lines)

### 4.2 How it runs
- Windows **Task Scheduler** task `\SEOC_Backup_API`
- Trigger: `ONSTART` (runs at VM boot as SYSTEM)
- Command: `"C:\Program Files\Python312\python.exe" "C:\inetpub\wwwroot\seoc\api\seoc_api.py"`
- Binds: `127.0.0.1:8099` (localhost only)
- **Verified LISTENING on port 8099 as of this scan**
- Installed via [api/install_service.bat](api/install_service.bat) (not NSSM — uses schtasks)

### 4.3 Public-facing URL
`https://apsdmagis.ap.gov.in/seoc-api/` — IIS reverse proxy forwards to `127.0.0.1:8099`

### 4.4 Endpoints

| Method | Path          | Purpose                                                            |
|--------|---------------|--------------------------------------------------------------------|
| GET    | `/` or `/health` | Health check — returns `{status, db, uptime, transactions_logged, retry_queue}` |
| POST   | `/`           | Insert record: `{module: "lightning", attributes: {...}}` → returns `{success, id, table}` |
| POST   | `/villages`   | Village lookup: `{district, mandal}` → returns `{villages: [...], count}` |
| OPTIONS| any           | CORS preflight (allows all origins)                                |

### 4.5 Module → PostgreSQL table mapping (`TABLE_MAP`)
```python
'lightning' → seoc.lightning_deaths
'drowning'  → seoc.drowning_incidents
'floods'    → seoc.flood_damage
'calls'     → seoc.emergency_calls
'rescue'    → seoc.rescue_operations
'heatwave'  → seoc.heatwave_monitoring
'reservoir' → seoc.reservoir_levels
'dsr'       → seoc.daily_situation_report
'staff'     → seoc.staff_registration
```

### 4.6 Insert behavior
- Skips fields in `SKIP_FIELDS` (`_moduleKey`, `objectid`, `globalid`, `Shape__*`, `_latitude`, `_longitude`)
- Skips non-scalar values (dict, list)
- Converts JavaScript epoch milliseconds to `YYYY-MM-DD` date strings (range check: 2000-01-01 to 2050-01-01)
- Builds `INSERT ... RETURNING id`, runs with autocommit
- On success: `log_transaction('insert', ..., 'ok')` → appends to `transactions.jsonl`
- On DB error: `queue_retry()` → appends to `retry_queue.jsonl`, returns 500 with `queued: true`

### 4.7 Retry worker
- Background thread, sleeps 300 seconds
- Reads `retry_queue.jsonl`, attempts re-insert, writes only failed items back
- Logs `retry_success` transactions

### 4.8 Database credentials

Loaded at startup from `api/config.json` (gitignored). Use `api/config.example.json` as a template:

```json
{
  "database": {
    "host": "YOUR_DB_HOST",
    "port": 5432,
    "dbname": "apsdma_2026",
    "user": "YOUR_DB_USER",
    "password": "YOUR_DB_PASSWORD"
  }
}
```

If `config.json` is missing or malformed, the API logs an error and exits.

### 4.9 Current runtime state (as of scan)
- Process: **RUNNING** (port 8099 LISTENING)
- Transactions logged: 3
  - 1× DB error (null `incident_date` test failure, 2026-04-02)
  - 2× successful inserts (lightning id=793, id=794, 2026-04-05)
- Retry queue: **empty** (0 items)

---

## 5. PostgreSQL Schema (VM2: 192.168.9.35)

### 5.1 Database
- **Name**: `apsdma_2026`
- **Engine**: PostgreSQL 13 + PostGIS 3.1.4
- **Users**: `sde` (app), `PgAdmin` (admin)
- **Creation script**: `C:\Users\Administrator\APSDMA_SEOC_DB_Portal\Database\create_seoc_database.py`

### 5.2 Schema: `seoc` (10 tables + attachments)

| # | Table                          | Key fields                                                                 |
|---|--------------------------------|----------------------------------------------------------------------------|
| 1 | `seoc.staff_registration`      | full_name, designation, portal_role, portal_username, mobile_primary       |
| 2 | `seoc.lightning_deaths`        | incident_date, victim_name, aadhar_number, kin_*, payment_status, exgratia |
| 3 | `seoc.drowning_incidents`      | incident_date, water_body_type, total_victims, persons_saved/died/missing  |
| 4 | `seoc.drowning_victims`        | **child table** of drowning_incidents (victim_name, age, gender, outcome)  |
| 5 | `seoc.flood_damage`            | 30+ fields: houses (6 types), infrastructure, crops, relief ops            |
| 6 | `seoc.emergency_calls`         | call_source (112/1070), event_type, victims, response team                 |
| 7 | `seoc.rescue_operations`       | force_type (SDRF/NDRF/Navy/Coast Guard/Army), team, rescue outcomes        |
| 8 | `seoc.heatwave_monitoring`     | max_temperature, humidity, heatwave_declared, casualties                   |
| 9 | `seoc.reservoir_levels`        | river_system, dam_name, water_level_ft, inflow/outflow_cusecs, flood_warning |
| 10| `seoc.daily_situation_report`  | disaster_type, deaths, injuries, property_damage_crores                    |
| + | `seoc.attachments`             | polymorphic attachment table (parent_table, parent_id, file_data BYTEA)    |

### 5.3 Common columns on every table
- `id SERIAL PRIMARY KEY`
- `globalid UUID DEFAULT gen_random_uuid()` — for ArcGIS sync
- `entry_status VARCHAR(20) DEFAULT 'Pending'` — Pending/Approved/Rejected workflow
- `entered_by VARCHAR(100)` — audit
- `approved_by VARCHAR(100)` — audit
- `entry_datetime TIMESTAMPTZ DEFAULT now()`
- `geom GEOMETRY(Point, 4326)` — WGS84 point
- `created_at TIMESTAMPTZ DEFAULT now()`
- `updated_at TIMESTAMPTZ DEFAULT now()` (where applicable)
- `district_lgd INTEGER`, `mandal_lgd INTEGER` — LGD codes for govt integration

### 5.4 Indexes
For each of the 9 disaster tables:
- `idx_{table}_district` on `district`
- `idx_{table}_status` on `entry_status`
- `idx_{table}_created` on `created_at`
- `idx_{table}_geom` GIST on `geom`
- `idx_{table}_date` on module's date field

Attachments:
- `idx_attach_parent` on `(parent_table, parent_id)`
- `idx_attach_category` on `file_category`

### 5.5 Related schemas used by the portal
- `admin.ap_districts_28` — 28 districts
- `admin.ap_mandals` — 688 mandals
- `admin.ap_villages` — 18,392 villages (used by `/seoc-api/villages` endpoint)

---

## 6. ArcGIS Enterprise Layer (VM1)

### 6.1 Portal
- URL: `https://apsdmagis.ap.gov.in/gisportal/home`
- Admin account: credentials managed out-of-band (see `config.json` on the deploy host)
- Version: Portal for ArcGIS 9.2 (+ Server, Data Store)

### 6.2 Survey123 forms published (`Portal_Config/portal_form_items.json`)

| Form                                    | Item ID                              | XLSForm file                        |
|-----------------------------------------|--------------------------------------|-------------------------------------|
| SEOC - Staff Registration               | a01c4f7327314257bac6bd966ca2c420     | SEOC_Staff_Registration.xlsx        |
| SEOC - Lightning Death Report           | 97534e1cd6624cd48a0a07006b1f0dd4     | SEOC_Lightning_Death.xlsx           |
| SEOC - Drowning Incident Report         | ce6f0215de05416dab8c56e5d8e5bd0f     | SEOC_Drowning_Incident.xlsx         |
| SEOC - Flood Damage Report              | a6168fd70cc84ee89a4fc905ee0003f1     | SEOC_Flood_Damage.xlsx              |
| SEOC - Emergency Calls (112/1070)       | 4f5ab52fc5ee4d6187439cf905e03c5e     | SEOC_Emergency_Calls.xlsx           |
| SEOC - SDRF/NDRF Rescue Operation       | 144d8a53e76d422aa3cac6c17219c767     | SEOC_Rescue_Operation.xlsx          |
| SEOC - Heat Wave Monitoring             | 0145106121aa41e2b8a7d2d2cf4c8c43     | SEOC_HeatWave.xlsx                  |
| SEOC - Reservoir / River Levels         | 3d8bd16e4a924cc5b9537a639e4d70ee     | SEOC_Reservoir_Levels.xlsx          |
| SEOC - Daily Situation Report           | 062ab9df26a34706abdb22ad2b44e3a3     | SEOC_DSR.xlsx                       |

Note: The SPA **does not embed these Survey123 forms** anymore. It uses native HTML forms (seoc-forms.js) that submit directly to the feature services. The Survey123 XLSForms remain as the formal spec and field/choice source of truth.

### 6.3 Feature services (`Portal_Config/portal_services.json`)

Base URL: `https://apsdmagis.ap.gov.in/gisserver/rest/services/Hosted/{ServiceName}/FeatureServer/0`

| Service                      | Item ID                              |
|------------------------------|--------------------------------------|
| SEOC_Staff_Registration      | b36ecbb6a0fa4f4e8673328d779e5622     |
| SEOC_Lightning_Deaths        | 5404875609374ac3b10e4de53bf19b4a     |
| SEOC_Drowning_Incidents      | 90f7155cc4e841e5a84bb0066930223b     |
| SEOC_Flood_Damage            | 7bfc92c5253e456ca1c4551154b692c2     |
| SEOC_Emergency_Calls         | b866f6ae39b9496481eab1fe77d84047     |
| SEOC_Rescue_Operations       | a7c8588197614ba8b0f53e485ccc392a     |
| SEOC_HeatWave                | f3ab5d5759f54874b9bb89fb785af0af     |
| SEOC_Reservoir_Levels        | 8ed65eaaefa1476695b7ae8ba77d287d     |
| SEOC_DSR                     | 424f0f5c618c4b00acf94738b9a21aff     |

### 6.4 Groups (for RBAC)
```json
{
  "SEOC_Admins":        "537b68e430854f32b3bef7cdb4a1c1fe",
  "SEOC_DutyOfficers":  "686f65c4fb82451891f1d403ba94b8ec",
  "SEOC_DEOs":          "cf51a56f1e674c37868f65650b7f72f0"
}
```

---

## 7. User Accounts

The portal uses the following role distribution (10 users total). Actual usernames and passwords are **not documented in this repository** — they live in the ArcGIS Portal itself and with the APSDMA admin. Passwords should be rotated on deploy and managed through the Portal admin UI, not source control.

| Role          | Count | Permissions                                              |
|---------------|-------|----------------------------------------------------------|
| Admin         | 2     | Full control, manage users, delete records              |
| SEOC Incharge | 1     | Approve all, view all, dashboards                        |
| Duty Officer  | 2     | Ratify/approve DEO entries, export data                  |
| DEO           | 5     | Enter data, view own records                             |

To list current accounts, log in to the ArcGIS Portal admin UI → **Organization → Members**.

---

## 8. Quick Access URLs

| Target                    | URL                                                              |
|---------------------------|------------------------------------------------------------------|
| **SEOC Portal (live)**    | https://apsdmagis.ap.gov.in/seoc/                                |
| Backup API (public)       | https://apsdmagis.ap.gov.in/seoc-api/                            |
| Backup API (internal)     | http://127.0.0.1:8099/                                           |
| ArcGIS Portal             | https://apsdmagis.ap.gov.in/gisportal/home                       |
| ArcGIS Server             | https://apsdmagis.ap.gov.in/gisserver/rest/services              |
| ArcGIS Server Manager     | http://apsdmagis.ap.gov.in/gisserver/manager                     |
| PostgreSQL (VM2)          | 192.168.9.35:5432 / apsdma_2026                                  |

---

## 9. Source of Truth — What Lives Where

| Artifact                              | Location                                                               | In Git?                                    |
|---------------------------------------|------------------------------------------------------------------------|--------------------------------------------|
| **SPA frontend** (index.html, js/, css/, lib/) | `C:\inetpub\wwwroot\seoc\`                                | ❌ **NO**                                  |
| **Python backup API**                 | `C:\inetpub\wwwroot\seoc\api\seoc_api.py`                              | ❌ **NO**                                  |
| **Python service installer**          | `C:\inetpub\wwwroot\seoc\api\install_service.bat`                      | ❌ **NO**                                  |
| **Survey123 XLSForms (9)**            | `C:\Users\Administrator\APSDMA_SEOC_DB_Portal\Survey123_Forms\`        | ✅ yes                                     |
| **Form generation scripts**           | `C:\Users\Administrator\APSDMA_SEOC_DB_Portal\Survey123_Forms\create_*.py` | ✅ yes                                 |
| **DB schema creation**                | `C:\Users\Administrator\APSDMA_SEOC_DB_Portal\Database\create_seoc_database.py` | ✅ yes                          |
| **Feature service publishing**        | `C:\Users\Administrator\APSDMA_SEOC_DB_Portal\Database\publish_services_v2.py` | ✅ yes                           |
| **Portal config JSON** (form/service/group IDs) | `C:\Users\Administrator\APSDMA_SEOC_DB_Portal\Portal_Config\` | ✅ yes                                     |
| **Data migration CSVs**               | `C:\Users\Administrator\APSDMA_SEOC_DB_Portal\Data_Migration\`         | ✅ CSVs only                               |
| **Upload scripts**                    | `C:\Users\Administrator\APSDMA_SEOC_DB_Portal\Data_Migration\upload_*.py` | ⚠️ untracked                             |
| **Deployment guide**                  | `C:\Users\Administrator\APSDMA_SEOC_DB_Portal\Docs\DEPLOYMENT_GUIDE.md` | ✅ yes                                     |
| **Build plan**                        | `C:\Users\Administrator\.claude\plans\proud-swinging-panda.md`         | ❌ local only                              |

**GitHub repo**: https://github.com/dharmanaharishnaidu11/APSDMA_SEOC_DB_Portal (3 commits, main branch, in sync with local)

---

## 10. Known Issues / Action Items

| # | Issue                                                              | Severity | Status                                                              |
|---|---------------------------------------------------------------------|----------|---------------------------------------------------------------------|
| 1 | SPA code not in git — single point of failure on VM1                | HIGH     | ✅ Fixed — added as `WebApp/` in this repo                          |
| 2 | DB password hardcoded in Python scripts                             | HIGH     | ✅ Fixed — moved to gitignored `config.json` via `_config_loader.py`|
| 3 | Weak password on one Duty Officer account (username=password)       | MEDIUM   | Rotate via ArcGIS Portal admin UI                                   |
| 4 | DEO record filtering (own vs all) not enforced in view tab          | LOW      | Apply `entered_by=currentUser` filter for DEOs in `_loadTable`      |
| 5 | Test row with null `incident_date` still in DB                      | LOW      | `DELETE FROM seoc.lightning_deaths WHERE incident_date IS NULL`     |
| 6 | Fixed: `map.add is not a function` on dashboard                     | ✅ fixed | Used `map.layers.addMany()` in [seoc-dashboard.js:182](../WebApp/js/seoc-dashboard.js#L182) |

---

## 11. How to Deploy to a Fresh Server

1. Install Windows Server 2019+, IIS, Python 3.12
2. Install ArcGIS Enterprise 10.91 (Portal + Server + Data Store)
3. Clone GitHub repo: `git clone https://github.com/dharmanaharishnaidu11/APSDMA_SEOC_DB_Portal.git`
4. Install PostgreSQL 13 + PostGIS 3.1.4 on VM2, create `apsdma_2026` database
5. Run `Database/create_seoc_database.py` to provision schema
6. Use Survey123 Connect to publish the 9 XLSForms to the Portal
7. Copy the SPA files to `C:\inetpub\wwwroot\seoc\`
8. Run `api\install_service.bat` as Administrator to register the backup API scheduled task
9. Configure IIS reverse proxy: `/seoc-api/*` → `http://127.0.0.1:8099/*`
10. Create Portal groups + users per Section 7
11. Test login flow for each role

---

*Generated by Claude after full VM1 scan, 2026-04-05.*
