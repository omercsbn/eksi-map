// dashboard.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('[Ekşi Map Dashboard] Yüklendi!');
  
  loadDashboard();
  
  // Otomatik yenileme (her 30 saniyede bir)
  setInterval(loadDashboard, 30000);
});

function loadDashboard() {
  loadStats();
  loadHistory();
  loadToneStats();
  loadKeywordStats();
  loadTrendChart();
}

function loadStats() {
  const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
  const totalKeywords = history.reduce((sum, item) => sum + (item.keywords?.length || 0), 0);
  const uniqueTones = new Set(history.map(item => item.tone).filter(Boolean)).size;
  
  // Son analiz tarihi
  let lastAnalysis = '-';
  if (history.length > 0) {
    const lastItem = history[history.length - 1];
    if (lastItem.timestamp) {
      const date = new Date(lastItem.timestamp);
      lastAnalysis = date.toLocaleDateString('tr-TR');
    }
  }
  
  document.getElementById('totalAnalyses').textContent = history.length;
  document.getElementById('totalKeywords').textContent = totalKeywords;
  document.getElementById('uniqueTones').textContent = uniqueTones;
  document.getElementById('lastAnalysis').textContent = lastAnalysis;
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
  const historyList = document.getElementById('historyList');
  
  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>Henüz analiz yapılmamış</h3>
        <p>Ekşi Sözlük'te bir başlık analiz ettiğinde burada görünecek.</p>
      </div>
    `;
    return;
  }
  
  // Son 10 analizi göster
  const recentHistory = history.slice(-10).reverse();
  
  historyList.innerHTML = recentHistory.map(item => {
    const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString('tr-TR') : 'Bilinmiyor';
    const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString('tr-TR') : '';
    
    const toneBadge = item.tone ? `
      <span class="tone-badge" style="background: ${getToneColor(item.tone)};">
        ${getToneEmoji(item.tone)} ${item.tone}
      </span>
    ` : '';
    
    const keywords = item.keywords ? item.keywords.slice(0, 5).map(keyword => 
      `<span class="keyword-tag">${keyword}</span>`
    ).join('') : '';
    
    return `
      <div class="history-item">
        <div class="history-title">${item.title || 'Başlıksız'}</div>
        <div class="history-meta">
          <span>📅 ${date} ${time}</span>
          ${toneBadge}
        </div>
        <div class="history-keywords">
          ${keywords}
        </div>
      </div>
    `;
  }).join('');
}

function loadToneStats() {
  const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
  const toneStats = document.getElementById('toneStats');
  
  const toneCounts = {};
  history.forEach(item => {
    if (item.tone) {
      toneCounts[item.tone] = (toneCounts[item.tone] || 0) + 1;
    }
  });
  
  const sortedTones = Object.entries(toneCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  if (sortedTones.length === 0) {
    toneStats.innerHTML = '<p style="color: #6c757d; font-style: italic;">Henüz ton verisi yok</p>';
    return;
  }
  
  toneStats.innerHTML = sortedTones.map(([tone, count]) => `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 8px;">
      <span style="display: flex; align-items: center; gap: 8px;">
        <span style="background: ${getToneColor(tone)}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8em;">
          ${getToneEmoji(tone)} ${tone}
        </span>
      </span>
      <span style="font-weight: 600; color: #007bff;">${count}</span>
    </div>
  `).join('');
}

function loadKeywordStats() {
  const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
  const keywordStats = document.getElementById('keywordStats');
  
  const keywordCounts = {};
  history.forEach(item => {
    if (item.keywords) {
      item.keywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
    }
  });
  
  const sortedKeywords = Object.entries(keywordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);
  
  if (sortedKeywords.length === 0) {
    keywordStats.innerHTML = '<p style="color: #6c757d; font-style: italic;">Henüz kelime verisi yok</p>';
    return;
  }
  
  keywordStats.innerHTML = sortedKeywords.map(([keyword, count]) => `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 6px; background: #f8f9fa; border-radius: 6px;">
      <span style="background: #ffd700; color: #333; padding: 2px 6px; border-radius: 10px; font-size: 0.8em; font-weight: 500;">
        ${keyword}
      </span>
      <span style="font-weight: 600; color: #007bff; font-size: 0.9em;">${count}</span>
    </div>
  `).join('');
}

function loadTrendChart() {
  const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
  const canvas = document.getElementById('trendChart');
  const ctx = canvas.getContext('2d');
  
  if (history.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6c757d';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Henüz veri yok', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  // Son 7 günün verilerini grupla
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('tr-TR');
    
    const dayCount = history.filter(item => {
      if (!item.timestamp) return false;
      const itemDate = new Date(item.timestamp);
      return itemDate.toLocaleDateString('tr-TR') === dateStr;
    }).length;
    
    last7Days.push({ date: dateStr, count: dayCount });
  }
  
  // Chart çizimi
  const width = canvas.width;
  const height = canvas.height;
  const padding = 40;
  
  ctx.clearRect(0, 0, width, height);
  
  // Grid çiz
  ctx.strokeStyle = '#e9ecef';
  ctx.lineWidth = 1;
  
  // Yatay çizgiler
  const maxCount = Math.max(...last7Days.map(d => d.count));
  const ySteps = Math.max(1, Math.ceil(maxCount / 3));
  
  for (let i = 0; i <= ySteps; i++) {
    const y = padding + (height - 2 * padding) * (1 - i / ySteps);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    
    // Y ekseni etiketleri
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(i * Math.ceil(maxCount / ySteps), padding - 5, y + 4);
  }
  
  // Dikey çizgiler
  for (let i = 0; i < last7Days.length; i++) {
    const x = padding + (width - 2 * padding) * (i / (last7Days.length - 1));
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, height - padding);
    ctx.stroke();
  }
  
  // Veri çizgisi
  ctx.strokeStyle = '#007bff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  last7Days.forEach((day, i) => {
    const x = padding + (width - 2 * padding) * (i / (last7Days.length - 1));
    const y = padding + (height - 2 * padding) * (1 - day.count / Math.max(1, maxCount));
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    // Nokta çiz
    ctx.fillStyle = '#007bff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // X ekseni etiketleri
    ctx.fillStyle = '#6c757d';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(day.date.split('.').slice(0, 2).join('.'), x, height - padding + 15);
  });
  
  ctx.stroke();
}

// Yardımcı fonksiyonlar
function getToneColor(tone) {
  const colorMap = {
    'coşkulu': '#28a745',
    'üzgün': '#6c757d',
    'sinirli': '#dc3545',
    'nötr': '#6c757d',
    'ironik': '#fd7e14',
    'sarkastik': '#e83e8c',
    'şaşırmış': '#20c997',
    'korku': '#6f42c1',
    'tiksinti': '#795548',
    'eleştirel': '#ffc107'
  };
  return colorMap[tone?.toLowerCase()] || '#6c757d';
}

function getToneEmoji(tone) {
  const emojiMap = {
    'coşkulu': '🤩',
    'üzgün': '😢',
    'sinirli': '😡',
    'nötr': '😐',
    'ironik': '😏',
    'sarkastik': '🙃',
    'şaşırmış': '😲',
    'korku': '😨',
    'tiksinti': '🤢',
    'eleştirel': '🤔'
  };
  return emojiMap[tone?.toLowerCase()] || '😐';
}

// Buton fonksiyonları
function openEksiSozluk() {
  window.open('https://eksisozluk.com', '_blank');
}

function exportAllData() {
  const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
  const preferences = JSON.parse(localStorage.getItem('eksiMapPreferences') || '{}');
  
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
}

function clearAllData() {
  if (confirm('Tüm veri silinecek. Emin misiniz?')) {
    localStorage.removeItem('eksiMapHistory');
    localStorage.removeItem('eksiMapPreferences');
    alert('Veriler temizlendi!');
    loadDashboard();
  }
}

function showBubbleChart() {
  // Bubble chart'ı yeni sekmede aç
  const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
  if (history.length === 0) {
    alert('Henüz analiz verisi yok!');
    return;
  }
  
  // Chart verilerini hazırla
  const chartData = history.map(item => ({
    title: item.title,
    keywords: item.keywords || [],
    tone: item.tone,
    timestamp: item.timestamp
  }));
  
  // Yeni sekmede chart aç
  const chartWindow = window.open('', '_blank');
  chartWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ekşi Map - Bubble Chart</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
      <h1>🧠 Ekşi Map - Bubble Chart</h1>
      <canvas id="bubbleChart" width="800" height="600"></canvas>
      <script>
        const data = ${JSON.stringify(chartData)};
        const ctx = document.getElementById('bubbleChart').getContext('2d');
        
        const chartData = data.map((item, index) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          r: (item.keywords.length || 1) * 3,
          label: item.title,
          tone: item.tone
        }));
        
        new Chart(ctx, {
          type: 'bubble',
          data: {
            datasets: [{
              data: chartData,
              backgroundColor: chartData.map(item => {
                const colors = {
                  'coşkulu': 'rgba(40, 167, 69, 0.7)',
                  'üzgün': 'rgba(108, 117, 125, 0.7)',
                  'sinirli': 'rgba(220, 53, 69, 0.7)',
                  'nötr': 'rgba(108, 117, 125, 0.7)',
                  'ironik': 'rgba(253, 126, 20, 0.7)',
                  'sarkastik': 'rgba(232, 62, 140, 0.7)'
                };
                return colors[item.tone] || 'rgba(108, 117, 125, 0.7)';
              })
            }]
          },
          options: {
            responsive: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.raw.label;
                  }
                }
              }
            }
          }
        });
      </script>
    </body>
    </html>
  `);
} 