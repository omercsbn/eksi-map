/**
 * Analysis comparison engine for Ekşi Map Pro
 * Compares analysis results and detects significant changes
 */
class AnalysisComparison {
  constructor() {
    this.config = {
      keywordSimilarityThreshold: 0.3, // 30% similarity threshold
      toneChangeThreshold: 0.5, // Significant tone change threshold
      sentimentChangeThreshold: 0.3, // Significant sentiment change threshold
      newKeywordThreshold: 0.4, // New keywords significance threshold
      changeDescriptionThreshold: 0.6 // Threshold for generating change descriptions
    };
  }

  /**
   * Compare two analysis results
   */
  compareResults(previous, current) {
    if (!previous || !current) {
      return {
        hasSignificantChanges: false,
        changeDescription: 'Önceki analiz verisi bulunamadı.',
        changes: {}
      };
    }

    console.log('[AnalysisComparison] Comparing results...');

    const changes = {
      keywords: this.compareKeywords(previous.keywords || [], current.keywords || []),
      tone: this.compareTone(previous.tone, current.tone),
      sentiment: this.compareSentiment(previous.sentiment, current.sentiment),
      entryCount: this.compareEntryCount(previous.entryCount, current.entryCount),
      summary: this.compareSummary(previous.summary, current.summary)
    };

    const hasSignificantChanges = this.detectSignificantChanges(changes);
    const changeDescription = this.generateChangeDescription(changes, hasSignificantChanges);

    return {
      hasSignificantChanges,
      changeDescription,
      changes,
      timestamp: Date.now(),
      previousState: previous,
      currentState: current
    };
  }

  /**
   * Compare keyword lists
   */
  compareKeywords(previousKeywords, currentKeywords) {
    const previousSet = new Set(previousKeywords);
    const currentSet = new Set(currentKeywords);
    
    const added = currentKeywords.filter(k => !previousSet.has(k));
    const removed = previousKeywords.filter(k => !currentSet.has(k));
    const common = currentKeywords.filter(k => previousSet.has(k));
    
    const similarity = common.length / Math.max(previousKeywords.length, currentKeywords.length, 1);
    const changeRatio = (added.length + removed.length) / Math.max(previousKeywords.length, currentKeywords.length, 1);
    
    return {
      added,
      removed,
      common,
      similarity,
      changeRatio,
      isSignificant: changeRatio > this.config.newKeywordThreshold
    };
  }

  /**
   * Compare tone changes
   */
  compareTone(previousTone, currentTone) {
    if (!previousTone || !currentTone) {
      return {
        changed: false,
        previous: previousTone,
        current: currentTone,
        isSignificant: false
      };
    }

    const toneMap = {
      'coşkulu': 0.8,
      'mutlu': 0.7,
      'nötr': 0.5,
      'üzgün': 0.3,
      'sinirli': 0.2,
      'ironik': 0.4,
      'sarkastik': 0.3,
      'şaşırmış': 0.6,
      'korku': 0.1,
      'tiksinti': 0.0,
      'eleştirel': 0.4
    };

    const previousScore = toneMap[previousTone.toLowerCase()] || 0.5;
    const currentScore = toneMap[currentTone.toLowerCase()] || 0.5;
    const change = Math.abs(currentScore - previousScore);
    
    return {
      changed: previousTone !== currentTone,
      previous: previousTone,
      current: currentTone,
      previousScore,
      currentScore,
      change,
      isSignificant: change > this.config.toneChangeThreshold
    };
  }

  /**
   * Compare sentiment scores
   */
  compareSentiment(previousSentiment, currentSentiment) {
    if (previousSentiment === null || currentSentiment === null) {
      return {
        changed: false,
        previous: previousSentiment,
        current: currentSentiment,
        isSignificant: false
      };
    }

    const change = Math.abs(currentSentiment - previousSentiment);
    
    return {
      changed: previousSentiment !== currentSentiment,
      previous: previousSentiment,
      current: currentSentiment,
      change,
      isSignificant: change > this.config.sentimentChangeThreshold
    };
  }

  /**
   * Compare entry counts
   */
  compareEntryCount(previousCount, currentCount) {
    if (!previousCount || !currentCount) {
      return {
        changed: false,
        previous: previousCount,
        current: currentCount,
        difference: 0,
        isSignificant: false
      };
    }

    const difference = currentCount - previousCount;
    const changeRatio = Math.abs(difference) / previousCount;
    
    return {
      changed: difference !== 0,
      previous: previousCount,
      current: currentCount,
      difference,
      changeRatio,
      isSignificant: changeRatio > 0.1 // 10% change threshold
    };
  }

  /**
   * Compare summaries
   */
  compareSummary(previousSummary, currentSummary) {
    if (!previousSummary || !currentSummary) {
      return {
        changed: false,
        similarity: 0,
        isSignificant: false
      };
    }

    // Simple text similarity using common words
    const previousWords = new Set(previousSummary.toLowerCase().split(/\s+/));
    const currentWords = new Set(currentSummary.toLowerCase().split(/\s+/));
    
    const commonWords = [...previousWords].filter(word => currentWords.has(word));
    const totalWords = new Set([...previousWords, ...currentWords]);
    
    const similarity = commonWords.length / totalWords.size;
    
    return {
      changed: previousSummary !== currentSummary,
      similarity,
      isSignificant: similarity < this.config.keywordSimilarityThreshold
    };
  }

  /**
   * Detect if changes are significant overall
   */
  detectSignificantChanges(changes) {
    const significantChanges = [
      changes.keywords.isSignificant,
      changes.tone.isSignificant,
      changes.sentiment.isSignificant,
      changes.entryCount.isSignificant,
      changes.summary.isSignificant
    ];

    // Consider significant if at least 2 major changes occurred
    return significantChanges.filter(Boolean).length >= 2;
  }

  /**
   * Generate human-readable change description
   */
  generateChangeDescription(changes, hasSignificantChanges) {
    if (!hasSignificantChanges) {
      return 'Önemli bir değişiklik tespit edilmedi.';
    }

    const descriptions = [];

    // Entry count changes
    if (changes.entryCount.isSignificant) {
      const diff = changes.entryCount.difference;
      if (diff > 0) {
        descriptions.push(`${diff} yeni entry eklendi`);
      } else {
        descriptions.push(`${Math.abs(diff)} entry silindi`);
      }
    }

    // Tone changes
    if (changes.tone.isSignificant) {
      const toneEmojis = {
        'coşkulu': '🤩',
        'mutlu': '😊',
        'nötr': '😐',
        'üzgün': '😢',
        'sinirli': '😡',
        'ironik': '😏',
        'sarkastik': '🙃',
        'şaşırmış': '😲',
        'korku': '😨',
        'tiksinti': '🤢',
        'eleştirel': '🤔'
      };

      const previousEmoji = toneEmojis[changes.tone.previous] || '😐';
      const currentEmoji = toneEmojis[changes.tone.current] || '😐';
      descriptions.push(`Ton değişti: ${previousEmoji} → ${currentEmoji}`);
    }

    // Keyword changes
    if (changes.keywords.isSignificant) {
      if (changes.keywords.added.length > 0) {
        const newKeywords = changes.keywords.added.slice(0, 3).join(', ');
        descriptions.push(`Yeni anahtar kelimeler: ${newKeywords}`);
      }
    }

    // Sentiment changes
    if (changes.sentiment.isSignificant) {
      const sentiment = changes.sentiment.current > changes.sentiment.previous ? 'yükseldi' : 'düştü';
      descriptions.push(`Duygu durumu ${sentiment}`);
    }

    return descriptions.join('. ') + '.';
  }

  /**
   * Detect trends in historical data
   */
  detectTrends(history, timeWindow = 7) {
    if (history.length < 2) {
      return {
        hasTrends: false,
        trends: [],
        description: 'Yeterli veri yok'
      };
    }

    const recentHistory = history.slice(-timeWindow);
    const trends = [];

    // Tone trend analysis
    const toneTrend = this.analyzeToneTrend(recentHistory);
    if (toneTrend.hasTrend) {
      trends.push(toneTrend);
    }

    // Sentiment trend analysis
    const sentimentTrend = this.analyzeSentimentTrend(recentHistory);
    if (sentimentTrend.hasTrend) {
      trends.push(sentimentTrend);
    }

    // Keyword frequency trend
    const keywordTrend = this.analyzeKeywordTrend(recentHistory);
    if (keywordTrend.hasTrend) {
      trends.push(keywordTrend);
    }

    return {
      hasTrends: trends.length > 0,
      trends,
      description: this.generateTrendDescription(trends)
    };
  }

  /**
   * Analyze tone trends
   */
  analyzeToneTrend(history) {
    const tones = history.map(item => item.tone).filter(Boolean);
    if (tones.length < 3) return { hasTrend: false };

    const toneScores = tones.map(tone => {
      const scoreMap = {
        'coşkulu': 0.8, 'mutlu': 0.7, 'nötr': 0.5, 'üzgün': 0.3,
        'sinirli': 0.2, 'ironik': 0.4, 'sarkastik': 0.3
      };
      return scoreMap[tone.toLowerCase()] || 0.5;
    });

    const trend = this.calculateTrend(toneScores);
    
    return {
      type: 'tone',
      hasTrend: Math.abs(trend) > 0.1,
      direction: trend > 0 ? 'positive' : 'negative',
      strength: Math.abs(trend),
      description: trend > 0 ? 'Ton giderek daha pozitif' : 'Ton giderek daha negatif'
    };
  }

  /**
   * Analyze sentiment trends
   */
  analyzeSentimentTrend(history) {
    const sentiments = history.map(item => item.sentiment).filter(s => s !== null);
    if (sentiments.length < 3) return { hasTrend: false };

    const trend = this.calculateTrend(sentiments);
    
    return {
      type: 'sentiment',
      hasTrend: Math.abs(trend) > 0.05,
      direction: trend > 0 ? 'positive' : 'negative',
      strength: Math.abs(trend),
      description: trend > 0 ? 'Duygu durumu iyileşiyor' : 'Duygu durumu kötüleşiyor'
    };
  }

  /**
   * Analyze keyword frequency trends
   */
  analyzeKeywordTrend(history) {
    const allKeywords = history.flatMap(item => item.keywords || []);
    if (allKeywords.length < 5) return { hasTrend: false };

    const keywordCounts = {};
    allKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });

    const sortedKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      type: 'keywords',
      hasTrend: true,
      topKeywords: sortedKeywords.map(([keyword, count]) => ({ keyword, count })),
      description: `En popüler kelimeler: ${sortedKeywords.slice(0, 3).map(([k]) => k).join(', ')}`
    };
  }

  /**
   * Calculate linear trend from array of numbers
   */
  calculateTrend(values) {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Generate trend description
   */
  generateTrendDescription(trends) {
    if (trends.length === 0) return 'Belirgin trend bulunamadı.';

    const descriptions = trends.map(trend => trend.description);
    return descriptions.join('. ') + '.';
  }

  /**
   * Get comparison statistics
   */
  getComparisonStats(comparison) {
    return {
      totalChanges: Object.values(comparison.changes).filter(c => c.changed || c.isSignificant).length,
      significantChanges: Object.values(comparison.changes).filter(c => c.isSignificant).length,
      changeScore: this.calculateChangeScore(comparison.changes),
      timestamp: comparison.timestamp
    };
  }

  /**
   * Calculate overall change score
   */
  calculateChangeScore(changes) {
    let score = 0;
    
    if (changes.keywords.isSignificant) score += 0.3;
    if (changes.tone.isSignificant) score += 0.25;
    if (changes.sentiment.isSignificant) score += 0.25;
    if (changes.entryCount.isSignificant) score += 0.2;
    
    return Math.min(score, 1.0);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalysisComparison;
} 