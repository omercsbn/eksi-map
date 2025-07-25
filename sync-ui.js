/**
 * Sync UI - Senkronizasyon Kullanıcı Arayüzü
 * Temiz kod prensipleri ile modüler yapı
 */

class SyncUI {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
    this.currentProgress = 0;
    this.progressInterval = null;
    
    this.init();
  }

  /**
   * UI başlatma
   */
  async init() {
    try {
      await this.createElements();
      this.bindEvents();
      this.startStatusUpdates();
      this.isInitialized = true;
      
      console.log('[SyncUI] Kullanıcı arayüzü başlatıldı');
    } catch (error) {
      console.error('[SyncUI] Başlatma hatası:', error);
    }
  }

  /**
   * UI elementlerini oluştur
   */
  async createElements() {
    // Ana senkronizasyon container'ı
    this.elements.container = this.createElement('div', {
      id: 'sync-container',
      className: 'sync-container'
    });

    // Durum göstergesi
    this.elements.statusIndicator = this.createElement('div', {
      id: 'sync-status',
      className: 'sync-status'
    });

    // İlerleme çubuğu
    this.elements.progressBar = this.createElement('div', {
      id: 'sync-progress',
      className: 'sync-progress'
    });

    // Kontrol butonları
    this.elements.controls = this.createElement('div', {
      id: 'sync-controls',
      className: 'sync-controls'
    });

    // Ayarlar paneli
    this.elements.settingsPanel = this.createElement('div', {
      id: 'sync-settings',
      className: 'sync-settings'
    });

    // Çakışma dialog'u
    this.elements.conflictDialog = this.createElement('div', {
      id: 'sync-conflict-dialog',
      className: 'sync-conflict-dialog'
    });

    // Elementleri birleştir
    this.elements.container.appendChild(this.elements.statusIndicator);
    this.elements.container.appendChild(this.elements.progressBar);
    this.elements.container.appendChild(this.elements.controls);
    this.elements.container.appendChild(this.elements.settingsPanel);

    // CSS stillerini ekle
    this.addStyles();
  }

  /**
   * Element oluşturma yardımcı fonksiyonu
   */
  createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  }

  /**
   * CSS stillerini ekle
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .sync-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 20px;
        margin: 15px 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .sync-status {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 15px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-weight: 500;
      }

      .sync-status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .sync-status-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      .sync-status-dot.syncing {
        background: #ffd700;
        animation: pulse 1s infinite;
      }

      .sync-status-dot.success {
        background: #4ade80;
      }

      .sync-status-dot.error {
        background: #f87171;
      }

      .sync-status-dot.idle {
        background: #94a3b8;
      }

      .sync-progress {
        margin-bottom: 15px;
        display: none;
      }

      .sync-progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        overflow: hidden;
      }

      .sync-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4ade80, #22d3ee);
        border-radius: 3px;
        transition: width 0.3s ease;
        width: 0%;
      }

      .sync-controls {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }

      .sync-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .sync-btn-primary {
        background: linear-gradient(135deg, #4ade80, #22d3ee);
        color: white;
      }

      .sync-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
      }

      .sync-btn-secondary {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      .sync-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .sync-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
      }

      .sync-settings {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
      }

      .sync-settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        color: white;
        font-weight: 600;
      }

      .sync-settings-toggle {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        padding: 5px;
      }

      .sync-settings-content {
        display: none;
        color: white;
      }

      .sync-settings-content.show {
        display: block;
      }

      .sync-setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .sync-setting-label {
        font-weight: 500;
        font-size: 14px;
      }

      .sync-setting-control {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .sync-toggle {
        position: relative;
        width: 44px;
        height: 24px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.3s ease;
      }

      .sync-toggle.active {
        background: #4ade80;
      }

      .sync-toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        transition: transform 0.3s ease;
      }

      .sync-toggle.active .sync-toggle-thumb {
        transform: translateX(20px);
      }

      .sync-select {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        color: white;
        padding: 6px 10px;
        font-size: 14px;
      }

      .sync-select option {
        background: #1f2937;
        color: white;
      }

      .sync-input {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        color: white;
        padding: 6px 10px;
        font-size: 14px;
        width: 80px;
      }

      .sync-input::placeholder {
        color: rgba(255, 255, 255, 0.7);
      }

      .sync-conflict-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }

      .sync-conflict-content {
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .sync-conflict-header {
        text-align: center;
        margin-bottom: 20px;
        color: #1f2937;
      }

      .sync-conflict-message {
        margin-bottom: 20px;
        color: #6b7280;
        line-height: 1.6;
      }

      .sync-conflict-options {
        display: flex;
        gap: 10px;
        justify-content: center;
      }

      .sync-conflict-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .sync-conflict-btn-primary {
        background: #4ade80;
        color: white;
      }

      .sync-conflict-btn-secondary {
        background: #f3f4f6;
        color: #374151;
      }

      .sync-conflict-btn:hover {
        transform: translateY(-2px);
      }

      .sync-backup-list {
        max-height: 200px;
        overflow-y: auto;
        margin-top: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 10px;
      }

      .sync-backup-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        margin-bottom: 5px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: white;
        font-size: 14px;
      }

      .sync-backup-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .sync-backup-date {
        font-weight: 500;
      }

      .sync-backup-size {
        font-size: 12px;
        opacity: 0.8;
      }

      .sync-backup-actions {
        display: flex;
        gap: 5px;
      }

      .sync-backup-btn {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .sync-backup-btn-restore {
        background: #4ade80;
        color: white;
      }

      .sync-backup-btn-delete {
        background: #f87171;
        color: white;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .sync-container {
        animation: slideIn 0.5s ease;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Event binding
   */
  bindEvents() {
    // Manuel senkronizasyon butonu
    this.elements.controls.innerHTML = `
      <button class="sync-btn sync-btn-primary" id="manual-sync">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
        Senkronize Et
      </button>
      <button class="sync-btn sync-btn-secondary" id="manual-backup">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2zm1-1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2z"/>
          <path d="M.5 3.9a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2zm1-1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2z"/>
          <path d="M.5 6.9a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2zm1-1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2z"/>
        </svg>
        Yedekle
      </button>
      <button class="sync-btn sync-btn-secondary" id="show-backups">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
        Yedekler
      </button>
    `;

    // Ayarlar paneli
    this.elements.settingsPanel.innerHTML = `
      <div class="sync-settings-header">
        <span>Senkronizasyon Ayarları</span>
        <button class="sync-settings-toggle" id="toggle-settings">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
        </button>
      </div>
      <div class="sync-settings-content" id="settings-content">
        <div class="sync-setting-item">
          <span class="sync-setting-label">Otomatik Senkronizasyon</span>
          <div class="sync-setting-control">
            <div class="sync-toggle" id="auto-sync-toggle">
              <div class="sync-toggle-thumb"></div>
            </div>
          </div>
        </div>
        <div class="sync-setting-item">
          <span class="sync-setting-label">Senkronizasyon Sıklığı</span>
          <div class="sync-setting-control">
            <input type="number" class="sync-input" id="sync-interval" min="1" max="60" value="5">
            <span>dakika</span>
          </div>
        </div>
        <div class="sync-setting-item">
          <span class="sync-setting-label">Yedekleme Sıklığı</span>
          <div class="sync-setting-control">
            <input type="number" class="sync-input" id="backup-interval" min="5" max="1440" value="15">
            <span>dakika</span>
          </div>
        </div>
        <div class="sync-setting-item">
          <span class="sync-setting-label">Bulut Servisi</span>
          <div class="sync-setting-control">
            <select class="sync-select" id="cloud-provider">
              <option value="local">Yerel</option>
              <option value="google-drive">Google Drive</option>
              <option value="dropbox">Dropbox</option>
            </select>
          </div>
        </div>
        <div class="sync-setting-item">
          <span class="sync-setting-label">Veri Şifreleme</span>
          <div class="sync-setting-control">
            <div class="sync-toggle" id="encryption-toggle">
              <div class="sync-toggle-thumb"></div>
            </div>
          </div>
        </div>
        <div class="sync-setting-item">
          <span class="sync-setting-label">Veri Sıkıştırma</span>
          <div class="sync-setting-control">
            <div class="sync-toggle" id="compression-toggle">
              <div class="sync-toggle-thumb"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // İlerleme çubuğu
    this.elements.progressBar.innerHTML = `
      <div class="sync-progress-bar">
        <div class="sync-progress-fill" id="progress-fill"></div>
      </div>
    `;

    // Event listener'ları ekle
    this.addEventListeners();
  }

  /**
   * Event listener'ları ekle
   */
  addEventListeners() {
    // Manuel senkronizasyon
    document.getElementById('manual-sync')?.addEventListener('click', async () => {
      await this.handleManualSync();
    });

    // Manuel yedekleme
    document.getElementById('manual-backup')?.addEventListener('click', async () => {
      await this.handleManualBackup();
    });

    // Yedeklemeleri göster
    document.getElementById('show-backups')?.addEventListener('click', () => {
      this.showBackupList();
    });

    // Ayarları göster/gizle
    document.getElementById('toggle-settings')?.addEventListener('click', () => {
      this.toggleSettings();
    });

    // Ayar değişiklikleri
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
    });
  }

  /**
   * Manuel senkronizasyon işlemi
   */
  async handleManualSync() {
    try {
      const btn = document.getElementById('manual-sync');
      btn.disabled = true;
      btn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="animate-spin">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
        Senkronize Ediliyor...
      `;

      this.showProgress();
      this.startProgressAnimation();

      const result = await window.syncManager.manualSync();
      
      if (result.success) {
        this.showNotification('Senkronizasyon başarılı!', 'success');
      } else {
        this.showNotification('Senkronizasyon hatası: ' + result.error, 'error');
      }

    } catch (error) {
      console.error('[SyncUI] Manuel senkronizasyon hatası:', error);
      this.showNotification('Senkronizasyon hatası: ' + error.message, 'error');
    } finally {
      this.hideProgress();
      this.resetManualSyncButton();
    }
  }

  /**
   * Manuel yedekleme işlemi
   */
  async handleManualBackup() {
    try {
      const btn = document.getElementById('manual-backup');
      btn.disabled = true;
      btn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="animate-spin">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
        Yedekleniyor...
      `;

      this.showProgress();
      this.startProgressAnimation();

      const result = await window.syncManager.manualBackup();
      
      if (result.success) {
        this.showNotification('Yedekleme başarılı!', 'success');
      } else {
        this.showNotification('Yedekleme hatası: ' + result.error, 'error');
      }

    } catch (error) {
      console.error('[SyncUI] Manuel yedekleme hatası:', error);
      this.showNotification('Yedekleme hatası: ' + error.message, 'error');
    } finally {
      this.hideProgress();
      this.resetManualBackupButton();
    }
  }

  /**
   * Yedekleme listesini göster
   */
  async showBackupList() {
    try {
      const backups = await window.syncManager.getBackups();
      
      if (backups.length === 0) {
        this.showNotification('Henüz yedekleme bulunmuyor.', 'info');
        return;
      }

      const backupList = backups.map(backup => `
        <div class="sync-backup-item">
          <div class="sync-backup-info">
            <div class="sync-backup-date">${new Date(backup.timestamp).toLocaleString('tr-TR')}</div>
            <div class="sync-backup-size">Versiyon: ${backup.version}</div>
          </div>
          <div class="sync-backup-actions">
            <button class="sync-backup-btn sync-backup-btn-restore" onclick="syncUI.restoreBackup('${backup.timestamp}')">
              Geri Yükle
            </button>
            <button class="sync-backup-btn sync-backup-btn-delete" onclick="syncUI.deleteBackup('${backup.timestamp}')">
              Sil
            </button>
          </div>
        </div>
      `).join('');

      const dialog = this.createBackupDialog(backupList);
      document.body.appendChild(dialog);
      
      setTimeout(() => {
        dialog.style.display = 'flex';
      }, 10);

    } catch (error) {
      console.error('[SyncUI] Yedekleme listesi hatası:', error);
      this.showNotification('Yedekleme listesi yüklenemedi.', 'error');
    }
  }

  /**
   * Yedekleme dialog'u oluştur
   */
  createBackupDialog(backupList) {
    const dialog = document.createElement('div');
    dialog.className = 'sync-conflict-dialog';
    dialog.innerHTML = `
      <div class="sync-conflict-content">
        <div class="sync-conflict-header">
          <h3>Yedeklemeler</h3>
        </div>
        <div class="sync-backup-list">
          ${backupList}
        </div>
        <div class="sync-conflict-options">
          <button class="sync-conflict-btn sync-conflict-btn-secondary" onclick="this.closest('.sync-conflict-dialog').remove()">
            Kapat
          </button>
        </div>
      </div>
    `;
    return dialog;
  }

  /**
   * Yedekleme geri yükleme
   */
  async restoreBackup(backupId) {
    try {
      const result = await window.syncManager.restoreBackup(backupId);
      
      if (result.success) {
        this.showNotification('Yedekleme başarıyla geri yüklendi!', 'success');
        // Dialog'u kapat
        document.querySelector('.sync-conflict-dialog')?.remove();
      } else {
        this.showNotification('Geri yükleme hatası: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('[SyncUI] Yedekleme geri yükleme hatası:', error);
      this.showNotification('Geri yükleme hatası: ' + error.message, 'error');
    }
  }

  /**
   * Yedekleme silme
   */
  async deleteBackup(backupId) {
    try {
      // Bu fonksiyon sync-manager.js'de implement edilmeli
      this.showNotification('Yedekleme silme özelliği henüz implement edilmedi.', 'info');
    } catch (error) {
      console.error('[SyncUI] Yedekleme silme hatası:', error);
      this.showNotification('Yedekleme silme hatası: ' + error.message, 'error');
    }
  }

  /**
   * Ayarları göster/gizle
   */
  toggleSettings() {
    const content = document.getElementById('settings-content');
    const toggle = document.getElementById('toggle-settings');
    
    if (content.classList.contains('show')) {
      content.classList.remove('show');
      toggle.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>
      `;
    } else {
      content.classList.add('show');
      toggle.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      `;
    }
  }

  /**
   * Toggle ayar değiştirme
   */
  toggleSetting(settingName) {
    const toggle = document.getElementById(`${settingName.replace(/([A-Z])/g, '-$1').toLowerCase()}-toggle`);
    const isActive = toggle.classList.contains('active');
    
    toggle.classList.toggle('active');
    this.updateSetting(settingName, !isActive);
  }

  /**
   * Ayar güncelleme
   */
  async updateSetting(settingName, value) {
    try {
      await window.syncManager.updateSettings({ [settingName]: value });
      this.showNotification('Ayar güncellendi!', 'success');
    } catch (error) {
      console.error('[SyncUI] Ayar güncelleme hatası:', error);
      this.showNotification('Ayar güncellenemedi: ' + error.message, 'error');
    }
  }

  /**
   * İlerleme çubuğunu göster
   */
  showProgress() {
    this.elements.progressBar.style.display = 'block';
  }

  /**
   * İlerleme çubuğunu gizle
   */
  hideProgress() {
    this.elements.progressBar.style.display = 'none';
    this.stopProgressAnimation();
  }

  /**
   * İlerleme animasyonu başlat
   */
  startProgressAnimation() {
    this.currentProgress = 0;
    this.progressInterval = setInterval(() => {
      this.currentProgress += Math.random() * 15;
      if (this.currentProgress > 90) this.currentProgress = 90;
      
      const fill = document.getElementById('progress-fill');
      if (fill) {
        fill.style.width = this.currentProgress + '%';
      }
    }, 200);
  }

  /**
   * İlerleme animasyonu durdur
   */
  stopProgressAnimation() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    
    const fill = document.getElementById('progress-fill');
    if (fill) {
      fill.style.width = '100%';
      setTimeout(() => {
        fill.style.width = '0%';
      }, 500);
    }
  }

  /**
   * Manuel senkronizasyon butonunu sıfırla
   */
  resetManualSyncButton() {
    const btn = document.getElementById('manual-sync');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
        Senkronize Et
      `;
    }
  }

  /**
   * Manuel yedekleme butonunu sıfırla
   */
  resetManualBackupButton() {
    const btn = document.getElementById('manual-backup');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2zm1-1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2z"/>
          <path d="M.5 3.9a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2zm1-1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2z"/>
          <path d="M.5 6.9a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h2zm1-1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2z"/>
        </svg>
        Yedekle
      `;
    }
  }

  /**
   * Durum güncellemelerini başlat
   */
  startStatusUpdates() {
    if (window.syncManager) {
      window.syncManager.addListener((event, data) => {
        this.handleSyncEvent(event, data);
      });
    }
  }

  /**
   * Senkronizasyon event'lerini işle
   */
  handleSyncEvent(event, data) {
    switch (event) {
      case 'syncStarted':
        this.updateStatus('syncing', 'Senkronize ediliyor...');
        break;
      case 'syncCompleted':
        if (data.success) {
          this.updateStatus('success', 'Senkronizasyon tamamlandı');
          this.hideProgress();
        } else {
          this.updateStatus('error', 'Senkronizasyon hatası');
          this.hideProgress();
        }
        break;
      case 'backupStarted':
        this.updateStatus('syncing', 'Yedekleniyor...');
        break;
      case 'backupCompleted':
        if (data.success) {
          this.updateStatus('success', 'Yedekleme tamamlandı');
          this.hideProgress();
        } else {
          this.updateStatus('error', 'Yedekleme hatası');
          this.hideProgress();
        }
        break;
      case 'conflictDetected':
        this.showConflictDialog(data);
        break;
      case 'error':
        this.updateStatus('error', 'Hata oluştu');
        break;
    }
  }

  /**
   * Durum güncelleme
   */
  updateStatus(status, message) {
    const statusIndicator = this.elements.statusIndicator;
    const dot = statusIndicator.querySelector('.sync-status-dot') || this.createElement('div', { className: 'sync-status-dot' });
    
    // Dot class'ını güncelle
    dot.className = 'sync-status-dot ' + status;
    
    // Mesajı güncelle
    const messageElement = statusIndicator.querySelector('.sync-status-message') || this.createElement('span', { className: 'sync-status-message' });
    messageElement.textContent = message;
    
    // Zaman damgasını güncelle
    const timestamp = statusIndicator.querySelector('.sync-status-time') || this.createElement('span', { className: 'sync-status-time' });
    timestamp.textContent = new Date().toLocaleTimeString('tr-TR');
    
    // Elementleri birleştir
    if (!statusIndicator.querySelector('.sync-status-indicator')) {
      const indicator = this.createElement('div', { className: 'sync-status-indicator' });
      indicator.appendChild(dot);
      indicator.appendChild(messageElement);
      statusIndicator.appendChild(indicator);
    }
    
    if (!statusIndicator.querySelector('.sync-status-time')) {
      statusIndicator.appendChild(timestamp);
    }
  }

  /**
   * Çakışma dialog'u göster
   */
  showConflictDialog(data) {
    const dialog = this.createElement('div', { className: 'sync-conflict-dialog' });
    dialog.innerHTML = `
      <div class="sync-conflict-content">
        <div class="sync-conflict-header">
          <h3>Veri Çakışması Tespit Edildi</h3>
        </div>
        <div class="sync-conflict-message">
          Yerel ve bulut verileriniz arasında çakışma tespit edildi. Hangi veriyi kullanmak istiyorsunuz?
        </div>
        <div class="sync-conflict-options">
          <button class="sync-conflict-btn sync-conflict-btn-primary" onclick="syncUI.resolveConflict('local')">
            Yerel Veriyi Kullan
          </button>
          <button class="sync-conflict-btn sync-conflict-btn-secondary" onclick="syncUI.resolveConflict('cloud')">
            Bulut Verisini Kullan
          </button>
          <button class="sync-conflict-btn sync-conflict-btn-secondary" onclick="syncUI.resolveConflict('merge')">
            Birleştir
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    setTimeout(() => {
      dialog.style.display = 'flex';
    }, 10);
  }

  /**
   * Çakışma çözümleme
   */
  async resolveConflict(resolution) {
    try {
      // Bu fonksiyon sync-manager.js'de implement edilmeli
      this.showNotification('Çakışma çözümleme özelliği henüz implement edilmedi.', 'info');
      
      // Dialog'u kapat
      document.querySelector('.sync-conflict-dialog')?.remove();
    } catch (error) {
      console.error('[SyncUI] Çakışma çözümleme hatası:', error);
      this.showNotification('Çakışma çözülemedi: ' + error.message, 'error');
    }
  }

  /**
   * Bildirim göster
   */
  showNotification(message, type = 'info') {
    // Mevcut notification sistemini kullan
    if (window.notificationManager) {
      window.notificationManager.showNotification(message, type);
    } else {
      // Basit alert
      alert(message);
    }
  }

  /**
   * UI'yi belirtilen container'a ekle
   */
  appendTo(container) {
    if (container && this.elements.container) {
      container.appendChild(this.elements.container);
    }
  }

  /**
   * UI'yi kaldır
   */
  remove() {
    if (this.elements.container && this.elements.container.parentNode) {
      this.elements.container.parentNode.removeChild(this.elements.container);
    }
  }

  /**
   * UI'yi güncelle
   */
  update() {
    if (window.syncManager) {
      const status = window.syncManager.getSyncStatus();
      this.updateStatus(status.isSyncing ? 'syncing' : 'idle', 
        status.isSyncing ? 'Senkronize ediliyor...' : 'Hazır');
    }
  }
}

// Global instance
window.syncUI = new SyncUI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncUI;
} 