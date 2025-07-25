/**
 * Sync Manager - Veri Senkronizasyonu ve Yedekleme Sistemi
 * Temiz kod prensipleri ile modüler yapı
 */

class SyncManager {
  constructor() {
    this.syncStatus = {
      isSyncing: false,
      lastSync: null,
      lastBackup: null,
      syncErrors: [],
      pendingChanges: false
    };
    
    this.syncInterval = null;
    this.backupInterval = null;
    this.listeners = new Set();
    
    this.init();
  }

  /**
   * Sistem başlatma
   */
  async init() {
    try {
      await this.loadSettings();
      await this.startAutoSync();
      await this.startAutoBackup();
      this.notifyListeners('initialized');
    } catch (error) {
      console.error('[SyncManager] Başlatma hatası:', error);
      this.handleError(error);
    }
  }

  /**
   * Ayarları yükle
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get({
        syncEnabled: true,
        autoBackupInterval: 15, // dakika
        autoSyncInterval: 5, // dakika
        cloudProvider: 'local', // local, google-drive, dropbox
        encryptionEnabled: true,
        compressionEnabled: true,
        lastSyncTimestamp: null,
        lastBackupTimestamp: null
      });
      
      this.settings = result;
      return result;
    } catch (error) {
      console.error('[SyncManager] Ayarlar yüklenemedi:', error);
      throw error;
    }
  }

  /**
   * Otomatik senkronizasyon başlat
   */
  async startAutoSync() {
    if (!this.settings.syncEnabled) return;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.performSync();
      } catch (error) {
        console.error('[SyncManager] Otomatik senkronizasyon hatası:', error);
        this.handleError(error);
      }
    }, this.settings.autoSyncInterval * 60 * 1000);
  }

  /**
   * Otomatik yedekleme başlat
   */
  async startAutoBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    
    this.backupInterval = setInterval(async () => {
      try {
        await this.performBackup();
      } catch (error) {
        console.error('[SyncManager] Otomatik yedekleme hatası:', error);
        this.handleError(error);
      }
    }, this.settings.autoBackupInterval * 60 * 1000);
  }

  /**
   * Senkronizasyon gerçekleştir
   */
  async performSync() {
    if (this.syncStatus.isSyncing) {
      console.log('[SyncManager] Senkronizasyon zaten devam ediyor');
      return;
    }

    try {
      this.syncStatus.isSyncing = true;
      this.notifyListeners('syncStarted');

      // Yerel verileri al
      const localData = await this.getLocalData();
      
      // Bulut verilerini al (eğer bulut servisi aktifse)
      let cloudData = null;
      if (this.settings.cloudProvider !== 'local') {
        cloudData = await this.getCloudData();
      }

      // Çakışma kontrolü ve çözümleme
      if (cloudData && this.hasConflicts(localData, cloudData)) {
        await this.resolveConflicts(localData, cloudData);
      }

      // Verileri senkronize et
      const syncedData = await this.mergeData(localData, cloudData);
      
      // Yerel ve bulut verilerini güncelle
      await this.updateLocalData(syncedData);
      if (this.settings.cloudProvider !== 'local') {
        await this.updateCloudData(syncedData);
      }

      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.pendingChanges = false;
      this.syncStatus.syncErrors = [];
      
      this.notifyListeners('syncCompleted', { success: true });
      
    } catch (error) {
      console.error('[SyncManager] Senkronizasyon hatası:', error);
      this.syncStatus.syncErrors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
      this.notifyListeners('syncCompleted', { success: false, error });
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  /**
   * Yedekleme gerçekleştir
   */
  async performBackup() {
    try {
      this.notifyListeners('backupStarted');

      const data = await this.getLocalData();
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        data: data,
        checksum: await this.calculateChecksum(data)
      };

      // Sıkıştırma uygula
      if (this.settings.compressionEnabled) {
        backupData.data = await this.compressData(backupData.data);
      }

      // Şifreleme uygula
      if (this.settings.encryptionEnabled) {
        backupData.data = await this.encryptData(backupData.data);
      }

      // Yedeklemeyi kaydet
      await this.saveBackup(backupData);

      this.syncStatus.lastBackup = new Date().toISOString();
      this.notifyListeners('backupCompleted', { success: true });

    } catch (error) {
      console.error('[SyncManager] Yedekleme hatası:', error);
      this.notifyListeners('backupCompleted', { success: false, error });
    }
  }

  /**
   * Yerel verileri al
   */
  async getLocalData() {
    try {
      const result = await chrome.storage.local.get(null);
      return {
        analytics: result.analytics || {},
        searchHistory: result.searchHistory || [],
        userPreferences: result.userPreferences || {},
        analysisData: result.analysisData || {},
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[SyncManager] Yerel veri alma hatası:', error);
      throw error;
    }
  }

  /**
   * Bulut verilerini al
   */
  async getCloudData() {
    try {
      switch (this.settings.cloudProvider) {
        case 'google-drive':
          return await this.getGoogleDriveData();
        case 'dropbox':
          return await this.getDropboxData();
        default:
          return null;
      }
    } catch (error) {
      console.error('[SyncManager] Bulut veri alma hatası:', error);
      throw error;
    }
  }

  /**
   * Çakışma kontrolü
   */
  hasConflicts(localData, cloudData) {
    if (!localData || !cloudData) return false;
    
    const localTimestamp = new Date(localData.timestamp).getTime();
    const cloudTimestamp = new Date(cloudData.timestamp).getTime();
    
    // 5 dakikadan fazla fark varsa çakışma olabilir
    return Math.abs(localTimestamp - cloudTimestamp) > 5 * 60 * 1000;
  }

  /**
   * Çakışma çözümleme
   */
  async resolveConflicts(localData, cloudData) {
    try {
      // Kullanıcıya çakışma bildirimi gönder
      this.notifyListeners('conflictDetected', {
        localData,
        cloudData,
        timestamp: new Date().toISOString()
      });

      // Varsayılan olarak en son değişikliği kabul et
      const localTime = new Date(localData.timestamp).getTime();
      const cloudTime = new Date(cloudData.timestamp).getTime();
      
      return localTime > cloudTime ? localData : cloudData;
    } catch (error) {
      console.error('[SyncManager] Çakışma çözümleme hatası:', error);
      throw error;
    }
  }

  /**
   * Veri birleştirme
   */
  async mergeData(localData, cloudData) {
    if (!cloudData) return localData;
    if (!localData) return cloudData;

    try {
      return {
        analytics: { ...cloudData.analytics, ...localData.analytics },
        searchHistory: [...new Set([...cloudData.searchHistory, ...localData.searchHistory])],
        userPreferences: { ...cloudData.userPreferences, ...localData.userPreferences },
        analysisData: { ...cloudData.analysisData, ...localData.analysisData },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[SyncManager] Veri birleştirme hatası:', error);
      throw error;
    }
  }

  /**
   * Yerel verileri güncelle
   */
  async updateLocalData(data) {
    try {
      await chrome.storage.local.set({
        analytics: data.analytics,
        searchHistory: data.searchHistory,
        userPreferences: data.userPreferences,
        analysisData: data.analysisData
      });
    } catch (error) {
      console.error('[SyncManager] Yerel veri güncelleme hatası:', error);
      throw error;
    }
  }

  /**
   * Bulut verilerini güncelle
   */
  async updateCloudData(data) {
    try {
      switch (this.settings.cloudProvider) {
        case 'google-drive':
          return await this.updateGoogleDriveData(data);
        case 'dropbox':
          return await this.updateDropboxData(data);
        default:
          return;
      }
    } catch (error) {
      console.error('[SyncManager] Bulut veri güncelleme hatası:', error);
      throw error;
    }
  }

  /**
   * Manuel senkronizasyon
   */
  async manualSync() {
    try {
      await this.performSync();
      return { success: true };
    } catch (error) {
      console.error('[SyncManager] Manuel senkronizasyon hatası:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manuel yedekleme
   */
  async manualBackup() {
    try {
      await this.performBackup();
      return { success: true };
    } catch (error) {
      console.error('[SyncManager] Manuel yedekleme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Yedekleme geri yükleme
   */
  async restoreBackup(backupId) {
    try {
      this.notifyListeners('restoreStarted');

      const backup = await this.loadBackup(backupId);
      if (!backup) {
        throw new Error('Yedekleme bulunamadı');
      }

      // Şifre çözme
      if (this.settings.encryptionEnabled) {
        backup.data = await this.decryptData(backup.data);
      }

      // Sıkıştırma çözme
      if (this.settings.compressionEnabled) {
        backup.data = await this.decompressData(backup.data);
      }

      // Checksum kontrolü
      const currentChecksum = await this.calculateChecksum(backup.data);
      if (currentChecksum !== backup.checksum) {
        throw new Error('Yedekleme verisi bozulmuş');
      }

      // Verileri geri yükle
      await this.updateLocalData(backup.data);

      this.notifyListeners('restoreCompleted', { success: true });
      return { success: true };

    } catch (error) {
      console.error('[SyncManager] Yedekleme geri yükleme hatası:', error);
      this.notifyListeners('restoreCompleted', { success: false, error });
      return { success: false, error: error.message };
    }
  }

  /**
   * Checksum hesaplama
   */
  async calculateChecksum(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('[SyncManager] Checksum hesaplama hatası:', error);
      throw error;
    }
  }

  /**
   * Veri sıkıştırma
   */
  async compressData(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonString);
      
      // Basit LZ4 benzeri sıkıştırma (gerçek implementasyon için LZ4 kütüphanesi kullanılabilir)
      const compressed = await this.simpleCompress(dataBuffer);
      return compressed;
    } catch (error) {
      console.error('[SyncManager] Veri sıkıştırma hatası:', error);
      throw error;
    }
  }

  /**
   * Veri sıkıştırma çözme
   */
  async decompressData(compressedData) {
    try {
      const decompressed = await this.simpleDecompress(compressedData);
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decompressed);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[SyncManager] Veri sıkıştırma çözme hatası:', error);
      throw error;
    }
  }

  /**
   * Basit sıkıştırma (demo amaçlı)
   */
  async simpleCompress(buffer) {
    // Gerçek implementasyonda LZ4 veya benzeri kullanılmalı
    return buffer;
  }

  /**
   * Basit sıkıştırma çözme (demo amaçlı)
   */
  async simpleDecompress(buffer) {
    // Gerçek implementasyonda LZ4 veya benzeri kullanılmalı
    return buffer;
  }

  /**
   * Veri şifreleme
   */
  async encryptData(data) {
    try {
      const key = await this.getEncryptionKey();
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );
      
      return {
        data: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv)
      };
    } catch (error) {
      console.error('[SyncManager] Veri şifreleme hatası:', error);
      throw error;
    }
  }

  /**
   * Veri şifre çözme
   */
  async decryptData(encryptedData) {
    try {
      const key = await this.getEncryptionKey();
      const data = new Uint8Array(encryptedData.data);
      const iv = new Uint8Array(encryptedData.iv);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decrypted);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[SyncManager] Veri şifre çözme hatası:', error);
      throw error;
    }
  }

  /**
   * Şifreleme anahtarı al
   */
  async getEncryptionKey() {
    try {
      const storedKey = await chrome.storage.local.get('encryptionKey');
      if (storedKey.encryptionKey) {
        return await crypto.subtle.importKey(
          'raw',
          new Uint8Array(storedKey.encryptionKey),
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      }
      
      // Yeni anahtar oluştur
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      const exportedKey = await crypto.subtle.exportKey('raw', key);
      await chrome.storage.local.set({
        encryptionKey: Array.from(new Uint8Array(exportedKey))
      });
      
      return key;
    } catch (error) {
      console.error('[SyncManager] Şifreleme anahtarı hatası:', error);
      throw error;
    }
  }

  /**
   * Yedekleme kaydet
   */
  async saveBackup(backupData) {
    try {
      const backups = await this.getBackups();
      backups.push(backupData);
      
      // Son 10 yedeklemeyi tut
      if (backups.length > 10) {
        backups.splice(0, backups.length - 10);
      }
      
      await chrome.storage.local.set({ backups });
    } catch (error) {
      console.error('[SyncManager] Yedekleme kaydetme hatası:', error);
      throw error;
    }
  }

  /**
   * Yedeklemeleri al
   */
  async getBackups() {
    try {
      const result = await chrome.storage.local.get('backups');
      return result.backups || [];
    } catch (error) {
      console.error('[SyncManager] Yedekleme alma hatası:', error);
      throw error;
    }
  }

  /**
   * Yedekleme yükle
   */
  async loadBackup(backupId) {
    try {
      const backups = await this.getBackups();
      return backups.find(backup => backup.timestamp === backupId);
    } catch (error) {
      console.error('[SyncManager] Yedekleme yükleme hatası:', error);
      throw error;
    }
  }

  /**
   * Google Drive veri alma (placeholder)
   */
  async getGoogleDriveData() {
    // Google Drive API implementasyonu burada olacak
    throw new Error('Google Drive entegrasyonu henüz implement edilmedi');
  }

  /**
   * Dropbox veri alma (placeholder)
   */
  async getDropboxData() {
    // Dropbox API implementasyonu burada olacak
    throw new Error('Dropbox entegrasyonu henüz implement edilmedi');
  }

  /**
   * Google Drive veri güncelleme (placeholder)
   */
  async updateGoogleDriveData(data) {
    // Google Drive API implementasyonu burada olacak
    throw new Error('Google Drive entegrasyonu henüz implement edilmedi');
  }

  /**
   * Dropbox veri güncelleme (placeholder)
   */
  async updateDropboxData(data) {
    // Dropbox API implementasyonu burada olacak
    throw new Error('Dropbox entegrasyonu henüz implement edilmedi');
  }

  /**
   * Hata yönetimi
   */
  handleError(error) {
    this.syncStatus.syncErrors.push({
      timestamp: new Date().toISOString(),
      error: error.message
    });
    
    this.notifyListeners('error', { error });
  }

  /**
   * Dinleyici ekleme
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  /**
   * Dinleyici kaldırma
   */
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  /**
   * Dinleyicilere bildirim gönderme
   */
  notifyListeners(event, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[SyncManager] Dinleyici hatası:', error);
      }
    });
  }

  /**
   * Senkronizasyon durumu al
   */
  getSyncStatus() {
    return { ...this.syncStatus };
  }

  /**
   * Ayarları güncelle
   */
  async updateSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await chrome.storage.sync.set(this.settings);
      
      // Otomatik işlemleri yeniden başlat
      await this.startAutoSync();
      await this.startAutoBackup();
      
      this.notifyListeners('settingsUpdated', this.settings);
    } catch (error) {
      console.error('[SyncManager] Ayar güncelleme hatası:', error);
      throw error;
    }
  }

  /**
   * Sistem temizleme
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    this.listeners.clear();
  }
}

// Global instance
window.syncManager = new SyncManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncManager;
} 