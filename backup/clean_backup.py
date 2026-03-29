import os
import re
import shutil

cwd = r"f:/AntiGravity/MoldCutterSearch"
backup_dir = os.path.join(cwd, "backup")
if not os.path.exists(backup_dir):
    os.makedirs(backup_dir)

# Read latest index to find all resources
index_path = os.path.join(cwd, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract src and href
resources = set()
for match in re.finditer(r'(?:src|href)="([^"]+\.(?:js|css))"', content):
    resources.add(match.group(1))

# Keep latest versions of html like index.html and index-v8.5.63.html (max version)
html_files = [f for f in os.listdir(cwd) if f.startswith("index") and f.endswith(".html")]
def extract_version(fname):
    m = re.search(r'-v(\d+\.\d+\.\d+)', fname)
    if not m:
        return (0,0,0)
    return tuple(map(int, m.group(1).split('.')))

max_version = max([extract_version(f) for f in html_files if f != "index.html"] + [(0,0,0)])
max_html_file = f"index-v{max_version[0]}.{max_version[1]}.{max_version[2]}.html"
resources.add("index.html")
resources.add(max_html_file)

# The goal is to move OUTDATED files that match our patterns
# Only root files
patterns = ["app-", "checkin-checkout-", "data-manager-", "detail-panel-", "device-history-status-",
            "device-photo-store-", "dp-extended-editor-", "extended-editor-", "filter-core-", "filter-ui-",
            "global-assistive-touch-", "location-manager-", "location-move-", "mcs-color-design-", "mobile-navbar-",
            "notification-module-", "photo-manager-", "photo-upload-", "print-export-module-", "pull-to-refresh-",
            "qr-export-", "qr-scanner-", "quick-update-module-", "results-card-renderer-", "results-table-renderer-",
            "search-layout-mobile-", "search-module-", "styles-", "supabase-config-", "teflon-processing-", "tray-manager-", "view-manager-"]

moved = []
for file in os.listdir(cwd):
    filepath = os.path.join(cwd, file)
    if not os.path.isfile(filepath):
        continue
        
    # check if file matches one of our versioned patterns
    is_versioned = any(file.startswith(p) for p in patterns) or file.startswith("index-")
    
    if is_versioned and file not in resources:
        try:
            shutil.move(filepath, os.path.join(backup_dir, file))
            moved.append(file)
        except Exception as e:
            print(f"Error moving {file}: {e}")

print('Moved files:', len(moved))
print("Kept resources:")
for r in sorted(resources):
    print(r)
