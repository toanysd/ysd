import re
with open('detail-panel-v8.6.7.js', 'r', encoding='utf-8') as f:
    text = f.read()
target_code = "const rackLayerText = this.toCircledNumber(rackId)\n        ? `${this.toCircledNumber(rackId)}-${String(layerNum ?? '').trim() || '-'}`\n        : `${String(rackId ?? '').trim() || '-'}-${String(layerNum ?? '').trim() || '-'}`;"
new_code = "const rackLayerText = (rackId || layerNum) ? `${String(rackId ?? '').trim() || '-'}-${String(layerNum ?? '').trim() || '-'}` : '-';"

if target_code in text:
    text = text.replace(target_code, new_code)
elif target_code.replace('\n', '\r\n') in text:
    text = text.replace(target_code.replace('\n', '\r\n'), new_code)

with open('detail-panel-v8.6.7.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Done")
