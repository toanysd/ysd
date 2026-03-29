import sys
import re
import os

print(f"Current working directory: {os.getcwd()}")

# Fix detail-panel-v8.6.17.js
try:
    with open('detail-panel-v8.6.16.js', 'r', encoding='utf-8') as f:
        js = f.read()

    js = re.sub(r'<button class="detail-tab"[^>]*data-tab="extended"[^>]*>.*?</button>', '', js, flags=re.DOTALL)
    js = re.sub(r'<div class="detail-tab-content" data-tab-content="extended"></div>', '', js)
    js = re.sub(r"if \(target === 'storage'\) \{.*?tab = 'extended';\s*\}", "if (target === 'storage') { tab = 'info'; }", js, flags=re.DOTALL)
    js = js.replace("let tab = 'extended'; // Mặc định mở tab extended", "let tab = 'info'; // Mặc định mở tab info")
    js = re.sub(r"// Scroll specifically for extended groupings.*?if \(tab === 'extended'\) \{.*?\}, 300\);\n\s*\}", "", js, flags=re.DOTALL)
    js = re.sub(r"case 'extended':.*?(?=\s+case|\s+default|\s+\}\s*$)", "", js, flags=re.DOTALL)
    js = re.sub(r"// TAB 9: EXTENDED \(only CSV data\).*?(?=\/\/ =====================================================================\r?\n\s*\/\/ DATA HELPERS)", "", js, flags=re.DOTALL)

    with open('detail-panel-v8.6.17.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print('JS fixed')
except Exception as e:
    print('JS err:', e)

# Fix detail-panel-v8.6.27.css
try:
    with open('detail-panel-v8.6.26.css', 'r', encoding='utf-8') as f:
        css = f.read()
    
    css = re.sub(r'#detailPanel\.detail-tab\[data-tab="extended"\] i \{.*?\r?\n?', '', css)

    with open('detail-panel-v8.6.27.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('CSS fixed')
except Exception as e:
    print('CSS err:', e)

# Fix index.html
try:
    # Read from the raw backup copied by Copy-Item initially
    with open('index-v8.6.0.html', 'r', encoding='utf-8') as f:
        html = f.read()

    html = html.replace('detail-panel-v8.6.16.js', 'detail-panel-v8.6.17.js')
    html = html.replace('detail-panel-v8.6.26.css', 'detail-panel-v8.6.27.css')
    html = re.sub(r'(?m)^\s*<link rel="stylesheet" href="extended-editor-v8\.5\.3-6\.css">\s*\n?', '', html)
    html = re.sub(r'(?m)^\s*<script src="dp-extended-editor-v8\.5\.3-6\.js"></script>\s*\n?', '', html)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('HTML fixed')
except Exception as e:
    print('HTML err:', e)
