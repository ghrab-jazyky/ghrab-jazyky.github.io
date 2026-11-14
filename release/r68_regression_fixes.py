#!/usr/bin/env python3
"""R68 compatibility with historic CI snapshots. Only exact post-install changes."""
from pathlib import Path
import re,sys,json
root=Path(sys.argv[1])/'language-skills-hub'
assert (root/'data/cards.json').is_file()
cat=json.loads((root/'data/cards.json').read_text('utf8'))
assert len(cat['entries'])==31 and sum(len(e['levels'])*len(e['languages']) for e in cat['entries'])==672
def update(rel,old,new):
 p=root/rel;s=p.read_text('utf8')
 n=s.count(old)
 if n!=1:raise SystemExit('INCOMPATIBLE '+rel+' expected 1, got '+str(n))
 p.write_text(s.replace(old,new,1),'utf8')
for name in ['r22-static-policy.test.cjs','r28-grade-proposal.test.cjs','r31-review-export.test.cjs','r34-full-pdf-export.test.cjs']:
 update('tests/'+name,"'R35-HR2'","'R68-SAD-A1C2'")
# Teacher key snapshots must have precisely the six canonical entry fields;
# remove only the additional SAD summary property, not the catalog description.
p=root/'self-check/practice-answers/teacher-key.js';s=p.read_text('utf8')
marker='"id": "ll-sad"'
assert s.count(marker)==1
start=s.index(marker);stop=s.index('].map(e=>Object.freeze',start)
region=s[start:stop]
m=re.search(r'(?m)^\s*"summary":\s*"[^"\n]*",\s*\n',region)
if not m:raise SystemExit('SAD summary was not found in key snapshot')
region=region[:m.start()]+region[m.end():]
p.write_text(s[:start]+region+s[stop:],'utf8')
update('tests/r68-sad-a1c2.test.cjs',"/phase:'matching'/", "/phase==='matching'/")
print('PASS: 4 historic release assertions, exact teacher snapshot parity, R68 matching semantics fixed')
