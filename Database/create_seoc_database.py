#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Create SEOC schema with 9 structured tables + attachments in PostgreSQL"""

import sys, os
os.environ['PYTHONIOENCODING'] = 'utf-8'
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from _config_loader import load_config

import psycopg2

conn = psycopg2.connect(**load_config()['database'])
conn.autocommit = True
cur = conn.cursor()

print("Creating SEOC database schema...")
cur.execute("CREATE SCHEMA IF NOT EXISTS seoc")
print("  Schema 'seoc' created\n")

# ──────────────────────────────────────────
# 1. Staff Registration
# ──────────────────────────────────────────
print("[1/9] seoc.staff_registration")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.staff_registration (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    employee_id VARCHAR(50),
    designation VARCHAR(200),
    designation_other VARCHAR(200),
    section_wing VARCHAR(100),
    section_wing_other VARCHAR(200),
    posting_type VARCHAR(50),
    date_of_joining DATE,
    staff_status VARCHAR(20) DEFAULT 'active',
    shift_duty VARCHAR(50),
    mobile_primary VARCHAR(15),
    mobile_alternate VARCHAR(15),
    whatsapp_number VARCHAR(15),
    email_official VARCHAR(100),
    seoc_intercom VARCHAR(20),
    portal_role VARCHAR(50),
    assigned_modules TEXT,
    portal_username VARCHAR(50),
    account_created VARCHAR(10) DEFAULT 'no',
    remarks TEXT,
    entry_status VARCHAR(20) DEFAULT 'Pending',
    registered_by VARCHAR(100),
    registration_date TIMESTAMPTZ DEFAULT now(),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
)""")
print("  OK")

# ──────────────────────────────────────────
# 2. Lightning Deaths
# ──────────────────────────────────────────
print("[2/9] seoc.lightning_deaths")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.lightning_deaths (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    incident_date DATE NOT NULL,
    incident_time VARCHAR(20),
    victim_name VARCHAR(200) NOT NULL,
    aadhar_number VARCHAR(12),
    gender VARCHAR(10),
    age INTEGER,
    occupation VARCHAR(100),
    death_location VARCHAR(50),
    economic_status VARCHAR(10),
    district VARCHAR(100),
    district_lgd INTEGER,
    mandal VARCHAR(100),
    mandal_lgd INTEGER,
    village VARCHAR(200),
    habitation VARCHAR(200),
    location_details TEXT,
    kin_name VARCHAR(200),
    kin_phone VARCHAR(15),
    kin_relation VARCHAR(50),
    cap_alert_sent VARCHAR(5),
    cap_alert_time VARCHAR(50),
    whatsapp_alert VARCHAR(5),
    payment_status VARCHAR(20) DEFAULT 'pending',
    sanction_order VARCHAR(100),
    exgratia_amount NUMERIC(12,2),
    cfms_bill_no VARCHAR(50),
    remarks TEXT,
    entry_status VARCHAR(20) DEFAULT 'Pending',
    entered_by VARCHAR(100),
    approved_by VARCHAR(100),
    entry_datetime TIMESTAMPTZ DEFAULT now(),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
)""")
print("  OK")

# ──────────────────────────────────────────
# 3. Drowning Incidents + Victims
# ──────────────────────────────────────────
print("[3/9] seoc.drowning_incidents + drowning_victims")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.drowning_incidents (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    incident_date DATE NOT NULL,
    incident_time VARCHAR(20),
    incident_description TEXT,
    water_body_type VARCHAR(50),
    water_body_name VARCHAR(200),
    district VARCHAR(100),
    district_lgd INTEGER,
    mandal VARCHAR(100),
    mandal_lgd INTEGER,
    village VARCHAR(200),
    location_details TEXT,
    total_victims INTEGER,
    persons_saved INTEGER DEFAULT 0,
    persons_died INTEGER DEFAULT 0,
    persons_missing INTEGER DEFAULT 0,
    rescue_by TEXT,
    report_source VARCHAR(50),
    remarks TEXT,
    entry_status VARCHAR(20) DEFAULT 'Pending',
    entered_by VARCHAR(100),
    approved_by VARCHAR(100),
    entry_datetime TIMESTAMPTZ DEFAULT now(),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
)""")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.drowning_victims (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER REFERENCES seoc.drowning_incidents(id) ON DELETE CASCADE,
    victim_name VARCHAR(200),
    victim_age INTEGER,
    victim_gender VARCHAR(10),
    victim_outcome VARCHAR(20)
)""")
print("  OK")

# ──────────────────────────────────────────
# 4. Flood Damage
# ──────────────────────────────────────────
print("[4/9] seoc.flood_damage")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.flood_damage (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    report_time VARCHAR(20),
    report_shift VARCHAR(30),
    district VARCHAR(100),
    district_lgd INTEGER,
    mandal VARCHAR(100),
    mandals_affected INTEGER DEFAULT 0,
    villages_affected INTEGER DEFAULT 0,
    villages_inundated INTEGER DEFAULT 0,
    population_affected INTEGER DEFAULT 0,
    lives_lost INTEGER DEFAULT 0,
    cattle_lost INTEGER DEFAULT 0,
    houses_fully_pucca INTEGER DEFAULT 0,
    houses_fully_kutcha INTEGER DEFAULT 0,
    houses_fully_huts INTEGER DEFAULT 0,
    houses_partly_pucca INTEGER DEFAULT 0,
    houses_partly_kutcha INTEGER DEFAULT 0,
    houses_partly_huts INTEGER DEFAULT 0,
    electric_poles INTEGER DEFAULT 0,
    roads_damaged_km NUMERIC(10,2) DEFAULT 0,
    bridges_damaged INTEGER DEFAULT 0,
    tanks_breached INTEGER DEFAULT 0,
    bunds_breached INTEGER DEFAULT 0,
    crop_area_ha NUMERIC(12,2) DEFAULT 0,
    crop_loss_crores NUMERIC(12,2) DEFAULT 0,
    sdrf_teams INTEGER DEFAULT 0,
    ndrf_teams INTEGER DEFAULT 0,
    boats_deployed INTEGER DEFAULT 0,
    relief_camps INTEGER DEFAULT 0,
    people_in_camps INTEGER DEFAULT 0,
    people_evacuated INTEGER DEFAULT 0,
    medical_camps INTEGER DEFAULT 0,
    food_packets INTEGER DEFAULT 0,
    remarks TEXT,
    entry_status VARCHAR(20) DEFAULT 'Pending',
    entered_by VARCHAR(100),
    approved_by VARCHAR(100),
    entry_datetime TIMESTAMPTZ DEFAULT now(),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
)""")
print("  OK")

# ──────────────────────────────────────────
# 5. Emergency Calls
# ──────────────────────────────────────────
print("[5/9] seoc.emergency_calls")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.emergency_calls (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    call_date DATE,
    call_time VARCHAR(20),
    call_source VARCHAR(10),
    caller_name VARCHAR(200),
    caller_phone VARCHAR(15),
    event_type VARCHAR(50),
    event_info TEXT,
    district VARCHAR(100),
    district_lgd INTEGER,
    mandal VARCHAR(100),
    village VARCHAR(200),
    location_details TEXT,
    victim_name_age VARCHAR(500),
    num_persons INTEGER,
    bodies_traced INTEGER DEFAULT 0,
    persons_missing INTEGER DEFAULT 0,
    persons_saved INTEGER DEFAULT 0,
    team_deployed TEXT,
    info_passed_time TEXT,
    erss_closing_time VARCHAR(50),
    remarks TEXT,
    entry_status VARCHAR(20) DEFAULT 'Pending',
    entered_by VARCHAR(100),
    approved_by VARCHAR(100),
    entry_datetime TIMESTAMPTZ DEFAULT now(),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
)""")
print("  OK")

# ──────────────────────────────────────────
# 6. Rescue Operations
# ──────────────────────────────────────────
print("[6/9] seoc.rescue_operations")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.rescue_operations (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    request_received TIMESTAMPTZ,
    request_from TEXT,
    team_dispatched TIMESTAMPTZ,
    force_type VARCHAR(20),
    battalion VARCHAR(100),
    num_teams INTEGER,
    team_strength INTEGER,
    incharge_name VARCHAR(200),
    incharge_phone VARCHAR(15),
    equipment TEXT,
    event_nature VARCHAR(50),
    district VARCHAR(100),
    district_lgd INTEGER,
    mandal VARCHAR(100),
    village VARCHAR(200),
    water_body_name VARCHAR(200),
    location_details TEXT,
    rescue_datetime TIMESTAMPTZ,
    males_rescued INTEGER DEFAULT 0,
    females_rescued INTEGER DEFAULT 0,
    children_rescued INTEGER DEFAULT 0,
    persons_survived INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    team_closed_date DATE,
    remarks TEXT,
    entry_status VARCHAR(20) DEFAULT 'Pending',
    entered_by VARCHAR(100),
    approved_by VARCHAR(100),
    entry_datetime TIMESTAMPTZ DEFAULT now(),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
)""")
print("  OK")

# ──────────────────────────────────────────
# 7. Heat Wave Monitoring
# ──────────────────────────────────────────
print("[7/9] seoc.heatwave_monitoring")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.heatwave_monitoring (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    observation_date DATE NOT NULL,
    observation_time VARCHAR(20),
    district VARCHAR(100),
    district_lgd INTEGER,
    mandal VARCHAR(100),
    mandal_lgd INTEGER,
    max_temperature NUMERIC(5,2),
    min_temperature NUMERIC(5,2),
    humidity_percent NUMERIC(5,2),
    heatwave_declared VARCHAR(5),
    severe_heatwave VARCHAR(5),
    heat_casualties INTEGER DEFAULT 0,
    hospitalizations INTEGER DEFAULT 0,
    village VARCHAR(200),
    location_details TEXT,
    remarks TEXT,
    entry_status VARCHAR(20) DEFAULT 'Pending',
    entered_by VARCHAR(100),
    approved_by VARCHAR(100),
    entry_datetime TIMESTAMPTZ DEFAULT now(),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
)""")
print("  OK")

# ──────────────────────────────────────────
# 8. Reservoir / River Levels
# ──────────────────────────────────────────
print("[8/9] seoc.reservoir_levels")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.reservoir_levels (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    reading_date DATE NOT NULL,
    reading_time VARCHAR(20),
    river_system VARCHAR(50),
    dam_name VARCHAR(100),
    district VARCHAR(100),
    mandal VARCHAR(100),
    village VARCHAR(200),
    location_details TEXT,
    water_level_ft NUMERIC(10,2),
    water_level_m NUMERIC(10,2),
    inflow_cusecs NUMERIC(12,2),
    outflow_cusecs NUMERIC(12,2),
    storage_tmc NUMERIC(10,2),
    gates_opened INTEGER,
    flood_warning VARCHAR(30),
    remarks TEXT,
    entry_status VARCHAR(20) DEFAULT 'Pending',
    entered_by VARCHAR(100),
    approved_by VARCHAR(100),
    entry_datetime TIMESTAMPTZ DEFAULT now(),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
)""")
print("  OK")

# ──────────────────────────────────────────
# 9. Daily Situation Report
# ──────────────────────────────────────────
print("[9/9] seoc.daily_situation_report")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.daily_situation_report (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    report_time VARCHAR(20),
    disaster_type VARCHAR(50),
    district VARCHAR(100),
    district_lgd INTEGER,
    mandal VARCHAR(100),
    village VARCHAR(200),
    location_details TEXT,
    deaths INTEGER DEFAULT 0,
    injuries INTEGER DEFAULT 0,
    missing INTEGER DEFAULT 0,
    property_damage_crores NUMERIC(12,2) DEFAULT 0,
    crop_damage_ha NUMERIC(12,2) DEFAULT 0,
    infra_damage_crores NUMERIC(12,2) DEFAULT 0,
    remarks TEXT,
    entry_status VARCHAR(20) DEFAULT 'Pending',
    entered_by VARCHAR(100),
    approved_by VARCHAR(100),
    entry_datetime TIMESTAMPTZ DEFAULT now(),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT now()
)""")
print("  OK")

# ──────────────────────────────────────────
# Attachments Table (shared across all modules)
# Supports: PDF, Photos, Excel, any file
# ──────────────────────────────────────────
print("\n[+] seoc.attachments (PDFs, photos, Excel, scans)")
cur.execute("""
CREATE TABLE IF NOT EXISTS seoc.attachments (
    id SERIAL PRIMARY KEY,
    globalid UUID DEFAULT gen_random_uuid(),
    parent_table VARCHAR(50) NOT NULL,
    parent_id INTEGER NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size_bytes BIGINT,
    file_category VARCHAR(50),
    file_data BYTEA,
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    remarks TEXT
)""")
print("  OK")

# ──────────────────────────────────────────
# INDEXES
# ──────────────────────────────────────────
print("\n[+] Creating indexes...")

tables = [
    'staff_registration', 'lightning_deaths', 'drowning_incidents',
    'flood_damage', 'emergency_calls', 'rescue_operations',
    'heatwave_monitoring', 'reservoir_levels', 'daily_situation_report'
]

for t in tables:
    # Not all tables have district column (staff_registration doesn't)
    try:
        cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{t}_district ON seoc.{t}(district)")
    except Exception:
        conn.rollback()
        conn.autocommit = True
    cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{t}_status ON seoc.{t}(entry_status)")
    cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{t}_created ON seoc.{t}(created_at)")
    cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{t}_geom ON seoc.{t} USING GIST(geom)")

# Date indexes
date_cols = {
    'lightning_deaths': 'incident_date',
    'drowning_incidents': 'incident_date',
    'flood_damage': 'report_date',
    'emergency_calls': 'call_date',
    'heatwave_monitoring': 'observation_date',
    'reservoir_levels': 'reading_date',
    'daily_situation_report': 'report_date',
}
for t, col in date_cols.items():
    cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{t}_date ON seoc.{t}({col})")

# Attachment indexes
cur.execute("CREATE INDEX IF NOT EXISTS idx_attach_parent ON seoc.attachments(parent_table, parent_id)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_attach_category ON seoc.attachments(file_category)")

print("  OK: All indexes created")

# ──────────────────────────────────────────
# GRANT permissions to sde user
# ──────────────────────────────────────────
print("\n[+] Granting permissions...")
cur.execute("GRANT ALL ON SCHEMA seoc TO sde")
cur.execute("GRANT ALL ON ALL TABLES IN SCHEMA seoc TO sde")
cur.execute("GRANT ALL ON ALL SEQUENCES IN SCHEMA seoc TO sde")
print("  OK")

# ──────────────────────────────────────────
# VERIFY
# ──────────────────────────────────────────
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

cur.execute("""
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='seoc' ORDER BY table_name
""")
seoc_tables = [r[0] for r in cur.fetchall()]
print(f"Tables in seoc schema: {len(seoc_tables)}")
for t in seoc_tables:
    cur.execute(f"""SELECT count(*) FROM information_schema.columns
        WHERE table_schema='seoc' AND table_name='{t}'""")
    col_count = cur.fetchone()[0]
    print(f"  seoc.{t}: {col_count} columns")

conn.close()

print("\n" + "=" * 60)
print("DATABASE READY!")
print("=" * 60)
print("""
Created in PostgreSQL (192.168.9.35 / apsdma_2026):

  seoc.staff_registration      - APSDMA staff + portal login
  seoc.lightning_deaths         - Lightning/thunderbolt death records
  seoc.drowning_incidents       - Drowning incident reports
  seoc.drowning_victims         - Individual victim details (child table)
  seoc.flood_damage             - Flood damage reports (45 fields)
  seoc.emergency_calls          - 112/1070 emergency call log
  seoc.rescue_operations        - SDRF/NDRF rescue operations
  seoc.heatwave_monitoring      - Heat wave temperature monitoring
  seoc.reservoir_levels         - Dam/river water level monitoring
  seoc.daily_situation_report   - Multi-disaster daily situation report
  seoc.attachments              - PDFs, photos, Excel uploads for all tables

All tables include:
  - entry_status (Pending/Approved/Rejected) for workflow
  - entered_by / approved_by for audit trail
  - geom (Point, WGS84) for spatial queries
  - globalid (UUID) for ArcGIS sync
  - Indexes on district, date, status, geometry
""")
