#!/usr/bin/env python3
"""Static package verification. No network, no device actions, no external dependencies."""
from pathlib import Path
from datetime import datetime,date,timedelta
import csv, json, xml.etree.ElementTree as ET, sys
root=Path(__file__).resolve().parents[1]
required=['README.md','AGENT_PROMPT.md','gui/care-calendar-prototype.html','data/solar_calendar_365.csv','data/care_routines.csv','data/weather_rules.csv','data/observation_template.csv','data/data_dictionary.csv','data/gui_backlog.csv','data/feed_log_template.csv','xml/tendercells-care-config.xml','xml/tendercells-care-config.xsd','xml/tendercells-care-api-extension.xml','schema/care-schedule.schema.json','schema/roost-observation.schema.json','schema/weather-snapshot.schema.json']
for f in required:
    assert (root/f).is_file(),f'Missing {f}'
with (root/'data/solar_calendar_365.csv').open(encoding='utf-8',newline='') as f:days=list(csv.DictReader(f))
assert len(days)==365, 'Incorrect solar length'
assert days[0]['local_date']=='2026-11-22' and days[-1]['local_date']=='2027-11-21'
assert all(row['auto_actuate']=='FALSE' and row['kind']=='HUMAN_REVIEW' for row in days)
assert all(row['sunset_local_iso'].endswith(('-07:00','-08:00')) for row in days)
assert len({row['local_date'] for row in days})==365
with (root/'data/care_routines.csv').open(encoding='utf-8',newline='') as f:routines=list(csv.DictReader(f))
assert len({r['routine_id'] for r in routines})==len(routines)
assert all(r['enabled']=='FALSE' and r['output_type']=='notification' for r in routines)
obs=list(csv.DictReader((root/'data/observation_template.csv').open(encoding='utf-8',newline='')))
assert obs[0]['roosting_seen_by_iso'] and not obs[0]['confirmed_first_roost_iso'] and not obs[0]['last_bird_inside_iso']
for x in (root/'xml').glob('*.xml'):ET.parse(x)
for x in (root/'schema').glob('*.json'):
  data=json.loads(x.read_text(encoding='utf-8'));assert data['$schema'].endswith('2020-12/schema')
config=ET.parse(root/'xml/tendercells-care-config.xml').getroot()
assert config.attrib=={'schemaVersion':'1','mode':'advisory'}
assert all(r.attrib['enabled']=='false' and r.attrib['actionKind']=='notification' for r in config.findall('./CareRoutines/Routine'))
html=(root/'gui/care-calendar-prototype.html').read_text(encoding='utf-8')
assert 'SIMULATED' in html and 'Roosting observed by' in html and 'Unknown' in html
print(f'PASS: {len(required)} key files, {len(days)} solar days, {len(routines)} advisory routines, 3 XML parse, 3 JSON schemas; no commands enabled')
