from pathlib import Path
path = Path('src/pages/ProfileDetail.tsx')
data = path.read_text()
data = data.replace('�', '"')
path.write_text(data)
