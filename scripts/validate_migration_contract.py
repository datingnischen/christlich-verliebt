#!/usr/bin/env python3
from __future__ import annotations

import argparse,json,re,sys
from pathlib import Path
from urllib.parse import urlparse
import yaml

REQ='[REQUIRED]'; SHA=re.compile(r'^[0-9a-fA-F]{64}$'); RANGE=re.compile(r'^[0-9a-fA-F]{40,64}\.\.[0-9a-fA-F]{40,64}$'); HOST=re.compile(r'^(?=.{1,253}$)(?!-)(?:[A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,63}$'); MEDIA=re.compile(r'^[A-Za-z0-9!#$&^_.+-]+/[A-Za-z0-9!#$&^_.+-]+$')
TOP={'version','project','state','snapshot','fetch_policy','route_ownership','cutover','review'}
SC={'state':{'preview','production_deployment','dns_cutover'},'snapshot':{'serializer','serializer_version','dependency_lock_sha256','source_fixture_sha256','output_sha256','acquisition_timestamp_policy'},'fetch':{'source_hosts','allowed_ports','connect_timeout_seconds','read_timeout_seconds','total_timeout_seconds','max_redirects','max_response_bytes','allowed_content_types','reject_non_public_ips'},'route':{'path_family','owner','methods','query_preserved','expected_status','upstream','verified'},'cutover':{'legacy_origin','certificate_verified','redirects_verified','forms_verified','cookies_verified','sessions_verified','legal_verified','magazine_verified','rollback'},'rollback':{'previous_dns_values','target','responsible_operator','ttl_seconds'},'review':{'immutable_range','passed','security_concerns','logic_errors'}}
def mp(v,p,k,e):
 if not isinstance(v,dict):e.append(f'{p} must be mapping');return {}
 e += [f'missing: {p}.{x}' for x in sorted(k-set(v))]+[f'unknown: {p}.{x}' for x in sorted(set(v)-k)];return v
def rs(v,p,e):
 if not isinstance(v,str) or not v.strip() or REQ in v:e.append(f'{p} unresolved');return ''
 return v.strip()
def bi(v,p,e):
 if type(v) is not bool:e.append(f'{p} not boolean');return None
 return v
def pi(v,p,e,lo=1,hi=None):
 if type(v) is not int or v<lo or (hi is not None and v>hi):e.append(f'{p} out of range');return None
 return v
def hu(v,p,e):
 s=rs(v,p,e)
 if not s:return
 try:u=urlparse(s);port=u.port
 except ValueError:e.append(f'{p} malformed URL');return
 if u.scheme!='https' or not u.hostname or u.username or u.password or u.fragment:e.append(f'{p} unsafe HTTPS URL')
 if port not in (None,443):e.append(f'{p} must use 443')
def validate(d,cutover=False):
 e=[];r=mp(d,'contract',TOP,e)
 if r.get('version')!=1:e.append('version invalid')
 rs(r.get('project'),'project',e);st=mp(r.get('state'),'state',SC['state'],e)
 for x in SC['state']:
  if st.get(x) not in {'blocked','ready'}:e.append(f'state.{x} invalid')
 s=mp(r.get('snapshot'),'snapshot',SC['snapshot'],e);rs(s.get('serializer'),'snapshot.serializer',e);rs(s.get('serializer_version'),'snapshot.serializer_version',e)
 if s.get('acquisition_timestamp_policy')!='separate-audit-artifact':e.append('timestamp policy invalid')
 for x in ('dependency_lock_sha256','source_fixture_sha256','output_sha256'):
  if not isinstance(s.get(x),str) or not SHA.fullmatch(s[x]):e.append(f'snapshot.{x} invalid')
 f=mp(r.get('fetch_policy'),'fetch_policy',SC['fetch'],e);h=f.get('source_hosts');nh=[]
 if not isinstance(h,list) or not h:e.append('source_hosts empty')
 else:
  for i,x in enumerate(h):
   z=rs(x,f'source_hosts[{i}]',e)
   if z and not HOST.fullmatch(z):e.append(f'source_hosts[{i}] invalid')
   if z:nh.append(z.lower())
  if len(nh)!=len(set(nh)):e.append('source_hosts duplicates')
 if f.get('allowed_ports')!=[443]:e.append('ports invalid')
 for x,lo,hi in [('connect_timeout_seconds',1,60),('read_timeout_seconds',1,300),('total_timeout_seconds',1,600),('max_redirects',0,10),('max_response_bytes',1,100000000)]:pi(f.get(x),x,e,lo,hi)
 mt=f.get('allowed_content_types')
 if not isinstance(mt,list) or not mt or any(not isinstance(x,str) or not MEDIA.fullmatch(x) for x in mt):e.append('media types invalid')
 elif len(mt)!=len(set(x.lower() for x in mt)):e.append('media types duplicates')
 if bi(f.get('reject_non_public_ips'),'reject_non_public_ips',e) is not True:e.append('IP rejection disabled')
 rows=r.get('route_ownership')
 if not isinstance(rows,list) or not rows:e.append('routes empty')
 else:
  for i,x in enumerate(rows):
   q=mp(x,f'route[{i}]',SC['route'],e);path=rs(q.get('path_family'),f'route[{i}].path_family',e)
   if path and not path.startswith('/'):e.append('route path invalid')
   if q.get('owner') not in {'nextjs','legacy'}:e.append('owner invalid')
   if not isinstance(q.get('methods'),list) or not q['methods']:e.append('methods empty')
   if bi(q.get('query_preserved'),'query_preserved',e) is not True:e.append('query not verified')
   pi(q.get('expected_status'),'status',e,100,599)
   if bi(q.get('verified'),'verified',e) is not True:e.append('route unverified')
   if q.get('owner')=='legacy':hu(q.get('upstream'),'upstream',e)
 c=mp(r.get('cutover'),'cutover',SC['cutover'],e);hu(c.get('legacy_origin'),'legacy_origin',e)
 for x in ('certificate_verified','redirects_verified','forms_verified','cookies_verified','sessions_verified','legal_verified','magazine_verified'):
  v=bi(c.get(x),x,e)
  if cutover and v is not True:e.append(f'{x} not ready')
 rb=mp(c.get('rollback'),'rollback',SC['rollback'],e)
 for x in ('previous_dns_values','target','responsible_operator'):rs(rb.get(x),x,e)
 pi(rb.get('ttl_seconds'),'ttl',e,1,86400)
 rv=mp(r.get('review'),'review',SC['review'],e);ir=rs(rv.get('immutable_range'),'immutable_range',e)
 if ir and not RANGE.fullmatch(ir):e.append('immutable_range invalid')
 if bi(rv.get('passed'),'review.passed',e) is not True:e.append('review not passed')
 for x in ('security_concerns','logic_errors'):
  if not isinstance(rv.get(x),list) or rv.get(x):e.append(f'{x} nonempty')
 if cutover and (st.get('dns_cutover')!='ready' or st.get('production_deployment')!='ready'):e.append('states not ready')
 return sorted(set(e))
p=argparse.ArgumentParser();p.add_argument('contract',type=Path);p.add_argument('--require-cutover-ready',action='store_true');a=p.parse_args()
try:d=yaml.safe_load(a.contract.read_text(encoding='utf-8'))
except Exception as x:print(json.dumps({'valid':False,'errors':[str(x)]}));sys.exit(2)
if not isinstance(d,dict):print(json.dumps({'valid':False,'errors':['root invalid']}));sys.exit(2)
e=validate(d,a.require_cutover_ready);print(json.dumps({'valid':not e,'errors':e},indent=2));sys.exit(0 if not e else 1)
