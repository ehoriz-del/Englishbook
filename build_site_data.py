from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
books_path = ROOT / "data" / "books.json"
data = json.loads(books_path.read_text(encoding="utf-8"))
content = {}
for book_chapters in data.get("chapters", {}).values():
    for ch in book_chapters:
        rel = ch.get("file")
        if rel and rel not in content:
            p = ROOT / rel
            if not p.exists():
                raise FileNotFoundError(f"Missing chapter source: {rel}")
            content[rel] = p.read_text(encoding="utf-8")
data["chapterContent"] = content
out = ROOT / "data" / "site-data.js"
out.write_text("window.ENGLISHBOOK_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print(f"Built {out.relative_to(ROOT)} with {len(content)} chapter files")
