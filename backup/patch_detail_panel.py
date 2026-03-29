import os
import shutil
import re

dir_path = r"g:\AntiGravity\MoldCutterSearch"
old_js = os.path.join(dir_path, "detail-panel-v8.6.10.js")
new_js = os.path.join(dir_path, "detail-panel-v8.6.11.js")

old_css = os.path.join(dir_path, "detail-panel-v8.6.11.css")
new_css = os.path.join(dir_path, "detail-panel-v8.6.12.css")

old_html_ver = os.path.join(dir_path, "index-v8.5.51.html")
new_html_ver = os.path.join(dir_path, "index-v8.5.52.html")
master_html = os.path.join(dir_path, "index.html")

def read_file(path):
    for enc in ['utf-8', 'utf-8-sig', 'utf-16']:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read(), enc
        except UnicodeDecodeError:
            pass
        except FileNotFoundError:
            return None, None
    raise Exception(f"Cannot decode {path}")

def write_file(path, content, enc):
    if not content: return
    with open(path, 'w', encoding=enc) as f:
        f.write(content)

js_content, js_enc = read_file(old_js)
css_content, css_enc = read_file(old_css)
html_content, html_enc = read_file(old_html_ver)

if not js_content: exit()

# 1. Patch JS
js_content = js_content.replace(
    "const VERSION = 'v8.4.3-6-1';", 
    "const VERSION = 'v8.4.3-6-2';"
)

js_content = js_content.replace('padding:6px 4px; gap:8px;', 'padding:3px 4px; gap:4px;')
js_content = js_content.replace('font-size:18px;', 'font-size:15px;')
js_content = js_content.replace('font-size:11px; font-weight:700;', 'font-size:10.5px; font-weight:700;')
js_content = js_content.replace('font-size:9.5px; color:#64748b; line-height:1.1;', 'font-size:9px; color:#64748b; line-height:1.1; letter-spacing:-0.2px;')

# Quick access:
qacc_orig = 'style="display:flex;flex-direction:row;align-items:center;text-align:left;gap:6px;padding:6px;"'
qacc_new = 'style="display:flex;flex-direction:row;align-items:center;text-align:left;gap:4px;padding:3px 4px;"'
js_content = js_content.replace(qacc_orig, qacc_new)

# name badge: using regex
namebadge_pattern = r"(const nameBadge = `[\s\S]*?)(<div style=\"font-size: 16px; font-weight: 800; color:#0f172a; line-height: )1\.2(;?\">\s*\$\{isMold[\s\S]*?\})\s*\$\{itemName\}\s*(</div>)\s*`;"
namebadge_repl = r"\g<1>\g<2>1.4; display: flex; align-items: center; gap: 8px\g<3>\n           <span style=\"display:inline-flex; align-items:center; gap: 6px; flex-wrap: wrap;\">\n             ${itemName} \n             ${itemType && itemType !== '-' ? `<span style=\"font-size: 11px; font-weight: 700; padding: 1px 5px; background: #f1f5f9; color: #475569; border-radius: 4px; border: 1px solid #e2e8f0; line-height: 1.25;\">${itemType}</span>` : ''}\n           </span>\n        \g<4>\n      `;"
js_content = re.sub(namebadge_pattern, namebadge_repl, js_content)

# Remove row2
row2_pat = r"const row2 = \[ \{ label: this\.biLabel\('タイプ', 'Kiểu'\), rawValue: itemType, customClass: 'type-row' \} \];\s*"
js_content = re.sub(row2_pat, "", js_content)

# Remove row2 from renderGrid
rgrid_pat = r"\$\{renderGrid\(row2, 'row-1col'\)\}\s*"
js_content = re.sub(rgrid_pat, "", js_content)

write_file(new_js, js_content, js_enc)


# 2. Patch CSS
if css_content:
    css_patch_from = "grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)) !important; gap: 6px !important; align-items: start;"
    css_patch_to = "grid-template-columns: repeat(3, 1fr) !important; gap: 4px !important; align-items: stretch;"
    css_content = css_content.replace(css_patch_from, css_patch_to)

    btn_old = "aspect-ratio: auto !important; height: auto !important; min-height: 44px; justify-content: flex-start; padding: 6px 8px !important;"
    btn_new = "aspect-ratio: auto !important; height: auto !important; min-height: 38px; justify-content: flex-start; padding: 3px 6px !important; width: 100%;"
    css_content = css_content.replace(btn_old, btn_new)

    write_file(new_css, css_content, css_enc)


# 3. Patch HTML
def patch_html(filepath):
    if not os.path.exists(filepath): return
    content, enc = read_file(filepath)
    if not content: return
    content = content.replace('detail-panel-v8.6.10.js', 'detail-panel-v8.6.11.js')
    content = content.replace('detail-panel-v8.6.11.css', 'detail-panel-v8.6.12.css')
    content = content.replace('v=8.6.10', 'v=8.6.11')
    write_file(filepath, content, enc)

patch_html(new_html_ver)
patch_html(master_html)

print("SUCCESS: Regex replaced correctly.")
