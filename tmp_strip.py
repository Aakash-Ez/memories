from pathlib import Path

path = Path("tmp_highlights.tsx")
text = path.read_text(encoding="utf-8")
markers = ['\n"""\\n*** End Patch', '\n\\"\\\"\\\"\\n*** End Patch']
for marker in markers:
    if marker in text:
        text = text.replace(marker, "")
path.write_text(text, encoding="utf-8")
