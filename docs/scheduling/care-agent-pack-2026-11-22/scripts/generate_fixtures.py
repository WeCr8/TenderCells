#!/usr/bin/env python3
"""Generate deterministic, non-live CSV/XML/JSON contract fixtures; NO hardware access."""
from pathlib import Path
from datetime import datetime, timedelta, date, timezone
from zoneinfo import ZoneInfo
from math import pi, cos, sin, tan, acos, radians, degrees
import csv, json, xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'; XML=ROOT/'xml'; SCHEMA=ROOT/'schema'; DATA.mkdir(exist_ok=True); XML.mkdir(exist_ok=True); SCHEMA.mkdir(exist_ok=True)
lat,lon=32.9,-116.9  # deliberately coarse (~10 km) demo anchor; never commit a real household location
TZ=ZoneInfo('America/Los_Angeles')
TODAY=date(2026,11,22)

def solar(d, zenith=90.833):
    n=d.timetuple().tm_yday
    days=366 if (d.year%4==0 and(d.year%100!=0 or d.year%400==0)) else 365
    gamma=2*pi/days*(n-1)
    eq=229.18*(0.000075+0.001868*cos(gamma)-0.032077*sin(gamma)-0.014615*cos(2*gamma)-0.040849*sin(2*gamma))
    dec=(0.006918-0.399912*cos(gamma)+0.070257*sin(gamma)-0.006758*cos(2*gamma)+0.000907*sin(2*gamma)-0.002697*cos(3*gamma)+0.00148*sin(3*gamma))
    hour=acos(cos(radians(zenith))/(cos(radians(lat))*cos(dec))-tan(radians(lat))*tan(dec))
    zero=datetime(d.year,d.month,d.day,tzinfo=timezone.utc)
    rise=zero+timedelta(minutes=720-4*(lon+degrees(hour))-eq)
    sett=zero+timedelta(minutes=720-4*(lon-degrees(hour))-eq)
    return rise.astimezone(TZ),sett.astimezone(TZ)

def write(name,head,rows):
    with (DATA/name).open('w',encoding='utf-8',newline='') as f:
        w=csv.writer(f);w.writerow(head);w.writerows(rows)

solrows=[]
for i in range(365):
    d=TODAY+timedelta(days=i)
    rise,sett=solar(d);dusk=solar(d,96)[1]
    roostcue=sett-timedelta(minutes=25)
    watchcue=roostcue-timedelta(minutes=10)
    review=sett-timedelta(minutes=10)
    solrows.append([d.isoformat(),'demo-site-approx','America/Los_Angeles',rise.isoformat(),sett.isoformat(),dusk.isoformat(),watchcue.isoformat(),roostcue.isoformat(),review.isoformat(),'approx_noaa','low','FALSE','HUMAN_REVIEW','One Nov observation; 25 min is provisional, not predicted bird behavior'])
solarhead=['local_date','property_id','time_zone','sunrise_local_iso','sunset_local_iso','civil_dusk_local_iso','headcount_cue_local_iso','provisional_roost_cue_local_iso','door_review_local_iso','solar_source','shade_confidence','auto_actuate','kind','note']
write('solar_calendar_365.csv',solarhead,solrows)

routines=[
('R01','Dawn readiness','solar','sunrise','-20','Check overnight faults and weather','notification','monitoring','FALSE'),
('R02','Door opening review','solar','sunrise','20','Review path, latch, run and predator safety','notification','door','FALSE'),
('R03','Feed availability','solar','sunrise','30','Check complete feed accessible; record refill','notification','feed','FALSE'),
('R04','Water availability','solar','sunrise','30','Verify clean water continuous and flow','notification','water','FALSE'),
('R05','Egg inspection','solar','sunrise','90','Human nest-box check; no arm motion','notification','eggs','FALSE'),
('R06','Midday heat/water','fixed','','','Review coop temp, shade, water and ventilation','notification','weather','FALSE'),
('R07','Afternoon feed/water','solar','sunset','-75','Verify feed and water before local roost','notification','feed_water','FALSE'),
('R08','Early return monitoring','solar','sunset','-35','Look for birds returning as site shades','notification','roost','FALSE'),
('R09','Pre-close headcount','solar','sunset','-10','Count all birds, inspect mechanism, manual review','notification','door','FALSE'),
('R10','Evening secure review','solar','civil_dusk','0','Verify position feedback or alert keeper','notification','security','FALSE'),
('R11','Weekly checks','fixed','','','Clean feeders, inspect mounts and backup power','notification','maintenance','FALSE')
]
write('care_routines.csv',['routine_id','label','trigger_mode','solar_event','offset_minutes','description','output_type','capability','enabled'],routines)

rules=[
('W01','warm_day',80,'F','external_forecast_or_sensor','Inspect water and shade; no autonomous actuation','advisory','FALSE'),
('W02','coop_heat_review',85,'F','sensed_coop','Human welfare inspection and ventilation review','alert','FALSE'),
('W03','extreme_heat',95,'F','external_forecast','Increase keeper checks and verify water availability','alert','FALSE'),
('W04','low_water_level',20,'pct','sensed_calibrated','Notify keeper; do not energize uncalibrated pump','alert','FALSE'),
('W05','low_feed_level',20,'pct','sensed_calibrated','Notify keeper to refill','alert','FALSE'),
('W06','stale_weather',6,'hours','external_forecast','Show stale and revert to local checks','advisory','FALSE'),
('W07','early_shade',0,'lux_delta','sensed_local','Begin manual headcount, not lockup','advisory','FALSE')
]
write('weather_rules.csv',['rule_id','condition','threshold','unit','evidence_required','response','output_type','auto_actuate'],rules)
obs=[['OBS-20261122-DEMO','demo-site-approx','2026-11-22','2026-11-22T16:18:00-08:00','','','','','human_report','low','Roosting already underway by ~4:18 PM; first bird and last bird unknown','FALSE']]
write('observation_template.csv',['observation_id','property_id','local_date','roosting_seen_by_iso','confirmed_first_roost_iso','last_bird_inside_iso','shade_onset_iso','lux','source_type','confidence','notes','confirmed_count_complete'],obs)
write('feed_log_template.csv',['date','property_id','flock_count','life_stage','feed_added_g','feed_leftover_g','estimated_consumed_g','water_level_pct','flow_ok','egg_count','observations'], [[(TODAY+timedelta(days=i)).isoformat(),'demo-site-approx','','adult_layer','','','','','','',''] for i in range(21)])

gui=[
('GUI-01','P0','Care Calendar Today/Week/Month','SchedulesPage.tsx','Provide daylight, care plan, provenance; old CRUD remains','Planned'),
('GUI-02','P0','Schedule wizard mode picker','SchedulesPage.tsx','Fixed/solar/shade/sensor/combined; read-only preview','Planned'),
('GUI-03','P0','Explicit Door Open/Close field','SchedulesPage.tsx','save payload contains selected state; safety checks','Planned'),
('GUI-04','P0','Water action labels by hardware capability','SchedulesPage.tsx; schedules.ts','ml never mapped silently to light relay','Planned'),
('GUI-05','P0','Feed amount limit validation','SchedulesPage.tsx; schedules.ts','no hidden 5000g to 1000g clamping','Planned'),
('GUI-06','P1','Shade & roost observation drawer','new component','seen-by vs confirmed-first separate; timestamps/provenance','Planned'),
('GUI-07','P1','Weather source + stale badge','new service/component','issuedAt/fetchedAt/validUntil + stale','Planned'),
('GUI-08','P1','Command vs physical feedback','schedule execution panel','requested/ack/confirmed distinct and dated','Planned'),
('GUI-09','P1','Feed, water and eggs care summary','new dashboard cards','reporting only without installed sensors','Planned'),
('GUI-10','P2','XLSX/CSV/XML import/export dialog','new component','read-only preview, schema version, diff, disabled import','Planned'),
('GUI-11','P2','Demo learning mission','demoEnvironment.ts','simulated reminder only; no real commands','Planned'),
('GUI-12','P0','Queue claim failure safety','schedule.runner.ts','fail closed for device actions and test duplicate runners','Planned'),
]
write('gui_backlog.csv',['task_id','priority','screen_or_issue','source_touchpoint','acceptance','status'],gui)
fields=[
('schedule','schema_version','integer','','required','1','model version'),
('schedule','trigger_mode','enum','','required','fixed|solar|site_shade|sensor|combined','non-authorizing cue'),
('schedule','action_kind','enum','','required','human_reminder|device_action','device action default disabled'),
('schedule','time_zone','iana_timezone','','required','','property timezone'),
('weather','provider','string','','required','','source of forecast'),
('weather','issued_at','date-time','ISO8601','optional','','forecast issue timestamp'),
('weather','fetched_at','date-time','ISO8601','required','','collection timestamp'),
('weather','valid_until','date-time','ISO8601','required','','stale computation'),
('observation','roosting_seen_by_iso','date-time','ISO8601','optional','','upper-bound observation, not first roost'),
('observation','confirmed_first_roost_iso','date-time','ISO8601','optional','','must be explicitly confirmed'),
('observation','last_bird_inside_iso','date-time','ISO8601','optional','','not inferred from first-roost'),
('observation','source_type','enum','','required','human_report|sensed|inferred|simulated','provenance'),
('feed','feed_added_g','number','g','optional','','not equal to consumption'),
('feed','estimated_consumed_g','number','g','optional','','label estimate'),
('water','water_level_pct','number','%','optional','','only installed sensor'),
('execution','physical_confirmed_at','date-time','ISO8601','optional','','physical feedback only'),
]
write('data_dictionary.csv',['table','field','type','unit','required','allowed_or_default','description'],fields)

# JSON schema draft 7 standard for pure structures; devices not autoactivated.
schedule={"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://tendercells.com/schema/care-schedule-v1.json","title":"TenderCells Care Schedule Draft","type":"object","additionalProperties":False,"required":["schemaVersion","id","propertyId","timeZone","triggerMode","actionKind","enabled"],"properties":{"schemaVersion":{"const":1},"id":{"type":"string","minLength":1},"propertyId":{"type":"string","minLength":1},"timeZone":{"type":"string","minLength":1},"triggerMode":{"enum":["fixed","solar","site_shade","sensor","combined"]},"solarEvent":{"enum":["sunrise","sunset","civil_dusk"]},"offsetMinutes":{"type":"integer","minimum":-1440,"maximum":1440},"actionKind":{"enum":["human_reminder","device_action"]},"enabled":{"type":"boolean","default":False},"sensorMetric":{"type":"string"},"humanLabel":{"type":"string"}}}
observation={"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://tendercells.com/schema/roost-observation-v1.json","title":"TenderCells Roost Observation","type":"object","additionalProperties":False,"required":["schemaVersion","id","propertyId","localDate","sourceType","confidence"],"properties":{"schemaVersion":{"const":1},"id":{"type":"string"},"propertyId":{"type":"string"},"localDate":{"type":"string","format":"date"},"roostingSeenBy":{"type":["string","null"],"format":"date-time"},"confirmedFirstRoostAt":{"type":["string","null"],"format":"date-time"},"lastBirdInsideAt":{"type":["string","null"],"format":"date-time"},"shadeOnsetAt":{"type":["string","null"],"format":"date-time"},"lux":{"type":["number","null"],"minimum":0},"sourceType":{"enum":["human_report","sensed","inferred","simulated"]},"confidence":{"enum":["low","medium","high"]},"notes":{"type":"string"}}}
weather={"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://tendercells.com/schema/weather-snapshot-v1.json","title":"TenderCells Weather Snapshot","type":"object","additionalProperties":False,"required":["schemaVersion","provider","fetchedAt","validUntil","stale","sourceType"],"properties":{"schemaVersion":{"const":1},"provider":{"type":"string"},"issuedAt":{"type":"string","format":"date-time"},"fetchedAt":{"type":"string","format":"date-time"},"validUntil":{"type":"string","format":"date-time"},"stale":{"type":"boolean"},"sourceType":{"const":"EXTERNAL"},"temperatureC":{"type":["number","null"]},"windSpeedMps":{"type":["number","null"]},"precipitationProbabilityPct":{"type":["number","null"],"minimum":0,"maximum":100},"alerts":{"type":"array","items":{"type":"string"}}}}
for name,instance in [('care-schedule.schema.json',schedule),('roost-observation.schema.json',observation),('weather-snapshot.schema.json',weather)]: (SCHEMA/name).write_text(json.dumps(instance,indent=2)+'\n',encoding='utf-8')

# Documented example XML config, not deployed, explicitly disabled
root=ET.Element('TenderCellsCareConfig',attrib={'schemaVersion':'1','mode':'advisory'})
ET.SubElement(root,'Property',attrib={'id':'demo-site-approx','timeZone':'America/Los_Angeles','latitude':str(lat),'longitude':str(lon)})
triggers=ET.SubElement(root,'CareRoutines')
for id_,label,mode,event,offset,description,kind,capability,enabled in routines:
    attrs={'id':id_,'label':label,'mode':mode,'actionKind':kind,'enabled':'false'}
    if event: attrs['solarEvent']=event
    if offset: attrs['offsetMinutes']=offset
    e=ET.SubElement(triggers,'Routine',attrs)
    ET.SubElement(e,'Description').text=description
ET.SubElement(root,'Notes').text='Advisory templates only. Import must not enable physical action. Roosting already seen by 4:18 PM on 2026-11-22; first/last unknown.'
ET.indent(root,space='  ')
ET.ElementTree(root).write(XML/'tendercells-care-config.xml',encoding='utf-8',xml_declaration=True)

xsd='''<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="TenderCellsCareConfig">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="Property">
          <xs:complexType><xs:attribute name="id" type="xs:string" use="required"/><xs:attribute name="timeZone" type="xs:string" use="required"/><xs:attribute name="latitude" type="xs:decimal" use="required"/><xs:attribute name="longitude" type="xs:decimal" use="required"/></xs:complexType>
        </xs:element>
        <xs:element name="CareRoutines">
          <xs:complexType><xs:sequence><xs:element name="Routine" minOccurs="1" maxOccurs="unbounded">
            <xs:complexType><xs:sequence><xs:element name="Description" type="xs:string"/></xs:sequence>
            <xs:attribute name="id" type="xs:string" use="required"/><xs:attribute name="label" type="xs:string" use="required"/><xs:attribute name="mode" use="required"><xs:simpleType><xs:restriction base="xs:string"><xs:enumeration value="fixed"/><xs:enumeration value="solar"/></xs:restriction></xs:simpleType></xs:attribute>
            <xs:attribute name="actionKind" use="required"><xs:simpleType><xs:restriction base="xs:string"><xs:enumeration value="notification"/></xs:restriction></xs:simpleType></xs:attribute>
            <xs:attribute name="enabled" type="xs:boolean" use="required"/><xs:attribute name="solarEvent" type="xs:string" use="optional"/><xs:attribute name="offsetMinutes" type="xs:int" use="optional"/>
            </xs:complexType>
          </xs:element></xs:sequence></xs:complexType>
        </xs:element>
        <xs:element name="Notes" type="xs:string"/>
      </xs:sequence>
      <xs:attribute name="schemaVersion" use="required"><xs:simpleType><xs:restriction base="xs:string"><xs:enumeration value="1"/></xs:restriction></xs:simpleType></xs:attribute>
      <xs:attribute name="mode" use="required"><xs:simpleType><xs:restriction base="xs:string"><xs:enumeration value="advisory"/></xs:restriction></xs:simpleType></xs:attribute>
    </xs:complexType>
  </xs:element>
</xs:schema>
'''
(XML/'tendercells-care-config.xsd').write_text(xsd,encoding='utf-8')
(XML/'tendercells-care-api-extension.xml').write_text('''<?xml version="1.0" encoding="UTF-8"?>
<!-- Proposed API description fragment only; do not replace generated tendercells-backend.xml -->
<proposedEndpoints schemaVersion="1" status="UNIMPLEMENTED">
  <endpoint method="GET" path="/api/properties/{propertyId}/care/calendar" access="owner" description="Read-only solar, events, provenance"/>
  <endpoint method="POST" path="/api/properties/{propertyId}/care/observations" access="owner" description="Save human observation; no device action"/>
  <endpoint method="GET" path="/api/properties/{propertyId}/care/weather" access="owner" description="Weather snapshot with freshness"/>
  <endpoint method="POST" path="/api/properties/{propertyId}/care/import/dry-run" access="owner" description="Schema validate + diff, never execute"/>
  <endpoint method="GET" path="/api/properties/{propertyId}/care/export" access="owner" description="CSV/XML/XLSX sanitized report"/>
</proposedEndpoints>
''',encoding='utf-8')

# human-only small ics, in UTC time; not synced to calendar and not hardware control
lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TenderCells//CARE-REMINDERS-EXAMPLE//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:TenderCells human care reminders (example)']
for i in range(14):
  d=TODAY+timedelta(days=i)
  rise,sett=solar(d)
  for slug,label,at in [('dawn','Check coop feed and water',rise+timedelta(minutes=30)),('evening','Check flock is inside (do NOT auto-close)',sett-timedelta(minutes=10))]:
    stamp=at.astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    lines+=['BEGIN:VEVENT',f'UID:tc-care-{d.strftime("%Y%m%d")}-{slug}@tendercells.local',f'DTSTART:{stamp}',f'DTEND:{(at+timedelta(minutes=10)).astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")}',f'SUMMARY:{label}','DESCRIPTION:Human reminder only. Simulated schedule preview. No hardware command.','END:VEVENT']
lines+=['END:VCALENDAR']
(ROOT/'data'/'human_reminders_14_day_example.ics').write_text('\r\n'.join(lines)+'\r\n',encoding='utf-8')
print('Generated',len(list(DATA.iterdir())),'data files; 365 solar dates; 3 JSON schemas; 3 XML files.')
