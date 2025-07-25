/**
 * Notification management system for Ekşi Map Pro
 * Handles browser notifications, in-page toasts, and notification preferences
 */
class NotificationManager {
  constructor() {
    this.permissions = null;
    this.preferences = this.loadPreferences();
    this.toastContainer = null;
    this.notificationHistory = [];
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize notification system
   */
  async initialize() {
    console.log('[NotificationManager] Initializing...');
    
    // Check browser notification permissions
    await this.checkPermissions();
    
    // Create toast container
    this.createToastContainer();
    
    // Load notification history
    this.loadNotificationHistory();
  }

  /**
   * Check and request notification permissions
   */
  async checkPermissions() {
    if (!('Notification' in window)) {
      console.warn('[NotificationManager] Browser notifications not supported');
      this.permissions = 'unsupported';
      return;
    }

    this.permissions = Notification.permission;
    
    if (this.permissions === 'default') {
      console.log('[NotificationManager] Requesting notification permissions...');
      this.permissions = await Notification.requestPermission();
    }
    
    console.log(`[NotificationManager] Notification permission: ${this.permissions}`);
  }

  /**
   * Load notification preferences from storage
   */
  loadPreferences() {
    const defaultPreferences = {
      browserNotifications: true,
      inPageToasts: true,
      soundEnabled: false,
      notificationTypes: {
        analysis_update: true,
        significant_change: true,
        error: true,
        info: false
      },
      frequency: 'immediate', // immediate, hourly, daily
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    const saved = localStorage.getItem('eksiMapNotificationPreferences');
    return saved ? { ...defaultPreferences, ...JSON.parse(saved) } : defaultPreferences;
  }

  /**
   * Save notification preferences to storage
   */
  savePreferences() {
    localStorage.setItem('eksiMapNotificationPreferences', JSON.stringify(this.preferences));
  }

  /**
   * Update notification preferences
   */
  updatePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
  }

  /**
   * Show notification based on type and data
   */
  showNotification(type, data) {
    console.log(`[NotificationManager] Showing notification: ${type}`, data);
    
    // Check if notifications are enabled for this type
    if (!this.shouldShowNotification(type)) {
      console.log(`[NotificationManager] Notifications disabled for type: ${type}`);
      return;
    }

    // Check quiet hours
    if (this.isInQuietHours()) {
      console.log('[NotificationManager] In quiet hours, skipping notification');
      return;
    }

    // Create notification content
    const notificationContent = this.createNotificationContent(type, data);
    
    // Show browser notification
    if (this.preferences.browserNotifications && this.permissions === 'granted') {
      this.showBrowserNotification(notificationContent);
    }
    
    // Show in-page toast
    if (this.preferences.inPageToasts) {
      this.showToast(notificationContent);
    }
    
    // Play sound if enabled
    if (this.preferences.soundEnabled) {
      this.playNotificationSound(type);
    }
    
    // Log to history
    this.logNotification(type, data, notificationContent);
  }

  /**
   * Check if notification should be shown based on preferences
   */
  shouldShowNotification(type) {
    return this.preferences.notificationTypes[type] !== false;
  }

  /**
   * Check if current time is in quiet hours
   */
  isInQuietHours() {
    if (!this.preferences.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Create notification content based on type and data
   */
  createNotificationContent(type, data) {
    const templates = {
      analysis_update: {
        title: '🧠 Analiz Güncellendi',
        message: 'Yeni entry\'ler analiz edildi ve önemli değişiklikler tespit edildi.',
        icon: '🧠',
        color: '#007bff'
      },
      significant_change: {
        title: '⚠️ Önemli Değişiklik',
        message: data?.data?.changeDescription || 'Başlıkta önemli bir değişiklik tespit edildi.',
        icon: '⚠️',
        color: '#ffc107'
      },
      error: {
        title: '❌ Hata',
        message: data?.message || 'Bir hata oluştu.',
        icon: '❌',
        color: '#dc3545'
      },
      info: {
        title: 'ℹ️ Bilgi',
        message: data?.message || 'Bilgilendirme mesajı.',
        icon: 'ℹ️',
        color: '#17a2b8'
      }
    };

    const template = templates[type] || templates.info;
    
    return {
      ...template,
      timestamp: Date.now(),
      type: type,
      data: data
    };
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(content) {
    try {
      const notification = new Notification(content.title, {
        body: content.message,
        icon: '/icon48.png', // Extension icon
        badge: '/icon32.png',
        tag: 'eksi-map-notification',
        requireInteraction: false,
        silent: !this.preferences.soundEnabled
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

    } catch (error) {
      console.error('[NotificationManager] Browser notification failed:', error);
    }
  }

  /**
   * Create toast container
   */
  createToastContainer() {
    if (this.toastContainer) return;
    
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'eksi-map-toast-container';
    this.toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    
    document.body.appendChild(this.toastContainer);
  }

  /**
   * Show in-page toast notification
   */
  showToast(content) {
    if (!this.toastContainer) {
      this.createToastContainer();
    }

    const toast = document.createElement('div');
    toast.className = 'eksi-map-toast';
    toast.style.cssText = `
      background: ${content.color};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
      pointer-events: auto;
      cursor: pointer;
      transform: translateX(-100%);
      opacity: 0;
      transition: all 0.3s ease;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 16px;">${content.icon}</span>
        <span style="font-weight: 600;">${content.title}</span>
      </div>
      <div style="font-size: 13px; opacity: 0.9;">${content.message}</div>
    `;

    this.toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(-100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);

    // Click to dismiss
    toast.addEventListener('click', () => {
      toast.style.transform = 'translateX(-100%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
  }

  /**
   * Play notification sound
   */
  playNotificationSound(type) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different notification types
      const soundConfig = {
        analysis_update: { frequency: 800, duration: 200 },
        significant_change: { frequency: 600, duration: 300 },
        error: { frequency: 400, duration: 400 },
        info: { frequency: 1000, duration: 150 }
      };

      const config = soundConfig[type] || soundConfig.info;

      oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration / 1000);

    } catch (error) {
      console.warn('[NotificationManager] Sound playback failed:', error);
    }
  }

  /**
   * Log notification to history
   */
  logNotification(type, data, content) {
    const notification = {
      id: Date.now() + Math.random(),
      type: type,
      title: content.title,
      message: content.message,
      timestamp: content.timestamp,
      data: data,
      read: false
    };

    this.notificationHistory.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }

    this.saveNotificationHistory();
  }

  /**
   * Load notification history from storage
   */
  loadNotificationHistory() {
    const saved = localStorage.getItem('eksiMapNotificationHistory');
    if (saved) {
      this.notificationHistory = JSON.parse(saved);
    }
  }

  /**
   * Save notification history to storage
   */
  saveNotificationHistory() {
    localStorage.setItem('eksiMapNotificationHistory', JSON.stringify(this.notificationHistory));
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId) {
    const notification = this.notificationHistory.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotificationHistory();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notificationHistory.forEach(notification => {
      notification.read = true;
    });
    this.saveNotificationHistory();
  }

  /**
   * Clear notification history
   */
  clearHistory() {
    this.notificationHistory = [];
    this.saveNotificationHistory();
  }

  /**
   * Get unread notification count
   */
  getUnreadCount() {
    return this.notificationHistory.filter(n => !n.read).length;
  }

  /**
   * Get recent notifications
   */
  getRecentNotifications(limit = 10) {
    return this.notificationHistory.slice(0, limit);
  }

  /**
   * Get notification statistics
   */
  getStats() {
    const total = this.notificationHistory.length;
    const unread = this.getUnreadCount();
    const byType = {};

    this.notificationHistory.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    });

    return {
      total,
      unread,
      byType,
      lastNotification: this.notificationHistory[0] || null
    };
  }

  /**
   * Test notification system
   */
  testNotification(type = 'info') {
    this.showNotification(type, {
      message: 'Bu bir test bildirimidir.',
      timestamp: Date.now()
    });
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    if (!('Notification' in window)) {
      throw new Error('Browser notifications not supported');
    }

    this.permissions = await Notification.requestPermission();
    return this.permissions;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus() {
    return this.permissions;
  }

  /**
   * Check if notifications are supported and enabled
   */
  isSupported() {
    return 'Notification' in window && this.permissions === 'granted';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
} 