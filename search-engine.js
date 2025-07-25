/**
 * Search Engine - Ekşi Map Advanced Search & Filtering
 * Gelişmiş arama, filtreleme ve sonuç yönetimi için motor
 */

class SearchEngine {
    constructor() {
        this.data = null;
        this.index = new Map();
        this.searchHistory = [];
        this.savedSearches = [];
        this.isInitialized = false;
        this.searchWorker = null;
        this.maxResults = 1000;
    }

    /**
     * Search engine'i başlat
     */
    async initialize() {
        try {
            console.log('🔍 Search Engine başlatılıyor...');
            
            // Veriyi yükle
            await this.loadData();
            
            // Arama indeksini oluştur
            this.buildSearchIndex();
            
            // Kayıtlı aramaları yükle
            await this.loadSavedSearches();
            
            // Arama geçmişini yükle
            await this.loadSearchHistory();
            
            // Web Worker'ı başlat (performans için)
            this.initializeSearchWorker();
            
            this.isInitialized = true;
            console.log('✅ Search Engine başlatıldı');
            
            return true;
        } catch (error) {
            console.error('❌ Search Engine başlatma hatası:', error);
            return false;
        }
    }

    /**
     * EksiMap verilerini yükle
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
     * Arama indeksini oluştur
     */
    buildSearchIndex() {
        console.log('🔍 Arama indeksi oluşturuluyor...');
        
        this.index.clear();
        
        this.data.forEach((item, id) => {
            // Başlık indeksi
            this.addToIndex(item.title, id, 'title');
            
            // Anahtar kelimeler indeksi
            if (item.keywords) {
                item.keywords.forEach(keyword => {
                    this.addToIndex(keyword, id, 'keyword');
                });
            }
            
            // Özet indeksi
            if (item.summary) {
                this.addToIndex(item.summary, id, 'summary');
            }
            
            // Duygu tonu indeksi
            if (item.sentiment) {
                this.addToIndex(item.sentiment, id, 'sentiment');
            }
            
            // URL indeksi
            if (item.url) {
                this.addToIndex(item.url, id, 'url');
            }
        });
        
        console.log(`✅ Arama indeksi oluşturuldu: ${this.index.size} terim`);
    }

    /**
     * İndekse terim ekle
     */
    addToIndex(term, id, type) {
        if (!term) return;
        
        const normalizedTerm = this.normalizeTerm(term);
        const words = normalizedTerm.split(/\s+/);
        
        words.forEach(word => {
            if (word.length < 2) return; // Çok kısa kelimeleri atla
            
            if (!this.index.has(word)) {
                this.index.set(word, new Map());
            }
            
            const wordIndex = this.index.get(word);
            if (!wordIndex.has(id)) {
                wordIndex.set(id, { count: 0, types: new Set() });
            }
            
            const entry = wordIndex.get(id);
            entry.count++;
            entry.types.add(type);
        });
    }

    /**
     * Terimi normalize et
     */
    normalizeTerm(term) {
        return term
            .toLowerCase()
            .replace(/[çğıöşü]/g, char => {
                const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
                return map[char] || char;
            })
            .replace(/[^a-z0-9\s]/g, ' ')
            .trim();
    }

    /**
     * Gelişmiş arama yap
     */
    async search(query, filters = {}) {
        try {
            console.log('🔍 Arama yapılıyor:', query);
            
            if (!query && Object.keys(filters).length === 0) {
                return this.data.slice(0, this.maxResults);
            }
            
            let results = [];
            
            // Metin araması
            if (query && query.trim()) {
                results = this.textSearch(query);
            } else {
                results = this.data.map((item, index) => ({ item, score: 1, id: index }));
            }
            
            // Filtreleri uygula
            if (Object.keys(filters).length > 0) {
                results = this.applyFilters(results, filters);
            }
            
            // Sonuçları sırala
            results = this.sortResults(results, filters.sortBy || 'relevance');
            
            // Sonuç sayısını sınırla
            results = results.slice(0, this.maxResults);
            
            // Arama geçmişine ekle
            this.addToSearchHistory(query, filters);
            
            console.log(`✅ ${results.length} sonuç bulundu`);
            return results;
            
        } catch (error) {
            console.error('❌ Arama hatası:', error);
            return [];
        }
    }

    /**
     * Metin araması yap
     */
    textSearch(query) {
        const normalizedQuery = this.normalizeTerm(query);
        const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length >= 2);
        
        const resultScores = new Map();
        
        queryWords.forEach(word => {
            // Tam eşleşme
            if (this.index.has(word)) {
                this.index.get(word).forEach((score, id) => {
                    if (!resultScores.has(id)) {
                        resultScores.set(id, { score: 0, matches: new Set() });
                    }
                    resultScores.get(id).score += score.count * 10;
                    score.types.forEach(type => resultScores.get(id).matches.add(type));
                });
            }
            
            // Kısmi eşleşme (fuzzy search)
            this.index.forEach((entries, indexWord) => {
                if (this.isFuzzyMatch(word, indexWord)) {
                    entries.forEach((score, id) => {
                        if (!resultScores.has(id)) {
                            resultScores.set(id, { score: 0, matches: new Set() });
                        }
                        resultScores.get(id).score += score.count * 5;
                        score.types.forEach(type => resultScores.get(id).matches.add(type));
                    });
                }
            });
        });
        
        // Sonuçları formatla
        return Array.from(resultScores.entries()).map(([id, data]) => ({
            item: this.data[id],
            score: data.score,
            id: parseInt(id),
            matches: Array.from(data.matches)
        }));
    }

    /**
     * Fuzzy matching kontrol et
     */
    isFuzzyMatch(query, target) {
        if (target.includes(query) || query.includes(target)) {
            return true;
        }
        
        // Levenshtein distance hesapla
        const distance = this.levenshteinDistance(query, target);
        const maxLength = Math.max(query.length, target.length);
        
        return distance / maxLength <= 0.3; // %30 tolerans
    }

    /**
     * Levenshtein distance hesapla
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Filtreleri uygula
     */
    applyFilters(results, filters) {
        return results.filter(result => {
            const item = result.item;
            
            // Tarih filtresi
            if (filters.dateRange) {
                const itemDate = new Date(item.timestamp);
                const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
                const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
                
                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;
            }
            
            // Duygu tonu filtresi
            if (filters.sentiment && filters.sentiment.length > 0) {
                const itemSentiment = this.getSentimentCategory(item.sentiment);
                if (!filters.sentiment.includes(itemSentiment)) return false;
            }
            
            // Anahtar kelime filtresi
            if (filters.keywords && filters.keywords.length > 0) {
                const itemKeywords = item.keywords || [];
                const hasKeyword = filters.keywords.some(keyword => 
                    itemKeywords.some(itemKeyword => 
                        this.normalizeTerm(itemKeyword).includes(this.normalizeTerm(keyword))
                    )
                );
                if (!hasKeyword) return false;
            }
            
            // Konu kategorisi filtresi
            if (filters.topicCategory && filters.topicCategory.length > 0) {
                const itemTopics = this.getTopicCategories(item.keywords);
                const hasTopic = filters.topicCategory.some(topic => 
                    itemTopics.includes(topic)
                );
                if (!hasTopic) return false;
            }
            
            // Okuma süresi filtresi
            if (filters.readingTime) {
                const estimatedTime = this.estimateReadingTime(item);
                if (filters.readingTime.min && estimatedTime < filters.readingTime.min) return false;
                if (filters.readingTime.max && estimatedTime > filters.readingTime.max) return false;
            }
            
            return true;
        });
    }

    /**
     * Duygu tonu kategorisini belirle
     */
    getSentimentCategory(sentiment) {
        if (!sentiment) return 'neutral';
        
        const text = sentiment.toLowerCase();
        if (text.includes('pozitif') || text.includes('olumlu') || text.includes('iyi')) {
            return 'positive';
        } else if (text.includes('negatif') || text.includes('olumsuz') || text.includes('kötü')) {
            return 'negative';
        }
        return 'neutral';
    }

    /**
     * Konu kategorilerini belirle
     */
    getTopicCategories(keywords) {
        if (!keywords || keywords.length === 0) return ['genel'];
        
        const categories = [];
        const topicMap = {
            'teknoloji': ['teknoloji', 'yazılım', 'programlama', 'bilgisayar', 'internet'],
            'siyaset': ['siyaset', 'politika', 'hükümet', 'parti', 'seçim'],
            'spor': ['spor', 'futbol', 'basketbol', 'tenis', 'atletizm'],
            'sanat': ['sanat', 'müzik', 'film', 'edebiyat', 'resim'],
            'bilim': ['bilim', 'araştırma', 'teknoloji', 'keşif', 'laboratuvar'],
            'sağlık': ['sağlık', 'tıp', 'hastane', 'doktor', 'tedavi'],
            'eğitim': ['eğitim', 'okul', 'üniversite', 'öğrenci', 'öğretmen']
        };
        
        keywords.forEach(keyword => {
            const normalizedKeyword = this.normalizeTerm(keyword);
            Object.entries(topicMap).forEach(([category, terms]) => {
                if (terms.some(term => normalizedKeyword.includes(term))) {
                    categories.push(category);
                }
            });
        });
        
        return categories.length > 0 ? categories : ['genel'];
    }

    /**
     * Okuma süresini tahmin et
     */
    estimateReadingTime(item) {
        const titleLength = item.title ? item.title.length : 0;
        const summaryLength = item.summary ? item.summary.length : 0;
        const totalLength = titleLength + summaryLength;
        
        // Ortalama okuma hızı: 200 kelime/dakika
        const wordsPerMinute = 200;
        const averageWordLength = 5; // Türkçe için ortalama
        const totalWords = totalLength / averageWordLength;
        
        return Math.round((totalWords / wordsPerMinute) * 60); // Saniye cinsinden
    }

    /**
     * Sonuçları sırala
     */
    sortResults(results, sortBy) {
        return results.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.item.timestamp) - new Date(a.item.timestamp);
                case 'date_asc':
                    return new Date(a.item.timestamp) - new Date(b.item.timestamp);
                case 'sentiment':
                    return this.getSentimentScore(b.item.sentiment) - this.getSentimentScore(a.item.sentiment);
                case 'popularity':
                    return (b.item.keywords?.length || 0) - (a.item.keywords?.length || 0);
                case 'relevance':
                default:
                    return b.score - a.score;
            }
        });
    }

    /**
     * Duygu tonu skoru hesapla
     */
    getSentimentScore(sentiment) {
        if (!sentiment) return 0;
        
        const text = sentiment.toLowerCase();
        if (text.includes('pozitif') || text.includes('olumlu')) return 1;
        if (text.includes('negatif') || text.includes('olumsuz')) return -1;
        return 0;
    }

    /**
     * Arama geçmişine ekle
     */
    addToSearchHistory(query, filters) {
        const searchEntry = {
            query,
            filters,
            timestamp: new Date().toISOString(),
            resultCount: 0 // Sonuç sayısı daha sonra güncellenir
        };
        
        this.searchHistory.unshift(searchEntry);
        this.searchHistory = this.searchHistory.slice(0, 50); // Son 50 aramayı tut
        
        // Local storage'a kaydet
        this.saveSearchHistory();
    }

    /**
     * Arama geçmişini kaydet
     */
    async saveSearchHistory() {
        try {
            await chrome.storage.local.set({
                'eksiMapSearchHistory': this.searchHistory
            });
        } catch (error) {
            console.error('❌ Arama geçmişi kaydetme hatası:', error);
        }
    }

    /**
     * Arama geçmişini yükle
     */
    async loadSearchHistory() {
        try {
            const result = await chrome.storage.local.get(['eksiMapSearchHistory']);
            this.searchHistory = result.eksiMapSearchHistory || [];
        } catch (error) {
            console.error('❌ Arama geçmişi yükleme hatası:', error);
            this.searchHistory = [];
        }
    }

    /**
     * Arama önerileri al
     */
    getSearchSuggestions(query) {
        if (!query || query.length < 2) return [];
        
        const normalizedQuery = this.normalizeTerm(query);
        const suggestions = new Set();
        
        // İndeksten öneriler al
        this.index.forEach((entries, term) => {
            if (term.startsWith(normalizedQuery) || term.includes(normalizedQuery)) {
                suggestions.add(term);
            }
        });
        
        // Arama geçmişinden öneriler al
        this.searchHistory.forEach(entry => {
            if (entry.query && entry.query.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(entry.query);
            }
        });
        
        return Array.from(suggestions).slice(0, 10);
    }

    /**
     * Kayıtlı arama oluştur
     */
    async saveSearch(name, query, filters) {
        const savedSearch = {
            id: Date.now(),
            name,
            query,
            filters,
            timestamp: new Date().toISOString()
        };
        
        this.savedSearches.push(savedSearch);
        await this.saveSavedSearches();
        
        return savedSearch;
    }

    /**
     * Kayıtlı aramaları kaydet
     */
    async saveSavedSearches() {
        try {
            await chrome.storage.local.set({
                'eksiMapSavedSearches': this.savedSearches
            });
        } catch (error) {
            console.error('❌ Kayıtlı aramalar kaydetme hatası:', error);
        }
    }

    /**
     * Kayıtlı aramaları yükle
     */
    async loadSavedSearches() {
        try {
            const result = await chrome.storage.local.get(['eksiMapSavedSearches']);
            this.savedSearches = result.eksiMapSavedSearches || [];
        } catch (error) {
            console.error('❌ Kayıtlı aramalar yükleme hatası:', error);
            this.savedSearches = [];
        }
    }

    /**
     * Kayıtlı arama sil
     */
    async deleteSavedSearch(id) {
        this.savedSearches = this.savedSearches.filter(search => search.id !== id);
        await this.saveSavedSearches();
    }

    /**
     * Web Worker'ı başlat
     */
    initializeSearchWorker() {
        try {
            // Web Worker için blob oluştur
            const workerCode = `
                self.onmessage = function(e) {
                    const { type, data } = e.data;
                    
                    switch (type) {
                        case 'search':
                            const results = performSearch(data.query, data.index, data.filters);
                            self.postMessage({ type: 'searchResults', results });
                            break;
                    }
                };
                
                function performSearch(query, index, filters) {
                    // Basit arama implementasyonu
                    return [];
                }
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            this.searchWorker = new Worker(URL.createObjectURL(blob));
            
        } catch (error) {
            console.warn('⚠️ Web Worker başlatılamadı, senkron arama kullanılacak');
            this.searchWorker = null;
        }
    }

    /**
     * Arama istatistikleri al
     */
    getSearchStats() {
        const totalSearches = this.searchHistory.length;
        const uniqueQueries = new Set(this.searchHistory.map(h => h.query)).size;
        const popularQueries = this.getPopularQueries();
        
        return {
            totalSearches,
            uniqueQueries,
            popularQueries,
            savedSearches: this.savedSearches.length
        };
    }

    /**
     * Popüler aramaları al
     */
    getPopularQueries() {
        const queryCounts = {};
        
        this.searchHistory.forEach(entry => {
            if (entry.query) {
                queryCounts[entry.query] = (queryCounts[entry.query] || 0) + 1;
            }
        });
        
        return Object.entries(queryCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([query, count]) => ({ query, count }));
    }

    /**
     * İndeksi temizle
     */
    clearIndex() {
        this.index.clear();
        console.log('🗑️ Arama indeksi temizlendi');
    }

    /**
     * Cache'i temizle
     */
    clearCache() {
        this.clearIndex();
        this.searchHistory = [];
        this.savedSearches = [];
        console.log('🗑️ Search Engine cache temizlendi');
    }
}

// Global instance
window.searchEngine = new SearchEngine(); 