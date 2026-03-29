import codecs

def process_file():
    in_file = 'f:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.14.js'
    out_file = 'f:/AntiGravity/MoldCutterSearch/detail-panel-v8.6.15.js'
    
    with codecs.open(in_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Wait, what if it was utf-8 with BOM? Let me just try utf-8 first.
    # Actually, Windows 1252 or Shift_JIS could be the culprit.
    # Let's read bytes and detect properly.
    
    with open(in_file, 'rb') as f:
        raw = f.read()
    
    try:
        content = raw.decode('utf-8')
    except:
        content = raw.decode('shift_jis', errors='ignore')

    # 1. Rename 'Liên quan' tab to '系統図' and 'Phả hệ'
    content = content.replace(
        '<span class="tab-label-ja">関連</span>',
        '<span class="tab-label-ja">系統図</span>'
    )
    content = content.replace(
        '<span class="tab-label-vi">Liên quan</span>',
        '<span class="tab-label-vi">Phả hệ</span>'
    )

    # 2. Delete Analytics button
    btn_str = '''          <button class="detail-tab" data-tab="analytics" type="button">
            <i class="fas fa-chart-line"></i>
            <span class="tab-label-ja">統計</span>
            <span class="tab-label-vi">Thống kê</span>
          </button>'''
    content = content.replace(btn_str, '')

    # 3. Delete case 'analytics' inside renderTabContent
    content = content.replace("case 'analytics': html = this.renderAnalyticsTab(); break;", "")

    # Save to out_file as utf-8 signature (BOM) to prevent any ts/vscode issues 
    # VSCode handles BOM perfectly.
    with open(out_file, 'w', encoding='utf-8-sig') as f:
        f.write(content)
        
    print("DONE 1")

    # Now for detail-panel-related-tab
    # Duplicate v8.5.3-5 to v8.5.3-6 and replace title
    in_rel = 'f:/AntiGravity/MoldCutterSearch/detail-panel-related-tab-v8.5.3-5.js'
    out_rel = 'f:/AntiGravity/MoldCutterSearch/detail-panel-related-tab-v8.5.3-6.js'
    with open(in_rel, 'rb') as f:
        raw_rel = f.read()
        
    try:
        content_rel = raw_rel.decode('utf-8')
    except:
        content_rel = raw_rel.decode('shift_jis')
        
    content_rel = content_rel.replace("var title = 'Vòng đời & Gắn kết';", "var title = 'ライフサイクル & 系統図 (Vòng đời & Phả hệ)';")
    
    # Also fix the inner HTML title since the JS filename changes
    content_rel = content_rel.replace("detail-panel-related-tab-v8.5.3-5.js", "detail-panel-related-tab-v8.5.3-6.js")
    
    with open(out_rel, 'w', encoding='utf-8-sig') as f:
        f.write(content_rel)
        
    print("DONE 2")

process_file()
