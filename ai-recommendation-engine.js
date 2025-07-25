/**
 * AI Recommendation Engine - Akıllı Öneriler ve Kişiselleştirme Sistemi
 */

class AIRecommendationEngine {
  constructor() {
    this.userProfile = null;
    this.recommendationCache = new Map();
    this.learningData = {
      userInteractions: [],
      recommendationFeedback: [],
      patternData: {}
    };
    
    this.algorithms = {
      collaborative: new CollaborativeFiltering(),
      contentBased: new ContentBasedFiltering(),
      hybrid: new HybridRecommendation(),
      sentiment: new SentimentBasedRecommendation()
    };
    
    this.init();
  }

  async init() {
    try {
      await this.loadUserProfile();
      await this.loadLearningData();
      this.startLearningLoop();
      console.log('[AI Recommendation Engine] Başlatıldı');
    } catch (error) {
      console.error('[AI Recommendation Engine] Başlatma hatası:', error);
    }
  }

  async loadUserProfile() {
    try {
      const result = await chrome.storage.local.get('userProfile');
      this.userProfile = result.userProfile || this.createDefaultProfile();
      
      if (!result.userProfile) {
        await this.saveUserProfile();
      }
      
      return this.userProfile;
    } catch (error) {
      console.error('[AI Recommendation Engine] Profil yükleme hatası:', error);
      this.userProfile = this.createDefaultProfile();
      return this.userProfile;
    }
  }

  createDefaultProfile() {
    return {
      id: this.generateUserId(),
      createdAt: new Date().toISOString(),
      preferences: {
        topics: [],
        sentiment: 'neutral',
        readingTime: 'medium',
        activityLevel: 'medium'
      },
      behavior: {
        readingPatterns: [],
        favoriteTopics: [],
        activeHours: [],
        readingSpeed: 'medium'
      },
      goals: {
        dailyReadingGoal: 5,
        weeklyReadingGoal: 30,
        diversityGoal: 0.7,
        currentStreak: 0
      },
      statistics: {
        totalReadings: 0,
        averageReadingTime: 0,
        favoriteSentiment: 'neutral',
        mostActiveHour: 12
      },
      recommendations: {
        lastUpdated: null,
        cachedRecommendations: [],
        feedbackHistory: []
      }
    };
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async saveUserProfile() {
    try {
      await chrome.storage.local.set({ userProfile: this.userProfile });
    } catch (error) {
      console.error('[AI Recommendation Engine] Profil kaydetme hatası:', error);
    }
  }

  async loadLearningData() {
    try {
      const result = await chrome.storage.local.get('aiLearningData');
      this.learningData = result.aiLearningData || this.learningData;
    } catch (error) {
      console.error('[AI Recommendation Engine] Öğrenme verisi yükleme hatası:', error);
    }
  }

  async saveLearningData() {
    try {
      await chrome.storage.local.set({ aiLearningData: this.learningData });
    } catch (error) {
      console.error('[AI Recommendation Engine] Öğrenme verisi kaydetme hatası:', error);
    }
  }

  async generateRecommendations(options = {}) {
    try {
      const {
        type = 'hybrid',
        limit = 10,
        includeSentiment = true,
        includeDiversity = true,
        forceRefresh = false
      } = options;

      const cacheKey = `${type}_${limit}_${includeSentiment}_${includeDiversity}`;
      if (!forceRefresh && this.recommendationCache.has(cacheKey)) {
        const cached = this.recommendationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
          return cached.recommendations;
        }
      }

      let recommendations = [];

      switch (type) {
        case 'collaborative':
          recommendations = await this.algorithms.collaborative.getRecommendations(this.userProfile, limit);
          break;
        case 'content':
          recommendations = await this.algorithms.contentBased.getRecommendations(this.userProfile, limit);
          break;
        case 'sentiment':
          recommendations = await this.algorithms.sentiment.getRecommendations(this.userProfile, limit);
          break;
        case 'hybrid':
        default:
          recommendations = await this.algorithms.hybrid.getRecommendations(this.userProfile, limit);
          break;
      }

      if (includeSentiment) {
        recommendations = this.applySentimentBalance(recommendations);
      }

      if (includeDiversity) {
        recommendations = this.applyDiversityFilter(recommendations);
      }

      recommendations = this.scoreAndRankRecommendations(recommendations);

      this.recommendationCache.set(cacheKey, {
        recommendations,
        timestamp: Date.now()
      });

      this.userProfile.recommendations.lastUpdated = new Date().toISOString();
      this.userProfile.recommendations.cachedRecommendations = recommendations;
      await this.saveUserProfile();

      return recommendations;

    } catch (error) {
      console.error('[AI Recommendation Engine] Öneri oluşturma hatası:', error);
      return [];
    }
  }

  applySentimentBalance(recommendations) {
    try {
      const sentimentCounts = {
        positive: 0,
        negative: 0,
        neutral: 0
      };

      recommendations.forEach(rec => {
        if (rec.sentiment) {
          sentimentCounts[rec.sentiment] = (sentimentCounts[rec.sentiment] || 0) + 1;
        }
      });

      const targetBalance = this.userProfile.goals.diversityGoal || 0.7;
      const maxNegative = Math.floor(recommendations.length * (1 - targetBalance));

      if (sentimentCounts.negative > maxNegative) {
        const negativeRecs = recommendations.filter(rec => rec.sentiment === 'negative');
        const positiveRecs = recommendations.filter(rec => rec.sentiment === 'positive');
        const neutralRecs = recommendations.filter(rec => rec.sentiment === 'neutral');

        const balancedRecs = [
          ...negativeRecs.slice(0, maxNegative),
          ...positiveRecs,
          ...neutralRecs
        ];

        return balancedRecs.slice(0, recommendations.length);
      }

      return recommendations;
    } catch (error) {
      console.error('[AI Recommendation Engine] Duygu dengesi hatası:', error);
      return recommendations;
    }
  }

  applyDiversityFilter(recommendations) {
    try {
      const seenTopics = new Set();
      const diverseRecommendations = [];

      for (const rec of recommendations) {
        const topicKey = rec.topic || rec.category || 'general';
        
        if (!seenTopics.has(topicKey) || Math.random() < 0.3) {
          diverseRecommendations.push(rec);
          seenTopics.add(topicKey);
        }

        if (diverseRecommendations.length >= recommendations.length) {
          break;
        }
      }

      return diverseRecommendations;
    } catch (error) {
      console.error('[AI Recommendation Engine] Çeşitlilik filtresi hatası:', error);
      return recommendations;
    }
  }

  scoreAndRankRecommendations(recommendations) {
    try {
      return recommendations.map(rec => {
        let score = rec.baseScore || 0;

        if (this.userProfile.preferences.topics.includes(rec.topic)) {
          score += 0.3;
        }

        if (this.userProfile.preferences.sentiment === rec.sentiment) {
          score += 0.2;
        }

        const currentHour = new Date().getHours();
        if (this.userProfile.behavior.activeHours.includes(currentHour)) {
          score += 0.1;
        }

        if (rec.popularity) {
          score += rec.popularity * 0.1;
        }

        if (rec.timestamp) {
          const daysOld = (Date.now() - new Date(rec.timestamp).getTime()) / (1000 * 60 * 60 * 24);
          score += Math.max(0, 1 - daysOld / 30) * 0.1;
        }

        return {
          ...rec,
          finalScore: score
        };
      }).sort((a, b) => b.finalScore - a.finalScore);
    } catch (error) {
      console.error('[AI Recommendation Engine] Skorlama hatası:', error);
      return recommendations;
    }
  }

  async recordUserInteraction(interaction) {
    try {
      const enrichedInteraction = {
        ...interaction,
        timestamp: new Date().toISOString(),
        userProfile: {
          preferences: this.userProfile.preferences,
          behavior: this.userProfile.behavior
        }
      };

      this.learningData.userInteractions.push(enrichedInteraction);
      await this.updateUserProfile(interaction);
      await this.saveLearningData();
      this.analyzeUserPatterns();

    } catch (error) {
      console.error('[AI Recommendation Engine] Etkileşim kaydetme hatası:', error);
    }
  }

  async updateUserProfile(interaction) {
    try {
      this.userProfile.statistics.totalReadings++;
      
      if (interaction.readingTime) {
        const currentAvg = this.userProfile.statistics.averageReadingTime;
        const totalReadings = this.userProfile.statistics.totalReadings;
        this.userProfile.statistics.averageReadingTime = 
          (currentAvg * (totalReadings - 1) + interaction.readingTime) / totalReadings;
      }

      if (interaction.sentiment) {
        this.updateSentimentPreference(interaction.sentiment);
      }

      if (interaction.topic) {
        this.updateTopicPreference(interaction.topic);
      }

      const currentHour = new Date().getHours();
      if (!this.userProfile.behavior.activeHours.includes(currentHour)) {
        this.userProfile.behavior.activeHours.push(currentHour);
        this.userProfile.behavior.activeHours.sort();
      }

      this.updateGoals(interaction);
      await this.saveUserProfile();

    } catch (error) {
      console.error('[AI Recommendation Engine] Profil güncelleme hatası:', error);
    }
  }

  updateSentimentPreference(sentiment) {
    try {
      const sentimentCounts = {
        positive: 0,
        negative: 0,
        neutral: 0
      };

      const recentInteractions = this.learningData.userInteractions
        .slice(-50)
        .filter(interaction => interaction.sentiment);

      recentInteractions.forEach(interaction => {
        sentimentCounts[interaction.sentiment]++;
      });

      const favoriteSentiment = Object.keys(sentimentCounts)
        .reduce((a, b) => sentimentCounts[a] > sentimentCounts[b] ? a : b);

      this.userProfile.statistics.favoriteSentiment = favoriteSentiment;
      this.userProfile.preferences.sentiment = favoriteSentiment;

    } catch (error) {
      console.error('[AI Recommendation Engine] Duygu tercihi güncelleme hatası:', error);
    }
  }

  updateTopicPreference(topic) {
    try {
      if (!this.userProfile.preferences.topics.includes(topic)) {
        this.userProfile.preferences.topics.push(topic);
      }

      const topicCounts = {};
      const recentInteractions = this.learningData.userInteractions
        .slice(-100)
        .filter(interaction => interaction.topic);

      recentInteractions.forEach(interaction => {
        topicCounts[interaction.topic] = (topicCounts[interaction.topic] || 0) + 1;
      });

      this.userProfile.behavior.favoriteTopics = Object.keys(topicCounts)
        .sort((a, b) => topicCounts[b] - topicCounts[a])
        .slice(0, 5);

    } catch (error) {
      console.error('[AI Recommendation Engine] Konu tercihi güncelleme hatası:', error);
    }
  }

  updateGoals(interaction) {
    try {
      const today = new Date().toDateString();
      const todayReadings = this.learningData.userInteractions
        .filter(interaction => new Date(interaction.timestamp).toDateString() === today)
        .length;

      if (todayReadings >= this.userProfile.goals.dailyReadingGoal) {
        this.userProfile.goals.currentStreak++;
      }

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekReadings = this.learningData.userInteractions
        .filter(interaction => new Date(interaction.timestamp) >= weekStart)
        .length;

      if (weekReadings > this.userProfile.goals.weeklyReadingGoal * 1.2) {
        this.userProfile.goals.weeklyReadingGoal = Math.floor(weekReadings * 1.1);
      }

    } catch (error) {
      console.error('[AI Recommendation Engine] Hedef güncelleme hatası:', error);
    }
  }

  analyzeUserPatterns() {
    try {
      const patterns = {
        readingTime: this.analyzeReadingTimePattern(),
        topicPreferences: this.analyzeTopicPattern(),
        sentimentPattern: this.analyzeSentimentPattern(),
        activityPattern: this.analyzeActivityPattern()
      };

      this.learningData.patternData = patterns;
      this.userProfile.behavior.readingPatterns = patterns;
      this.userProfile.behavior.readingSpeed = this.calculateReadingSpeed();

    } catch (error) {
      console.error('[AI Recommendation Engine] Pattern analizi hatası:', error);
    }
  }

  analyzeReadingTimePattern() {
    try {
      const recentInteractions = this.learningData.userInteractions.slice(-100);
      const readingTimes = recentInteractions
        .filter(interaction => interaction.readingTime)
        .map(interaction => interaction.readingTime);

      if (readingTimes.length === 0) return 'medium';

      const avgTime = readingTimes.reduce((a, b) => a + b, 0) / readingTimes.length;

      if (avgTime < 2) return 'fast';
      if (avgTime > 5) return 'slow';
      return 'medium';

    } catch (error) {
      console.error('[AI Recommendation Engine] Okuma zamanı analizi hatası:', error);
      return 'medium';
    }
  }

  analyzeTopicPattern() {
    try {
      const recentInteractions = this.learningData.userInteractions.slice(-50);
      const topicCounts = {};

      recentInteractions.forEach(interaction => {
        if (interaction.topic) {
          topicCounts[interaction.topic] = (topicCounts[interaction.topic] || 0) + 1;
        }
      });

      return Object.keys(topicCounts)
        .sort((a, b) => topicCounts[b] - topicCounts[a])
        .slice(0, 3);

    } catch (error) {
      console.error('[AI Recommendation Engine] Konu analizi hatası:', error);
      return [];
    }
  }

  analyzeSentimentPattern() {
    try {
      const recentInteractions = this.learningData.userInteractions.slice(-50);
      const sentimentCounts = {};

      recentInteractions.forEach(interaction => {
        if (interaction.sentiment) {
          sentimentCounts[interaction.sentiment] = (sentimentCounts[interaction.sentiment] || 0) + 1;
        }
      });

      return sentimentCounts;

    } catch (error) {
      console.error('[AI Recommendation Engine] Duygu analizi hatası:', error);
      return {};
    }
  }

  analyzeActivityPattern() {
    try {
      const recentInteractions = this.learningData.userInteractions.slice(-100);
      const hourCounts = {};

      recentInteractions.forEach(interaction => {
        const hour = new Date(interaction.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const mostActiveHour = Object.keys(hourCounts)
        .reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);

      this.userProfile.statistics.mostActiveHour = parseInt(mostActiveHour);

      return hourCounts;

    } catch (error) {
      console.error('[AI Recommendation Engine] Aktivite analizi hatası:', error);
      return {};
    }
  }

  calculateReadingSpeed() {
    try {
      const recentInteractions = this.learningData.userInteractions.slice(-50);
      const readingTimes = recentInteractions
        .filter(interaction => interaction.readingTime)
        .map(interaction => interaction.readingTime);

      if (readingTimes.length === 0) return 'medium';

      const avgTime = readingTimes.reduce((a, b) => a + b, 0) / readingTimes.length;

      if (avgTime < 2) return 'fast';
      if (avgTime > 5) return 'slow';
      return 'medium';

    } catch (error) {
      console.error('[AI Recommendation Engine] Okuma hızı hesaplama hatası:', error);
      return 'medium';
    }
  }

  async recordRecommendationFeedback(recommendationId, feedback) {
    try {
      const feedbackRecord = {
        recommendationId,
        feedback,
        timestamp: new Date().toISOString(),
        userProfile: {
          preferences: this.userProfile.preferences,
          behavior: this.userProfile.behavior
        }
      };

      this.learningData.recommendationFeedback.push(feedbackRecord);
      this.userProfile.recommendations.feedbackHistory.push(feedbackRecord);

      await this.saveLearningData();
      await this.saveUserProfile();

      this.updateLearningAlgorithm(feedbackRecord);

    } catch (error) {
      console.error('[AI Recommendation Engine] Geri bildirim kaydetme hatası:', error);
    }
  }

  updateLearningAlgorithm(feedbackRecord) {
    try {
      if (feedbackRecord.feedback === 'positive') {
        this.algorithms.hybrid.updateWeights(feedbackRecord, 0.1);
      } else if (feedbackRecord.feedback === 'negative') {
        this.algorithms.hybrid.updateWeights(feedbackRecord, -0.1);
      }

    } catch (error) {
      console.error('[AI Recommendation Engine] Öğrenme algoritması güncelleme hatası:', error);
    }
  }

  startLearningLoop() {
    setInterval(async () => {
      try {
        await this.performLearningCycle();
      } catch (error) {
        console.error('[AI Recommendation Engine] Öğrenme döngüsü hatası:', error);
      }
    }, 30 * 60 * 1000);
  }

  async performLearningCycle() {
    try {
      this.analyzeUserPatterns();
      this.evaluateAlgorithmPerformance();
      this.clearOldCache();
      await this.saveLearningData();
      await this.saveUserProfile();

      console.log('[AI Recommendation Engine] Öğrenme döngüsü tamamlandı');

    } catch (error) {
      console.error('[AI Recommendation Engine] Öğrenme döngüsü hatası:', error);
    }
  }

  evaluateAlgorithmPerformance() {
    try {
      const recentFeedback = this.learningData.recommendationFeedback.slice(-100);
      const positiveFeedback = recentFeedback.filter(f => f.feedback === 'positive').length;
      const totalFeedback = recentFeedback.length;

      if (totalFeedback > 0) {
        const successRate = positiveFeedback / totalFeedback;
        console.log(`[AI Recommendation Engine] Algoritma başarı oranı: ${(successRate * 100).toFixed(1)}%`);
      }

    } catch (error) {
      console.error('[AI Recommendation Engine] Performans değerlendirme hatası:', error);
    }
  }

  clearOldCache() {
    try {
      const now = Date.now();
      const maxAge = 60 * 60 * 1000;

      for (const [key, value] of this.recommendationCache.entries()) {
        if (now - value.timestamp > maxAge) {
          this.recommendationCache.delete(key);
        }
      }

    } catch (error) {
      console.error('[AI Recommendation Engine] Cache temizleme hatası:', error);
    }
  }

  getUserProfile() {
    return { ...this.userProfile };
  }

  getLearningData() {
    return { ...this.learningData };
  }

  getSystemStatus() {
    return {
      isActive: true,
      lastLearningCycle: new Date().toISOString(),
      recommendationCount: this.recommendationCache.size,
      userInteractionsCount: this.learningData.userInteractions.length,
      feedbackCount: this.learningData.recommendationFeedback.length
    };
  }
}

// Algoritma sınıfları
class CollaborativeFiltering {
  async getRecommendations(userProfile, limit) {
    return [];
  }
}

class ContentBasedFiltering {
  async getRecommendations(userProfile, limit) {
    return [];
  }
}

class HybridRecommendation {
  async getRecommendations(userProfile, limit) {
    return [];
  }

  updateWeights(feedbackRecord, adjustment) {
  }
}

class SentimentBasedRecommendation {
  async getRecommendations(userProfile, limit) {
    return [];
  }
}

// Global instance
window.aiRecommendationEngine = new AIRecommendationEngine();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIRecommendationEngine;
}
