// content.js
(async function() {
  console.log('[Ekşi Map] content.js yüklendi!');
  
  // Ekşi Sözlük sayfasında mıyız?
  if (!window.location.hostname.includes('eksisozluk.com')) return;
  
  console.log('[Ekşi Map] Ekşi Sözlük sayfasındayız!');  // Buton ekle - Ana analiz butonu kompakt tasarım
  function addMapButton() {
    if (document.getElementById('eksi-map-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'eksi-map-btn';
    btn.innerText = '🧠 Analiz';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = 9999;
    btn.style.padding = '10px 16px';
    btn.style.background = '#007bff';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.fontWeight = '600';
    btn.style.fontSize = '14px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 8px rgba(0,123,255,0.3)';
    btn.style.transition = 'all 0.2s ease';
    btn.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    
    // Hover efekti
    btn.onmouseover = () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.boxShadow = '0 4px 12px rgba(0,123,255,0.4)';
    };
    btn.onmouseout = () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 2px 8px rgba(0,123,255,0.3)';
    };
    
    // Loading state
    btn.onclick = async () => {
      const originalText = btn.innerText;
      btn.innerText = '⏳ Analiz...';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      
      try {
        await onMapClick();
      } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    };
    
    document.body.appendChild(btn);
  }
  // Entry'leri topla (farklı selector'lar dene)
  function getEntries() {
    // Önce farklı selector'ları dene
    let entries = Array.from(document.querySelectorAll('li[data-id] .content'));
    if (!entries.length) {
      entries = Array.from(document.querySelectorAll('.entry .content'));
    }
    if (!entries.length) {
      entries = Array.from(document.querySelectorAll('#entry-item-list .content'));
    }
    if (!entries.length) {
      entries = Array.from(document.querySelectorAll('[data-id] .content'));
    }
    console.log('[Ekşi Map] Entry sayısı bulundu:', entries.length);
    return entries.map(e => e.innerText.trim()).filter(Boolean);
  }

  // Chunk'lama (paragraf bazlı, cümle bölmez)
  function chunkByParagraph(entryArray, maxLength = 2000) {
    const chunks = [];
    let current = "";
    for (let entry of entryArray) {
      if ((current + entry + "\n").length < maxLength) {
        current += entry + "\n";
      } else {
        if (current) chunks.push(current);
        current = entry + "\n";
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  // Tonu emoji ile göster
  function toneToEmoji(tone) {
    const map = {
      'öfkeli': '😡',
      'ironik': '😏',
      'nötr': '😐',
      'üzgün': '😢',
      'coşkulu': '🤩',
      'sarkastik': '🙃'
    };
    return map[tone?.toLowerCase()] || '';
  }  // Ton -> renk (güncel harita) - İyileştirilmiş renk paleti
  function toneToColor(tone) {
    const map = {
      'coşkulu': '#28a745', 'happy': '#28a745', 'mutlu': '#28a745', 'pozitif': '#28a745',
      'üzgün': '#6c757d', 'sad': '#6c757d', 'hüzünlü': '#6c757d',
      'sinirli': '#dc3545', 'kızgın': '#dc3545', 'angry': '#dc3545', 'negatif': '#dc3545',
      'nötr': '#6c757d', 'neutral': '#6c757d',
      'ironik': '#fd7e14', 'ironic': '#fd7e14',
      'sarkastik': '#e83e8c', 'sarcastic': '#e83e8c',
      'şaşırmış': '#20c997', 'surprised': '#20c997',
      'korku': '#6f42c1', 'fear': '#6f42c1',
      'tiksinti': '#795548', 'disgust': '#795548',
      'eleştirel': '#ffc107', 'critical': '#ffc107'
    };
    return map[tone?.toLowerCase()] || '#6c757d';
  }

  // Açık renk versiyonu (background için)
  function toneToColorLight(tone) {
    const color = toneToColor(tone);
    return color + '20'; // Alpha channel ekleme
  }

  // Kullanıcı tercihleri
  function getUserPreferences() {
    return JSON.parse(localStorage.getItem('eksiMapPreferences') || '{"defaultOpen": true, "autoAnalyze": false}');
  }

  function setUserPreference(key, value) {
    const prefs = getUserPreferences();
    prefs[key] = value;
    localStorage.setItem('eksiMapPreferences', JSON.stringify(prefs));
  }

  // Google'da Ekşi Sözlük araması
  async function searchTopicOnEksi(topic) {
    try {
      const searchUrl = `https://www.google.com/search?q=site:eksisozluk.com "${topic}"`;
      // Chrome extension'lar direct Google search yapamaz, background script kullanmalı
      const result = await chrome.runtime.sendMessage({ 
        type: 'SEARCH_TOPIC_ON_EKSI', 
        topic: topic 
      });
      return result?.exists || false;
    } catch (error) {
      console.error('[Ekşi Map] Google search hatası:', error);
      return false;
    }
  }  // İlgili başlıkların varlığını kontrol et (Ekşi Sözlük'te var mı?) - Geliştirilmiş
  async function checkTopicExists(topicName) {
    try {
      // Önce direkt URL deneme
      const cleanTopic = topicName.toLowerCase()
        .replace(/[şŞ]/g, 's')
        .replace(/[çÇ]/g, 'c')
        .replace(/[ğĞ]/g, 'g')
        .replace(/[üÜ]/g, 'u')
        .replace(/[öÖ]/g, 'o')
        .replace(/[ıİ]/g, 'i')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      const urls = [
        `https://eksisozluk.com/${encodeURIComponent(topicName.toLowerCase().replace(/\s+/g, '-'))}`,
        `https://eksisozluk.com/${cleanTopic}`,
        `https://eksisozluk.com/${encodeURIComponent(topicName)}`
      ];
      
      for (const url of urls) {
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            cache: 'no-cache'
          });
          if (response.ok && response.status === 200) {
            console.log('[Ekşi Map] Başlık bulundu:', topicName, 'URL:', url);
            return true;
          }
        } catch (urlError) {
          console.log('[Ekşi Map] URL deneme hatası:', url, urlError.message);
        }
      }
      
      console.log('[Ekşi Map] Başlık bulunamadı:', topicName);
      return false;
      
    } catch (error) {
      console.error('[Ekşi Map] checkTopicExists hatası:', error);
      return false;
    }
  }
  // Popup göster - Geliştirilmiş versiyon
  function showPopup(dataArr) {
    // Sonuçları birleştir
    const keywords = [...new Set(dataArr.flatMap(d => d.keywords))].slice(0,5);
    const tones = dataArr.map(d => d.tone).filter(Boolean);
    const tone = tones.length ? tones[0] : '';
    const related = [...new Set(dataArr.flatMap(d => d.related_topics))].slice(0,5);
    const summaries = dataArr.map(d => d.summary).filter(Boolean);
    const summary = summaries.length ? summaries[0] : 'Analiz sonucu özet bulunamadı.';
    
    // Kullanıcı tercihi kontrol et
    const prefs = getUserPreferences();
      // Popup
    let popup = document.getElementById('eksi-map-popup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'eksi-map-popup';
      popup.style.position = 'fixed';
      popup.style.bottom = '70px';
      popup.style.right = '20px';
      popup.style.background = '#fff';
      popup.style.border = '1px solid #dee2e6';
      popup.style.borderRadius = '8px';
      popup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
      popup.style.padding = '0';
      popup.style.zIndex = 10000;
      popup.style.width = '350px';
      popup.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      popup.style.overflow = 'hidden';
      popup.style.display = prefs.defaultOpen ? 'block' : 'none';
      document.body.appendChild(popup);
    }
    
    // İçeriği oluştur
    const isExpanded = popup.style.display !== 'none';    popup.innerHTML = `
      <div style='background:#f8f9fa;padding:12px;border-bottom:1px solid #dee2e6;border-radius:8px 8px 0 0;'>
        <div style='font-weight:600;font-size:1em;color:#333;display:flex;align-items:center;justify-content:space-between;'>
          <span>🧠 Analiz Sonucu</span>
          <div>
            <button id='eksi-map-toggle' style='background:none;border:none;font-size:0.9em;cursor:pointer;color:#666;margin-right:8px;'>${isExpanded ? '▼' : '▲'}</button>
            <button id='eksi-map-close' style='background:none;border:none;font-size:1.1em;cursor:pointer;color:#666;'>&times;</button>
          </div>
        </div>
        <div style='font-size:0.8em;color:#666;margin-top:2px;'>${new Date().toLocaleDateString('tr-TR')}</div>
      </div>
      <div id='eksi-map-content' style='display:${isExpanded ? 'block' : 'none'};'>
        <div style='padding:12px;'>
          <div style='margin-bottom:12px;'>
            <div style='font-weight:600;font-size:0.9em;margin-bottom:4px;color:#495057;'>📝 Özet</div>
            <div style='padding:8px;background:#f8f9fa;border-left:3px solid ${toneToColor(tone)};border-radius:0 6px 6px 0;font-size:0.85em;line-height:1.3;color:#333;'>${summary}</div>
          </div>
          
          <div style='margin-bottom:12px;'>
            <div style='font-weight:600;font-size:0.9em;margin-bottom:6px;color:#495057;'>🔑 Anahtar Kelimeler</div>
            <div style='display:flex;flex-wrap:wrap;gap:3px;'>
              ${keywords.map(k=>`<span style='display:inline-block;background:#007bff;color:#fff;border-radius:12px;padding:3px 8px;font-size:0.8em;font-weight:500;'>${k}</span>`).join('')}
            </div>
          </div>
          
          <div style='margin-bottom:12px;'>
            <div style='font-weight:600;font-size:0.9em;margin-bottom:6px;color:#495057;'>🎭 Ton</div>
            <div style='display:inline-block;background:${toneToColorLight(tone)};color:${toneToColor(tone)};padding:6px 12px;border-radius:16px;font-size:0.85em;font-weight:600;border:1px solid ${toneToColor(tone)};'>
              ${toneToEmoji(tone)} ${tone || 'Belirsiz'}
            </div>
          </div>
          
          <div style='margin-bottom:8px;'>
            <div style='font-weight:600;font-size:0.9em;margin-bottom:6px;color:#495057;'>🔗 İlgili Başlıklar</div>
            <div id="related-topics-container">
              <div style="color:#888;font-size:0.8em;font-style:italic;">Kontrol ediliyor...</div>
            </div>
          </div>
        </div>
        
        <div style='padding:8px 12px;background:#f8f9fa;border-top:1px solid #dee2e6;border-radius:0 0 8px 8px;display:flex;gap:6px;justify-content:space-between;align-items:center;'>
          <button id='eksi-map-export-btn' style='background:#28a745;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:0.8em;font-weight:500;'>📥 Export</button>
          <label style='display:flex;align-items:center;font-size:0.8em;color:#666;cursor:pointer;'>
            <input type='checkbox' id='eksi-map-default-open' ${prefs.defaultOpen ? 'checked' : ''} style='margin-right:4px;scale:0.9;'>
            Otomatik açık
          </label>
        </div>
      </div>
    `;
    
    // Event listeners
    document.getElementById('eksi-map-close').onclick = () => popup.remove();
      document.getElementById('eksi-map-toggle').onclick = () => {
      const content = document.getElementById('eksi-map-content');
      const toggleBtn = document.getElementById('eksi-map-toggle');
      const isVisible = content.style.display !== 'none';
      content.style.display = isVisible ? 'none' : 'block';
      toggleBtn.textContent = isVisible ? '▲' : '▼';
    };
    
    document.getElementById('eksi-map-default-open').onchange = (e) => {
      setUserPreference('defaultOpen', e.target.checked);
    };
    
    // İlgili başlıkları gelişmiş kontrol
    Promise.all(related.map(async topic => {
      // Önce normal Ekşi kontrolü
      let exists = await checkTopicExists(topic);
      
      // Eğer bulunamazsa Google search dene  
      if (!exists) {
        exists = await searchTopicOnEksi(topic);
      }
      
      return { topic, exists };
    })).then(results => {
      const container = document.getElementById('related-topics-container');
      if (!container) return;
      
      if (results.length === 0) {
        container.innerHTML = '<div style="color:#888;font-size:0.9em;font-style:italic;">İlgili başlık bulunamadı</div>';
        return;
      }
        const relatedHTML = results.map(({topic, exists}) => {
        const style = exists 
          ? 'background:#d1ecf1;color:#0c5460;border:1px solid #bee5eb;' 
          : 'background:#f8d7da;color:#721c24;border:1px solid #f5c6cb;';
        const icon = exists ? '✓' : '✗';
        const title = exists ? 'Bu başlık mevcut' : 'Bu başlık yok';
        const url = exists ? `https://eksisozluk.com/${encodeURIComponent(topic.toLowerCase().replace(/\s+/g, '-'))}` : '#';
        const linkStyle = exists ? 'cursor:pointer;text-decoration:none;' : 'cursor:default;';
        
        return `
          <a href="${url}" target="_blank" style="${linkStyle}">
            <div style='display:inline-block;margin:2px;padding:4px 8px;border-radius:6px;font-size:0.8em;${style}' title='${title}'>
              ${icon} ${topic}
            </div>
          </a>
        `;
      }).join('');
      
      container.innerHTML = relatedHTML;
    }).catch(error => {
      console.error('[Ekşi Map] İlgili başlık kontrolü hatası:', error);
      document.getElementById('related-topics-container').innerHTML = 
        '<div style="color:#dc3545;font-size:0.9em;">Başlık kontrolünde hata oluştu</div>';
    });
  }
  // Local history: analizleri kaydet
  function saveAnalysisToHistory({ title, tone, keywords, relatedTopics, summary }) {
    const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
    history.unshift({
      title,
      tone,
      keywords,
      relatedTopics,
      summary,
      date: new Date().toISOString()
    });
    localStorage.setItem('eksiMapHistory', JSON.stringify(history.slice(0, 5)));
  }
  // Geçmişi gösteren popup - Geliştirilmiş UI
  function showHistoryPopup() {
    const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
    let popup = document.getElementById('eksi-map-popup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'eksi-map-popup';
      popup.style.position = 'fixed';
      popup.style.bottom = '70px';
      popup.style.right = '24px';
      popup.style.background = '#fff';
      popup.style.border = '1px solid #ccc';
      popup.style.borderRadius = '12px';
      popup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
      popup.style.padding = '0';
      popup.style.zIndex = 10000;
      popup.style.minWidth = '320px';
      popup.style.maxWidth = '400px';
      popup.style.maxHeight = '500px';
      popup.style.fontFamily = 'sans-serif';
      popup.style.overflow = 'hidden';
      document.body.appendChild(popup);
    }
    
    const historyHtml = history.length ? history.map(h => `
      <div style='padding:12px;border-bottom:1px solid #f0f0f0;margin-bottom:0;'>
        <div style='font-weight:bold;font-size:1em;margin-bottom:6px;color:#333;'>${h.title}</div>
        <div style='margin-bottom:8px;'>
          <span style='display:inline-block;background:${toneToColorLight(h.tone)};color:${toneToColor(h.tone)};padding:3px 8px;border-radius:12px;font-size:0.85em;font-weight:500;'>${toneToEmoji(h.tone)} ${h.tone}</span>
          <span style='font-size:0.8em;color:#888;margin-left:8px;'>${new Date(h.date).toLocaleDateString('tr-TR')}</span>
        </div>
        ${h.summary ? `<div style='font-size:0.9em;color:#666;font-style:italic;margin-bottom:8px;line-height:1.4;'>"${h.summary.length > 80 ? h.summary.substring(0,80) + '...' : h.summary}"</div>` : ''}
        <div style='font-size:0.85em;'>
          ${h.keywords?.slice(0,4).map(k=>`<span style='display:inline-block;background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:2px 6px;margin:1px 2px 1px 0;color:#495057;'>${k}</span>`).join('')}
        </div>
      </div>
    `).join('') : '<div style="padding:20px;text-align:center;color:#888;">Henüz analiz geçmişin yok</div>';
    
    popup.innerHTML = `
      <div style='background:#f8f9fa;padding:16px;border-bottom:1px solid #dee2e6;border-radius:12px 12px 0 0;'>
        <div style='font-weight:bold;font-size:1.1em;color:#333;display:flex;align-items:center;justify-content:space-between;'>
          <span>🧠 Zihin Akışım</span>
          <button id='eksi-map-close' style='background:none;border:none;font-size:1.2em;cursor:pointer;color:#666;'>&times;</button>
        </div>
        <div style='font-size:0.9em;color:#666;margin-top:4px;'>Son ${history.length} analiz</div>
      </div>
      <div style='max-height:350px;overflow-y:auto;'>
        ${historyHtml}
      </div>
      <div style='padding:12px;background:#f8f9fa;border-top:1px solid #dee2e6;border-radius:0 0 12px 12px;text-align:center;'>
        <button id='eksi-map-clear-history' style='background:#dc3545;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.9em;'>Geçmişi Temizle</button>
      </div>
    `;
    
    document.getElementById('eksi-map-close').onclick = () => popup.remove();
    document.getElementById('eksi-map-clear-history').onclick = () => {
      if (confirm('Tüm analiz geçmişini silmek istediğinize emin misiniz?')) {
        localStorage.removeItem('eksiMapHistory');
        popup.remove();
      }
    };
  }
  // Export JSON - Geliştirilmiş versiyon
  function exportAnalysis({ title, tone, keywords, relatedTopics, summary }) {
    const timestamp = new Date().toISOString();
    const dataToExport = { 
      title, 
      tone, 
      keywords, 
      relatedTopics, 
      summary,
      analysisDate: timestamp,
      source: 'Ekşi Map Extension',
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eksi-analiz-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().getTime()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }  // Bubble Chart (Chart.js) - Düzeltilmiş versiyon
  function showBubbleChart() {
    // Chart.js inject - local dosyadan
    (function injectChartJs(cb) {
      if (window.Chart) {
        console.log('[Ekşi Map] Chart.js zaten yüklü');
        return cb && cb();
      }
      
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('chart.min.js');
      script.onload = () => {
        console.log('[Ekşi Map] Chart.js yüklendi, Chart objesi:', typeof window.Chart);
        setTimeout(() => cb && cb(), 100); // Kısa gecikme
      };
      script.onerror = () => {
        console.error('[Ekşi Map] Chart.js yüklenemedi');
        alert('Chart.js yüklenemedi. Uzantıyı yeniden yükleyin.');
      };
      document.head.appendChild(script);
    })(renderChart);

    function renderChart() {
      const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
      if (!history.length) {
        alert('Zihin haritası için analiz geçmişiniz yok. Önce bir başlığı analiz edin.');
        return;
      }
      
      let popup = document.getElementById('eksi-map-popup');
      if (!popup) {
        popup = document.createElement('div');
        popup.id = 'eksi-map-popup';
        popup.style.position = 'fixed';
        popup.style.bottom = '70px';
        popup.style.right = '24px';
        popup.style.background = '#fff';
        popup.style.border = '1px solid #ccc';
        popup.style.borderRadius = '12px';
        popup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        popup.style.padding = '0';
        popup.style.zIndex = 10000;
        popup.style.width = '450px';
        popup.style.fontFamily = 'sans-serif';
        document.body.appendChild(popup);
      }
      
      popup.innerHTML = `
        <div style='background:#f8f9fa;padding:16px;border-bottom:1px solid #dee2e6;border-radius:12px 12px 0 0;'>
          <div style='font-weight:bold;font-size:1.1em;color:#333;display:flex;align-items:center;justify-content:space-between;'>
            <span>🗺️ Zihin Haritam</span>
            <button id='eksi-map-close' style='background:none;border:none;font-size:1.2em;cursor:pointer;color:#666;'>&times;</button>
          </div>
          <div style='font-size:0.9em;color:#666;margin-top:4px;'>Bubble Chart: Balon boyutu = keyword sayısı</div>
        </div>
        <div style='padding:16px;'>
          <canvas id='eksi-map-bubble' width='400' height='250'></canvas>
          <div style='display:flex;gap:8px;margin-top:12px;'>
            <button id='eksi-map-export-png' style='background:#28a745;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:0.9em;'>PNG Kaydet</button>
            <button id='eksi-map-fullscreen' style='background:#17a2b8;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:0.9em;'>Büyüt</button>
          </div>
          <div id='eksi-map-summary' style='margin-top:12px;padding:12px;background:#f8f9fa;border-radius:8px;font-size:0.95em;'></div>
        </div>
      `;
      
      document.getElementById('eksi-map-close').onclick = () => popup.remove();
      
      // Data hazırlama
      const minTime = Math.min(...history.map(h=>+new Date(h.date||h.timestamp)));
      const maxTime = Math.max(...history.map(h=>+new Date(h.date||h.timestamp)));
      const timeRange = maxTime - minTime || 86400000; // En az 1 gün
      
      const data = history.map((h, index) => ({
        x: timeRange > 0 ? ((+new Date(h.date||h.timestamp)) - minTime) / timeRange * 100 : index * 20,
        y: h.keywords?.length || 1,
        r: Math.max(8, Math.min(25, 8 + (h.keywords?.length||1)*2)),
        backgroundColor: toneToColor(h.tone),
        borderColor: toneToColor(h.tone),
        title: h.title,
        tone: h.tone,
        keywords: h.keywords,
        date: h.date||h.timestamp
      }));
      
      // Chart.js - Düzeltilmiş konfigürasyon
      setTimeout(() => {
        const ctx = document.getElementById('eksi-map-bubble');
        if (!ctx) {
          console.error('[Ekşi Map] Canvas elementi bulunamadı');
          return;
        }
        
        const canvasCtx = ctx.getContext('2d');
        if (window.eksiMapBubbleChart) {
          window.eksiMapBubbleChart.destroy();
        }
          try {
          if (!window.Chart) {
            console.error('[Ekşi Map] Chart objesi hala tanımsız');
            document.getElementById('eksi-map-bubble').parentElement.innerHTML = 
              '<div style="text-align:center;padding:40px;color:#666;">Chart.js yüklenemedi</div>';
            return;
          }
          
          window.eksiMapBubbleChart = new Chart(canvasCtx, {
            type: 'bubble',
            data: {
              datasets: [{
                label: 'Zihin Noktalarım',
                data: data,
                backgroundColor: data.map(d => d.backgroundColor + '80'), // Transparency
                borderColor: data.map(d => d.borderColor),
                borderWidth: 2
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                tooltip: {
                  callbacks: {
                    title: () => '',
                    label: function(context) {
                      const data = context.raw;
                      return [
                        `📖 ${data.title}`,
                        `🎭 ${data.tone}`,
                        `🔑 ${data.keywords?.slice(0,3).join(', ') || 'N/A'}`,
                        `📅 ${new Date(data.date).toLocaleDateString('tr-TR')}`
                      ];
                    }
                  }
                },
                legend: {
                  display: false
                }
              },
              scales: {
                x: {
                  title: { display: true, text: '⏰ Zaman' },
                  min: -5,
                  max: 105,
                  grid: { color: '#f0f0f0' },
                  ticks: {
                    callback: function(value) {
                      if (timeRange > 86400000) { // Birden fazla gün
                        const idx = Math.round(value/100*(history.length-1));
                        const d = history[idx]?.date||history[idx]?.timestamp;
                        return d ? new Date(d).toLocaleDateString('tr-TR') : '';
                      } else {
                        return value < 50 ? 'Eskiler' : 'Yeniler';
                      }
                    }
                  }
                },
                y: {
                  title: { display: true, text: '🔑 Keyword Sayısı' },
                  min: 0,
                  grid: { color: '#f0f0f0' },
                  beginAtZero: true
                }
              },
              interaction: {
                intersect: false
              }
            }
          });
          
          console.log('[Ekşi Map] Bubble chart oluşturuldu', window.eksiMapBubbleChart);
          
        } catch (error) {
          console.error('[Ekşi Map] Chart oluşturma hatası:', error);
          document.getElementById('eksi-map-bubble').parentElement.innerHTML = 
            '<div style="text-align:center;padding:40px;color:#666;">Chart yüklenirken hata oluştu</div>';
        }
          // Export PNG
        document.getElementById('eksi-map-export-png').onclick = () => {
          try {
            if (window.eksiMapBubbleChart) {
              const link = document.createElement('a');
              link.download = 'zihin-haritam.png';
              link.href = window.eksiMapBubbleChart.toBase64Image('image/png', 1.0);
              link.click();
            }
          } catch (error) {
            console.error('[Ekşi Map] PNG export hatası:', error);
          }
        };
        
        // Büyüt butonu
        const fullscreenBtn = document.getElementById('eksi-map-fullscreen');
        if (fullscreenBtn) {
          fullscreenBtn.onclick = () => {
            popup.style.width = popup.style.width === '450px' ? '600px' : '450px';
            popup.style.height = popup.style.width === '600px' ? '500px' : 'auto';
            setTimeout(() => window.eksiMapBubbleChart?.resize(), 100);
          };
        }
        
        // Duygusal özet
        const tones = history.map(h=>h.tone?.toLowerCase()).filter(Boolean);
        const keywords = history.flatMap(h=>h.keywords||[]);
        const mostTone = tones.length ? tones.sort((a,b) => 
          tones.filter(t=>t===a).length - tones.filter(t=>t===b).length
        ).pop() : null;
        const mostKeywords = [...new Set(keywords)].slice(0,3);
        
        let summary = `📊 Toplam ${history.length} analiz yapılmış. `;
        if (mostTone) {
          const emoji = toneToEmoji(mostTone);
          summary += `Genelde ${emoji} ${mostTone} tonunda yazılar okuyorsun. `;
        }
        if (mostKeywords.length) {
          summary += `En çok ilgilendiğin konular: ${mostKeywords.map(k => `"${k}"`).join(', ')}.`;
        }
        
        document.getElementById('eksi-map-summary').innerHTML = summary;
        
      }, 100);
    }
  }  // Zihin Akışım butonu ekle - Kompakt tasarım
  function addHistoryButton() {
    if (document.getElementById('eksi-map-history-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'eksi-map-history-btn';
    btn.innerText = '📚 Geçmiş';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '120px';
    btn.style.zIndex = 9999;
    btn.style.padding = '10px 16px';
    btn.style.background = '#6c757d';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.fontWeight = '600';
    btn.style.fontSize = '14px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 8px rgba(108,117,125,0.3)';
    btn.style.transition = 'all 0.2s ease';
    
    // Hover efekti
    btn.onmouseover = () => {
      btn.style.transform = 'translateY(-1px)';
      btn.style.background = '#5a6268';
    };
    btn.onmouseout = () => {
      btn.style.transform = 'translateY(0)';
      btn.style.background = '#6c757d';
    };
    
    document.body.appendChild(btn);
    btn.addEventListener('click', showHistoryPopup);
    
    // Bubble Chart butonu - Kompakt
    let chartBtn = document.getElementById('eksi-map-bubble-btn');
    if (!chartBtn) {
      chartBtn = document.createElement('button');
      chartBtn.id = 'eksi-map-bubble-btn';
      chartBtn.innerText = '🗺️ Harita';
      chartBtn.style.position = 'fixed';
      chartBtn.style.bottom = '20px';
      chartBtn.style.right = '220px';
      chartBtn.style.zIndex = 9999;
      chartBtn.style.padding = '10px 16px';
      chartBtn.style.background = '#28a745';
      chartBtn.style.color = '#fff';
      chartBtn.style.border = 'none';
      chartBtn.style.borderRadius = '8px';
      chartBtn.style.fontWeight = '600';
      chartBtn.style.fontSize = '14px';
      chartBtn.style.cursor = 'pointer';
      chartBtn.style.boxShadow = '0 2px 8px rgba(40,167,69,0.3)';
      chartBtn.style.transition = 'all 0.2s ease';
      
      // Hover efekti
      chartBtn.onmouseover = () => {
        chartBtn.style.transform = 'translateY(-1px)';
        chartBtn.style.background = '#218838';
      };
      chartBtn.onmouseout = () => {
        chartBtn.style.transform = 'translateY(0)';
        chartBtn.style.background = '#28a745';
      };
      
      document.body.appendChild(chartBtn);
      chartBtn.addEventListener('click', showBubbleChart);
    }
    
    // Settings butonu - Kompakt
    let settingsBtn = document.getElementById('eksi-map-settings-btn');
    if (!settingsBtn) {
      settingsBtn = document.createElement('button');
      settingsBtn.id = 'eksi-map-settings-btn';
      settingsBtn.innerText = '⚙️';
      settingsBtn.style.position = 'fixed';
      settingsBtn.style.bottom = '20px';
      settingsBtn.style.right = '320px';
      settingsBtn.style.zIndex = 9999;
      settingsBtn.style.padding = '10px';
      settingsBtn.style.background = '#ffc107';
      settingsBtn.style.color = '#212529';
      settingsBtn.style.border = 'none';
      settingsBtn.style.borderRadius = '8px';
      settingsBtn.style.width = '40px';
      settingsBtn.style.height = '40px';
      settingsBtn.style.fontWeight = '600';
      settingsBtn.style.fontSize = '16px';
      settingsBtn.style.cursor = 'pointer';
      settingsBtn.style.boxShadow = '0 2px 8px rgba(255,193,7,0.3)';
      settingsBtn.style.transition = 'all 0.2s ease';
      settingsBtn.title = 'Ayarlar';
      
      // Hover efekti
      settingsBtn.onmouseover = () => {
        settingsBtn.style.transform = 'translateY(-1px) rotate(90deg)';
        settingsBtn.style.background = '#e0a800';
      };
      settingsBtn.onmouseout = () => {
        settingsBtn.style.transform = 'translateY(0) rotate(0deg)';
        settingsBtn.style.background = '#ffc107';
      };
      
      document.body.appendChild(settingsBtn);
      settingsBtn.addEventListener('click', showSettingsPopup);
    }
  }
  // Ayarlar popup'ı - Kompakt versiyon
  function showSettingsPopup() {
    const prefs = getUserPreferences();
    
    let popup = document.getElementById('eksi-map-popup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'eksi-map-popup';
      popup.style.position = 'fixed';
      popup.style.bottom = '70px';
      popup.style.right = '20px';
      popup.style.background = '#fff';
      popup.style.border = '1px solid #dee2e6';
      popup.style.borderRadius = '8px';
      popup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
      popup.style.padding = '0';
      popup.style.zIndex = 10000;
      popup.style.width = '280px';
      popup.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      document.body.appendChild(popup);
    }
    
    popup.innerHTML = `
      <div style='background:#f8f9fa;padding:12px;border-bottom:1px solid #dee2e6;border-radius:8px 8px 0 0;'>
        <div style='font-weight:600;font-size:1em;color:#333;display:flex;align-items:center;justify-content:space-between;'>
          <span>⚙️ Ayarlar</span>
          <button id='eksi-map-close' style='background:none;border:none;font-size:1.1em;cursor:pointer;color:#666;'>&times;</button>
        </div>
      </div>
      <div style='padding:12px;'>
        <label style='display:flex;align-items:center;cursor:pointer;margin-bottom:12px;'>
          <input type='checkbox' id='setting-default-open' ${prefs.defaultOpen ? 'checked' : ''} style='margin-right:8px;'>
          <div>
            <div style='font-weight:500;color:#333;font-size:0.9em;'>Otomatik açık</div>
            <div style='font-size:0.8em;color:#666;'>Analiz sonuçları varsayılan açık</div>
          </div>
        </label>
        
        <label style='display:flex;align-items:center;cursor:pointer;margin-bottom:12px;'>
          <input type='checkbox' id='setting-auto-analyze' ${prefs.autoAnalyze ? 'checked' : ''} style='margin-right:8px;'>
          <div>
            <div style='font-weight:500;color:#333;font-size:0.9em;'>Otomatik analiz</div>
            <div style='font-size:0.8em;color:#666;'>Sayfa yüklenince analiz yap</div>
          </div>
        </label>
        
        <div style='padding:8px;background:#f8f9fa;border-radius:6px;margin-bottom:12px;'>
          <div style='font-size:0.85em;color:#666;text-align:center;'>
            <div>Toplam analiz: <span id='total-analyses'>0</span></div>
            <div>Veri: <span id='storage-usage'>0</span> KB</div>
          </div>
        </div>
      </div>
      
      <div style='padding:8px 12px;background:#f8f9fa;border-top:1px solid #dee2e6;border-radius:0 0 8px 8px;display:flex;gap:6px;'>
        <button id='export-all-data' style='background:#28a745;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:0.8em;flex:1;'>📥 Export</button>
        <button id='clear-all-data' style='background:#dc3545;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:0.8em;flex:1;'>🗑️ Temizle</button>
      </div>
    `;
    
    // Event listeners
    document.getElementById('eksi-map-close').onclick = () => popup.remove();
    
    document.getElementById('setting-default-open').onchange = (e) => {
      setUserPreference('defaultOpen', e.target.checked);
    };
    
    document.getElementById('setting-auto-analyze').onchange = (e) => {
      setUserPreference('autoAnalyze', e.target.checked);
    };
    
    document.getElementById('export-all-data').onclick = () => {
      const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
      const preferences = getUserPreferences();
      const allData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        analysisHistory: history,
        userPreferences: preferences
      };
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eksi-map-export-${new Date().getTime()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    
    document.getElementById('clear-all-data').onclick = () => {
      if (confirm('Tüm veri silinecek. Emin misiniz?')) {
        localStorage.removeItem('eksiMapHistory');
        localStorage.removeItem('eksiMapPreferences');
        alert('Veriler temizlendi!');
        popup.remove();
      }
    };
    
    // İstatistikleri güncelle
    const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
    document.getElementById('total-analyses').textContent = history.length;
    
    const storageSize = (JSON.stringify(history).length + JSON.stringify(prefs).length) / 1024;
    document.getElementById('storage-usage').textContent = storageSize.toFixed(1);
  }

  // Buton tıklanınca
  async function onMapClick() {
    console.log('[Ekşi Map] Analiz başlatıldı...');
    const entries = getEntries();
    console.log('[Ekşi Map] Entry sayısı:', entries.length);
    if (!entries.length) return alert('Entry bulunamadı!');
    
    const chunks = chunkByParagraph(entries);
    console.log('[Ekşi Map] Chunk sayısı:', chunks.length);
    
    try {
      const results = await Promise.all(chunks.map(async (chunk, i) => {
        console.log(`[Ekşi Map] Chunk ${i+1} gönderiliyor...`);
        const result = await chrome.runtime.sendMessage({ type: 'GEMINI_ANALYZE', text: chunk });
        console.log(`[Ekşi Map] Chunk ${i+1} sonucu:`, result);
        return result;
      }));      const dataArr = results.filter(Boolean);
      console.log('[Ekşi Map] Filtrelenmiş sonuçlar:', dataArr);
      
      if (!dataArr.length) {
        alert('Analiz sonucu alınamadı. API key\'i kontrol edin.');
        return;
      }
        // Sonuçları birleştir
    const keywords = [...new Set(dataArr.flatMap(d => d.keywords))].slice(0,5);
    const tones = dataArr.map(d => d.tone).filter(Boolean);
    const tone = tones.length ? tones[0] : '';
    const related = [...new Set(dataArr.flatMap(d => d.related_topics))].slice(0,5);
    const summaries = dataArr.map(d => d.summary).filter(Boolean);
    const summary = summaries.length ? summaries[0] : 'Analiz sonucu özet bulunamadı.';    const title = document.querySelector('h1')?.innerText || location.pathname;
    saveAnalysisToHistory({ title, tone, keywords, relatedTopics: related, summary });
    showPopup(dataArr);
    
    // Export butonu event listener
    setTimeout(() => {
      const exportBtn = document.getElementById('eksi-map-export-btn');
      if (exportBtn) {
        exportBtn.onclick = () => exportAnalysis({ title, tone, keywords, relatedTopics: related, summary });
      }
    }, 300);
    } catch (error) {
      console.error('[Ekşi Map] Analiz hatası:', error);
      alert('Analiz sırasında hata oluştu: ' + error.message);
    }
  }  // Entry var mı kontrolü ve dinamik yükleme desteği
  function tryInit() {
    const entries = getEntries();
    console.log('[Ekşi Map] tryInit çağrıldı, entry sayısı:', entries.length);
    if (entries.length > 0) {
      addMapButton();
      addHistoryButton();
      console.log('[Ekşi Map] Butonlar eklendi.');
      
      // Auto-analyze kontrolü
      const prefs = getUserPreferences();
      if (prefs.autoAnalyze) {
        console.log('[Ekşi Map] Otomatik analiz başlatılıyor...');
        setTimeout(() => {
          onMapClick();
        }, 2000); // 2 saniye bekle
      }
      
      return true;
    }
    return false;
  }

  // İlk deneme
  setTimeout(() => {
    if (!tryInit()) {
      // Dinamik yükleme için MutationObserver
      const observer = new MutationObserver(() => {
        if (tryInit()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }, 1000); // 1 saniye bekle

  // Test amaçlı her zaman buton ekle (geçici)
  setTimeout(() => {
    addMapButton();
    addHistoryButton();
    console.log('[Ekşi Map] Test butonları eklendi.');  }, 2000);
})();
