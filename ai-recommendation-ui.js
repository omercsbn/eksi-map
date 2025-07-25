/**
 * AI Recommendation UI - Akıllı Öneriler Kullanıcı Arayüzü
 */

class AIRecommendationUI {
  constructor() {
    this.engine = null;
    this.currentRecommendations = [];
    this.isLoading = false;
    this.init();
  }

  async init() {
    try {
      // AI engine'i yükle
      if (window.aiRecommendationEngine) {
        this.engine = window.aiRecommendationEngine;
      } else {
        console.error('[AI Recommendation UI] AI Engine bulunamadı');
        return;
      }

      this.setupEventListeners();
      await this.loadUserProfile();
      await this.loadRecommendations();
      
      console.log('[AI Recommendation UI] Başlatıldı');
    } catch (error) {
      console.error('[AI Recommendation UI] Başlatma hatası:', error);
    }
  }

  setupEventListeners() {
    // Öneri yenileme butonu
    const refreshBtn = document.getElementById('ai-refresh-recommendations');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadRecommendations(true));
    }

    // Öneri filtreleri
    const filterInputs = document.querySelectorAll('.ai-filter-input');
    filterInputs.forEach(input => {
      input.addEventListener('change', () => this.applyFilters());
    });

    // Öneri geri bildirimi
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('ai-feedback-btn')) {
        const recommendationId = e.target.dataset.recommendationId;
        const feedback = e.target.dataset.feedback;
        this.recordFeedback(recommendationId, feedback);
      }
    });

    // Profil ayarları
    const profileBtn = document.getElementById('ai-profile-settings');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => this.showProfileSettings());
    }
  }

  async loadUserProfile() {
    try {
      if (!this.engine) return;

      const profile = this.engine.getUserProfile();
      this.updateProfileDisplay(profile);
    } catch (error) {
      console.error('[AI Recommendation UI] Profil yükleme hatası:', error);
    }
  }

  updateProfileDisplay(profile) {
    try {
      // Profil istatistikleri
      const statsContainer = document.getElementById('ai-profile-stats');
      if (statsContainer) {
        statsContainer.innerHTML = `
          <div class="stat-item">
            <span class="stat-label">Toplam Okuma</span>
            <span class="stat-value">${profile.statistics.totalReadings}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Ortalama Süre</span>
            <span class="stat-value">${profile.statistics.averageReadingTime.toFixed(1)} dk</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Günlük Seri</span>
            <span class="stat-value">${profile.goals.currentStreak} gün</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Favori Duygu</span>
            <span class="stat-value">${this.getSentimentLabel(profile.statistics.favoriteSentiment)}</span>
          </div>
        `;
      }

      // Hedefler
      const goalsContainer = document.getElementById('ai-goals-display');
      if (goalsContainer) {
        const today = new Date().toDateString();
        const todayReadings = this.engine.getLearningData().userInteractions
          .filter(interaction => new Date(interaction.timestamp).toDateString() === today)
          .length;

        const dailyProgress = (todayReadings / profile.goals.dailyReadingGoal) * 100;
        
        goalsContainer.innerHTML = `
          <div class="goal-item">
            <div class="goal-header">
              <span class="goal-title">Günlük Hedef</span>
              <span class="goal-progress">${todayReadings}/${profile.goals.dailyReadingGoal}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(dailyProgress, 100)}%"></div>
            </div>
          </div>
        `;
      }

      // Favori konular
      const topicsContainer = document.getElementById('ai-favorite-topics');
      if (topicsContainer && profile.behavior.favoriteTopics.length > 0) {
        topicsContainer.innerHTML = `
          <div class="topics-list">
            ${profile.behavior.favoriteTopics.map(topic => 
              `<span class="topic-tag">${topic}</span>`
            ).join('')}
          </div>
        `;
      }

    } catch (error) {
      console.error('[AI Recommendation UI] Profil güncelleme hatası:', error);
    }
  }

  getSentimentLabel(sentiment) {
    const labels = {
      positive: 'Pozitif',
      negative: 'Negatif',
      neutral: 'Nötr'
    };
    return labels[sentiment] || sentiment;
  }

  async loadRecommendations(forceRefresh = false) {
    try {
      if (!this.engine) return;

      this.setLoading(true);
      
      const filters = this.getActiveFilters();
      const recommendations = await this.engine.generateRecommendations({
        type: filters.algorithm,
        limit: filters.limit,
        includeSentiment: filters.includeSentiment,
        includeDiversity: filters.includeDiversity,
        forceRefresh
      });

      this.currentRecommendations = recommendations;
      this.displayRecommendations(recommendations);
      
    } catch (error) {
      console.error('[AI Recommendation UI] Öneri yükleme hatası:', error);
      this.showError('Öneriler yüklenirken hata oluştu');
    } finally {
      this.setLoading(false);
    }
  }

  getActiveFilters() {
    try {
      return {
        algorithm: document.getElementById('ai-algorithm-select')?.value || 'hybrid',
        limit: parseInt(document.getElementById('ai-limit-select')?.value) || 10,
        includeSentiment: document.getElementById('ai-sentiment-filter')?.checked || false,
        includeDiversity: document.getElementById('ai-diversity-filter')?.checked || false
      };
    } catch (error) {
      console.error('[AI Recommendation UI] Filtre alma hatası:', error);
      return {
        algorithm: 'hybrid',
        limit: 10,
        includeSentiment: false,
        includeDiversity: false
      };
    }
  }

  displayRecommendations(recommendations) {
    try {
      const container = document.getElementById('ai-recommendations-container');
      if (!container) return;

      if (recommendations.length === 0) {
        container.innerHTML = `
          <div class="no-recommendations">
            <div class="no-recommendations-icon">🤖</div>
            <h3>Henüz öneri yok</h3>
            <p>Daha fazla içerik okuduktan sonra kişiselleştirilmiş öneriler alacaksınız.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = recommendations.map((rec, index) => `
        <div class="recommendation-card" data-recommendation-id="${rec.id || index}">
          <div class="recommendation-header">
            <div class="recommendation-meta">
              <span class="recommendation-topic">${rec.topic || 'Genel'}</span>
              <span class="recommendation-sentiment ${rec.sentiment}">${this.getSentimentLabel(rec.sentiment)}</span>
            </div>
            <div class="recommendation-score">
              <span class="score-value">${(rec.finalScore * 100).toFixed(0)}%</span>
              <span class="score-label">Eşleşme</span>
            </div>
          </div>
          
          <div class="recommendation-content">
            <h4 class="recommendation-title">${rec.title || 'Öneri Başlığı'}</h4>
            <p class="recommendation-description">${rec.description || 'Bu içerik size özel olarak önerilmiştir.'}</p>
          </div>
          
          <div class="recommendation-footer">
            <div class="recommendation-actions">
              <button class="btn btn-primary btn-sm" onclick="window.open('${rec.url || '#'}', '_blank')">
                Oku
              </button>
              <button class="btn btn-outline btn-sm ai-feedback-btn" 
                      data-recommendation-id="${rec.id || index}" 
                      data-feedback="positive">
                👍
              </button>
              <button class="btn btn-outline btn-sm ai-feedback-btn" 
                      data-recommendation-id="${rec.id || index}" 
                      data-feedback="negative">
                👎
              </button>
            </div>
            <div class="recommendation-reason">
              <small>${this.getRecommendationReason(rec)}</small>
            </div>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('[AI Recommendation UI] Öneri gösterme hatası:', error);
    }
  }

  getRecommendationReason(recommendation) {
    const reasons = [];
    
    if (recommendation.finalScore > 0.8) {
      reasons.push('Yüksek eşleşme');
    }
    
    if (recommendation.popularity > 0.7) {
      reasons.push('Popüler içerik');
    }
    
    if (recommendation.topic && this.engine.getUserProfile().preferences.topics.includes(recommendation.topic)) {
      reasons.push('Favori konunuz');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Kişiselleştirilmiş öneri';
  }

  async recordFeedback(recommendationId, feedback) {
    try {
      if (!this.engine) return;

      await this.engine.recordRecommendationFeedback(recommendationId, feedback);
      
      // UI güncelleme
      this.showFeedbackSuccess(feedback);
      
      // Önerileri yeniden yükle
      setTimeout(() => {
        this.loadRecommendations(true);
      }, 1000);
      
    } catch (error) {
      console.error('[AI Recommendation UI] Geri bildirim kaydetme hatası:', error);
    }
  }

  showFeedbackSuccess(feedback) {
    const message = feedback === 'positive' ? 'Teşekkürler! Bu öneri beğenildi.' : 'Anlaşıldı, bu öneri beğenilmedi.';
    
    // Toast mesajı göster
    this.showToast(message, 'success');
  }

  applyFilters() {
    this.loadRecommendations(true);
  }

  showProfileSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>AI Profil Ayarları</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          ${this.getProfileSettingsForm()}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  getProfileSettingsForm() {
    const profile = this.engine.getUserProfile();
    
    return `
      <form id="ai-profile-form">
        <div class="form-group">
          <label>Günlük Okuma Hedefi</label>
          <input type="number" name="dailyReadingGoal" value="${profile.goals.dailyReadingGoal}" min="1" max="50">
        </div>
        
        <div class="form-group">
          <label>Duygu Dengesi Hedefi</label>
          <select name="diversityGoal">
            <option value="0.5" ${profile.goals.diversityGoal === 0.5 ? 'selected' : ''}>Daha dengeli</option>
            <option value="0.7" ${profile.goals.diversityGoal === 0.7 ? 'selected' : ''}>Orta düzey</option>
            <option value="0.9" ${profile.goals.diversityGoal === 0.9 ? 'selected' : ''}>Daha pozitif</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Favori Konular</label>
          <div class="topics-input">
            ${profile.preferences.topics.map(topic => 
              `<span class="topic-tag removable" data-topic="${topic}">
                ${topic} <button type="button" onclick="this.parentElement.remove()">×</button>
              </span>`
            ).join('')}
            <input type="text" id="new-topic" placeholder="Yeni konu ekle">
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Kaydet</button>
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">İptal</button>
        </div>
      </form>
    `;
  }

  setLoading(loading) {
    this.isLoading = loading;
    
    const container = document.getElementById('ai-recommendations-container');
    const refreshBtn = document.getElementById('ai-refresh-recommendations');
    
    if (loading) {
      if (container) {
        container.innerHTML = `
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Öneriler yükleniyor...</p>
          </div>
        `;
      }
      if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="spinner-small"></span> Yükleniyor...';
      }
    } else {
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '🔄 Yenile';
      }
    }
  }

  showError(message) {
    const container = document.getElementById('ai-recommendations-container');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <div class="error-icon">⚠️</div>
          <h3>Hata</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="aiRecommendationUI.loadRecommendations(true)">
            Tekrar Dene
          </button>
        </div>
      `;
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // 3 saniye sonra otomatik kaldır
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 3000);
  }

  getSystemStatus() {
    if (!this.engine) return null;
    
    return this.engine.getSystemStatus();
  }
}

// Global instance
window.aiRecommendationUI = new AIRecommendationUI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIRecommendationUI;
} 