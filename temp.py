from pathlib import Path
text = Path('src/pages/ProfileDetail.tsx').read_text()
print(text[:400])
