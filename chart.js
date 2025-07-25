// chart.js - Chart.js CDN inject helper
(function() {
  'use strict';
  
  let chartJsLoaded = false;
  let chartJsLoading = false;
  let loadCallbacks = [];
  
  // Chart.js yükleme fonksiyonu
  function injectChartJs(callback) {
    // Eğer Chart.js zaten yüklüyse callback'i çağır
    if (window.Chart) {
      console.log('[Chart.js] Zaten yüklü');
      chartJsLoaded = true;
      return callback && callback();
    }
    
    // Eğer yükleme devam ediyorsa callback'i kuyruğa ekle
    if (chartJsLoading) {
      console.log('[Chart.js] Yükleme devam ediyor, callback kuyruğa eklendi');
      loadCallbacks.push(callback);
      return;
    }
    
    chartJsLoading = true;
    console.log('[Chart.js] Yükleniyor...');
    
    // Önce local dosyayı dene
    loadFromLocalFile();
    
    function loadFromLocalFile() {
      const localScript = document.createElement('script');
      localScript.src = chrome.runtime.getURL('chart.min.js');
      localScript.type = 'text/javascript';
      localScript.async = true;
      
      localScript.onload = function() {
        console.log('[Chart.js] Local dosyadan yüklendi');
        onChartJsLoaded();
      };
      
      localScript.onerror = function() {
        console.log('[Chart.js] Local dosya başarısız, CDN deneniyor...');
        loadFromCDN();
      };
      
      document.head.appendChild(localScript);
    }
    
    function loadFromCDN() {
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
      cdnScript.type = 'text/javascript';
      cdnScript.async = true;
      
      cdnScript.onload = function() {
        console.log('[Chart.js] CDN\'den yüklendi');
        onChartJsLoaded();
      };
      
      cdnScript.onerror = function() {
        console.log('[Chart.js] CDN başarısız, alternatif CDN deneniyor...');
        loadFromAlternativeCDN();
      };
      
      document.head.appendChild(cdnScript);
    }
    
    function loadFromAlternativeCDN() {
      const altScript = document.createElement('script');
      altScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.js';
      altScript.type = 'text/javascript';
      altScript.async = true;
      
      altScript.onload = function() {
        console.log('[Chart.js] Alternatif CDN\'den yüklendi');
        onChartJsLoaded();
      };
      
      altScript.onerror = function() {
        console.error('[Chart.js] Tüm kaynaklar başarısız');
        onChartJsError();
      };
      
      document.head.appendChild(altScript);
    }
    
    function onChartJsLoaded() {
      // Kısa bir gecikme ile Chart objesinin hazır olmasını bekle
      setTimeout(() => {
        if (window.Chart) {
          console.log('[Chart.js] Başarıyla yüklendi, Chart objesi:', typeof window.Chart);
          chartJsLoaded = true;
          chartJsLoading = false;
          
          // Tüm bekleyen callback'leri çağır
          if (callback) callback();
          loadCallbacks.forEach(cb => cb && cb());
          loadCallbacks = [];
        } else {
          console.error('[Chart.js] Chart objesi hala tanımsız');
          onChartJsError();
        }
      }, 100);
    }
    
    function onChartJsError() {
      chartJsLoading = false;
      console.error('[Chart.js] Yükleme başarısız');
      
      // Hata callback'lerini çağır
      if (callback) callback(new Error('Chart.js yüklenemedi'));
      loadCallbacks.forEach(cb => cb && cb(new Error('Chart.js yüklenemedi')));
      loadCallbacks = [];
    }
  }
  
  // Global fonksiyon olarak expose et
  window.injectChartJs = injectChartJs;
  
  // Chart.js durumunu kontrol et
  window.isChartJsLoaded = function() {
    return chartJsLoaded && !!window.Chart;
  };
  
  // Chart.js'i zorla yeniden yükle
  window.reloadChartJs = function(callback) {
    chartJsLoaded = false;
    chartJsLoading = false;
    loadCallbacks = [];
    
    // Mevcut Chart.js script'lerini kaldır
    const existingScripts = document.querySelectorAll('script[src*="chart.js"], script[src*="Chart.js"]');
    existingScripts.forEach(script => script.remove());
    
    // Yeniden yükle
    injectChartJs(callback);
  };
  
})();
