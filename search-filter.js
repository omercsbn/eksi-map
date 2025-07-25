/**
 * Search Filter - Advanced Search Interface
 * Arama ve filtreleme arayüzünü yöneten ana modül
 */

class SearchFilter {
    constructor() {
        this.engine = null;
        this.currentResults = [];
        this.currentFilters = {};
        this.searchTimeout = null;
        this.isInitialized = false;
        this.selectedItems = new Set();
    }

    /**
     * Search Filter'ı başlat
     */
    async initialize() {
        try {
            console.log('🔍 Search Filter başlatılıyor...');
            
            // Search engine'i başlat
            this.engine = window.searchEngine;
            if (!this.engine) {
                throw new Error('Search Engine bulunamadı');
            }
            
            await this.engine.initialize();
            
            // Event listener'ları ekle
            this.setupEventListeners();
            
            // Kayıtlı aramaları yükle
            await this.loadSavedSearches();
            
            // İlk aramayı yap
            await this.performSearch();
            
            this.isInitialized = true;
            console.log('✅ Search Filter başlatıldı');
            
        } catch (error) {
            console.error('❌ Search Filter başlatma hatası:', error);
            this.showError('Search Filter başlatılamadı: ' + error.message);
        }
    }

    /**
     * Event listener'ları ayarla
     */
    setupEventListeners() {
        // Arama input'u
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        searchInput.addEventListener('focus', () => {
            this.showSuggestions();
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 200);
        });

        // Arama butonu
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        // Enter tuşu
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Filtre butonları
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Sıralama değişikliği
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortResults(e.target.value);
        });

        // Filtre checkbox'ları
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateFilters();
            });
        });

        // Tarih input'ları
        document.getElementById('startDate').addEventListener('change', () => {
            this.updateFilters();
        });

        document.getElementById('endDate').addEventListener('change', () => {
            this.updateFilters();
        });

        // Okuma süresi input'ları
        document.getElementById('minReadingTime').addEventListener('input', () => {
            this.updateFilters();
        });

        document.getElementById('maxReadingTime').addEventListener('input', () => {
            this.updateFilters();
        });
    }

    /**
     * Arama input'unu işle
     */
    handleSearchInput(query) {
        // Önceki timeout'u temizle
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Yeni timeout ayarla (debounce)
        this.searchTimeout = setTimeout(() => {
            this.updateSuggestions(query);
            this.performSearch();
        }, 300);
    }

    /**
     * Önerileri güncelle
     */
    updateSuggestions(query) {
        if (!query || query.length < 2) {
            this.hideSuggestions();
            return;
        }

        const suggestions = this.engine.getSearchSuggestions(query);
        this.showSuggestions(suggestions);
    }

    /**
     * Önerileri göster
     */
    showSuggestions(suggestions = []) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        const suggestionsHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" onclick="searchFilter.selectSuggestion('${suggestion}')">
                ${suggestion}
            </div>
        `).join('');

        suggestionsContainer.innerHTML = suggestionsHTML;
        suggestionsContainer.style.display = 'block';
    }

    /**
     * Önerileri gizle
     */
    hideSuggestions() {
        document.getElementById('searchSuggestions').style.display = 'none';
    }

    /**
     * Öneri seç
     */
    selectSuggestion(suggestion) {
        document.getElementById('searchInput').value = suggestion;
        this.hideSuggestions();
        this.performSearch();
    }

    /**
     * Arama yap
     */
    async performSearch() {
        try {
            const query = document.getElementById('searchInput').value.trim();
            const filters = this.getCurrentFilters();
            
            // Loading göster
            this.showLoading();
            
            // Arama yap
            const results = await this.engine.search(query, filters);
            
            // Sonuçları göster
            this.displayResults(results);
            
        } catch (error) {
            console.error('❌ Arama hatası:', error);
            this.showError('Arama yapılamadı: ' + error.message);
        }
    }

    /**
     * Mevcut filtreleri al
     */
    getCurrentFilters() {
        const filters = {};

        // Tarih aralığı
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate || endDate) {
            filters.dateRange = { start: startDate, end: endDate };
        }

        // Duygu tonu
        const sentiments = [];
        if (document.getElementById('sentimentPositive').checked) sentiments.push('positive');
        if (document.getElementById('sentimentNegative').checked) sentiments.push('negative');
        if (document.getElementById('sentimentNeutral').checked) sentiments.push('neutral');
        if (sentiments.length > 0) {
            filters.sentiment = sentiments;
        }

        // Konu kategorisi
        const topics = [];
        const topicCheckboxes = [
            'topicTechnology', 'topicPolitics', 'topicSports', 'topicArt',
            'topicScience', 'topicHealth', 'topicEducation'
        ];
        topicCheckboxes.forEach(id => {
            if (document.getElementById(id).checked) {
                topics.push(document.getElementById(id).value);
            }
        });
        if (topics.length > 0) {
            filters.topicCategory = topics;
        }

        // Okuma süresi
        const minTime = document.getElementById('minReadingTime').value;
        const maxTime = document.getElementById('maxReadingTime').value;
        if (minTime || maxTime) {
            filters.readingTime = {
                min: minTime ? parseInt(minTime) : null,
                max: maxTime ? parseInt(maxTime) : null
            };
        }

        return filters;
    }

    /**
     * Filtreleri uygula
     */
    applyFilters() {
        this.currentFilters = this.getCurrentFilters();
        this.performSearch();
    }

    /**
     * Filtreleri temizle
     */
    clearFilters() {
        // Checkbox'ları temizle
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Tarih input'larını temizle
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';

        // Okuma süresi input'larını temizle
        document.getElementById('minReadingTime').value = '';
        document.getElementById('maxReadingTime').value = '';

        // Filtreleri sıfırla
        this.currentFilters = {};
        this.performSearch();
    }

    /**
     * Filtreleri güncelle
     */
    updateFilters() {
        this.currentFilters = this.getCurrentFilters();
    }

    /**
     * Sonuçları göster
     */
    displayResults(results) {
        this.currentResults = results;
        
        const resultsGrid = document.getElementById('resultsGrid');
        const resultsCount = document.getElementById('resultsCount');
        
        // Sonuç sayısını güncelle
        resultsCount.textContent = `${results.length} sonuç bulundu`;
        
        if (results.length === 0) {
            resultsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>🔍 Sonuç bulunamadı</h3>
                    <p>Arama kriterlerinizi değiştirmeyi deneyin veya farklı anahtar kelimeler kullanın.</p>
                </div>
            `;
            return;
        }

        // Sonuçları formatla
        const resultsHTML = results.map(result => this.formatResultItem(result)).join('');
        resultsGrid.innerHTML = resultsHTML;

        // Event listener'ları ekle
        this.addResultEventListeners();
    }

    /**
     * Sonuç öğesini formatla
     */
    formatResultItem(result) {
        const item = result.item;
        const sentiment = this.getSentimentCategory(item.sentiment);
        const sentimentText = this.getSentimentText(sentiment);
        const date = new Date(item.timestamp).toLocaleDateString('tr-TR');
        
        const keywordsHTML = item.keywords ? item.keywords.slice(0, 5).map(keyword => 
            `<span class="keyword-tag">${keyword}</span>`
        ).join('') : '';

        return `
            <div class="result-item" data-id="${result.id}">
                <div class="result-header">
                    <div>
                        <div class="result-title">${item.title}</div>
                        <div class="result-date">${date}</div>
                    </div>
                    <div class="result-sentiment ${sentiment}">${sentimentText}</div>
                </div>
                
                <div class="result-meta">
                    <span>📊 ${item.keywords?.length || 0} anahtar kelime</span>
                    <span>⏱️ ${this.estimateReadingTime(item)}s</span>
                </div>
                
                ${keywordsHTML ? `<div class="result-keywords">${keywordsHTML}</div>` : ''}
                
                ${item.summary ? `<div class="result-summary">${item.summary}</div>` : ''}
                
                <div class="result-actions">
                    <button class="action-btn" onclick="searchFilter.reanalyzeItem(${result.id})">🔄 Yeniden Analiz</button>
                    <button class="action-btn" onclick="searchFilter.shareItem(${result.id})">📤 Paylaş</button>
                    <button class="action-btn" onclick="searchFilter.bookmarkItem(${result.id})">🔖 Kaydet</button>
                    <button class="action-btn" onclick="searchFilter.exportItem(${result.id})">📄 Dışa Aktar</button>
                </div>
            </div>
        `;
    }

    /**
     * Duygu tonu kategorisini al
     */
    getSentimentCategory(sentiment) {
        if (!sentiment) return 'neutral';
        
        const text = sentiment.toLowerCase();
        if (text.includes('pozitif') || text.includes('olumlu')) return 'positive';
        if (text.includes('negatif') || text.includes('olumsuz')) return 'negative';
        return 'neutral';
    }

    /**
     * Duygu tonu metnini al
     */
    getSentimentText(sentiment) {
        const texts = {
            'positive': '😊 Pozitif',
            'negative': '😔 Negatif',
            'neutral': '😐 Nötr'
        };
        return texts[sentiment] || '😐 Nötr';
    }

    /**
     * Okuma süresini tahmin et
     */
    estimateReadingTime(item) {
        const titleLength = item.title ? item.title.length : 0;
        const summaryLength = item.summary ? item.summary.length : 0;
        const totalLength = titleLength + summaryLength;
        
        const wordsPerMinute = 200;
        const averageWordLength = 5;
        const totalWords = totalLength / averageWordLength;
        
        return Math.round((totalWords / wordsPerMinute) * 60);
    }

    /**
     * Sonuç event listener'larını ekle
     */
    addResultEventListeners() {
        // Sonuç öğelerine tıklama event'i
        document.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn')) {
                    const id = parseInt(item.dataset.id);
                    this.openItem(id);
                }
            });
        });
    }

    /**
     * Öğeyi aç
     */
    openItem(id) {
        const item = this.currentResults.find(result => result.id === id);
        if (item && item.item.url) {
            window.open(item.item.url, '_blank');
        }
    }

    /**
     * Öğeyi yeniden analiz et
     */
    reanalyzeItem(id) {
        const item = this.currentResults.find(result => result.id === id);
        if (item && item.item.url) {
            // Yeni sekmede aç ve analiz et
            chrome.tabs.create({ url: item.item.url }, (tab) => {
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_ANALYSIS' });
                }, 2000);
            });
        }
    }

    /**
     * Öğeyi paylaş
     */
    shareItem(id) {
        const item = this.currentResults.find(result => result.id === id);
        if (item) {
            const shareData = {
                title: item.item.title,
                text: item.item.summary || 'Ekşi Map analizi',
                url: item.item.url
            };
            
            if (navigator.share) {
                navigator.share(shareData);
            } else {
                // Fallback: URL'yi kopyala
                navigator.clipboard.writeText(item.item.url);
                this.showNotification('URL panoya kopyalandı!');
            }
        }
    }

    /**
     * Öğeyi kaydet
     */
    bookmarkItem(id) {
        const item = this.currentResults.find(result => result.id === id);
        if (item) {
            // Local storage'a kaydet
            const bookmarks = JSON.parse(localStorage.getItem('eksiMapBookmarks') || '[]');
            const bookmark = {
                id: Date.now(),
                item: item.item,
                timestamp: new Date().toISOString()
            };
            
            bookmarks.push(bookmark);
            localStorage.setItem('eksiMapBookmarks', JSON.stringify(bookmarks));
            
            this.showNotification('Öğe kaydedildi!');
        }
    }

    /**
     * Öğeyi dışa aktar
     */
    exportItem(id) {
        const item = this.currentResults.find(result => result.id === id);
        if (item) {
            const data = JSON.stringify(item.item, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `eksi-map-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Sonuçları sırala
     */
    sortResults(sortBy) {
        if (this.currentResults.length === 0) return;
        
        this.currentResults = this.engine.sortResults(this.currentResults, sortBy);
        this.displayResults(this.currentResults);
    }

    /**
     * Kayıtlı aramaları yükle
     */
    async loadSavedSearches() {
        try {
            const savedSearches = this.engine.savedSearches;
            
            if (savedSearches.length === 0) {
                document.getElementById('savedSearches').style.display = 'none';
                return;
            }

            const savedSearchesList = document.getElementById('savedSearchesList');
            const savedSearchesHTML = savedSearches.map(search => `
                <div class="saved-search-item">
                    <div class="saved-search-info">
                        <h4>${search.name}</h4>
                        <p>${search.query || 'Filtre araması'} • ${new Date(search.timestamp).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div class="saved-search-actions">
                        <button class="action-btn" onclick="searchFilter.loadSavedSearch(${search.id})">🔍</button>
                        <button class="action-btn" onclick="searchFilter.deleteSavedSearch(${search.id})">🗑️</button>
                    </div>
                </div>
            `).join('');

            savedSearchesList.innerHTML = savedSearchesHTML;
            document.getElementById('savedSearches').style.display = 'block';
            
        } catch (error) {
            console.error('❌ Kayıtlı aramalar yükleme hatası:', error);
        }
    }

    /**
     * Kayıtlı aramayı yükle
     */
    loadSavedSearch(id) {
        const savedSearch = this.engine.savedSearches.find(search => search.id === id);
        if (savedSearch) {
            // Arama sorgusunu ayarla
            document.getElementById('searchInput').value = savedSearch.query || '';
            
            // Filtreleri ayarla
            this.applySavedSearchFilters(savedSearch.filters);
            
            // Aramayı yap
            this.performSearch();
        }
    }

    /**
     * Kayıtlı arama filtrelerini uygula
     */
    applySavedSearchFilters(filters) {
        if (!filters) return;

        // Tarih aralığı
        if (filters.dateRange) {
            document.getElementById('startDate').value = filters.dateRange.start || '';
            document.getElementById('endDate').value = filters.dateRange.end || '';
        }

        // Duygu tonu
        if (filters.sentiment) {
            filters.sentiment.forEach(sentiment => {
                const checkbox = document.getElementById(`sentiment${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // Konu kategorisi
        if (filters.topicCategory) {
            filters.topicCategory.forEach(topic => {
                const checkbox = document.getElementById(`topic${topic.charAt(0).toUpperCase() + topic.slice(1)}`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // Okuma süresi
        if (filters.readingTime) {
            document.getElementById('minReadingTime').value = filters.readingTime.min || '';
            document.getElementById('maxReadingTime').value = filters.readingTime.max || '';
        }
    }

    /**
     * Kayıtlı aramayı sil
     */
    async deleteSavedSearch(id) {
        await this.engine.deleteSavedSearch(id);
        this.loadSavedSearches();
        this.showNotification('Kayıtlı arama silindi!');
    }

    /**
     * Arama kaydet
     */
    async saveCurrentSearch() {
        const query = document.getElementById('searchInput').value.trim();
        const filters = this.getCurrentFilters();
        
        if (!query && Object.keys(filters).length === 0) {
            this.showError('Kaydedilecek arama bulunamadı');
            return;
        }

        const name = prompt('Arama için bir isim girin:');
        if (!name) return;

        await this.engine.saveSearch(name, query, filters);
        this.loadSavedSearches();
        this.showNotification('Arama kaydedildi!');
    }

    /**
     * Loading göster
     */
    showLoading() {
        document.getElementById('resultsGrid').innerHTML = `
            <div class="loading">Arama yapılıyor...</div>
        `;
    }

    /**
     * Hata göster
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '1000';
        errorDiv.style.maxWidth = '300px';
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }

    /**
     * Bildirim göster
     */
    showNotification(message) {
        const notificationDiv = document.createElement('div');
        notificationDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;
        notificationDiv.textContent = message;
        
        document.body.appendChild(notificationDiv);
        
        setTimeout(() => {
            document.body.removeChild(notificationDiv);
        }, 3000);
    }
}

// Global instance
window.searchFilter = new SearchFilter();

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', async () => {
    await window.searchFilter.initialize();
}); 