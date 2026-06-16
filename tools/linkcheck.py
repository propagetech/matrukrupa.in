#!/usr/bin/env python3
"""Validate a static site on disk: every local asset, internal page link and
cross-page #anchor must resolve. Handles both root-absolute (/css/..) and
relative (../css/..) references (relative ones resolve against the page's dir).
Run as: python3 linkcheck.py <repo_dir>"""
import os, re, sys

repo = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.getcwd()

pages = []
for f in os.listdir(repo):
    if f.endswith(".html"):
        pages.append(os.path.join(repo, f))
for d in os.listdir(repo):
    p = os.path.join(repo, d, "index.html")
    if d not in ("archive", "tools", "node_modules", ".git") and os.path.isfile(p):
        pages.append(p)

def resolve(ref, page):
    path = ref.split("?")[0].split("#")[0]
    if path == "":
        return page
    if path.startswith("/"):
        fs = os.path.join(repo, path[1:])
    else:
        fs = os.path.join(os.path.dirname(page), path)
    fs = os.path.normpath(fs)
    if path.endswith("/") or os.path.isdir(fs):
        return os.path.join(fs, "index.html")
    return fs

id_cache = {}
def ids_of(fs):
    if fs not in id_cache:
        try:
            id_cache[fs] = set(re.findall(r'\bid="([^"]+)"', open(fs, encoding="utf-8").read()))
        except OSError:
            id_cache[fs] = None
    return id_cache[fs]

bad = []
attr = re.compile(r'(?:href|src)="([^"]+)"')
for page in pages:
    html = open(page, encoding="utf-8").read()
    rel = os.path.relpath(page, repo)
    for ref in attr.findall(html):
        if ref.startswith(("mailto:", "tel:", "http://", "https://", "data:", "javascript:")):
            continue
        if ref.startswith("#"):
            if ref[1:] and ref[1:] not in (ids_of(page) or set()):
                bad.append(f"{rel}: missing in-page anchor {ref}")
            continue
        fs = resolve(ref, page)
        if not os.path.exists(fs):
            bad.append(f"{rel}: broken {ref}  (-> {os.path.relpath(fs, repo)})")
            continue
        if "#" in ref and fs.endswith(".html"):
            anchor = ref.split("#", 1)[1]
            tids = ids_of(fs)
            if tids is not None and anchor not in tids:
                bad.append(f"{rel}: missing anchor {ref}")

print(f"checked {len(pages)} pages in {os.path.basename(repo)}")
if bad:
    print("BROKEN:\n" + "\n".join("  " + b for b in bad))
    sys.exit(1)
print("OK: all local assets, links and anchors resolve")
