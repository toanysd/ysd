import codecs, re, sys
file_path = "f:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.15.js"

with codecs.open(file_path, "r", "utf-8-sig") as f:
    text = f.read()

# Xóa thẻ button Analytics (Thống kê)
text = re.sub(r'[ \t]*<button class="detail-tab" data-tab="analytics".*?</button>\r?\n?', '', text, flags=re.DOTALL|re.IGNORECASE)

# Xóa đoạn case 'analytics'
text = re.sub(r'[ \t]*case \'analytics\':[^\n]*\r?\n?', '', text)

with codecs.open(file_path, "w", "utf-8-sig") as f:
    f.write(text)

print("Done removing analytics tab")
