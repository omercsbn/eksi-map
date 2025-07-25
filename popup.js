// popup.js
document.addEventListener('DOMContentLoaded', function() {
  console.log('[Ekşi Map] Popup yüklendi!');
  
  const statusElement = document.getElementById('status');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const historyBtn = document.getElementById('historyBtn');
  const bubbleChartBtn = document.getElementById('bubbleChartBtn');
  const analyticsBtn = document.getElementById('analyticsBtn');
  const searchBtn = document.getElementById('searchBtn');
  const syncBtn = document.getElementById('syncBtn');
  const analysisCountElement = document.getElementById('analysisCount');
  const keywordCountElement = document.getElementById('keywordCount');
  
  // Notification settings elements
  const browserNotificationsToggle = document.getElementById('browserNotifications');
  const inPageNotificationsToggle = document.getElementById('inPageNotifications');
  const realtimeMonitoringToggle = document.getElementById('realtimeMonitoring');
  
  // İstatistikleri yükle
  loadStats();
  
  // Bildirim ayarlarını yükle
  loadNotificationSettings();
  
  // Aktif tab kontrol et
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const isEksiPage = currentTab.url.includes('eksisozluk.com');
    
    if (isEksiPage) {
      updateStatus('success', '✅ Ekşi Sözlük sayfasındasın!', 'Analiz butonuna tıklayarak başlığı analiz edebilirsin.');
      analyzeBtn.disabled = false;
    } else {
      updateStatus('error', '❌ Ekşi Sözlük sayfasında değilsin', 'Analiz için bir başlık sayfasına gitmelisin.');
      analyzeBtn.disabled = true;
    }
  });
  
  // Analiz butonu
  analyzeBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'TRIGGER_ANALYSIS'}, function(response) {
        if (response && response.success) {
          updateStatus('success', '✅ Analiz başlatıldı!', 'Sayfada analiz popup\'ı açıldı.');
          setTimeout(loadStats, 2000); // İstatistikleri güncelle
        } else {
          updateStatus('error', '❌ Analiz başlatılamadı', 'Sayfayı yenile ve tekrar dene.');
        }
      });
    });
  });
  
  // Geçmiş butonu
  historyBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'SHOW_HISTORY'}, function(response) {
        if (response && response.success) {
          updateStatus('success', '✅ Geçmiş açıldı!', 'Sayfada geçmiş popup\'ı görüntülendi.');
        } else {
          updateStatus('error', '❌ Geçmiş açılamadı', 'Sayfayı yenile ve tekrar dene.');
        }
      });
    });
  });

  // Bubble Chart butonu
  bubbleChartBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'SHOW_BUBBLE_CHART'}, function(response) {
        if (response && response.success) {
          updateStatus('success', '✅ Zihin Haritası açıldı!', 'Sayfada bubble chart görüntülendi.');
        } else {
          updateStatus('error', '❌ Zihin Haritası açılamadı', 'Önce analiz geçmişi oluşturmalısın.');
        }
      });
    });
  });

  // Analytics butonu
  analyticsBtn.addEventListener('click', function() {
    chrome.tabs.create({url: chrome.runtime.getURL('analytics.html')});
  });

  // Arama butonu
  searchBtn.addEventListener('click', function() {
    chrome.tabs.create({url: chrome.runtime.getURL('search-filter.html')});
  });

  // Senkronizasyon butonu
  syncBtn.addEventListener('click', function() {
    chrome.tabs.create({url: chrome.runtime.getURL('sync-settings.html')});
  });

  // Bildirim ayarları event listeners
  browserNotificationsToggle.addEventListener('change', function() {
    updateNotificationPreference('browserNotifications', this.checked);
  });

  inPageNotificationsToggle.addEventListener('change', function() {
    updateNotificationPreference('inPageToasts', this.checked);
  });

  realtimeMonitoringToggle.addEventListener('change', function() {
    updateRealtimeMonitoring(this.checked);
  });
  
  // Durum güncelleme fonksiyonu
  function updateStatus(type, title, message) {
    statusElement.className = `status-card ${type}`;
    statusElement.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 5px;">${title}</div>
      <div style="font-size: 0.9em; opacity: 0.9;">${message}</div>
    `;
  }
  
  // İstatistikleri yükle
  function loadStats() {
    const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
    const totalKeywords = history.reduce((sum, item) => sum + (item.keywords?.length || 0), 0);
    
    analysisCountElement.textContent = history.length;
    keywordCountElement.textContent = totalKeywords;
  }

  // Bildirim ayarlarını yükle
  function loadNotificationSettings() {
    const preferences = JSON.parse(localStorage.getItem('eksiMapNotificationPreferences') || '{}');
    const realtimeEnabled = localStorage.getItem('eksiMapRealtimeEnabled') !== 'false';
    
    browserNotificationsToggle.checked = preferences.browserNotifications !== false;
    inPageNotificationsToggle.checked = preferences.inPageToasts !== false;
    realtimeMonitoringToggle.checked = realtimeEnabled;
  }

  // Bildirim tercihini güncelle
  function updateNotificationPreference(key, value) {
    const preferences = JSON.parse(localStorage.getItem('eksiMapNotificationPreferences') || '{}');
    preferences[key] = value;
    localStorage.setItem('eksiMapNotificationPreferences', JSON.stringify(preferences));
    
    // Content script'e bildir
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'UPDATE_NOTIFICATION_PREFERENCES',
        preferences: preferences
      });
    });
  }

  // Gerçek zamanlı izlemeyi güncelle
  function updateRealtimeMonitoring(enabled) {
    localStorage.setItem('eksiMapRealtimeEnabled', enabled);
    
    // Content script'e bildir
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'TOGGLE_REALTIME_MONITORING',
        enabled: enabled
      });
    });

    // Status güncelle
    const realtimeStatus = document.querySelector('.realtime-status');
    if (realtimeStatus) {
      if (enabled) {
        realtimeStatus.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        realtimeStatus.innerHTML = `
          <div class="realtime-indicator"></div>
          <span>🔄 Gerçek Zamanlı İzleme Aktif</span>
        `;
      } else {
        realtimeStatus.style.background = 'linear-gradient(135deg, #6c757d, #495057)';
        realtimeStatus.innerHTML = `
          <div class="realtime-indicator" style="background: #ccc; animation: none;"></div>
          <span>⏸️ Gerçek Zamanlı İzleme Kapalı</span>
        `;
      }
    }
  }
  
  // Kısayol tuşları
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !analyzeBtn.disabled) {
      analyzeBtn.click();
    }
    if (e.key === 'h' || e.key === 'H') {
      historyBtn.click();
    }
    if (e.key === 's' || e.key === 'S') {
      syncBtn.click();
    }
  });
  
  // Tooltip'ler
  analyzeBtn.title = 'Enter tuşu ile hızlı analiz';
  historyBtn.title = 'H tuşu ile hızlı geçmiş';
  syncBtn.title = 'S tuşu ile hızlı senkronizasyon';

  const aiRecommendationsBtn = document.getElementById('ai-recommendations-btn');
  if (aiRecommendationsBtn) {
    aiRecommendationsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'ai-recommendations.html' });
    });
  }
});

// Popup kapanırken temizlik
window.addEventListener('beforeunload', function() {
  // Gerekirse temizlik işlemleri
});
