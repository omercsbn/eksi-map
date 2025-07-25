// local-config.js
// Local configuration file for Ekşi Map
// Copy this file and rename to local-config.js
// Add your API keys below

const GEMINI_API_KEY = 'your_gemini_api_key_here';
const GOOGLE_SEARCH_API_KEY = 'your_google_search_api_key_here'; // Optional
const GOOGLE_SEARCH_ENGINE_ID = 'your_search_engine_id_here'; // Optional

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    GEMINI_API_KEY,
    GOOGLE_SEARCH_API_KEY,
    GOOGLE_SEARCH_ENGINE_ID
  };
}

// Browser/Service Worker environment - variables are already declared above
