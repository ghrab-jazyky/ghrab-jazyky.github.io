#!/usr/bin/env python3
from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(encoding='utf-8')
old=""" if r64.is_file():
  v=r64.read_text('utf-8')
  if 'entries.length,30' not in v:raise RuntimeError('R64 test expects an incompatible source; rebase PR #101 first.')
  amend_test('r64-real-catalog-sources.test.cjs',[
   repl('entries.length,30','entries.length,31','expanded catalogue')])
"""
new=""" if r64.is_file():
  v=r64.read_text('utf-8')
  if 'assert.ok(entries.length>=29)' in v:
   # Current R64 explicitly tests every catalog entry, with a lower bound only.
   # It already accepts additional entries; preserve the stronger full traversal.
   pass
  elif 'entries.length,30' in v:
   amend_test('r64-real-catalog-sources.test.cjs',[
    repl('entries.length,30','entries.length,31','expanded catalogue')])
  else:
   raise RuntimeError('Unknown R64 source validation: stop for audit')
"""
if s.count(old)!=1:raise SystemExit('INCOMPATIBLE_INSTALLER_SOURCE')
p.write_text(s.replace(old,new),encoding='utf-8')
print('R64 compatibility adapter updated without changing original R64 tests')
