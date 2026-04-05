#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Upload drowning (2025+2026) and rescue (2026) data to ArcGIS + PostgreSQL"""

import sys, os, json, time, warnings, calendar
os.environ['PYTHONIOENCODING'] = 'utf-8'
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
warnings.filterwarnings('ignore')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from _config_loader import load_config

import requests, urllib3, psycopg2, openpyxl
from datetime import datetime
urllib3.disable_warnings()

_cfg = load_config()
PORTAL = _cfg['arcgis_portal']['url']
SERVER = PORTAL.replace('/gisportal', '/gisserver') + '/rest/services/Hosted'
r = requests.post(f'{PORTAL}/sharing/rest/generateToken',
    data={'username': _cfg['arcgis_portal']['username'],
          'password': _cfg['arcgis_portal']['password'],
          'client':'referer','referer':'https://apsdmagis.ap.gov.in','f':'json'},
    verify=False)
TOKEN = r.json()['token']
print("Token acquired\n")

def add_batch(svc, features, bs=50):
    url = f'{SERVER}/{svc}/FeatureServer/0/addFeatures'
    added = errors = 0
    for i in range(0, len(features), bs):
        batch = features[i:i+bs]
        r2 = requests.post(url, data={'features':json.dumps(batch),'f':'json','token':TOKEN}, verify=False, timeout=120)
        res = r2.json().get('addResults',[])
        ok = sum(1 for x in res if x.get('success'))
        added += ok; errors += len(res)-ok
        pct = round((i+len(batch))/len(features)*100)
        print(f"    Batch {i//bs+1}: {ok}/{len(batch)} ({pct}%)")
        time.sleep(0.5)
    return added, errors

def to_epoch(val):
    if isinstance(val, datetime):
        return int(calendar.timegm(val.timetuple())) * 1000
    if isinstance(val, str):
        for fmt in ['%Y-%m-%d %H:%M:%S','%m-%d-%Y','%d-%m-%y','%Y-%m-%d']:
            try:
                return int(calendar.timegm(datetime.strptime(val.strip(), fmt).timetuple())) * 1000
            except:
                pass
    return None

# ═══════════════════════════════════
# 1. DROWNING 2026
# ═══════════════════════════════════
print("=" * 60)
print("1. DROWNING 2026 (HC_PC Works)")
print("=" * 60)

wb = openpyxl.load_workbook(
    "S:/SEOC_PORTAL/H_Drive_Backup/SEOC_DB_PORTAL/Constables works/HC_PC Works - 2026.xlsx",
    read_only=True, data_only=True)
ws = wb["Drowning - 2026"]
rows = list(ws.iter_rows(values_only=True))
wb.close()

features = []
for row in rows[1:]:
    if not row or not row[0] or not str(row[0]).strip():
        continue
    try:
        sno = int(float(str(row[0])))
    except:
        continue

    date_val = to_epoch(row[1])
    cause = str(row[7] or '').strip()
    drowned_into = str(row[12] or '').strip()

    attrs = {
        'incident_date': date_val,
        'incident_description': cause,
        'water_body_name': drowned_into if drowned_into else None,
        'district': str(row[8] or '').strip() or None,
        'mandal': str(row[9] or '').strip() or None,
        'village': str(row[10] or '').strip() or None,
        'report_source': str(row[6] or '').strip()[:50] or None,
        'rescue_by': str(row[5] or '').strip()[:500] or None,
        'entry_status': 'Approved',
        'entered_by': 'data_migration',
        'approved_by': 'data_migration',
    }
    try: attrs['total_victims'] = int(float(row[15]))
    except: pass
    try: attrs['persons_died'] = int(float(row[16]))
    except: pass
    try: attrs['persons_saved'] = int(float(row[19]))
    except: pass

    attrs = {k: v for k, v in attrs.items() if v is not None}
    features.append({'attributes': attrs})

print(f"  Parsed: {len(features)}")
a, e = add_batch('SEOC_Drowning_Incidents', features)
print(f"  ArcGIS: {a} added, {e} errors")

# ═══════════════════════════════════
# 2. DROWNING 2025
# ═══════════════════════════════════
print("\n" + "=" * 60)
print("2. DROWNING 2025")
print("=" * 60)

wb2 = openpyxl.load_workbook(
    "S:/SEOC_PORTAL/H_Drive_Backup/SEOC_DB_PORTAL/Constables works/2025 works/Drowning Data 2025.xlsx",
    read_only=True, data_only=True)
ws2 = wb2["Sheet3"]
rows2 = list(ws2.iter_rows(values_only=True))
wb2.close()

features2 = []
for row in rows2[1:]:
    if not row or not row[0] or not str(row[0]).strip():
        continue
    try:
        sno = int(float(str(row[0])))
    except:
        continue

    date_val = to_epoch(row[1])
    attrs = {
        'incident_date': date_val,
        'incident_description': str(row[7] or '').strip() or None,
        'district': str(row[8] or '').strip() or None,
        'mandal': str(row[9] or '').strip() or None,
        'village': str(row[10] or '').strip() or None,
        'report_source': str(row[6] or '').strip()[:50] or None,
        'rescue_by': str(row[5] or '').strip()[:500] or None,
        'entry_status': 'Approved',
        'entered_by': 'data_migration',
        'approved_by': 'data_migration',
    }
    try: attrs['total_victims'] = int(float(row[13]))
    except: pass
    try: attrs['persons_died'] = int(float(row[14]))
    except: pass

    attrs = {k: v for k, v in attrs.items() if v is not None}
    features2.append({'attributes': attrs})

print(f"  Parsed: {len(features2)}")
a2, e2 = add_batch('SEOC_Drowning_Incidents', features2)
print(f"  ArcGIS: {a2} added, {e2} errors")

# ═══════════════════════════════════
# 3. RESCUE OPS 2026
# ═══════════════════════════════════
print("\n" + "=" * 60)
print("3. RESCUE OPERATIONS 2026")
print("=" * 60)

wb3 = openpyxl.load_workbook(
    "S:/SEOC_PORTAL/H_Drive_Backup/SEOC_DB_PORTAL/Constables works/HC_PC Works - 2026.xlsx",
    read_only=True, data_only=True)
ws3 = wb3["NDRF & SDRF Deployment - 2026"]
rows3 = list(ws3.iter_rows(values_only=True))
wb3.close()

features3 = []
for row in rows3[4:]:
    if not row or not row[0]:
        continue
    sno = str(row[0]).strip()
    if not sno or not sno.replace('.', '').isdigit():
        continue

    attrs = {
        'request_from': str(row[1] or row[2] or '').strip()[:500] or None,
        'force_type': str(row[6] or '').strip().lower()[:20] or None,
        'battalion': str(row[7] or '').strip()[:100] or None,
        'event_nature': str(row[5] or '').strip().lower()[:50] or None,
        'entry_status': 'Approved',
        'entered_by': 'data_migration',
        'approved_by': 'data_migration',
    }
    try: attrs['num_teams'] = int(float(row[8]))
    except: pass
    try: attrs['team_strength'] = int(float(row[9]))
    except: pass

    attrs = {k: v for k, v in attrs.items() if v is not None}
    features3.append({'attributes': attrs})

print(f"  Parsed: {len(features3)}")
a3, e3 = add_batch('SEOC_Rescue_Operations', features3)
print(f"  ArcGIS: {a3} added, {e3} errors")

# ═══════════════════════════════════
# 4. BACKUP TO POSTGRESQL
# ═══════════════════════════════════
print("\n" + "=" * 60)
print("4. POSTGRESQL BACKUP")
print("=" * 60)

conn = psycopg2.connect(**load_config()['database'])
conn.autocommit = True
cur = conn.cursor()

pg_inserted = 0
for feat_list, table in [(features + features2, 'seoc.drowning_incidents'), (features3, 'seoc.rescue_operations')]:
    for feat in feat_list:
        a = feat['attributes']
        cols, vals = [], []
        for k, v in a.items():
            if v is None:
                continue
            if isinstance(v, (int, float)) and v > 946684800000:
                v = datetime.fromtimestamp(v / 1000).strftime('%Y-%m-%d')
            cols.append(k)
            vals.append(v)
        try:
            cur.execute(f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join(['%s']*len(cols))})", vals)
            pg_inserted += 1
        except:
            conn.rollback()
            conn.autocommit = True

conn.close()
print(f"  PostgreSQL: {pg_inserted} inserted")

# ═══════════════════════════════════
# FINAL VERIFICATION
# ═══════════════════════════════════
print("\n" + "=" * 60)
print("FINAL COUNTS")
print("=" * 60)

conn2 = psycopg2.connect(**load_config()['database'])
cur2 = conn2.cursor()

for svc, table, label in [
    ('SEOC_Lightning_Deaths', 'seoc.lightning_deaths', 'Lightning'),
    ('SEOC_Emergency_Calls', 'seoc.emergency_calls', 'Emergency Calls'),
    ('SEOC_Drowning_Incidents', 'seoc.drowning_incidents', 'Drowning'),
    ('SEOC_Rescue_Operations', 'seoc.rescue_operations', 'Rescue Ops'),
]:
    r2 = requests.get(f'{SERVER}/{svc}/FeatureServer/0/query',
        params={'where': '1=1', 'returnCountOnly': 'true', 'f': 'json', 'token': TOKEN}, verify=False)
    arc = r2.json().get('count', 0)
    cur2.execute(f'SELECT count(*) FROM {table}')
    pg = cur2.fetchone()[0]
    sync = "OK" if abs(arc - pg) <= 1 else f"DIFF:{arc-pg}"
    print(f"  {label:<20} ArcGIS:{arc:>6}  PG:{pg:>6}  {sync}")

conn2.close()
print("\nDone!")
