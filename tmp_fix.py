from pathlib import Path

path = Path("tmp_highlights.tsx")
text = path.read_text(encoding="utf-8")
text = text.replace("./src/", "../")
text = text.replace("aaa_dummy_replace", "should_not_exist")
if text.strip().endswith('"""*** End Patch'):
    text = text[: text.rfind('"""')]  # remove trailing patch markers
else:
    marker = "\n\"\"\"\n*** End Patch"
    if marker in text:
        text = text.replace(marker, "")
text = text.replace("â€¢", "•")
path.write_text(text, encoding="utf-8")
