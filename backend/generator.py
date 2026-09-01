import os
from pathlib import Path

src_dir = Path(r"C:\Users\ammus\.gemini\antigravity\scratch\kadalcycle\frontend\src")
views_dir = src_dir / "views"
views_dir.mkdir(parents=True, exist_ok=True)
print("Views directory ready:", views_dir)
