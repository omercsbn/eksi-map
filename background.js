// background.js
// Service worker for Ekşi Map Chrome Extension

// Import configuration
importScripts('config.js');

// Check if API key is configured
if (!GEMINI_API_KEY) {
  console.error('[Ekşi Map Background] API key not configured. Please set up your local-config.js file.');
}

// API çağrısı modüler
async function analyzeWithGemini(text) {
  console.log('[Ekşi Map Background] API çağrısı başlatıldı');
  console.log('[Ekşi Map Background] API Key mevcutluğu:', !!GEMINI_API_KEY);
  
  const prompt = `Bu metin bir forum platformundaki kullanıcı yorumlarından oluşmaktadır. Lütfen bu metni analiz et:

1. Hangi konular konuşuluyor? (3–5 kelimelik liste)
2. Genel duygu tonu nedir? (tek kelime: alaycı, ironik, nötr, üzgün, coşkulu vb.)
3. Bu konuşmalar hangi başlıklarla ilişkili olabilir?
4. Bu başlıkta ne konuşulduğunu 2-3 cümlelik özet yap

Metin:
${text}

Yanıtı şu formatta ver:
{
  "keywords": ["..."],
  "tone": "...",
  "related_topics": ["..."],
  "summary": "Bu başlıkta genelde ... konuşulmuş. Kullanıcılar ... hakkında görüş bildirmişler."
}`;
  
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    console.log('[Ekşi Map Background] HTTP Status:', res.status);
    
    if (!res.ok) {
      console.error('[Ekşi Map Background] API Error:', res.status, res.statusText);
      return null;
    }
    
    const data = await res.json();
    console.log('[Ekşi Map Background] API Yanıtı:', data);
    
    try {
      const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('[Ekşi Map Background] Metin çıkarıldı:', txt);
      const json = JSON.parse(txt.match(/\{[\s\S]*\}/)[0]);
      console.log('[Ekşi Map Background] JSON parse edildi:', json);
      return json;
    } catch (parseError) {
      console.error('[Ekşi Map Background] JSON parse hatası:', parseError);
      return null;
    }
  } catch (error) {
    console.error('[Ekşi Map Background] Network hatası:', error);
    return null;
  }
}

// Google'da Ekşi Sözlük araması
async function searchTopicOnGoogle(topic) {
  try {
    console.log('[Ekşi Map Background] Google\'da aranıyor:', topic);
    
    // Google search yaparak Ekşi Sözlük'te başlık var mı kontrol et
    const searchQuery = `site:eksisozluk.com "${topic}"`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error('[Ekşi Map Background] Google search failed:', response.status);
      return false;
    }
    
    const html = await response.text();
    
    // Basit HTML parse - Ekşi Sözlük linklerini ara
    const hasEksiResults = html.includes('eksisozluk.com') && 
                          (html.includes(topic.toLowerCase()) || 
                           html.includes(topic.replace(/\s+/g, '-').toLowerCase()));
    
    console.log('[Ekşi Map Background] Google search sonucu:', hasEksiResults);
    return hasEksiResults;
    
  } catch (error) {
    console.error('[Ekşi Map Background] Google search hatası:', error);
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GEMINI_ANALYZE') {
    analyzeWithGemini(msg.text).then(sendResponse);
    return true; // async
  }
  
  if (msg.type === 'SEARCH_TOPIC_ON_EKSI') {
    searchTopicOnGoogle(msg.topic).then(exists => {
      sendResponse({ exists });
    });
    return true; // async
  }
});
