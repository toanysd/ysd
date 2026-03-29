import re

with open('g:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.6.css', 'r', encoding='utf-8') as f:
    text = f.read()

# Make all dp-action-btn row-oriented and compact
# Remove existing flex-direction: column or row overrides
text = re.sub(r'flex-direction:\s*column\s*!important;', 'flex-direction: row !important;', text)
text = re.sub(r'min-height:\s*52px\s*!important;', 'min-height: 36px !important;', text)
text = re.sub(r'min-height:\s*48px\s*!important;', 'min-height: 36px !important;', text)
text = re.sub(r'min-height:\s*40px\s*!important;', 'min-height: 36px !important;', text)
text = re.sub(r'padding:\s*8px\s*4px\s*!important;', 'padding: 4px 6px !important;', text)
text = re.sub(r'padding:\s*6px\s*6px\s*!important;', 'padding: 4px 6px !important;', text)

# Reduce icon size
text = re.sub(r'font-size:\s*16px\s*!important;', 'font-size: 14px !important;', text)
text = re.sub(r'font-size:\s*18px\s*!important;', 'font-size: 14px !important;', text)

# For .dp-actions-grid make sure it is 3 columns
text = re.sub(r'grid-template-columns:\s*1fr\s*1fr\s*!important;', 'grid-template-columns: repeat(3, 1fr) !important;', text)

with open('g:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.6.css', 'w', encoding='utf-8') as f:
    f.write(text)
