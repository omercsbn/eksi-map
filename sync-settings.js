/**
 * Sync Settings - Senkronizasyon Ayarları Sayfası
 * Temiz kod prensipleri ile modüler yapı
 */

class SyncSettings {
  constructor() {
    this.syncManager = null;
    this.currentSettings = {};
    this.isLoading = false;
    
    this.init();
  }

  /**
   * Sayfa başlatma
   */
  async init() {
    try {
      await this.loadSyncManager();
      await this.loadSettings();
      this.bindEvents();
      this.updateUI();
      this.loadBackups();
      
      console.log('[SyncSettings] Sayfa başlatıldı');
    } catch (error) {
      console.error('[SyncSettings] Başlatma hatası:', error);
      this.showError('Sayfa yüklenirken hata oluştu: ' + error.message);
    }
  }

  /**
   * Sync Manager'ı yükle
   */
  async loadSyncManager() {
    try {
      if (window.syncManager) {
        this.syncManager = window.syncManager;
      } else {
        // Eğer syncManager henüz yüklenmemişse, yükle
        await this.loadScript('sync-manager.js');
        this.syncManager = window.syncManager;
      }
      
      if (!this.syncManager) {
        throw new Error('Sync Manager yüklenemedi');
      }
    } catch (error) {
      console.error('[SyncSettings] Sync Manager yükleme hatası:', error);
      throw error;
    }
  }

  /**
   * Script yükleme yardımcı fonksiyonu
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Ayarları yükle
   */
  async loadSettings() {
    try {
      this.currentSettings = await this.syncManager.loadSettings();
      console.log('[SyncSettings] Ayarlar yüklendi:', this.currentSettings);
    } catch (error) {
      console.error('[SyncSettings] Ayar yükleme hatası:', error);
      throw error;
    }
  }

  /**
   * Event binding
   */
  bindEvents() {
    // Toggle butonları
    document.getElementById('auto-sync-toggle')?.addEventListener('click', () => {
      this.toggleSetting('syncEnabled');
    });

    document.getElementById('encryption-toggle')?.addEventListener('click', () => {
      this.toggleSetting('encryptionEnabled');
    });

    document.getElementById('compression-toggle')?.addEventListener('click', () => {
      this.toggleSetting('compressionEnabled');
    });

    // Input değişiklikleri
    document.getElementById('sync-interval')?.addEventListener('change', (e) => {
      this.updateSetting('autoSyncInterval', parseInt(e.target.value));
    });

    document.getElementById('backup-interval')?.addEventListener('change', (e) => {
      this.updateSetting('autoBackupInterval', parseInt(e.target.value));
    });

    document.getElementById('cloud-provider')?.addEventListener('change', (e) => {
      this.updateSetting('cloudProvider', e.target.value);
      this.updateCloudAuthVisibility();
    });

    // Manuel işlem butonları
    document.getElementById('manual-sync-btn')?.addEventListener('click', () => {
      this.handleManualSync();
    });

    document.getElementById('manual-backup-btn')?.addEventListener('click', () => {
      this.handleManualBackup();
    });

    document.getElementById('export-data-btn')?.addEventListener('click', () => {
      this.handleExportData();
    });

    // Bulut auth butonu
    document.getElementById('cloud-auth-btn')?.addEventListener('click', () => {
      this.handleCloudAuth();
    });

    // Sync Manager event listener'ları
    this.syncManager.addListener((event, data) => {
      this.handleSyncEvent(event, data);
    });
  }

  /**
   * UI güncelleme
   */
  updateUI() {
    // Toggle durumlarını güncelle
    this.updateToggle('auto-sync-toggle', this.currentSettings.syncEnabled);
    this.updateToggle('encryption-toggle', this.currentSettings.encryptionEnabled);
    this.updateToggle('compression-toggle', this.currentSettings.compressionEnabled);

    // Input değerlerini güncelle
    document.getElementById('sync-interval').value = this.currentSettings.autoSyncInterval;
    document.getElementById('backup-interval').value = this.currentSettings.autoBackupInterval;
    document.getElementById('cloud-provider').value = this.currentSettings.cloudProvider;

    // Bulut auth görünürlüğünü güncelle
    this.updateCloudAuthVisibility();
  }

  /**
   * Toggle güncelleme
   */
  updateToggle(toggleId, isActive) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      if (isActive) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    }
  }

  /**
   * Bulut auth görünürlüğünü güncelle
   */
  updateCloudAuthVisibility() {
    const authItem = document.getElementById('cloud-auth-item');
    const provider = this.currentSettings.cloudProvider;
    
    if (provider === 'local') {
      authItem.style.display = 'none';
    } else {
      authItem.style.display = 'flex';
    }
  }

  /**
   * Toggle ayar değiştirme
   */
  async toggleSetting(settingName) {
    try {
      const currentValue = this.currentSettings[settingName];
      const newValue = !currentValue;
      
      await this.updateSetting(settingName, newValue);
    } catch (error) {
      console.error('[SyncSettings] Toggle ayar hatası:', error);
      this.showError('Ayar güncellenemedi: ' + error.message);
    }
  }

  /**
   * Ayar güncelleme
   */
  async updateSetting(settingName, value) {
    try {
      this.setLoading(true);
      
      await this.syncManager.updateSettings({ [settingName]: value });
      this.currentSettings[settingName] = value;
      
      this.updateUI();
      this.showSuccess('Ayar güncellendi');
      
    } catch (error) {
      console.error('[SyncSettings] Ayar güncelleme hatası:', error);
      this.showError('Ayar güncellenemedi: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Manuel senkronizasyon
   */
  async handleManualSync() {
    try {
      this.setLoading(true);
      this.updateStatus('Senkronize ediliyor...', 'syncing');
      
      const result = await this.syncManager.manualSync();
      
      if (result.success) {
        this.showSuccess('Senkronizasyon başarılı');
        this.updateStatus('Senkronizasyon tamamlandı', 'success');
      } else {
        this.showError('Senkronizasyon hatası: ' + result.error);
        this.updateStatus('Senkronizasyon hatası', 'error');
      }
      
    } catch (error) {
      console.error('[SyncSettings] Manuel senkronizasyon hatası:', error);
      this.showError('Senkronizasyon hatası: ' + error.message);
      this.updateStatus('Senkronizasyon hatası', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Manuel yedekleme
   */
  async handleManualBackup() {
    try {
      this.setLoading(true);
      this.updateStatus('Yedekleniyor...', 'syncing');
      
      const result = await this.syncManager.manualBackup();
      
      if (result.success) {
        this.showSuccess('Yedekleme başarılı');
        this.updateStatus('Yedekleme tamamlandı', 'success');
        this.loadBackups(); // Yedekleme listesini yenile
      } else {
        this.showError('Yedekleme hatası: ' + result.error);
        this.updateStatus('Yedekleme hatası', 'error');
      }
      
    } catch (error) {
      console.error('[SyncSettings] Manuel yedekleme hatası:', error);
      this.showError('Yedekleme hatası: ' + error.message);
      this.updateStatus('Yedekleme hatası', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Veri dışa aktarma
   */
  async handleExportData() {
    try {
      this.setLoading(true);
      
      const data = await this.syncManager.getLocalData();
      const exportData = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        data: data
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eksi-map-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showSuccess('Veri dışa aktarıldı');
      
    } catch (error) {
      console.error('[SyncSettings] Veri dışa aktarma hatası:', error);
      this.showError('Veri dışa aktarılamadı: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Bulut auth işlemi
   */
  async handleCloudAuth() {
    try {
      const provider = this.currentSettings.cloudProvider;
      
      if (provider === 'google-drive') {
        this.showInfo('Google Drive entegrasyonu henüz implement edilmedi');
      } else if (provider === 'dropbox') {
        this.showInfo('Dropbox entegrasyonu henüz implement edilmedi');
      }
      
    } catch (error) {
      console.error('[SyncSettings] Bulut auth hatası:', error);
      this.showError('Bulut bağlantısı kurulamadı: ' + error.message);
    }
  }

  /**
   * Yedeklemeleri yükle
   */
  async loadBackups() {
    try {
      const backups = await this.syncManager.getBackups();
      this.renderBackups(backups);
    } catch (error) {
      console.error('[SyncSettings] Yedekleme yükleme hatası:', error);
      this.renderBackups([]);
    }
  }

  /**
   * Yedeklemeleri render et
   */
  renderBackups(backups) {
    const backupList = document.getElementById('backup-list');
    
    if (backups.length === 0) {
      backupList.innerHTML = `
        <div class="backup-item">
          <div class="backup-info">
            <div class="backup-date">Henüz yedekleme bulunmuyor</div>
            <div class="backup-details">İlk yedeklemenizi oluşturmak için "Manuel Yedekleme" butonunu kullanın</div>
          </div>
        </div>
      `;
      return;
    }

    const backupItems = backups.map(backup => `
      <div class="backup-item">
        <div class="backup-info">
          <div class="backup-date">${new Date(backup.timestamp).toLocaleString('tr-TR')}</div>
          <div class="backup-details">Versiyon: ${backup.version} | Boyut: ${this.formatBytes(JSON.stringify(backup).length)}</div>
        </div>
        <div class="backup-actions">
          <button class="btn btn-small btn-success" onclick="syncSettings.restoreBackup('${backup.timestamp}')">
            Geri Yükle
          </button>
          <button class="btn btn-small btn-danger" onclick="syncSettings.deleteBackup('${backup.timestamp}')">
            Sil
          </button>
        </div>
      </div>
    `).join('');

    backupList.innerHTML = backupItems;
  }

  /**
   * Yedekleme geri yükleme
   */
  async restoreBackup(backupId) {
    try {
      if (!confirm('Bu yedeklemeyi geri yüklemek istediğinizden emin misiniz? Mevcut verileriniz değişecektir.')) {
        return;
      }

      this.setLoading(true);
      this.updateStatus('Yedekleme geri yükleniyor...', 'syncing');
      
      const result = await this.syncManager.restoreBackup(backupId);
      
      if (result.success) {
        this.showSuccess('Yedekleme başarıyla geri yüklendi');
        this.updateStatus('Yedekleme geri yüklendi', 'success');
        this.loadBackups(); // Listeyi yenile
      } else {
        this.showError('Geri yükleme hatası: ' + result.error);
        this.updateStatus('Geri yükleme hatası', 'error');
      }
      
    } catch (error) {
      console.error('[SyncSettings] Yedekleme geri yükleme hatası:', error);
      this.showError('Geri yükleme hatası: ' + error.message);
      this.updateStatus('Geri yükleme hatası', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Yedekleme silme
   */
  async deleteBackup(backupId) {
    try {
      if (!confirm('Bu yedeklemeyi silmek istediğinizden emin misiniz?')) {
        return;
      }

      this.setLoading(true);
      
      // Bu fonksiyon sync-manager.js'de implement edilmeli
      this.showInfo('Yedekleme silme özelliği henüz implement edilmedi');
      
    } catch (error) {
      console.error('[SyncSettings] Yedekleme silme hatası:', error);
      this.showError('Yedekleme silinemedi: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Sync event'lerini işle
   */
  handleSyncEvent(event, data) {
    switch (event) {
      case 'syncStarted':
        this.updateStatus('Senkronize ediliyor...', 'syncing');
        break;
      case 'syncCompleted':
        if (data.success) {
          this.updateStatus('Senkronizasyon tamamlandı', 'success');
        } else {
          this.updateStatus('Senkronizasyon hatası', 'error');
        }
        break;
      case 'backupStarted':
        this.updateStatus('Yedekleniyor...', 'syncing');
        break;
      case 'backupCompleted':
        if (data.success) {
          this.updateStatus('Yedekleme tamamlandı', 'success');
          this.loadBackups();
        } else {
          this.updateStatus('Yedekleme hatası', 'error');
        }
        break;
      case 'error':
        this.updateStatus('Hata oluştu', 'error');
        break;
    }
  }

  /**
   * Durum güncelleme
   */
  updateStatus(message, type = 'info') {
    const indicator = document.getElementById('status-indicator');
    const dot = indicator.querySelector('.status-dot');
    const text = indicator.querySelector('.status-text');
    
    // Dot rengini güncelle
    dot.className = 'status-dot';
    if (type === 'syncing') {
      dot.style.background = '#fbbf24';
    } else if (type === 'success') {
      dot.style.background = '#4ade80';
    } else if (type === 'error') {
      dot.style.background = '#f87171';
    } else {
      dot.style.background = '#94a3b8';
    }
    
    // Mesajı güncelle
    text.textContent = message;
    
    // Indicator class'ını güncelle
    indicator.className = 'status-indicator';
    if (type === 'error') {
      indicator.classList.add('error');
    } else if (type === 'success') {
      indicator.classList.add('success');
    }
  }

  /**
   * Loading durumu
   */
  setLoading(loading) {
    this.isLoading = loading;
    const container = document.querySelector('.container');
    
    if (loading) {
      container.classList.add('loading');
    } else {
      container.classList.remove('loading');
    }
  }

  /**
   * Başarı mesajı
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Hata mesajı
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Bilgi mesajı
   */
  showInfo(message) {
    this.showNotification(message, 'info');
  }

  /**
   * Bildirim göster
   */
  showNotification(message, type = 'info') {
    // Basit toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
      toast.style.background = '#4ade80';
    } else if (type === 'error') {
      toast.style.background = '#f87171';
    } else {
      toast.style.background = '#3b82f6';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  /**
   * Byte formatı
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Global instance
window.syncSettings = new SyncSettings();

// CSS animasyonları
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style); 