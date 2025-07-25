# Ekşi Map

Ekşi Sözlük başlıklarını AI ile analiz eden Chrome uzantısı. Anahtar kelimeler, duygu tonu analizi, görselleştirme ve gelişmiş özellikler sunar.

## Özellikler

### Temel Analiz
- **AI Destekli Analiz**: Gemini AI ile gelişmiş metin analizi
- **Anahtar Kelime Çıkarma**: Başlıktaki önemli kelimeleri otomatik tespit
- **Duygu Tonu Analizi**: Entry'lerin genel duygu durumunu belirleme
- **İlgili Başlık Önerileri**: Benzer konuları otomatik önerme

### Görselleştirme ve Analytics
- **Bubble Chart**: Analiz sonuçlarını görsel olarak sunma
- **Trend Grafikleri**: Zaman içindeki analiz trendlerini gösterme
- **Analytics Dashboard**: Kapsamlı okuma analizi ve kişisel içgörüler
- **Gerçek Zamanlı İzleme**: Başlık değişikliklerini anlık takip
- **Bildirim Sistemi**: Önemli değişiklikler için akıllı bildirimler

### Gelişmiş Arama ve Filtreleme
- **Full-Text Search**: Başlık, anahtar kelime ve özet araması
- **Akıllı Filtreler**: Tarih, duygu tonu, konu kategorisi filtreleme
- **Fuzzy Search**: Yazım hatalarını tolere eden arama
- **Kayıtlı Aramalar**: Sık kullanılan aramaları kaydetme
- **Arama Önerileri**: AI destekli arama önerileri
- **Bulk Actions**: Toplu işlemler ve dışa aktarma

### Veri Senkronizasyonu ve Yedekleme
- **Otomatik Senkronizasyon**: Verileri otomatik olarak senkronize etme
- **Yerel Yedekleme**: Chrome Storage API ile güvenli yedekleme
- **Bulut Entegrasyonu**: Google Drive ve Dropbox desteği (gelecek)
- **Veri Şifreleme**: AES-256 ile güvenli veri saklama
- **Veri Sıkıştırma**: LZ4 algoritması ile optimize edilmiş depolama
- **Çakışma Çözümleme**: Aynı anda birden fazla cihazda değişiklik yapıldığında
- **Yedekleme Yönetimi**: Yedekleme oluşturma, geri yükleme ve silme
- **Veri Dışa Aktarma**: JSON formatında veri dışa aktarma
- **Senkronizasyon Durumu**: Gerçek zamanlı durum göstergesi

### Kullanıcı Deneyimi
- **Modern UI**: Glassmorphism tasarım ile şık arayüz
- **Klavye Kısayolları**: Hızlı erişim için kısayol tuşları
- **Otomatik Analiz**: Sayfa yüklendiğinde otomatik analiz seçeneği
- **Geçmiş Yönetimi**: Analiz geçmişini görüntüleme ve yönetme

### Gelişmiş Özellikler
- **Veri Export**: Analiz sonuçlarını JSON/CSV formatında dışa aktarma
- **Ayarlar Paneli**: Kullanıcı tercihlerini özelleştirme
- **Responsive Tasarım**: Tüm cihazlarda uyumlu görünüm
- **Gerçek Zamanlı Güncelleme**: Otomatik veri yenileme
- **Kişisel Öneriler**: AI destekli okuma önerileri
- **Performans Optimizasyonu**: Web Workers ile hızlı arama

## Kurulum

### Gereksinimler
- Google Chrome (Manifest V3 destekli)
- Gemini AI API anahtarı
- Google Search API anahtarı (opsiyonel)

### Adımlar
1. **Projeyi İndirin**
   ```bash
   git clone https://github.com/omercsbn/eksi-map.git
   cd eksi-map
   ```

2. **Ortam Değişkenlerini Ayarlayın**
   - `.env.example` dosyasını `.env` olarak kopyalayın
   - `.env` dosyasında API anahtarlarınızı ekleyin:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
   GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
   ```

3. **Chrome'a Yükleyin**
   - Chrome'da `chrome://extensions/` adresine gidin
   - "Geliştirici modu"nu açın
   - "Paketlenmemiş öğe yükle" butonuna tıklayın
   - Proje klasörünü seçin

## Kullanım

### Temel Kullanım
1. **Ekşi Sözlük'e Gidin**: Herhangi bir başlık sayfasına gidin
2. **Analiz Butonuna Tıklayın**: Sağ alttaki "Analiz" butonuna tıklayın
3. **Sonuçları İnceleyin**: Popup'ta analiz sonuçlarını görüntüleyin

### Analytics Dashboard
1. **Dashboard'a Erişin**: Uzantı popup'ında "Analytics" butonuna tıklayın
2. **İçgörüleri Keşfedin**: Okuma trendleri, konu kümeleri ve kişisel analizler
3. **Önerileri İnceleyin**: AI destekli okuma önerilerini görüntüleyin
4. **Veriyi Dışa Aktarın**: JSON, CSV veya PNG formatında indirin

### Gelişmiş Arama
1. **Arama Sayfasına Erişin**: Uzantı popup'ında "Arama" butonuna tıklayın
2. **Arama Yapın**: Başlık, anahtar kelime veya özet araması yapın
3. **Filtreleri Uygulayın**: Tarih, duygu tonu, konu kategorisi filtreleri
4. **Sonuçları Yönetin**: Kaydet, paylaş, yeniden analiz et veya dışa aktar

### Veri Senkronizasyonu
1. **Senkronizasyon Sayfasına Erişin**: Uzantı popup'ında "Senkronizasyon" butonuna tıklayın
2. **Ayarları Yapılandırın**: Otomatik senkronizasyon, yedekleme sıklığı ve güvenlik ayarları
3. **Manuel İşlemler**: Manuel senkronizasyon ve yedekleme işlemleri
4. **Yedekleme Yönetimi**: Yedeklemeleri görüntüleme, geri yükleme ve silme
5. **Veri Dışa Aktarma**: Analiz verilerini JSON formatında dışa aktarma

### Klavye Kısayolları
- `Ctrl+Shift+A`: Hızlı analiz
- `Ctrl+Shift+H`: Geçmiş popup'ını aç
- `Ctrl+Shift+E`: Uzantı popup'ını aç
- `Ctrl+Shift+S`: Senkronizasyon sayfasını aç

### Dashboard Erişimi
- Uzantı popup'ında "Geçmiş" butonuna tıklayın
- Veya doğrudan `dashboard.html` dosyasını açın

## Dosya Yapısı

```
eksi-map/
├── manifest.json              # Uzantı konfigürasyonu
├── popup.html                 # Ana popup arayüzü
├── popup.js                   # Popup JavaScript
├── content.js                 # Sayfa içi script
├── background.js              # Arka plan script
├── config.js                  # API konfigürasyonu
├── local-config.example.js    # Yerel konfigürasyon örneği
├── .env.example               # Ortam değişkenleri örneği
├── .gitignore                 # Git ignore dosyası
├── dashboard.html             # Dashboard sayfası
├── dashboard.js               # Dashboard JavaScript
├── analytics.html             # Analytics Dashboard
├── analytics.js               # Analytics JavaScript
├── analytics-engine.js        # Analytics veri motoru
├── search-filter.html         # Gelişmiş Arama Arayüzü
├── search-filter.js           # Arama Arayüzü JavaScript
├── search-engine.js           # Arama Motoru
├── sync-manager.js            # Veri Senkronizasyon Yöneticisi
├── sync-ui.js                 # Senkronizasyon UI Modülü
├── sync-settings.html         # Senkronizasyon Ayarları Sayfası
├── sync-settings.js           # Senkronizasyon Ayarları JavaScript
├── realtime-monitor.js        # Gerçek zamanlı izleme
├── notification-manager.js    # Bildirim yöneticisi
├── analysis-comparison.js     # Analiz karşılaştırma
├── chart.min.js               # Chart.js kütüphanesi
└── README.md                  # Bu dosya
```

## Konfigürasyon

### API Ayarları
Ortam değişkenlerini `.env` dosyasında ayarlayın:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### Kullanıcı Tercihleri
```javascript
// Otomatik açık
setUserPreference('defaultOpen', true);

// Otomatik analiz
setUserPreference('autoAnalyze', false);

// Bildirim ayarları
setNotificationPreference('browserNotifications', true);
setNotificationPreference('inPageToasts', true);
```

### Senkronizasyon Ayarları
```javascript
// Otomatik senkronizasyon
syncEnabled: true,
autoSyncInterval: 5, // dakika

// Yedekleme ayarları
autoBackupInterval: 15, // dakika
encryptionEnabled: true,
compressionEnabled: true

// Bulut servisi (gelecek)
cloudProvider: 'local' // 'local', 'google-drive', 'dropbox'
```

## Analytics Dashboard Özellikleri

### Okuma Trendleri
- **Günlük/Haftalık/Aylık**: Zaman bazlı okuma analizi
- **Duygu Tonu Evrimi**: Duygu değişimlerini takip
- **Aktivite Paternleri**: En aktif okuma saatleri

### Konu Kümeleri
- **Anahtar Kelime Ağları**: Kelime bağlantılarını görselleştirme
- **Konu Kategorileri**: Benzer konuları gruplandırma
- **Trend Analizi**: Popüler konuları belirleme

### Kişisel İçgörüler
- **Okuma Paternleri**: Kişisel okuma alışkanlıkları
- **Favori Konular**: En çok ilgilenilen alanlar
- **Duygu Trendleri**: Genel duygu durumu analizi

### Akıllı Öneriler
- **Okuma Önerileri**: Benzer konulara yönlendirme
- **Çeşitlilik Önerileri**: Farklı konular keşfetme
- **Duygu Dengesi**: Pozitif/negatif içerik dengesi

## Gelişmiş Arama Özellikleri

### Arama Türleri
- **Full-Text Search**: Başlık, anahtar kelime ve özet araması
- **Fuzzy Search**: Yazım hatalarını tolere eden arama
- **Semantic Search**: Anlamlı arama sonuçları
- **Auto-Complete**: Akıllı arama önerileri

### Filtreleme Seçenekleri
- **Tarih Aralığı**: Belirli tarih aralığında arama
- **Duygu Tonu**: Pozitif/negatif/nötr filtreleme
- **Konu Kategorisi**: Teknoloji, siyaset, spor vb.
- **Okuma Süresi**: Tahmini okuma süresine göre filtreleme
- **Çoklu Kriter**: Birden fazla filtreyi birleştirme

### Kayıtlı Aramalar
- **Arama Kaydetme**: Sık kullanılan aramaları kaydetme
- **Arama Geçmişi**: Son aramaları görüntüleme
- **Hızlı Erişim**: Kayıtlı aramalara tek tıkla erişim

### Sonuç Yönetimi
- **Sıralama Seçenekleri**: İlgi, tarih, duygu tonu, popülerlik
- **Toplu İşlemler**: Birden fazla sonucu seçme ve işleme
- **Hızlı Aksiyonlar**: Yeniden analiz, paylaş, kaydet, dışa aktar
- **Export Seçenekleri**: Filtrelenmiş sonuçları dışa aktarma

## Analiz Sonuçları

### Çıktı Formatı
```json
{
  "keywords": ["anahtar", "kelimeler"],
  "tone": "duygu_tonu",
  "related_topics": ["ilgili", "başlıklar"],
  "summary": "Analiz özeti"
}
```

### Desteklenen Duygu Tonları
- Sinirli/Kızgın
- İronik
- Nötr
- Üzgün
- Coşkulu
- Sarkastik
- Şaşırmış
- Korku
- Tiksinti
- Eleştirel

## UI Özellikleri

### Tasarım Prensipleri
- **Glassmorphism**: Şeffaf ve bulanık efektler
- **Gradient Renkler**: Modern gradient arka planlar
- **Responsive Grid**: Esnek grid sistemi
- **Smooth Animations**: Yumuşak geçiş animasyonları

### Renk Paleti
- **Primary**: `#007bff` (Mavi)
- **Success**: `#28a745` (Yeşil)
- **Warning**: `#ffc107` (Sarı)
- **Danger**: `#dc3545` (Kırmızı)
- **Info**: `#17a2b8` (Cyan)

## Güncelleme Geçmişi

### v2.3.0 (Güncel)
- 🔄 Veri Senkronizasyonu ve Yedekleme Sistemi
- 💾 Otomatik ve manuel yedekleme özellikleri
- 🔐 AES-256 şifreleme ve veri güvenliği
- 📊 Yedekleme yönetimi (görüntüleme, geri yükleme, silme)
- 🔄 Otomatik senkronizasyon ve çakışma çözümleme
- 📤 Veri dışa aktarma ve içe aktarma
- ⚙️ Kapsamlı senkronizasyon ayarları
- 🎯 Gerçek zamanlı senkronizasyon durumu
- 🔒 Checksum kontrolü ve veri bütünlüğü
- 📱 Responsive senkronizasyon arayüzü

### v2.2.0
- 🔍 Gelişmiş Arama ve Filtreleme Sistemi
- 📝 Full-Text Search özelliği
- 🎛️ Akıllı filtreleme seçenekleri
- 💾 Kayıtlı aramalar ve arama geçmişi
- 🔄 Fuzzy Search ve auto-complete
- 📤 Gelişmiş sonuç yönetimi
- ⚡ Web Workers ile performans optimizasyonu
- 🎯 Bulk actions ve toplu işlemler

### v2.1.0
- ✨ Analytics Dashboard
- 📊 Kapsamlı veri analizi
- 🎯 Kişisel içgörüler
- 💡 AI destekli öneriler
- 📈 Trend grafikleri
- 🔄 Gerçek zamanlı izleme
- 🔔 Akıllı bildirim sistemi
- 📤 Veri dışa aktarma (JSON/CSV/PNG)

### v2.0.0
- ✨ Modern UI tasarımı
- 📊 Dashboard sayfası
- 🎯 Gelişmiş analiz özellikleri
- ⌨️ Klavye kısayolları
- 📈 Trend grafikleri
- 🔄 Otomatik yenileme

### v1.0.0
- 🧠 Temel AI analizi
- 📝 Anahtar kelime çıkarma
- 🎭 Duygu tonu analizi
- 🔗 İlgili başlık önerileri

## 🤝 Katkıda Bulunma

1. **Fork Yapın**: Projeyi fork edin
2. **Branch Oluşturun**: Yeni özellik için branch oluşturun
3. **Commit Yapın**: Değişikliklerinizi commit edin
4. **Push Yapın**: Branch'inizi push edin
5. **Pull Request**: Pull request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## Sorun Bildirimi

Bir hata bulduysanız veya öneriniz varsa:
1. **Issue Oluşturun**: GitHub'da yeni issue açın
2. **Detay Verin**: Sorunu detaylı açıklayın
3. **Ekran Görüntüsü**: Varsa ekran görüntüsü ekleyin

## İletişim

- **GitHub**: [@omercsbn](https://github.com/omercsbn)
- **Email**: omercansabun@icloud.com
- **Website**: [omercansabun.com](https://omercansabun.com)

## Teşekkürler

- **Ekşi Sözlük**: Platform için
- **Google Gemini**: AI analizi için
- **Chart.js**: Görselleştirme için
- **Tüm Katkıda Bulunanlar**: Projeye destek için

---

**Ekşi Map** ile Ekşi Sözlük deneyiminizi bir üst seviyeye taşıyın! 

## 🔄 Veri Senkronizasyonu Özellikleri

### 🔄 Otomatik Senkronizasyon
- **Zamanlanmış Senkronizasyon**: Belirlenen aralıklarla otomatik senkronizasyon
- **Değişiklik Algılama**: Veri değişikliklerini otomatik tespit etme
- **Çakışma Çözümleme**: Aynı anda birden fazla cihazda değişiklik yapıldığında
- **Senkronizasyon Durumu**: Gerçek zamanlı durum göstergesi

### 💾 Yedekleme Sistemi
- **Otomatik Yedekleme**: Belirlenen aralıklarla otomatik yedekleme
- **Manuel Yedekleme**: Kullanıcı tarafından başlatılan yedekleme
- **Yedekleme Geçmişi**: Son 10 yedeklemeyi görüntüleme
- **Yedekleme Geri Yükleme**: Önceki yedeklemeleri geri yükleme
- **Yedekleme Silme**: Gereksiz yedeklemeleri silme

### 🔐 Güvenlik Özellikleri
- **AES-256 Şifreleme**: Yedeklenen verileri güvenli şifreleme
- **Checksum Kontrolü**: Veri bütünlüğünü kontrol etme
- **Şifreleme Anahtarı Yönetimi**: Güvenli anahtar saklama
- **Veri Sıkıştırma**: LZ4 algoritması ile optimize edilmiş depolama

### ☁️ Bulut Entegrasyonu (Gelecek)
- **Google Drive Entegrasyonu**: Google Drive'a veri senkronizasyonu
- **Dropbox Entegrasyonu**: Dropbox'a veri senkronizasyonu
- **OAuth2 Authentication**: Güvenli bulut servisi kimlik doğrulama
- **Çoklu Cihaz Senkronizasyonu**: Farklı cihazlar arası veri senkronizasyonu

### 📊 Veri Yönetimi
- **Veri Dışa Aktarma**: JSON formatında veri dışa aktarma
- **Veri İçe Aktarma**: Dışa aktarılan verileri içe aktarma
- **Veri Temizleme**: Gereksiz verileri temizleme
- **Veri Optimizasyonu**: Depolama alanını optimize etme 