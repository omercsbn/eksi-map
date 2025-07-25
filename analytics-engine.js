/**
 * Analytics Engine - Ekşi Map Analytics Dashboard
 * Veri analizi, görselleştirme ve içgörü üretimi için motor
 */

class AnalyticsEngine {
    constructor() {
        this.data = null;
        this.cache = new Map();
        this.charts = new Map();
        this.isInitialized = false;
    }

    /**
     * Analytics motorunu başlat
     */
    async initialize() {
        try {
            console.log('🔍 Analytics Engine başlatılıyor...');
            
            // Mevcut veriyi yükle
            await this.loadData();
            
            // Cache'i temizle
            this.cache.clear();
            
            this.isInitialized = true;
            console.log('✅ Analytics Engine başlatıldı');
            
            return true;
        } catch (error) {
            console.error('❌ Analytics Engine başlatma hatası:', error);
            return false;
        }
    }

    /**
     * EksiMap geçmiş verilerini yükle
     */
    async loadData() {
        try {
            const result = await chrome.storage.local.get(['eksiMapHistory']);
            this.data = result.eksiMapHistory || [];
            
            console.log(`📊 ${this.data.length} analiz verisi yüklendi`);
            return this.data;
        } catch (error) {
            console.error('❌ Veri yükleme hatası:', error);
            return [];
        }
    }

    /**
     * Okuma trendlerini analiz et
     */
    getReadingTrends() {
        if (!this.data || this.data.length === 0) {
            return { daily: [], weekly: [], monthly: [] };
        }

        const trends = {
            daily: this.aggregateByTime('day'),
            weekly: this.aggregateByTime('week'),
            monthly: this.aggregateByTime('month')
        };

        this.cache.set('readingTrends', trends);
        return trends;
    }

    /**
     * Zaman bazlı veri toplama
     */
    aggregateByTime(period) {
        const grouped = {};
        
        this.data.forEach(item => {
            const date = new Date(item.timestamp);
            let key;
            
            switch (period) {
                case 'day':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
            }
            
            if (!grouped[key]) {
                grouped[key] = {
                    count: 0,
                    sentiment: { positive: 0, negative: 0, neutral: 0 },
                    keywords: new Set(),
                    titles: []
                };
            }
            
            grouped[key].count++;
            grouped[key].titles.push(item.title);
            
            // Duygu tonu analizi
            if (item.sentiment) {
                const sentiment = item.sentiment.toLowerCase();
                if (sentiment.includes('pozitif') || sentiment.includes('olumlu')) {
                    grouped[key].sentiment.positive++;
                } else if (sentiment.includes('negatif') || sentiment.includes('olumsuz')) {
                    grouped[key].sentiment.negative++;
                } else {
                    grouped[key].sentiment.neutral++;
                }
            }
            
            // Anahtar kelimeler
            if (item.keywords) {
                item.keywords.forEach(keyword => grouped[key].keywords.add(keyword));
            }
        });
        
        // Sonuçları formatla
        return Object.entries(grouped).map(([date, data]) => ({
            date,
            count: data.count,
            sentiment: data.sentiment,
            keywords: Array.from(data.keywords),
            titles: data.titles
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Konu kümelerini analiz et
     */
    getTopicClusters() {
        if (!this.data || this.data.length === 0) {
            return [];
        }

        const clusters = {};
        
        this.data.forEach(item => {
            if (item.keywords && item.keywords.length > 0) {
                // Ana anahtar kelimeyi belirle
                const mainKeyword = item.keywords[0];
                
                if (!clusters[mainKeyword]) {
                    clusters[mainKeyword] = {
                        keyword: mainKeyword,
                        count: 0,
                        relatedKeywords: new Set(),
                        titles: [],
                        avgSentiment: 0,
                        totalSentiment: 0
                    };
                }
                
                clusters[mainKeyword].count++;
                clusters[mainKeyword].titles.push(item.title);
                
                // İlgili kelimeleri ekle
                item.keywords.forEach(keyword => {
                    clusters[mainKeyword].relatedKeywords.add(keyword);
                });
                
                // Duygu tonu ortalaması
                if (item.sentiment) {
                    const sentimentScore = this.getSentimentScore(item.sentiment);
                    clusters[mainKeyword].totalSentiment += sentimentScore;
                }
            }
        });
        
        // Ortalamaları hesapla ve formatla
        return Object.values(clusters).map(cluster => ({
            ...cluster,
            relatedKeywords: Array.from(cluster.relatedKeywords),
            avgSentiment: cluster.count > 0 ? cluster.totalSentiment / cluster.count : 0
        })).sort((a, b) => b.count - a.count);
    }

    /**
     * Duygu tonu skorunu hesapla
     */
    getSentimentScore(sentiment) {
        if (!sentiment) return 0;
        
        const text = sentiment.toLowerCase();
        if (text.includes('pozitif') || text.includes('olumlu') || text.includes('iyi')) {
            return 1;
        } else if (text.includes('negatif') || text.includes('olumsuz') || text.includes('kötü')) {
            return -1;
        }
        return 0;
    }

    /**
     * Duygu tonu evrimini analiz et
     */
    getSentimentEvolution() {
        const trends = this.getReadingTrends();
        
        return trends.daily.map(day => ({
            date: day.date,
            positive: day.sentiment.positive,
            negative: day.sentiment.negative,
            neutral: day.sentiment.neutral,
            total: day.count,
            ratio: day.count > 0 ? (day.sentiment.positive - day.sentiment.negative) / day.count : 0
        }));
    }

    /**
     * Anahtar kelime ağını oluştur
     */
    getKeywordNetwork() {
        if (!this.data || this.data.length === 0) {
            return { nodes: [], edges: [] };
        }

        const keywordMap = new Map();
        const connections = new Map();
        
        this.data.forEach(item => {
            if (item.keywords && item.keywords.length > 1) {
                // Her kelime çifti arasında bağlantı oluştur
                for (let i = 0; i < item.keywords.length; i++) {
                    for (let j = i + 1; j < item.keywords.length; j++) {
                        const keyword1 = item.keywords[i];
                        const keyword2 = item.keywords[j];
                        
                        // Kelime frekanslarını say
                        keywordMap.set(keyword1, (keywordMap.get(keyword1) || 0) + 1);
                        keywordMap.set(keyword2, (keywordMap.get(keyword2) || 0) + 1);
                        
                        // Bağlantıları say
                        const connectionKey = [keyword1, keyword2].sort().join('|');
                        connections.set(connectionKey, (connections.get(connectionKey) || 0) + 1);
                    }
                }
            }
        });
        
        // Node'ları oluştur
        const nodes = Array.from(keywordMap.entries()).map(([keyword, weight]) => ({
            id: keyword,
            label: keyword,
            weight: weight,
            size: Math.max(10, Math.min(50, weight * 5))
        }));
        
        // Edge'leri oluştur
        const edges = Array.from(connections.entries()).map(([connection, weight]) => {
            const [keyword1, keyword2] = connection.split('|');
            return {
                source: keyword1,
                target: keyword2,
                weight: weight,
                width: Math.max(1, Math.min(10, weight * 2))
            };
        });
        
        return { nodes, edges };
    }

    /**
     * Kişisel içgörüler üret
     */
    getPersonalInsights() {
        if (!this.data || this.data.length === 0) {
            return {
                totalReadings: 0,
                favoriteTopics: [],
                readingPattern: 'none',
                sentimentTrend: 'neutral',
                recommendations: []
            };
        }

        const insights = {
            totalReadings: this.data.length,
            favoriteTopics: this.getFavoriteTopics(),
            readingPattern: this.analyzeReadingPattern(),
            sentimentTrend: this.analyzeSentimentTrend(),
            recommendations: this.generateRecommendations()
        };

        this.cache.set('personalInsights', insights);
        return insights;
    }

    /**
     * Favori konuları belirle
     */
    getFavoriteTopics() {
        const topicCounts = {};
        
        this.data.forEach(item => {
            if (item.keywords) {
                item.keywords.forEach(keyword => {
                    topicCounts[keyword] = (topicCounts[keyword] || 0) + 1;
                });
            }
        });
        
        return Object.entries(topicCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([keyword, count]) => ({ keyword, count }));
    }

    /**
     * Okuma paternini analiz et
     */
    analyzeReadingPattern() {
        const hourlyPattern = new Array(24).fill(0);
        
        this.data.forEach(item => {
            const hour = new Date(item.timestamp).getHours();
            hourlyPattern[hour]++;
        });
        
        const maxHour = hourlyPattern.indexOf(Math.max(...hourlyPattern));
        
        if (maxHour >= 6 && maxHour <= 12) return 'morning';
        if (maxHour >= 12 && maxHour <= 18) return 'afternoon';
        if (maxHour >= 18 && maxHour <= 22) return 'evening';
        return 'night';
    }

    /**
     * Duygu tonu trendini analiz et
     */
    analyzeSentimentTrend() {
        const recentData = this.data.slice(-10);
        const oldData = this.data.slice(0, 10);
        
        const recentSentiment = this.calculateAverageSentiment(recentData);
        const oldSentiment = this.calculateAverageSentiment(oldData);
        
        if (recentSentiment > oldSentiment + 0.1) return 'improving';
        if (recentSentiment < oldSentiment - 0.1) return 'declining';
        return 'stable';
    }

    /**
     * Ortalama duygu tonu hesapla
     */
    calculateAverageSentiment(data) {
        if (data.length === 0) return 0;
        
        const total = data.reduce((sum, item) => {
            return sum + this.getSentimentScore(item.sentiment);
        }, 0);
        
        return total / data.length;
    }

    /**
     * Öneriler üret
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Okuma sıklığı önerisi
        if (this.data.length < 10) {
            recommendations.push({
                type: 'frequency',
                title: 'Daha fazla okuma yapın',
                description: 'Analiz kalitesini artırmak için daha fazla başlık okuyun',
                priority: 'high'
            });
        }
        
        // Konu çeşitliliği önerisi
        const uniqueKeywords = new Set();
        this.data.forEach(item => {
            if (item.keywords) {
                item.keywords.forEach(keyword => uniqueKeywords.add(keyword));
            }
        });
        
        if (uniqueKeywords.size < 5) {
            recommendations.push({
                type: 'diversity',
                title: 'Farklı konular keşfedin',
                description: 'Daha çeşitli konularda okuma yaparak ilgi alanlarınızı genişletin',
                priority: 'medium'
            });
        }
        
        // Duygu tonu dengesi önerisi
        const sentimentEvolution = this.getSentimentEvolution();
        const recentSentiments = sentimentEvolution.slice(-7);
        const positiveCount = recentSentiments.reduce((sum, day) => sum + day.positive, 0);
        const negativeCount = recentSentiments.reduce((sum, day) => sum + day.negative, 0);
        
        if (negativeCount > positiveCount * 2) {
            recommendations.push({
                type: 'sentiment',
                title: 'Daha pozitif içerikler okuyun',
                description: 'Duygu tonunuzu dengelemek için daha olumlu başlıklara odaklanın',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    /**
     * Performans metriklerini hesapla
     */
    getPerformanceMetrics() {
        if (!this.data || this.data.length === 0) {
            return {
                totalAnalyses: 0,
                averageKeywords: 0,
                sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
                mostActiveDay: null,
                averageReadingTime: 0
            };
        }

        const totalAnalyses = this.data.length;
        const totalKeywords = this.data.reduce((sum, item) => sum + (item.keywords?.length || 0), 0);
        const averageKeywords = totalKeywords / totalAnalyses;
        
        const sentimentDistribution = { positive: 0, negative: 0, neutral: 0 };
        this.data.forEach(item => {
            const score = this.getSentimentScore(item.sentiment);
            if (score > 0) sentimentDistribution.positive++;
            else if (score < 0) sentimentDistribution.negative++;
            else sentimentDistribution.neutral++;
        });
        
        // En aktif günü bul
        const dailyCounts = {};
        this.data.forEach(item => {
            const date = new Date(item.timestamp).toISOString().split('T')[0];
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        
        const mostActiveDay = Object.entries(dailyCounts)
            .sort(([,a], [,b]) => b - a)[0];
        
        return {
            totalAnalyses,
            averageKeywords: Math.round(averageKeywords * 10) / 10,
            sentimentDistribution,
            mostActiveDay: mostActiveDay ? { date: mostActiveDay[0], count: mostActiveDay[1] } : null,
            averageReadingTime: this.calculateAverageReadingTime()
        };
    }

    /**
     * Ortalama okuma süresini hesapla
     */
    calculateAverageReadingTime() {
        // Basit bir hesaplama - gerçek uygulamada daha detaylı olabilir
        const averageWordsPerTitle = 50; // Tahmini
        const wordsPerMinute = 200; // Ortalama okuma hızı
        
        return Math.round((averageWordsPerTitle / wordsPerMinute) * 60); // Saniye cinsinden
    }

    /**
     * Veriyi dışa aktar
     */
    exportData(format = 'json') {
        const exportData = {
            analytics: {
                readingTrends: this.getReadingTrends(),
                topicClusters: this.getTopicClusters(),
                sentimentEvolution: this.getSentimentEvolution(),
                keywordNetwork: this.getKeywordNetwork(),
                personalInsights: this.getPersonalInsights(),
                performanceMetrics: this.getPerformanceMetrics()
            },
            rawData: this.data,
            exportDate: new Date().toISOString()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(exportData, null, 2);
            case 'csv':
                return this.convertToCSV(exportData);
            default:
                return exportData;
        }
    }

    /**
     * CSV formatına dönüştür
     */
    convertToCSV(data) {
        // Basit CSV dönüşümü - gerçek uygulamada daha kapsamlı olabilir
        const headers = ['Tarih', 'Başlık', 'Anahtar Kelimeler', 'Duygu Tonu'];
        const rows = this.data.map(item => [
            new Date(item.timestamp).toLocaleDateString('tr-TR'),
            item.title,
            item.keywords?.join(', ') || '',
            item.sentiment || ''
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * Cache'i temizle
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Analytics cache temizlendi');
    }

    /**
     * Performans optimizasyonu için veri önbellekleme
     */
    async preloadData() {
        try {
            console.log('⚡ Analytics verisi önbellekleniyor...');
            
            // Tüm analizleri paralel olarak çalıştır
            await Promise.all([
                this.getReadingTrends(),
                this.getTopicClusters(),
                this.getSentimentEvolution(),
                this.getKeywordNetwork(),
                this.getPersonalInsights(),
                this.getPerformanceMetrics()
            ]);
            
            console.log('✅ Analytics verisi önbelleklendi');
        } catch (error) {
            console.error('❌ Veri önbellekleme hatası:', error);
        }
    }
}

// Global instance
window.analyticsEngine = new AnalyticsEngine(); 