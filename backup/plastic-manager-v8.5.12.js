/* plastic-manager-v8.5.12.js */

(function() {
    'use strict';

    // UI State
    var state = {
        isOpen: false,
        activeTab: 'inventory', // 'inventory', 'inbound', 'mapping'
        materials: [],
        variants: [], 
        stock: []
    };

    // DOM Elements
    var el = {
        root: null,
        mainContainer: null,
        tabs: null,
        panels: {}
    };

    // ==========================================
    // Core Utilities (Fuzzy String Match)
    // ==========================================
    function getLevenshteinDistance(str1, str2) {
        var track = Array(str2.length + 1).fill(null).map(() =>
            Array(str1.length + 1).fill(null)
        );
        for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
        for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;
        for (let j = 1; j <= str2.length; j += 1) {
            for (let i = 1; i <= str1.length; i += 1) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1,
                    track[j - 1][i - 1] + indicator
                );
            }
        }
        return track[str2.length][str1.length];
    }
    
    function getSimilarityScore(s1, s2) {
        var longer = s1;
        var shorter = s2;
        if (s1.length < s2.length) { longer = s2; shorter = s1; }
        var longerLength = longer.length;
        if (longerLength == 0) return 1.0;
        var distance = getLevenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
        return (longerLength - distance) / parseFloat(longerLength);
    }

    // ==========================================
    // Supabase APIs
    // ==========================================
    var _sbClient = null;

    var api = {
        check: function() {
            if (_sbClient) return _sbClient;
            
            var cfg = window.MCSupabaseConfig || (window.SupabaseConfig ? window.SupabaseConfig.get() : null);
            if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
                alert('Vui lòng cấu hình kết nối Supabase trước.');
                return null;
            }
            if (!window.supabase) {
                alert('Lỗi: Chưa tải được thư viện Supabase JS.');
                return null;
            }
            _sbClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
            return _sbClient;
        },
        fetchMaterials: async function(sb) {
            var { data, error } = await sb.from('plastic_material').select('*');
            if (error) { console.error(error); return []; }
            return data || [];
        },
        // More APIs later
    };

    // ==========================================
    // UI Builders
    // ==========================================
    function createStructure() {
        var containerElem = document.getElementById('plasticManagerRoot');
        if(!containerElem) return;

        containerElem.innerHTML = `
            <div class="plastic-wrapper">
                <div class="plastic-header">
                    <div class="plastic-title">
                        <i class="fas fa-prescription-bottle" style="color: #3b82f6;"></i>
                        <div>
                            <span class="ja">プラスチック管理</span>
                            <span class="vi" style="font-size:12px; color:#64748b; margin-left:8px;">Quản lý cuộn/hạt nhựa</span>
                        </div>
                    </div>
                </div>

                <div class="plastic-tabs" id="plasticTabs">
                    <button class="plastic-tab active" data-tab="inventory">
                        <i class="fas fa-boxes"></i> 
                        <span class="ja">在庫</span> <span class="vi">Tồn kho</span>
                    </button>
                    <button class="plastic-tab" data-tab="inbound">
                        <i class="fas fa-truck-loading"></i>
                        <span class="ja">入庫</span> <span class="vi">Nhập kho</span>
                    </button>
                    <button class="plastic-tab" data-tab="outbound">
                        <i class="fas fa-cut"></i>
                        <span class="ja">使用・出庫</span> <span class="vi">Báo cáo Cắt</span>
                    </button>
                    <button class="plastic-tab" data-tab="mapping">
                        <i class="fas fa-magic"></i>
                        <span class="ja">マッピング</span> <span class="vi">Fuzzy Map</span>
                    </button>
                </div>

                <div class="plastic-panels">
                    <div id="panel-inventory" class="plastic-panel active">
                        <div class="plastic-loader"><i class="fas fa-circle-notch fa-spin"></i> データを読み込み中...</div>
                    </div>
                    <div id="panel-inbound" class="plastic-panel"></div>
                    <div id="panel-outbound" class="plastic-panel"></div>
                    <div id="panel-mapping" class="plastic-panel"></div>
                </div>
            </div>
        `;

        el.root = containerElem;
        el.tabs = containerElem.querySelectorAll('.plastic-tab');
        el.panels.inventory = containerElem.querySelector('#panel-inventory');
        el.panels.inbound = containerElem.querySelector('#panel-inbound');
        el.panels.outbound = containerElem.querySelector('#panel-outbound');
        el.panels.mapping = containerElem.querySelector('#panel-mapping');

        // Bắt sự kiện chuyển tab
        el.tabs.forEach(t => {
            t.addEventListener('click', function(e) {
                var tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
    }

    function switchTab(tabId) {
        state.activeTab = tabId;
        el.tabs.forEach(t => t.classList.remove('active'));
        var activeTabBtn = document.querySelector('.plastic-tab[data-tab="'+tabId+'"]');
        if(activeTabBtn) activeTabBtn.classList.add('active');

        Object.keys(el.panels).forEach(k => {
            el.panels[k].classList.remove('active');
        });
        if(el.panels[tabId]) el.panels[tabId].classList.add('active');

        if(tabId === 'inventory') {
            loadInventoryData();
        } else if (tabId === 'inbound') {
            loadInboundData();
        } else if (tabId === 'outbound') {
            loadOutboundData();
        } else if (tabId === 'mapping') {
            loadMappingData();
        }
    }

    // ==========================================
    // Fetch Data & Render Logic
    // ==========================================
    async function loadInventoryData() {
        var sb = api.check();
        if(!sb) return;
        el.panels.inventory.innerHTML = '<div class="plastic-loader"><i class="fas fa-circle-notch fa-spin"></i> Loading Database...</div>';
        
        // Demo logic cho Đề án: Truy vấn bảng plastic_stock
        var { data, error } = await sb.from('plastic_stock').select('*, supplier_code:supplier_code_id(supplier_product_code, material_id(material_code))').order('created_at', {ascending: false});
        
        if (error) {
            el.panels.inventory.innerHTML = '<div style="color:red">Error: ' + error.message + '</div>';
            return;
        }

        if(!data || data.length === 0) {
            el.panels.inventory.innerHTML = '<div style="padding: 20px; text-align: center; color:#64748b;">Chưa có dữ liệu tồn kho.</div>';
            return;
        }

        var html = '<div class="plastic-inventory-grid">';
        data.forEach(item => {
            var rawMeters = parseFloat(item.total_meters_received) - parseFloat(item.meters_used || 0);
            var mpr = parseFloat(item.meters_per_roll || 100);
            
            // LOGIC TÍNH CUỘN + MÉT LẺ THEO ĐỀ ÁN
            var fullRolls = Math.floor(rawMeters / mpr);
            var partialMeters = rawMeters % mpr;

            html += `
            <div class="plastic-card">
                <div class="plastic-card-header">
                    <div>
                        <div class="plastic-card-title">${item.lot_number}</div>
                        <div class="plastic-card-subtitle">Mã: ${item.supplier_code ? item.supplier_code.supplier_product_code : 'N/A'}</div>
                    </div>
                </div>
                <div class="plastic-stock-info">
                    <div class="plastic-stock-value">
                        <span class="num">${fullRolls}</span>
                        <span class="label">Cuộn nguyên</span>
                    </div>
                    <div style="color:#cbd5e1; font-weight:300; font-size:24px;">+</div>
                    <div class="plastic-stock-value" style="text-align:right;">
                        <span class="num" style="color:#8b5cf6;">${partialMeters.toFixed(1)}m</span>
                        <span class="label">Lẻ dở dang</span>
                    </div>
                </div>
                <div style="font-size:12px; color:#475569; text-align:center; background:#f1f5f9; padding:4px; border-radius:4px;">
                    Tổng: <b>${rawMeters.toFixed(1)}m</b> (Định mức: ${mpr}m/cuộn)
                </div>
            </div>`;
        });
        html += '</div>';
        el.panels.inventory.innerHTML = html;
    }

    function loadInboundData() {
        el.panels.inbound.innerHTML = `
            <div style="padding: 20px;">
                <div style="max-width:650px; margin: 0 auto; background:#fff; padding:30px; border-radius:12px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <h3 style="font-size:18px; margin-bottom:20px; color:#1e293b;"><i class="fas fa-barcode"></i> Nhập Kho Cuộn Nhựa (Inbound Scan)</h3>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <label style="font-weight: bold; display: block; margin-bottom: 8px; color: #3b82f6;">1. Quét Mã Vạch Nhà Cung Cấp (OEM Barcode)</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="scanSupplierCode" class="plastic-form-input" placeholder="VD: NCC01-PP-100" style="flex:1; font-size: 16px; padding: 10px; font-family: monospace;">
                            <button class="plastic-btn" style="background: #3b82f6; width: auto;"><i class="fas fa-search"></i> Tra cứu (Enter)</button>
                        </div>
                        <div id="supplierInfoRes" style="margin-top: 10px; font-size: 13px; color: #64748b;"><i>Chưa quét mã. Đưa súng quét qua Barcode NSX để Auto-Fill vật liệu...</i></div>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <label style="font-weight: bold; display: block; margin-bottom: 8px; color: #8b5cf6;">2. Thông Số Lô Kệ Nhập</label>
                        <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                            <div style="flex:1;">
                                <label style="font-size: 12px; color: #64748b;">Số Cuộn (Rolls)</label>
                                <input type="number" id="inboundRolls" class="plastic-form-input" placeholder="Nhập SL cuộn" style="font-size: 16px;">
                            </div>
                            <div style="flex:1;">
                                <label style="font-size: 12px; color: #64748b;">Độ Dài Gốc (m/cuộn)</label>
                                <input type="number" id="inboundMeters" class="plastic-form-input" placeholder="200" value="200" style="font-size: 16px;">
                            </div>
                            <div style="flex:1;">
                                <label style="font-size: 12px; color: #64748b;">Số PO (Supplier Lot)</label>
                                <input type="text" id="inboundLot" class="plastic-form-input" placeholder="LOT-NSX001" style="font-size: 14px; text-transform: uppercase;">
                            </div>
                        </div>
                    </div>

                    <button class="plastic-btn" id="btnSubmitInbound" style="width:100%; justify-content:center; background: #10b981; font-size: 16px; padding: 15px;">
                        <i class="fas fa-box-open"></i> Ghi Nhận Nhập Kho & Khởi tạo Mã Cuộn Nội Bộ
                    </button>
                    
                    <div id="inboundSuccess" style="margin-top: 20px; display: none; background: #ecfdf5; color: #059669; padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0;">
                        <h4 style="margin-bottom: 10px; font-size: 15px;"><i class="fas fa-check-circle"></i> Đã tạo n Cuộn Nội Bộ thành công!</h4>
                        <p style="font-size: 13px; margin-bottom: 8px;">Vui lòng dùng bút/máy in dán các mã sau lên lõi từng cuộn:</p>
                        <div id="inboundRollTags" style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <!-- Dynamically Generated Rolls -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function loadOutboundData() {
        el.panels.outbound.innerHTML = `
            <div style="padding: 20px;">
                <div style="max-width:650px; margin: 0 auto; background:#fff; padding:30px; border-radius:12px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <h3 style="font-size:18px; margin-bottom:20px; color:#1e293b;"><i class="fas fa-cut"></i> Báo Cáo Cắt Dở Dang (Outbound Usage)</h3>
                    
                    <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a; margin-bottom: 20px;">
                        <label style="font-weight: bold; display: block; margin-bottom: 8px; color: #d97706;">1. Quét Mã Cuộn Nội Bộ Đang Cắt (ROLL-ID)</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="scanRollCode" class="plastic-form-input" placeholder="VD: ROLL-2026-001" style="flex:1; font-size: 18px; padding: 12px; font-family: monospace; text-transform: uppercase;">
                            <button class="plastic-btn" style="background: #f59e0b; width: auto;"><i class="fas fa-search"></i> Truy Vấn Tồn (Enter)</button>
                        </div>
                        <div id="rollInfoRes" style="margin-top: 10px; font-size: 13px; color: #92400e;">
                            <i>Cầm máy quét mã dán trên Core cuộn để hiện thị số mét còn lại đang lỡ dở ở trong kho...</i>
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <label style="font-weight: bold; display: block; margin-bottom: 8px; color: #475569;">2. Thông Số Trừ Mòn Sau Khi Máy Dừng</label>
                        <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                            <div style="flex:1;">
                                <label style="font-size: 12px; color: #64748b;">Mã Chỉ Thị (Job ID / Máy Dập)</label>
                                <input type="text" id="outboundJobId" class="plastic-form-input" placeholder="VD: JOB-1061" style="font-size: 14px;">
                            </div>
                            <div style="flex:1;">
                                <label style="font-size: 12px; color: #ef4444; font-weight: bold;">Số Mét Đã Cắt Tiêu Hao</label>
                                <div style="position: relative;">
                                    <input type="number" id="outboundMeters" class="plastic-form-input" placeholder="0.0" style="font-size: 18px; color: #ef4444; font-weight: bold; padding-right: 30px;">
                                    <span style="position: absolute; right: 10px; top: 12px; color: #94a3b8; font-weight: bold;">m</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="plastic-btn" id="btnSubmitOutbound" style="width:100%; justify-content:center; background: #ef4444; font-size: 16px; padding: 15px;">
                        <i class="fas fa-minus-circle"></i> Trừ Phôi Cuộn Này & Lưu Log Tồn Kho (Dở Dang)
                    </button>
                    
                    <div id="outboundSuccess" style="margin-top: 15px; display: none; font-size: 14px; background: #eff6ff; color: #1e40af; padding: 10px; border-radius: 6px; text-align: center; border: 1px solid #bfdbfe;">
                        Đã khấu trừ thành công <strong id="outboundResultMeters">50m</strong>. Cuộn <strong id="outboundResultRoll">ROLL-001</strong> hiện còn <strong id="outboundResultLeft" style="color:#ef4444;">150m</strong>.
                    </div>
                </div>
            </div>
        `;
    }

    async function loadMappingData() {
        el.panels.mapping.innerHTML = `
            <div style="padding: 20px;">
                <h3 style="margin-bottom: 20px; font-size: 18px;"><i class="fas fa-magic"></i> Mapping Dữ Liệu & Import CSV</h3>
                
                <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px; color: #f59e0b;"><i class="fas fa-exclamation-triangle"></i> Khu vực Migrate Data Cấu Hình Ban Đầu</h4>
                    <p style="font-size: 13px; color: #64748b; margin-bottom: 5px;">Chỉ sử dụng công cụ này 1 lần duy nhất để đẩy dữ liệu từ 2 file <b>plastics.csv</b> và <b>plastics_chithisanxuat.csv</b> lên hệ thống Supabase trống.</p>
                    <div style="margin-bottom: 15px;">
                        <label style="font-size: 13px; font-weight: bold;">Mã hoá file (Encoding): </label>
                        <select id="csvEncoding" class="plastic-form-input" style="width: 200px; display: inline-block; padding: 5px;">
                            <option value="UTF-8">UTF-8 (Mặc định)</option>
                            <option value="Shift_JIS">Shift_JIS (Excel Nhật cũ)</option>
                        </select>
                    </div>

                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <div style="flex:1; min-width: 250px; background: #f8fafc; padding: 15px; border-radius: 8px;">
                            <label style="font-weight: bold; display: block; margin-bottom: 8px;">1. Bảng Nhựa Chuẩn (plastics.csv)</label>
                            <input type="file" id="filePlasticMaterial" accept=".csv" style="margin-bottom: 10px; width: 100%;">
                            <button class="plastic-btn" id="btnImportMaterial" style="background: #3b82f6; width: 100%;"><i class="fas fa-upload"></i> Xử lý & Đẩy lên plastic_material</button>
                        </div>
                        <div style="flex:1; min-width: 250px; background: #f8fafc; padding: 15px; border-radius: 8px;">
                            <label style="font-weight: bold; display: block; margin-bottom: 8px;">2. Text Chỉ Thị (plastics_chithisanxuat.csv)</label>
                            <input type="file" id="filePlasticText" accept=".csv" style="margin-bottom: 10px; width: 100%;">
                            <button class="plastic-btn" id="btnImportText" style="background: #8b5cf6; width: 100%;"><i class="fas fa-upload"></i> Xử lý & Đẩy lên plastic_text_variant</button>
                        </div>
                    </div>
                    <div id="importLog" style="margin-top: 15px; font-size: 12px; font-family: monospace; background: #1e293b; color: #10b981; padding: 15px; border-radius: 8px; max-height: 250px; overflow-y: auto; display: none;"></div>
                </div>
            </div>
        `;

        setTimeout(() => {
            document.getElementById('btnImportMaterial')?.addEventListener('click', handleImportMaterial);
            document.getElementById('btnImportText')?.addEventListener('click', handleImportTextVariant);
        }, 100);
    }

    // --- CÔNG CỤ IMPORT LOGGER ---
    function appendImportLog(msg) {
        var logEl = document.getElementById('importLog');
        if(!logEl) return;
        logEl.style.display = 'block';
        logEl.innerHTML += '<div>> ' + msg + '</div>';
        logEl.scrollTop = logEl.scrollHeight;
    }

    // --- PARSER ---
    function parseCSVLine(text) {
        let rows = text.split(/\r?\n/);
        let result = [];
        if(rows.length === 0) return result;
        let headers = rows[0].split(',').map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));
        for(let i=1; i<rows.length; i++) {
            if(!rows[i].trim()) continue;
            // Parse by comma, but ignore commas inside quotes
            let matches = rows[i].match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
            if(!matches) continue;
            let cols = matches.map(m => m.replace(/^,/, '').replace(/^"/, '').replace(/"$/, '').trim());
            
            let obj = {};
            headers.forEach((h, idx) => obj[h] = cols[idx] ? cols[idx] : "");
            result.push(obj);
        }
        return result;
    }

    async function handleImportMaterial() {
        var fileInput = document.getElementById('filePlasticMaterial');
        var encoding = document.getElementById('csvEncoding') ? document.getElementById('csvEncoding').value : 'UTF-8';
        if(!fileInput.files || fileInput.files.length === 0) return alert("Chưa chọn file plastics.csv");
        
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = async function(e) {
            var rawText = e.target.result;
            var data = parseCSVLine(rawText);
            appendImportLog("Đã đọc " + data.length + " dòng cấu trúc plastics.csv");
            
            // Map Schema vào plastic_material MỚI CHI TIẾT
            var insertPayload = data.map(row => {
               var rawType = row['TypeVL'] || row['NhaSXVL'] || ''; 
               var tText = row['T'] || '';
               var wText = row['W'] || '';
               var lText = row['L'] || '';
               
               // Sinh Mã Định Danh (Hiển thị UI)
               var wPart = wText ? 'x' + wText : '';
               var lPart = lText ? 'x' + lText : '';
               var code = (rawType + ' ' + tText + wPart + lPart).trim().replace(/ +/g, ' ');
               if(code === '') code = 'RAW_' + Math.random().toString(36).substring(2, 6);

               // 1. Phân Loại Danh Mục Nhựa (PP, PS, PET...)
               var category = null;
               var upperType = rawType.toUpperCase();
               if(upperType.indexOf('PS') !== -1 || upperType.indexOf('PST') !== -1) category = 'PS';
               else if(upperType.indexOf('PP') !== -1) category = 'PP';
               else if(upperType.indexOf('PET') !== -1 || upperType.indexOf('APET') !== -1) category = 'PET';
               else if(upperType.indexOf('PVC') !== -1) category = 'PVC';

               // 2. Nhận Diện Màu Sắc (Nhật Mặc định)
               var color = null;
               if(upperType.indexOf('(N)') !== -1 || upperType.indexOf('ナチュラル') !== -1) color = 'ナチュラル';
               else if(upperType.indexOf('(CL)') !== -1 || upperType.indexOf('透明') !== -1) color = '透明';
               else if(upperType.indexOf('(B)') !== -1 || upperType.indexOf('黒') !== -1) color = '黒';
               else if(upperType.indexOf('(G)') !== -1 || upperType.indexOf('緑') !== -1) color = '緑';
               else if(upperType.indexOf('茶') !== -1 || upperType.indexOf('TB') !== -1) color = '茶';

               // 3. Ép Kiểu Chỉ Số Vật Lý (Numeric)
               var tNum = parseFloat(tText);
               var wNum = parseFloat(wText);
               var lNum = parseFloat(lText);

               // 4. Các Loại Đặc Tính & Hoá Chất
               var isAntiStatic = (row['ThanhPhanAN'] || '').toUpperCase() === 'TRUE';
               var isSilicon = (row['ThanhPhanSI'] || '').toUpperCase() === 'TRUE';
               var isConductive = (upperType.indexOf('導電') !== -1 || upperType.indexOf('ミクロム') !== -1);
               
               // 5. Ghi chú Râu ria
               var featureNote = [row['ghichuVl'], row['GroupVL']].filter(x => x).join(' | ');

               return {
                   material_code: code,
                   material_category: category,
                   color: color,
                   thickness: isNaN(tNum) ? null : tNum,
                   width: isNaN(wNum) ? null : wNum,
                   length: isNaN(lNum) ? null : lNum,
                   anti_static: isAntiStatic,
                   silicon_coating: isSilicon,
                   conductive: isConductive,
                   manufacturer: row['NhaSXVL'] || null,
                   feature_note: featureNote || null
               };
            });

            // Lọc trùng theo material_code (Unique Constraint trong DB)
            var uniquePayload = [];
            var codeSet = new Set();
            for(var item of insertPayload) {
                if(!codeSet.has(item.material_code)) {
                    codeSet.add(item.material_code);
                    uniquePayload.push(item);
                }
            }
            appendImportLog("Sau khi chuẩn hóa mã trùng nhau: " + uniquePayload.length + " mã VL duy nhất.");
            
            var sb = api.check();
            if(!sb) return;
            
            appendImportLog("♻️ Đang Bắn dữ liệu lên Supabase bảng <b>plastic_material</b>... Vui lòng không tắt máy.");
            
            let chunkSize = 50;
            let successCount = 0;
            for (let i = 0; i < uniquePayload.length; i += chunkSize) {
                const chunk = uniquePayload.slice(i, i + chunkSize);
                const { data: ret, error } = await sb.from('plastic_material').insert(chunk).select();
                if (error) {
                    if(error.code === '23505') {
                        appendImportLog("<span style='color:#f59e0b'>Cảnh báo: Lô " + i + " có chứa mã đã tồn tại (Skip).</span>");
                    } else {
                        appendImportLog("<span style='color:#ef4444'>❌ Lỗi Insert Chunk " + i + ": " + error.message + "</span>");
                    }
                } else {
                    successCount += chunk.length;
                    appendImportLog("✅ Đã ghi thành công khối " + successCount + " / " + uniquePayload.length);
                }
            }
            appendImportLog("🎉 <b>HOÀN TẤT IMPORT BẢNG VẬT LIỆU CHUẨN!</b>");
        };
        reader.readAsText(file, encoding);
    }

    async function handleImportTextVariant() {
        var fileInput = document.getElementById('filePlasticText');
        var encoding = document.getElementById('csvEncoding') ? document.getElementById('csvEncoding').value : 'UTF-8';
        if(!fileInput.files || fileInput.files.length === 0) return alert("Chưa chọn file plastics_chithisanxuat.csv");
        
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = async function(e) {
            var rawText = e.target.result;
            var lines = rawText.split(/\r?\n/);
            appendImportLog("Đã đọc tổng cộng " + lines.length + " dòng biến thể, Đang Extract Text...");
            
            // Lọc các bản sao duy nhất
            var textSet = new Set();
            for(let i = 1; i < lines.length; i++) { // Bỏ qua Header mẫu
                let line = lines[i];
                if(!line.trim()) continue;
                
                // Trích xuất Chuỗi Text cột 1 và loại bỏ nháy đôi / phẩy thừa đằng sau
                let matches = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/g);
                if(matches && matches.length > 0) {
                    // Lấy Cột 1
                    let firstCol = matches[0].replace(/^,/, '').replace(/^"/, '').replace(/"$/, '').trim();
                    if(firstCol) textSet.add(firstCol);
                }
            }
            
            var uniqueList = Array.from(textSet);
            appendImportLog("🪄 Khám phá ra " + uniqueList.length + " chuỗi Unique Text. Đang tải lên <b>plastic_text_variant</b>...");
            
            var sb = api.check();
            if(!sb) return;
            
            var insertPayload = uniqueList.map(t => ({ text_value: t, is_verified: false }));
            
            let chunkSize = 50;
            let successCount = 0;
            for (let i = 0; i < insertPayload.length; i += chunkSize) {
                const chunk = insertPayload.slice(i, i + chunkSize);
                const { data: ret, error } = await sb.from('plastic_text_variant').insert(chunk);
                if (error) {
                    if(error.code === '23505') {
                        appendImportLog("<span style='color:#f59e0b'>ℹ Lô " + i + " bỏ qua các chuỗi Text đã tồn tại.</span>");
                    } else {
                        appendImportLog("<span style='color:#ef4444'>❌ Lỗi Insert: " + error.message + "</span>");
                    }
                } else {
                    successCount += chunk.length;
                    appendImportLog("✅ Đã ghi thành công chuỗi " + successCount + " / " + insertPayload.length);
                }
            }
            appendImportLog("🎉 <b>HOÀN TẤT IMPORT CHUỖI VĂN BẢN (TEXT VARIANTS)!</b>");
        };
        reader.readAsText(file, encoding);
    }


    // ==========================================
    // Public API Methods
    // ==========================================
    window.PlasticManager = {
        init: function() {
            // Wait until HTML exists
        },
        open: function() {
            var containerElem = document.getElementById('plasticManagerRoot');
            if(!containerElem) {
                // Try to initialize view if not ready
                console.error("DOM #plasticManagerRoot không tồn tại");
                return;
            }
            if(!el.root) {
                createStructure(); 
            }
            
            // View Controller (Giới hạn của module cũ, ta ép kiểu đăng ký động)
            if(window.ViewManager) {
                if(!window.ViewManager.views['plastic']) {
                    window.ViewManager.views['plastic'] = document.getElementById('mcs-view-plastic');
                    window.ViewManager.navs['plastic'] = document.getElementById('sidebarPlasticManagerBtn');
                }
                window.ViewManager.switchView('plastic');
            } else {
                // Fallback direct
                document.querySelectorAll('.content-area').forEach(c => c.style.display = 'none');
                document.getElementById('mcs-view-plastic').style.display = 'block';
            }
            
            state.isOpen = true;
            switchTab(state.activeTab);

            // Close sidebar for mobile responsive
            var sb = document.getElementById('sidebar');
            if(sb && sb.classList.contains('open')) {
                sb.classList.remove('open');
            }
            var backdrop = document.getElementById('backdrop');
            if(backdrop) backdrop.classList.remove('show');
        }
    };

})();
