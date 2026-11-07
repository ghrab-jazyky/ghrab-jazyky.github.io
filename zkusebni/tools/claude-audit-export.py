#!/usr/bin/env python3
"""Build review-only Claude ZIP batches from public student HTML. Never release tests."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path(__file__).resolve().parents[1]
SKILLS=("konverzace","cteni","poslech")
LABELS={"konverzace":"CONVERSATION","cteni":"READING","poslech":"LISTENING"}
REF={
 "konverzace":"Artificial Intelligence reference: 8 stations, 3 follow-ups per station, Support/Challenge/Stretch, 12 vocabulary items, 4 language supports.",
 "cteni":"Asteroids v2.3 reference: evidence in text, offline dictionary, levels A1-C2 (9/9/12/18/21/21 exercises per language), separate teacher answer key.",
 "poslech":"Matthew McConaughey v3 reference: Before -> First Listening -> Second Listening -> Third Listening (Written Evidence + Reconstruction) -> Optional Language -> After Listening."
}
def load(p):
 return json.loads((ROOT/p).read_text(encoding="utf-8"))
def source(p):
 if not isinstance(p,str) or not re.fullmatch(r"(?:[a-z0-9-]+/)+index\.html",p):
  raise ValueError("Invalid source path: "+str(p))
 f=(ROOT/p).resolve()
 if not f.is_relative_to(ROOT) or not f.is_file():
  raise ValueError("Source does not exist in public repo: "+p)
 return f
def prompt(item,sha):
 skill=item["skill"];id=item["id"]
 return "\n".join([
 "# Claude independent audit — "+item["title"],"",
 "Topic ID: "+id,
 "Skill: "+skill+"; languages: "+", ".join(item["languages"])+"; levels: "+", ".join(item["levels"]),
 "Original student HTML in ZIP: sources/"+id+".html",
 "SHA-256: "+sha,"",
 "Reference: "+REF[skill],"",
 "Audit ALL supported languages and CEFR variants, not only EN B2. Do not replace the original source.",
 "Check accuracy of grammar, idiomatic expression, CEFR difficulty, age suitability, detailed instructions, authentic and factual content, UX, vocabulary, errors in exercises, and mobile/offline limitations.",
 "For reading, inspect passages and evidence supporting answers; verify teacher answer key only if it is supplied privately, never assume it is already correct.",
 "For listening, verify the real recording and clip timing if accessible. Explicitly mark unverified media. Check pedagogical progression without mechanically transplanting Matthew questions.",
 "For speaking, assess open questions, station relevance, differentiated supports and learner interactions across all four languages.",
 "List each issue with P0/P1/P2 severity, language, CEFR, exact exercise/station, original wording, proposed fix and proof. Distinguish definite errors from hypotheses.",
 "P0 critical, P1 pedagogically significant, P2 minor language/UX. State when native Safari/iOS/Android or real media were not tested.",
 "Never infer new grading rubrics. No student data or private teacher keys in public repositories.",
 "Return an individual report with EXACT JSON fields:",
 '{"topicId":"'+id+'","sourceSha256":"'+sha+'","status":"REVIEWED_WITH_FINDINGS","requiresTeacherDecision":true,"findings":[{"severity":"P1","language":"es","level":"A1","location":"station 8 question 1","observed":"...","proposed":"...","evidence":"..."}]}',
 'Only use status "REVIEWED_NO_FINDINGS" with findings:[] if all inspected variants truly have no issues.',
 "Include a short narrative summary outside the JSON. Claude approval does NOT replace teacher approval or real-device UAT.",
 ""
 ])
def main():
 p=argparse.ArgumentParser();p.add_argument("--output",type=Path,required=True);out=p.parse_args().output.resolve();out.mkdir(parents=True,exist_ok=True)
 catalog=load("data/reference-pilots.json")
 queue=load("data/claude-audit-queue.json")
 entries={e["id"]:e for e in catalog["entries"]}
 queued={e["id"] for e in queue["topics"]}
 if catalog.get("approvedForTeaching") is not False or set(entries)!=queued or len(entries)!=len(queued):
  raise ValueError("Catalog, audit queue or publication status invalid.")
 index=["# Claude audit batches",f"Students-only public source cards: {len(entries)}","No teacher keys or student responses. Claude checks independently; school approval is separate.",""]
 totals={}
 allpacks=[]
 for skill in SKILLS:
  items=[q for q in queue["topics"] if q["skill"]==skill]
  totals[skill]=len(items)
  for start in range(0,len(items),5):
   bundle=items[start:start+5];number=start//5+1
   dest=out/f"LSH_CLAUDE_{LABELS[skill]}_BATCH_{number:02d}.zip"
   report={"schemaVersion":1,"reports":[]}
   with ZipFile(dest,"w",ZIP_DEFLATED,compresslevel=6) as z:
    z.writestr("README_CLAUDE.md", "# Claude batch "+str(number)+"\nPlease review ALL "+str(len(bundle))+" source HTML cards with their SHA-bound prompts.\nReturn a single JSON object with schemaVersion:1 and reports:[...].\nOnly student source files. No teacher keys or student submissions. No automatic approval.\n")
    for q in bundle:
     card=entries[q["id"]];data=source(q["sourcePath"]).read_bytes()
     if len(data)>6*1024*1024 or b"-----BEGIN PRIVATE KEY-----" in data or b"OPENAI_API_KEY" in data:
      raise ValueError("Oversize or sensitive HTML source: "+q["id"])
     digest=hashlib.sha256(data).hexdigest()
     z.writestr("sources/"+q["id"]+".html",data)
     z.writestr("prompts/"+q["id"]+".md",prompt(card,digest))
     report["reports"].append({"topicId":q["id"],"sourceSha256":digest,
      "status":"FILL_REVIEWED_WITH_FINDINGS_OR_REVIEWED_NO_FINDINGS",
      "requiresTeacherDecision":True,"findings":[]})
     index.append("- "+q["id"]+": "+dest.name+", SHA-256 "+digest)
    z.writestr("reports.template.json",json.dumps(report,ensure_ascii=False,indent=2))
   allpacks.append(dest)
   print("CREATED",dest.name,len(bundle),"student HTML files")
 (out/"INDEX.md").write_text("\n".join(index)+"\n",encoding="utf-8")
 if sum(totals.values())!=len(entries):
  raise ValueError("Incomplete audit roster.")
 print("PASS",len(allpacks),"Claude audit ZIP batches for",len(entries),"topics")
if __name__=="__main__":
 main()
