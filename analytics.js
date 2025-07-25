/**
 * Analytics Dashboard - Main JavaScript
 * Dashboard'u yöneten ve grafikleri oluşturan ana modül
 */

class AnalyticsDashboard {
    constructor() {
        this.engine = null;
        this.charts = new Map();
        this.currentPeriod = 'daily';
        this.currentChartTypes = {
            trends: 'line',
            sentiment: 'line',
            topics: 'doughnut',
            network: 'force'
        };
        this.isInitialized = false;
    }

    /**
     * Dashboard'u başlat
     */
    async initialize() {
        try {
            console.log('🚀 Analytics Dashboard başlatılıyor...');
            
            // Analytics engine'i başlat
            this.engine = window.analyticsEngine;
            if (!this.engine) {
                throw new Error('Analytics Engine bulunamadı');
            }
            
            await this.engine.initialize();
            
            // Event listener'ları ekle
            this.setupEventListeners();
            
            // Dashboard'u yükle
            await this.loadDashboard();
            
            this.isInitialized = true;
            console.log('✅ Analytics Dashboard başlatıldı');
            
        } catch (error) {
            console.error('❌ Dashboard başlatma hatası:', error);
            this.showError('Dashboard başlatılamadı: ' + error.message);
        }
    }

    /**
     * Event listener'ları ayarla
     */
    setupEventListeners() {
        // Chart kontrol butonları
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                const value = e.target.dataset.period || e.target.dataset.type;
                
                if (chartType === 'trends') {
                    this.currentPeriod = value;
                } else {
                    this.currentChartTypes[chartType] = value;
                }
                
                this.updateChart(chartType);
            });
        });

        // Export butonları
        document.getElementById('exportJSON').addEventListener('click', () => this.exportData('json'));
        document.getElementById('exportCSV').addEventListener('click', () => this.exportData('csv'));
        document.getElementById('exportPNG').addEventListener('click', () => this.exportChartsAsPNG());
    }

    /**
     * Dashboard'u yükle
     */
    async loadDashboard() {
        try {
            // İstatistikleri yükle
            await this.loadStats();
            
            // Grafikleri yükle
            await this.loadCharts();
            
            // İçgörüleri yükle
            await this.loadInsights();
            
            // Önerileri yükle
            await this.loadRecommendations();
            
        } catch (error) {
            console.error('❌ Dashboard yükleme hatası:', error);
            this.showError('Dashboard yüklenemedi: ' + error.message);
        }
    }

    /**
     * İstatistikleri yükle
     */
    async loadStats() {
        try {
            const metrics = this.engine.getPerformanceMetrics();
            
            const statsHTML = `
                <div class="stat-card">
                    <div class="stat-number">${metrics.totalAnalyses}</div>
                    <div class="stat-label">Toplam Analiz</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${metrics.averageKeywords}</div>
                    <div class="stat-label">Ort. Anahtar Kelime</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${Math.round(metrics.sentimentDistribution.positive / metrics.totalAnalyses * 100)}%</div>
                    <div class="stat-label">Pozitif Ton</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${metrics.averageReadingTime}s</div>
                    <div class="stat-label">Ort. Okuma Süresi</div>
                </div>
            `;
            
            document.getElementById('statsGrid').innerHTML = statsHTML;
            
        } catch (error) {
            console.error('❌ İstatistik yükleme hatası:', error);
            document.getElementById('statsGrid').innerHTML = '<div class="error">İstatistikler yüklenemedi</div>';
        }
    }

    /**
     * Grafikleri yükle
     */
    async loadCharts() {
        try {
            // Chart.js'in yüklendiğinden emin ol
            if (typeof Chart === 'undefined') {
                throw new Error('Chart.js yüklenemedi');
            }

            // Tüm grafikleri paralel olarak oluştur
            await Promise.all([
                this.createTrendsChart(),
                this.createSentimentChart(),
                this.createTopicsChart(),
                this.createNetworkChart()
            ]);
            
        } catch (error) {
            console.error('❌ Grafik yükleme hatası:', error);
            this.showError('Grafikler yüklenemedi: ' + error.message);
        }
    }

    /**
     * Okuma trendleri grafiği oluştur
     */
    async createTrendsChart() {
        try {
            const trends = this.engine.getReadingTrends();
            const data = trends[this.currentPeriod] || trends.daily;
            
            const ctx = document.getElementById('trendsChart');
            ctx.innerHTML = '<canvas></canvas>';
            
            const chart = new Chart(ctx.querySelector('canvas'), {
                type: 'line',
                data: {
                    labels: data.map(item => this.formatDate(item.date, this.currentPeriod)),
                    datasets: [{
                        label: 'Okuma Sayısı',
                        data: data.map(item => item.count),
                        borderColor: '#4facfe',
                        backgroundColor: 'rgba(79, 172, 254, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#b8b8b8'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#b8b8b8'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
            
            this.charts.set('trends', chart);
            
        } catch (error) {
            console.error('❌ Trend grafiği oluşturma hatası:', error);
            document.getElementById('trendsChart').innerHTML = '<div class="error">Trend grafiği oluşturulamadı</div>';
        }
    }

    /**
     * Duygu tonu grafiği oluştur
     */
    async createSentimentChart() {
        try {
            const evolution = this.engine.getSentimentEvolution();
            const chartType = this.currentChartTypes.sentiment;
            
            const ctx = document.getElementById('sentimentChart');
            ctx.innerHTML = '<canvas></canvas>';
            
            const chart = new Chart(ctx.querySelector('canvas'), {
                type: chartType,
                data: {
                    labels: evolution.map(item => this.formatDate(item.date, 'daily')),
                    datasets: [
                        {
                            label: 'Pozitif',
                            data: evolution.map(item => item.positive),
                            borderColor: '#43e97b',
                            backgroundColor: 'rgba(67, 233, 123, 0.2)',
                            borderWidth: 2
                        },
                        {
                            label: 'Negatif',
                            data: evolution.map(item => item.negative),
                            borderColor: '#fa709a',
                            backgroundColor: 'rgba(250, 112, 154, 0.2)',
                            borderWidth: 2
                        },
                        {
                            label: 'Nötr',
                            data: evolution.map(item => item.neutral),
                            borderColor: '#f093fb',
                            backgroundColor: 'rgba(240, 147, 251, 0.2)',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#ffffff'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#b8b8b8'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#b8b8b8'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    }
                }
            });
            
            this.charts.set('sentiment', chart);
            
        } catch (error) {
            console.error('❌ Duygu tonu grafiği oluşturma hatası:', error);
            document.getElementById('sentimentChart').innerHTML = '<div class="error">Duygu tonu grafiği oluşturulamadı</div>';
        }
    }

    /**
     * Konu kümeleri grafiği oluştur
     */
    async createTopicsChart() {
        try {
            const clusters = this.engine.getTopicClusters();
            const chartType = this.currentChartTypes.topics;
            
            const ctx = document.getElementById('topicsChart');
            ctx.innerHTML = '<canvas></canvas>';
            
            const colors = [
                '#4facfe', '#43e97b', '#fa709a', '#f093fb', '#667eea',
                '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'
            ];
            
            const chart = new Chart(ctx.querySelector('canvas'), {
                type: chartType,
                data: {
                    labels: clusters.slice(0, 10).map(cluster => cluster.keyword),
                    datasets: [{
                        data: clusters.slice(0, 10).map(cluster => cluster.count),
                        backgroundColor: colors.slice(0, 10),
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#ffffff',
                                padding: 20
                            }
                        }
                    }
                }
            });
            
            this.charts.set('topics', chart);
            
        } catch (error) {
            console.error('❌ Konu kümeleri grafiği oluşturma hatası:', error);
            document.getElementById('topicsChart').innerHTML = '<div class="error">Konu kümeleri grafiği oluşturulamadı</div>';
        }
    }

    /**
     * Anahtar kelime ağı grafiği oluştur
     */
    async createNetworkChart() {
        try {
            const network = this.engine.getKeywordNetwork();
            
            const ctx = document.getElementById('networkChart');
            ctx.innerHTML = '<div style="text-align: center; padding: 50px; color: #b8b8b8;">Network grafiği için gelişmiş kütüphane gerekli</div>';
            
            // Basit network görselleştirmesi
            if (network.nodes.length > 0) {
                const networkHTML = `
                    <div style="padding: 20px;">
                        <h4 style="color: #ffffff; margin-bottom: 15px;">Anahtar Kelime Bağlantıları</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${network.nodes.slice(0, 15).map(node => `
                                <span style="
                                    background: rgba(79, 172, 254, 0.2);
                                    border: 1px solid rgba(79, 172, 254, 0.5);
                                    padding: 5px 10px;
                                    border-radius: 15px;
                                    font-size: 0.9em;
                                    color: #ffffff;
                                ">${node.label} (${node.weight})</span>
                            `).join('')}
                        </div>
                    </div>
                `;
                ctx.innerHTML = networkHTML;
            }
            
        } catch (error) {
            console.error('❌ Network grafiği oluşturma hatası:', error);
            document.getElementById('networkChart').innerHTML = '<div class="error">Network grafiği oluşturulamadı</div>';
        }
    }

    /**
     * Grafik güncelle
     */
    updateChart(chartType) {
        try {
            const chart = this.charts.get(chartType);
            if (chart) {
                chart.destroy();
            }
            
            switch (chartType) {
                case 'trends':
                    this.createTrendsChart();
                    break;
                case 'sentiment':
                    this.createSentimentChart();
                    break;
                case 'topics':
                    this.createTopicsChart();
                    break;
                case 'network':
                    this.createNetworkChart();
                    break;
            }
        } catch (error) {
            console.error('❌ Grafik güncelleme hatası:', error);
        }
    }

    /**
     * İçgörüleri yükle
     */
    async loadInsights() {
        try {
            const insights = this.engine.getPersonalInsights();
            
            const insightsHTML = `
                <div class="insight-card">
                    <div class="insight-icon">📚</div>
                    <div class="insight-title">Toplam Okuma</div>
                    <div class="insight-description">${insights.totalReadings} başlık analiz edildi</div>
                </div>
                <div class="insight-card">
                    <div class="insight-icon">🎯</div>
                    <div class="insight-title">Favori Konular</div>
                    <div class="insight-description">${insights.favoriteTopics.slice(0, 3).map(topic => topic.keyword).join(', ')}</div>
                </div>
                <div class="insight-card">
                    <div class="insight-icon">⏰</div>
                    <div class="insight-title">Okuma Paterni</div>
                    <div class="insight-description">En aktif saatler: ${this.getPatternText(insights.readingPattern)}</div>
                </div>
                <div class="insight-card">
                    <div class="insight-icon">📈</div>
                    <div class="insight-title">Duygu Trendi</div>
                    <div class="insight-description">Genel trend: ${this.getSentimentTrendText(insights.sentimentTrend)}</div>
                </div>
            `;
            
            document.getElementById('insightsGrid').innerHTML = insightsHTML;
            
        } catch (error) {
            console.error('❌ İçgörü yükleme hatası:', error);
            document.getElementById('insightsGrid').innerHTML = '<div class="error">İçgörüler yüklenemedi</div>';
        }
    }

    /**
     * Önerileri yükle
     */
    async loadRecommendations() {
        try {
            const insights = this.engine.getPersonalInsights();
            
            if (insights.recommendations.length === 0) {
                document.getElementById('recommendationsList').innerHTML = 
                    '<div style="text-align: center; color: #b8b8b8; padding: 30px;">Henüz öneri bulunmuyor. Daha fazla analiz yapın!</div>';
                return;
            }
            
            const recommendationsHTML = insights.recommendations.map(rec => `
                <div class="recommendation-item ${rec.priority}">
                    <div class="recommendation-icon">${this.getRecommendationIcon(rec.type)}</div>
                    <div class="recommendation-content">
                        <h4>${rec.title}</h4>
                        <p>${rec.description}</p>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('recommendationsList').innerHTML = recommendationsHTML;
            
        } catch (error) {
            console.error('❌ Öneri yükleme hatası:', error);
            document.getElementById('recommendationsList').innerHTML = '<div class="error">Öneriler yüklenemedi</div>';
        }
    }

    /**
     * Veriyi dışa aktar
     */
    async exportData(format) {
        try {
            const data = this.engine.exportData(format);
            const filename = `eksi-map-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
            
            const blob = new Blob([data], { 
                type: format === 'json' ? 'application/json' : 'text/csv' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`✅ ${format.toUpperCase()} dosyası indirildi: ${filename}`);
            
        } catch (error) {
            console.error('❌ Veri dışa aktarma hatası:', error);
            this.showError('Veri dışa aktarılamadı: ' + error.message);
        }
    }

    /**
     * Grafikleri PNG olarak dışa aktar
     */
    async exportChartsAsPNG() {
        try {
            const charts = Array.from(this.charts.values());
            const promises = charts.map(chart => {
                return new Promise((resolve) => {
                    const canvas = chart.canvas;
                    const link = document.createElement('a');
                    link.download = `chart-${Date.now()}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                    resolve();
                });
            });
            
            await Promise.all(promises);
            console.log('✅ Grafikler PNG olarak indirildi');
            
        } catch (error) {
            console.error('❌ PNG dışa aktarma hatası:', error);
            this.showError('Grafikler dışa aktarılamadı: ' + error.message);
        }
    }

    /**
     * Tarih formatla
     */
    formatDate(dateString, period) {
        const date = new Date(dateString);
        
        switch (period) {
            case 'daily':
                return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
            case 'weekly':
                return `${date.getDate()}/${date.getMonth() + 1}`;
            case 'monthly':
                return date.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
            default:
                return date.toLocaleDateString('tr-TR');
        }
    }

    /**
     * Okuma paterni metni
     */
    getPatternText(pattern) {
        const patterns = {
            'morning': 'Sabah (06:00-12:00)',
            'afternoon': 'Öğleden sonra (12:00-18:00)',
            'evening': 'Akşam (18:00-22:00)',
            'night': 'Gece (22:00-06:00)',
            'none': 'Belirgin patern yok'
        };
        return patterns[pattern] || 'Belirgin patern yok';
    }

    /**
     * Duygu trendi metni
     */
    getSentimentTrendText(trend) {
        const trends = {
            'improving': 'İyileşiyor 📈',
            'declining': 'Azalıyor 📉',
            'stable': 'Kararlı 📊',
            'neutral': 'Nötr ➡️'
        };
        return trends[trend] || 'Nötr ➡️';
    }

    /**
     * Öneri ikonu
     */
    getRecommendationIcon(type) {
        const icons = {
            'frequency': '📊',
            'diversity': '🌍',
            'sentiment': '😊'
        };
        return icons[type] || '💡';
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
}

// Dashboard'u başlat
document.addEventListener('DOMContentLoaded', async () => {
    const dashboard = new AnalyticsDashboard();
    await dashboard.initialize();
}); 