import codecs
import re

def patch_file(fname):
    print(f"Patching {fname}...")
    try:
        with codecs.open(fname, 'r', 'utf-8') as f:
            content = f.read()
    except Exception as e:
        with codecs.open(fname, 'r', 'utf-16') as f:
            content = f.read()
            
    content = content.replace('detail-panel-v8.6.5', 'detail-panel-v8.6.6')
    content = content.replace('v8.5.46', 'v8.5.47')
    with codecs.open(fname, 'w', 'utf-8-sig') as f:
        f.write(content)

patch_file('g:/AntiGravity/MoldCutterSearch/index-v8.5.47.html')
patch_file('g:/AntiGravity/MoldCutterSearch/index.html')
print("Done patching.")
