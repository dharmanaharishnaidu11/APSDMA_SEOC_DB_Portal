#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Publish SEOC feature services - v2 (create then define)"""

import sys, os, json, warnings, time
os.environ['PYTHONIOENCODING'] = 'utf-8'
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
warnings.filterwarnings('ignore')

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from _config_loader import load_config

from arcgis.gis import GIS
from arcgis.features import FeatureLayerCollection

_cfg = load_config()['arcgis_portal']
gis = GIS(_cfg['url'], _cfg['username'], _cfg['password'], verify_cert=False)
print(f"Connected as: {gis.properties.user.username}")

_repo = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Portal_Config'))
form_items = json.load(open(os.path.join(_repo, 'portal_form_items.json')))
group_ids = json.load(open(os.path.join(_repo, 'portal_groups.json')))
all_groups = list(group_ids.values())

EXTENT = {'xmin': 76.5, 'ymin': 12.5, 'xmax': 85.0, 'ymax': 20.0, 'spatialReference': {'wkid': 4326}}

# Common fields
CF = [
    {'name': 'entry_status', 'type': 'esriFieldTypeString', 'alias': 'Entry Status', 'sqlType': 'sqlTypeNVarchar', 'length': 20, 'nullable': True, 'editable': True},
    {'name': 'entered_by', 'type': 'esriFieldTypeString', 'alias': 'Entered By', 'sqlType': 'sqlTypeNVarchar', 'length': 100, 'nullable': True, 'editable': True},
    {'name': 'approved_by', 'type': 'esriFieldTypeString', 'alias': 'Approved By', 'sqlType': 'sqlTypeNVarchar', 'length': 100, 'nullable': True, 'editable': True},
    {'name': 'remarks', 'type': 'esriFieldTypeString', 'alias': 'Remarks', 'sqlType': 'sqlTypeNVarchar', 'length': 2000, 'nullable': True, 'editable': True},
]

def sf(name, alias, length=200):
    return {'name': name, 'type': 'esriFieldTypeString', 'alias': alias, 'sqlType': 'sqlTypeNVarchar', 'length': length, 'nullable': True, 'editable': True}

def nf(name, alias):
    return {'name': name, 'type': 'esriFieldTypeInteger', 'alias': alias, 'sqlType': 'sqlTypeInt32', 'nullable': True, 'editable': True}

def df(name, alias):
    return {'name': name, 'type': 'esriFieldTypeDate', 'alias': alias, 'sqlType': 'sqlTypeOther', 'nullable': True, 'editable': True}

def ff(name, alias):
    return {'name': name, 'type': 'esriFieldTypeDouble', 'alias': alias, 'sqlType': 'sqlTypeFloat64', 'nullable': True, 'editable': True}


SERVICES = {
    'SEOC_Staff_Registration': {
        'form_title': 'SEOC - Staff Registration',
        'layer_name': 'Staff Registration',
        'fields': [sf('full_name','Full Name'), sf('gender','Gender',10), sf('employee_id','Employee ID',50),
                   sf('designation','Designation'), sf('section_wing','Section/Wing',100),
                   sf('posting_type','Posting Type',50), sf('staff_status','Status',20),
                   sf('mobile_primary','Mobile',15), sf('email_official','Email',100),
                   sf('portal_role','Portal Role',50), sf('portal_username','Username',50),
                   sf('assigned_modules','Modules',500)] + CF,
    },
    'SEOC_Lightning_Deaths': {
        'form_title': 'SEOC - Lightning Death Report',
        'layer_name': 'Lightning Deaths',
        'fields': [df('incident_date','Date'), sf('incident_time','Time',20),
                   sf('victim_name','Victim Name'), sf('aadhar_number','Aadhar',20),
                   sf('gender','Gender',10), nf('age','Age'), sf('occupation','Occupation',100),
                   sf('death_location','Death Location',50), sf('economic_status','Economic Status',10),
                   sf('district','District',100), sf('mandal','Mandal',100), sf('village','Village'),
                   sf('habitation','Habitation'), sf('kin_name','Next of Kin',500), sf('kin_phone','Kin Phone',50),
                   sf('cap_alert_sent','CAP Alert',5), sf('whatsapp_alert','WhatsApp Alert',5),
                   sf('payment_status','Payment Status',20), ff('exgratia_amount','Ex-Gratia'),
                   sf('cfms_bill_no','CFMS Bill',50)] + CF,
    },
    'SEOC_Drowning_Incidents': {
        'form_title': 'SEOC - Drowning Incident Report',
        'layer_name': 'Drowning Incidents',
        'fields': [df('incident_date','Date'), sf('incident_description','Description',2000),
                   sf('water_body_type','Water Body',50), sf('water_body_name','Water Body Name'),
                   sf('district','District',100), sf('mandal','Mandal',100), sf('village','Village'),
                   nf('total_victims','Total Victims'), nf('persons_saved','Saved'),
                   nf('persons_died','Died'), nf('persons_missing','Missing'),
                   sf('rescue_by','Rescue By',500), sf('report_source','Report Source',50)] + CF,
    },
    'SEOC_Flood_Damage': {
        'form_title': 'SEOC - Flood Damage Report',
        'layer_name': 'Flood Damage',
        'fields': [df('report_date','Date'), sf('report_shift','Shift',30), sf('district','District',100),
                   nf('mandals_affected','Mandals Affected'), nf('villages_affected','Villages Affected'),
                   nf('population_affected','Population'), nf('lives_lost','Lives Lost'),
                   nf('houses_fully_pucca','Fully Dmg Pucca'), nf('houses_fully_kutcha','Fully Dmg Kutcha'),
                   ff('crop_area_ha','Crop Area Ha'), nf('sdrf_teams','SDRF Teams'),
                   nf('ndrf_teams','NDRF Teams'), nf('people_evacuated','Evacuated'),
                   nf('relief_camps','Relief Camps')] + CF,
    },
    'SEOC_Emergency_Calls': {
        'form_title': 'SEOC - Emergency Calls (112/1070)',
        'layer_name': 'Emergency Calls',
        'fields': [df('call_date','Date'), sf('call_source','Source',10), sf('caller_name','Caller',200),
                   sf('caller_phone','Phone',50), sf('event_type','Event Type',50),
                   sf('event_info','Event Info',2000), sf('district','District',100),
                   sf('mandal','Mandal',100), sf('victim_name_age','Victim',500),
                   sf('team_deployed','Team Deployed',500),
                   nf('bodies_traced','Bodies Traced'), nf('persons_saved','Saved')] + CF,
    },
    'SEOC_Rescue_Operations': {
        'form_title': 'SEOC - SDRF/NDRF Rescue Operation',
        'layer_name': 'Rescue Operations',
        'fields': [df('request_received','Request Date'), sf('force_type','Force',20),
                   sf('battalion','Battalion',100), nf('num_teams','Teams'), nf('team_strength','Strength'),
                   sf('event_nature','Event Nature',50), sf('district','District',100),
                   sf('mandal','Mandal',100), nf('males_rescued','Males Rescued'),
                   nf('females_rescued','Females Rescued'), nf('children_rescued','Children Rescued'),
                   nf('deaths','Deaths')] + CF,
    },
    'SEOC_HeatWave': {
        'form_title': 'SEOC - Heat Wave Monitoring',
        'layer_name': 'Heat Wave Monitoring',
        'fields': [df('observation_date','Date'), sf('district','District',100), sf('mandal','Mandal',100),
                   ff('max_temperature','Max Temp C'), ff('min_temperature','Min Temp C'),
                   ff('humidity_percent','Humidity %'), sf('heatwave_declared','Heatwave',5),
                   nf('heat_casualties','Casualties')] + CF,
    },
    'SEOC_Reservoir_Levels': {
        'form_title': 'SEOC - Reservoir / River Levels',
        'layer_name': 'Reservoir Levels',
        'fields': [df('reading_date','Date'), sf('river_system','River System',50),
                   sf('dam_name','Dam/Barrage',100), ff('water_level_ft','Level Feet'),
                   ff('inflow_cusecs','Inflow Cusecs'), ff('outflow_cusecs','Outflow Cusecs'),
                   ff('storage_tmc','Storage TMC'), sf('flood_warning','Warning Level',30)] + CF,
    },
    'SEOC_DSR': {
        'form_title': 'SEOC - Daily Situation Report',
        'layer_name': 'Daily Situation Report',
        'fields': [df('report_date','Date'), sf('disaster_type','Disaster Type',50),
                   sf('district','District',100), sf('mandal','Mandal',100),
                   nf('deaths','Deaths'), nf('injuries','Injuries'),
                   ff('property_damage_crores','Property Damage Cr'),
                   ff('crop_damage_ha','Crop Damage Ha')] + CF,
    },
}

print(f"\nPublishing {len(SERVICES)} feature services...")
print("=" * 60)

results = []

for svc_name, svc_def in SERVICES.items():
    print(f"\n  {svc_name}")

    try:
        # Step 1: Create empty service
        item = gis.content.create_service(name=svc_name, service_type='featureService')

        # Step 2: Add layer definition with Web Mercator extent
        all_fields = [
            {'name': 'OBJECTID', 'type': 'esriFieldTypeOID', 'alias': 'OBJECTID', 'sqlType': 'sqlTypeOther'},
            {'name': 'GlobalID', 'type': 'esriFieldTypeGlobalID', 'alias': 'GlobalID', 'sqlType': 'sqlTypeOther'},
        ] + svc_def['fields']

        flc = FeatureLayerCollection.fromitem(item)
        flc.manager.add_to_definition({
            'layers': [{
                'id': 0,
                'name': svc_def['layer_name'],
                'type': 'Feature Layer',
                'geometryType': 'esriGeometryPoint',
                'hasAttachments': True,
                'extent': {'xmin': 8537894, 'ymin': 1399665, 'xmax': 9444277, 'ymax': 2273050,
                           'spatialReference': {'wkid': 102100, 'latestWkid': 3857}},
                'objectIdField': 'OBJECTID',
                'globalIdField': 'GlobalID',
                'capabilities': 'Create,Delete,Query,Update,Editing,Sync',
                'fields': all_fields,
            }]
        })
        print(f"    Created + defined: {item.id[:12]}... ({len(all_fields)} fields, attachments ON)")

        # Step 3: Share
        item.share(org=True, groups=all_groups)
        print(f"    Shared with org + groups")

        # Step 4: Link to Survey123 form
        form_item = None
        for fi in form_items:
            if fi['title'] == svc_def['form_title']:
                form_item = gis.content.get(fi['id'])
                break

        if form_item:
            form_item.update(item_properties={'url': item.url})
            try:
                form_item.add_relationship(item, 'Survey2Service')
                form_item.add_relationship(item, 'Survey2Data')
                print(f"    Linked to form: {svc_def['form_title']}")
            except:
                print(f"    Link: relationship may already exist")

        results.append({
            'name': svc_name,
            'item_id': item.id,
            'url': item.url,
            'form_title': svc_def['form_title']
        })
        print(f"    URL: {item.url}")

    except Exception as e:
        print(f"    ERROR: {str(e)[:200]}")

    time.sleep(1)

print("\n" + "=" * 60)
print(f"Published: {len(results)} / {len(SERVICES)}")

with open('h:/SEOC_DB_PORTAL/portal_services.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\nAll Feature Services:")
for r in results:
    print(f"  {r['name']}: {r['url']}")
