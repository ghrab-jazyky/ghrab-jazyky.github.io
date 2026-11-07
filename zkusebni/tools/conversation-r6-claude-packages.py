#!/usr/bin/env python3
"""Export five source-verified R6 Conversation candidate batches. No deployment or keys."""
import argparse
import hashlib
import json
import math
import pathlib
import re
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
INDEX = ROOT / "data/conversation-r6-candidates.json"
SAFE_PATH = re.compile(r"^konverzace/k/cl-[a-z0-9-]+\.html$")

def build(outdir):
    manifest = json.loads(INDEX.read_text(encoding="utf-8"))
    cards = manifest["cards"]
    if manifest.get("status") != "CANDIDATES_ONLY" or manifest.get("published") is not False:
        raise ValueError("R6 source manifest is not an unpublished candidate set")
    if len(cards) != 21 or len({x["id"] for x in cards}) != 21:
        raise ValueError("Expected 21 unique R6 Conversation candidates")
    outdir.mkdir(parents=True, exist_ok=True)
    packages = []
    batch_size = 5
    for start in range(0, len(cards), batch_size):
        selected = cards[start:start + batch_size]
        batch_no = start // batch_size + 1
        filename = f"LSH_R6_CONVERSATION_CLAUDE_DAVKA_{batch_no:02d}.zip"
        output = outdir / filename
        rows = []
        for entry in selected:
            p = entry["candidatePath"]
            if not SAFE_PATH.fullmatch(p) or pathlib.PurePosixPath(p).name != entry["id"] + ".html":
                raise ValueError("Unsafe candidate path: " + p)
            data = (ROOT / p).read_bytes()
            sha = hashlib.sha256(data).hexdigest()
            if sha != entry["candidateSha256"]:
                raise ValueError(f"Source SHA-256 mismatch: {entry['id']}")
            rows.append({"topicId": entry["id"], "sourceSha256": sha,
                         "file": "source/" + entry["id"] + ".html", "candidatePath": p})
        instructions = (
            "# Claude: nezavisly jazykovy a pedagogicky audit R6 Conversation Lab\n\n"
            f"Zkontroluj VSECH {len(rows)} zdrojovych HTML v teto davce, nikoli jen prvni.\n"
            "Kazda karta ma EN, ES, DE a FR ve vsech A1, A2, B1, B2, C1, C2.\n"
            "Pro KAZDOU kombinaci posud gramatiku, idiomaticnost, presnost, realnou CEFR narocnost,\n"
            "tematickou autenticitu a neopakovani otazek; strukturu 8 stanovist, 3 follow-up\n"
            "na stanoviste, Support/Challenge/Stretch, Explain, 12 slov a 4 jazykove opory.\n"
            "Nerikej PASS tam, kde jsi obsah neprosel. Posuzuj konkretni text HTML.\n"
            "Ke kazde chybe: topicId, jazyk, CEFR, stanoviste/uloha, presne puvodni zneni,\n"
            "navrzena oprava a priority P0/P1/P2. Dej oddeleny komentar k navrzene AI\n"
            "reference: zdrojove verze referencniho a R6 kandidata nemusi byt totozne.\n"
            "Vrat JSON s reports[]: topicId, sourceSha256, reviewedVariants[] (language,\n"
            "level, evidence), findings[] (severity, language, level, location, observed,\n"
            "proposed, evidence), unverifiedChecks[], requiresTeacherDecision:true.\n"
            "Vrat i kratky souhrn pocitu skutecne zkontrolovanych 24 variant na kartu.\n"
            "Neoverene iOS, Android, offline, skolni Wi-Fi a doplnkove JS moduly oznac\n"
            "NOT_TESTED. Ani hotovy jazykovy audit neni ucitelske schvaleni.\n"
            "Puvodni verejne cesty NEPREPISUJ; balicek je pouze ke kontrole kandidatu.\n"
            "Ucitelske klice a studentske osobni udaje se sem neprikladaji.\n"
            "Vysledek NEIMPORTUJ automaticky do stare fronty /data/claude-audit-queue.json:\n"
            "ta obsahuje SHA originalnich HTML, nikoliv kandidatnich souboru R6.\n"
        )
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            for row in rows:
                z.write(ROOT / row["candidatePath"], row["file"])
            z.writestr("README_CLAUDE_R6.txt", instructions)
            z.writestr("audit-index.json", json.dumps({"schemaVersion": 1, "batch": batch_no,
                            "sourceKind": "R6_CANDIDATES_ONLY", "cards": rows},
                            ensure_ascii=False, indent=2) + "\n")
        with zipfile.ZipFile(output) as z:
            if z.testzip() is not None or len(z.namelist()) != len(rows) + 2:
                raise ValueError("Invalid archive " + filename)
        packages.append({"batch": batch_no, "file": filename, "cards": len(rows),
                         "ids": [x["topicId"] for x in rows]})
    (outdir / "INDEX.json").write_text(json.dumps(
        {"schemaVersion": 1, "sourceKind": "R6_CANDIDATES_ONLY", "batchSize": batch_size,
         "totalCards": len(cards), "totalBatches": math.ceil(len(cards) / batch_size),
         "teacherApproval": False, "packages": packages}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    print("PASS: R6 candidate-only Claude export:", len(cards), "cards in",
          len(packages), "SHA-256 verified ZIP batches")
    return packages

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    build(args.output)
