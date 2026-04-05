# SEOC One-Stop Data Entry Portal — Build Plan

## Context

The current SEOC portal at `/seoc/index.html` is a link-launcher — it authenticates users via Portal tokens, shows 9 module cards, but links out to raw REST query pages (`f=html`) for "View Data" and raw Survey123 URLs for "Add New". The user experience is fragmented: users jump between different tabs, see raw API interfaces, and have no integrated analytics.

**Goal:** Build a unified single-page application where DEOs login, enter data, view records, see analytics — all in one window with no page jumps, no raw forms, and professional government UI.

## Why Custom JS API (not Experience Builder)

ExB 1.5.0 on Portal 9.2 cannot:
- Show/hide widgets by user role (no built-in role-based visibility)
- Handle 9 Survey123 form embeds efficiently in one experience
- Provide inline FeatureTable with approval workflow
- Match the existing APSDMA design system (`/shared/apsdma-theme.css`)

The team already has 3 production custom JS API 4.28 apps (Lightning/LAMS, DM Personnel, Heritage) deployed on this same server. This is the proven pattern.

## Architecture: Single-Page App on IIS

### File Structure
```
C:/inetpub/wwwroot/seoc/
├── index.html                 — SPA shell (header, sidebar nav, content area)
├── css/
│   └── seoc-theme.css         — extends /shared/apsdma-theme.css
├── js/
│   ├── seoc-config.js         — 9 service URLs, form IDs, group IDs, module metadata
│   ├── seoc-auth.js           — per-user token + group-based role detection
│   ├── seoc-router.js         — hash-based routing (#dashboard, #module/lightning, etc.)
│   ├── seoc-dashboard.js      — KPI cards + Chart.js charts
│   ├── seoc-module.js         — generic module view (Survey123 embed + FeatureTable + stats)
│   ├── seoc-approval.js       — pending queue + approve/reject workflow
│   └── seoc-admin.js          — staff registration, export, system status
└── lib/
    └── chart.min.js           — Chart.js 4.x (single file, no npm needed)
```

### External Dependencies (CDN)
- ArcGIS JS API 4.28: `https://js.arcgis.com/4.28/` (already used by LAMS, DM Personnel)
- Survey123 Web App JS API: `https://survey123.arcgis.com/api/jsapi`
- Chart.js 4.x: bundled locally in `lib/`
- APSDMA Theme: `/shared/apsdma-theme.css` (already on IIS)

## Authentication Flow

1. User visits `https://apsdmagis.ap.gov.in/seoc/`
2. Login form shown (username + password)
3. `POST /gisportal/sharing/rest/generateToken` with user's own credentials
4. `GET /gisportal/sharing/rest/community/self?f=json` to get user's group memberships
5. Match group IDs → determine role (Admin / SEOC Incharge / Duty Officer / DEO)
6. Store token + role in `sessionStorage`
7. Register with ArcGIS `IdentityManager` for all JS API calls
8. Auto-refresh token at 80% expiry
9. **No hardcoded credentials** — each user authenticates as themselves

## Pages & Routing

### `#dashboard` — Main Dashboard (default after login)

| Section | Widgets |
|---------|---------|
| Top KPI bar | 6 stat cards: Total Records, Pending Approval, Today's Entries, Active Alerts, Active Rescues, Modules Active |
| Module grid | 9 cards (icon, title, record count, pending count, quick-action buttons) |
| Map | ArcGIS MapView with all 9 feature layers, color-coded, clustered |
| Charts | Bar chart (records by module) + Line chart (records by date, last 30 days) |
| Activity feed | Last 20 records across all modules |

### `#module/{key}` — Module View (one template, 9 modules)

3 tabs within each module:

**Tab: Add New Entry**
- Embedded Survey123 form via `Survey123WebForm` JS API
- Token passed automatically, no separate login
- Success callback: toast notification + refresh stats

**Tab: View Data**
- ArcGIS `FeatureTable` widget with the module's feature layer
- Filters toolbar: date range, district dropdown, status (All/Pending/Approved)
- DEOs see only their own records; DOs/Admins see all
- Row selection → Edit button (opens Survey123 in edit mode) + Delete button (Admin only)

**Tab: Analytics**
- 4 module-specific KPI cards
- Bar chart: records by district
- Time series: records over time
- Uses `outStatistics` queries for server-side aggregation

### `#approvals` — Approval Queue (Duty Officers + Admins only)

- FeatureTable showing `entry_status = 'Pending'` across all modules
- Module filter dropdown
- Each row: Approve / Reject buttons
- Approve: sets `entry_status = 'Approved'`, `approved_by = currentUser`
- Reject: prompts for reason, sets `entry_status = 'Rejected'`
- Bulk approve with checkbox selection

### `#admin` — Admin Panel (Admins only)

- Staff Registration module (Survey123 embed + FeatureTable)
- System status: ping all 9 feature services
- Data export: select module + date range → CSV download

## Role-Based Visibility

| Feature | DEO | Duty Officer | Incharge | Admin |
|---------|-----|-------------|----------|-------|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Add records | ✓ | ✓ | ✓ | ✓ |
| View own records | ✓ | ✓ | ✓ | ✓ |
| View all records | ✗ | ✓ | ✓ | ✓ |
| Approve/Reject | ✗ | ✓ | ✓ | ✓ |
| Delete records | ✗ | ✗ | ✗ | ✓ |
| Staff Registration | ✗ | ✗ | ✗ | ✓ |
| Data Export | ✗ | ✓ | ✓ | ✓ |
| Approvals nav item | hidden | visible | visible | visible |
| Admin nav item | hidden | hidden | hidden | visible |

## Implementation Phases

### Phase 1: Foundation (SPA shell + auth + routing)
- `index.html` — header, sidebar nav, content area, footer
- `seoc-config.js` — all service URLs, form IDs, group IDs
- `seoc-auth.js` — login, token management, role detection
- `seoc-router.js` — hash-based navigation
- `seoc-theme.css` — extends APSDMA theme for SEOC-specific styles

### Phase 2: Dashboard + Module Template
- `seoc-dashboard.js` — KPI queries, Chart.js charts, module cards, map
- `seoc-module.js` — generic 3-tab module view (Add/View/Analytics)
- Survey123 Web App API integration for form embedding
- Test with Lightning Deaths module end-to-end

### Phase 3: All Modules + Approval Workflow
- Wire all 9 modules through the generic template
- `seoc-approval.js` — pending queue, approve/reject, bulk actions
- Test approval flow end-to-end

### Phase 4: Admin + Polish
- `seoc-admin.js` — staff registration, system status, CSV export
- Mobile responsiveness
- Create companion Operations Dashboard via Portal GUI (for control room wall display)

## Key Files to Reference
- `/shared/apsdma-theme.css` — APSDMA design system to extend
- `C:/inetpub/wwwroot/lightning/` — LAMS app pattern (JS API 4.28, Chart.js, auth)
- `C:/inetpub/wwwroot/dm_personnel/` — DM Personnel pattern (FeatureTable, filters, export)
- `C:/Users/Administrator/APSDMA_SEOC_DB_Portal/Portal_Config/` — service URLs, form IDs, group IDs

## Verification
1. Login as each role (seoc_deo1, seoc_do1, seoc_incharge, seoc_admin1)
2. Verify dashboard loads with correct KPIs
3. Navigate to Lightning Deaths module → Add tab → submit test record
4. Switch to View Data tab → verify record appears in FeatureTable
5. Switch to Analytics tab → verify charts show the new data
6. Login as DO → go to Approvals → approve the test record
7. Verify status changes to "Approved"
8. Login as Admin → Admin panel → verify staff registration works
9. Test on mobile/tablet viewport
10. Delete test record, verify cleanup
