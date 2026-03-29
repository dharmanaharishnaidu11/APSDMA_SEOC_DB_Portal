# APSDMA SEOC One-Stop Data Entry Portal

**Andhra Pradesh State Disaster Management Authority (APSDMA)**
**State Emergency Operations Centre (SEOC) - Data Entry Portal**

## Overview
Unified ArcGIS Enterprise-based data entry portal replacing scattered Excel spreadsheets for disaster management operations.

## Architecture
```
Operators (Browser / Survey123 App)
        |
   HTTPS (443)
        |
VM1 (192.168.8.24) - ArcGIS Enterprise 10.91
  Portal for ArcGIS 9.2 + ArcGIS Server + Survey123
        |
   TCP 5432
        |
VM2 (192.168.9.35) - PostgreSQL 13 + PostGIS 3.1.4
  Enterprise Geodatabase (apsdma_2026)
  30+ schemas, 500+ tables, 28 Districts, 688 Mandals
```

## Survey123 Forms (9 Total)

| # | Form | Purpose |
|---|------|---------|
| 0 | Staff Registration | APSDMA staff & portal login assignment |
| 1 | Lightning Death | Lightning/thunderbolt death proforma |
| 2 | Drowning Incident | Drowning incident with victim details |
| 3 | Flood Damage | Flood damage report (45 fields, 3x daily) |
| 4 | Emergency Calls | 112/1070 emergency call log |
| 5 | Rescue Operation | SDRF/NDRF search & rescue |
| 6 | Heat Wave | Temperature/humidity monitoring |
| 7 | Reservoir Levels | Dam/river water level monitoring |
| 8 | Daily Situation Report | Multi-disaster daily summary |

## User Roles (10 Logins)

| Role | Count | Permissions |
|------|-------|-------------|
| Admin | 2 | Full control, manage users & forms |
| SEOC Incharge | 1 | Approve, view all, dashboards |
| Duty Officer | 2 | Ratify/approve DEO entries |
| DEO | 5 | Enter data via Survey123 only |

## Repository Structure
```
Survey123_Forms/    - XLSForm files + generation scripts
Data_Migration/     - CSV data for migration to PostGIS
Database/           - Database schemas and SQL
Portal_Config/      - Portal configuration
Docs/               - Deployment guide
```

## Quick Start
1. Install Survey123 Connect
2. Sign in to https://apsdmagis.ap.gov.in/gisportal
3. Import XLSForm files from Survey123_Forms/
4. Publish to Portal
5. Create user accounts and share forms

See Docs/DEPLOYMENT_GUIDE.md for details.

---
Government of Andhra Pradesh | APSDMA | GIS Cell
