#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Upload ALL remaining data to ArcGIS + PostgreSQL
Sources:
  1. Drowning 2024 SDRF deployments → Rescue Operations
  2. SDRF/NDRF 2024 flood deployments → Rescue Operations
  3. Incidents Data 2026 → Daily Situation Report
  4. DSR MHA 2025 → Daily Situation Report
  5. Rescue 2024 (APSDRF + NDRF) → Rescue Operations
"""

import sys, os, json, time, warnings, calendar, re
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

DB = _cfg['database']

def add_batch(svc, features, bs=50):
    url = f'{SERVER}/{svc}/FeatureServer/0/addFeatures'
    added = errors = 0
    for i in range(0, len(features), bs):
        batch = features[i:i+bs]
        r2 = requests.post(url, data={'features':json.dumps(batch),'f':'json','token':TOKEN}, verify=False, timeout=120)
        res = r2.json().get('addResults',[])
        ok = sum(1 for x in res if x.get('success'))
        err_count = len(res) - ok
        added += ok; errors += err_count
        if err_count and i == 0:
            for x in res:
                if not x.get('success'):
                    print(f"      Err: {x.get('error',{}).get('description','?')[:80]}")
        pct = round((i+len(batch))/len(features)*100)
        print(f"    Batch {i//bs+1}: {ok}/{len(batch)} ({pct}%)")
        time.sleep(0.5)
    return added, errors

def pg_insert(table, attrs_list):
    conn = psycopg2.connect(**DB)
    conn.autocommit = True
    cur = conn.cursor()
    inserted = 0
    for attrs in attrs_list:
        cols, vals = [], []
        for k, v in attrs.items():
            if v is None: continue
            if isinstance(v, (int, float)) and v > 946684800000 and v < 2524608000000:
                v = datetime.fromtimestamp(v / 1000).strftime('%Y-%m-%d')
            if isinstance(v, (dict, list)): continue
            cols.append(k); vals.append(v)
        if cols:
            try:
                cur.execute(f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join(['%s']*len(cols))})", vals)
                inserted += 1
            except:
                conn.rollback()
                conn.autocommit = True
    conn.close()
    return inserted

def to_epoch(val):
    if isinstance(val, datetime):
        return int(calendar.timegm(val.timetuple())) * 1000
    if isinstance(val, str):
        val = val.strip()
        for fmt in ['%Y-%m-%d %H:%M:%S','%d.%m.%Y','%m-%d-%Y','%d-%m-%y','%d-%m-%Y','%Y-%m-%d','%m/%d/%Y']:
            try:
                return int(calendar.timegm(datetime.strptime(val, fmt).timetuple())) * 1000
            except:
                pass
    return None


# ═══════════════════════════════════════════
# 1. INCIDENTS DATA 2026 → DSR (147 records)
# ═══════════════════════════════════════════
print("=" * 60)
print("1. INCIDENTS DATA 2026 → Daily Situation Report")
print("=" * 60)

wb = openpyxl.load_workbook(
    "S:/SEOC_PORTAL/H_Drive_Backup/SEOC_DB_PORTAL/Constables works/HC_PC Works - 2026.xlsx",
    read_only=True, data_only=True)
ws = wb["Incidents Data - 2026"]
rows = list(ws.iter_rows(values_only=True))
wb.close()

features_dsr = []
for row in rows[1:]:
    if not row or not row[0] or not str(row[0]).strip():
        continue
    try:
        int(float(str(row[0])))
    except:
        continue

    date_val = to_epoch(row[1])
    district = str(row[2] or '').strip()
    victim = str(row[3] or '').strip()
    mandal_info = str(row[4] or '').strip()
    details = str(row[5] or '').strip()
    remarks_val = str(row[6] or '').strip()

    # Detect disaster type from details
    details_lower = details.lower()
    if 'drown' in details_lower or 'river' in details_lower or 'canal' in details_lower:
        dtype = 'drowning'
    elif 'lightning' in details_lower or 'thunderbolt' in details_lower:
        dtype = 'lightning'
    elif 'fire' in details_lower:
        dtype = 'fire'
    elif 'flood' in details_lower or 'rain' in details_lower:
        dtype = 'flood'
    elif 'snake' in details_lower:
        dtype = 'snake_bite'
    elif 'electrocution' in details_lower or 'electric' in details_lower:
        dtype = 'electrocution'
    elif 'collapse' in details_lower or 'wall' in details_lower:
        dtype = 'building_collapse'
    elif 'tree' in details_lower:
        dtype = 'tree_fall'
    else:
        dtype = 'other'

    # Parse deaths from victim field
    deaths = 0
    if victim:
        deaths = 1  # at least one victim mentioned

    attrs = {
        'report_date': date_val,
        'disaster_type': dtype,
        'district': district or None,
        'location_details': mandal_info or None,
        'deaths': deaths,
        'remarks': (details[:1000] + (' | ' + remarks_val if remarks_val else '')) if details else None,
        'entry_status': 'Approved',
        'entered_by': 'data_migration',
        'approved_by': 'data_migration',
    }
    attrs = {k: v for k, v in attrs.items() if v is not None}
    features_dsr.append({'attributes': attrs})

print(f"  Parsed: {len(features_dsr)}")
a, e = add_batch('SEOC_DSR', features_dsr)
print(f"  ArcGIS: {a} added, {e} errors")
pg = pg_insert('seoc.daily_situation_report', [f['attributes'] for f in features_dsr])
print(f"  PostgreSQL: {pg} inserted")


# ═══════════════════════════════════════════
# 2. SDRF/NDRF DEPLOYMENT 2024 → Rescue Ops
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("2. SDRF/NDRF DEPLOYMENT 2024 → Rescue Operations")
print("=" * 60)

wb2 = openpyxl.load_workbook(
    "S:/SEOC_PORTAL/H_Drive_Backup/SEOC_DB_PORTAL/Constables works/2024 works/Deployement status/SDRF, NDRF, NAvy Deployement for Floods 08.2024.xlsx",
    read_only=True, data_only=True)

features_rescue24 = []
for sn in wb2.sheetnames:
    ws2 = wb2[sn]
    rows2 = list(ws2.iter_rows(values_only=True))
    force = sn.strip().upper()
    if force not in ('SDRF', 'NDRF'):
        force = 'sdrf' if 'sdrf' in sn.lower() else 'ndrf'

    for row in rows2[2:]:
        if not row or not row[0]:
            continue
        sno = str(row[0]).strip()
        if not sno or not sno.replace('.','').isdigit():
            continue

        attrs = {
            'force_type': force.lower(),
            'battalion': str(row[1] or '').strip()[:100] or None,
            'event_nature': 'flood',
            'entry_status': 'Approved',
            'entered_by': 'data_migration',
            'approved_by': 'data_migration',
        }
        try:
            attrs['num_teams'] = 1
        except:
            pass

        # Parse district from deployment location
        place = str(row[4] or row[1] or '').strip()
        for dist in ['Srikakulam','Vizianagaram','Visakhapatnam','Guntur','Krishna','Kurnool',
                     'NTR','Palnadu','Bapatla','Eluru','Kakinada','East Godavari','West Godavari',
                     'Prakasam','Nellore','Tirupati','Chittoor','Nandyal','Kadapa','Ananthapuramu']:
            if dist.lower() in place.lower():
                attrs['district'] = dist
                break

        date_str = str(row[3] or '').strip()
        date_val = to_epoch(date_str)
        if date_val:
            attrs['request_received'] = date_val

        attrs = {k: v for k, v in attrs.items() if v is not None}
        features_rescue24.append({'attributes': attrs})

wb2.close()

print(f"  Parsed: {len(features_rescue24)}")
if features_rescue24:
    a2, e2 = add_batch('SEOC_Rescue_Operations', features_rescue24)
    print(f"  ArcGIS: {a2} added, {e2} errors")
    pg2 = pg_insert('seoc.rescue_operations', [f['attributes'] for f in features_rescue24])
    print(f"  PostgreSQL: {pg2} inserted")


# ═══════════════════════════════════════════
# 3. RESCUE 2024 (detailed operations)
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("3. RESCUE 2024 (Detailed APSDRF + NDRF operations)")
print("=" * 60)

try:
    wb3 = openpyxl.load_workbook(
        "S:/SEOC_PORTAL/H_Drive_Backup/SEOC_DB_PORTAL/Constables works/2024 works/19th Column 2024/Rescue and Relief operation details - APSDRF & NDRF -2024.xlsx",
        read_only=True, data_only=True)

    features_rescue24b = []
    for sn in wb3.sheetnames:
        ws3 = wb3[sn]
        rows3 = list(ws3.iter_rows(values_only=True))
        force = 'sdrf' if 'sdrf' in sn.lower() or 'apsdrf' in sn.lower() else 'ndrf'

        for row in rows3[2:]:
            if not row or not row[0]:
                continue
            sno = str(row[0]).strip()
            if not sno.replace('.','').replace(' ','').isdigit():
                continue

            attrs = {
                'force_type': force,
                'event_nature': str(row[5] or '').strip().lower()[:50] or 'flood',
                'entry_status': 'Approved',
                'entered_by': 'data_migration',
                'approved_by': 'data_migration',
            }
            try:
                attrs['num_teams'] = int(float(row[3])) if row[3] else None
            except:
                pass
            try:
                attrs['team_strength'] = int(float(row[4])) if row[4] else None
            except:
                pass

            request = str(row[1] or '').strip()
            if request:
                attrs['request_from'] = request[:500]

            attrs = {k: v for k, v in attrs.items() if v is not None}
            features_rescue24b.append({'attributes': attrs})

    wb3.close()

    print(f"  Parsed: {len(features_rescue24b)}")
    if features_rescue24b:
        a3, e3 = add_batch('SEOC_Rescue_Operations', features_rescue24b)
        print(f"  ArcGIS: {a3} added, {e3} errors")
        pg3 = pg_insert('seoc.rescue_operations', [f['attributes'] for f in features_rescue24b])
        print(f"  PostgreSQL: {pg3} inserted")
except Exception as ex:
    print(f"  Error: {ex}")


# ═══════════════════════════════════════════
# FINAL VERIFICATION
# ═══════════════════════════════════════════
print("\n" + "=" * 60)
print("FINAL DATA COUNTS")
print("=" * 60)

conn = psycopg2.connect(**DB)
cur = conn.cursor()

for svc, table, label in [
    ('SEOC_Lightning_Deaths', 'seoc.lightning_deaths', 'Lightning'),
    ('SEOC_Emergency_Calls', 'seoc.emergency_calls', 'Emergency Calls'),
    ('SEOC_Drowning_Incidents', 'seoc.drowning_incidents', 'Drowning'),
    ('SEOC_Rescue_Operations', 'seoc.rescue_operations', 'Rescue Ops'),
    ('SEOC_DSR', 'seoc.daily_situation_report', 'DSR'),
    ('SEOC_Flood_Damage', 'seoc.flood_damage', 'Flood Damage'),
    ('SEOC_HeatWave', 'seoc.heatwave_monitoring', 'Heat Wave'),
    ('SEOC_Reservoir_Levels', 'seoc.reservoir_levels', 'Reservoir'),
    ('SEOC_Staff_Registration', 'seoc.staff_registration', 'Staff'),
]:
    r2 = requests.get(f'{SERVER}/{svc}/FeatureServer/0/query',
        params={'where':'1=1','returnCountOnly':'true','f':'json','token':TOKEN}, verify=False)
    arc = r2.json().get('count', 0)
    cur.execute(f'SELECT count(*) FROM {table}')
    pg_count = cur.fetchone()[0]
    sync = "OK" if abs(arc - pg_count) <= 2 else f"DIFF:{arc-pg_count}"
    print(f"  {label:<20} ArcGIS:{arc:>6}  PG:{pg_count:>6}  {sync}")

conn.close()
print("\nDone!")