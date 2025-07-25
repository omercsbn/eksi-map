/**
 * Real-time monitoring system for Ekşi Map Pro
 * Monitors page changes and triggers analysis when significant changes are detected
 */
class RealtimeMonitor {
  constructor(notificationManager, analysisComparison) {
    this.observer = null;
    this.lastEntryCount = 0;
    this.lastAnalysisTime = null;
    this.analysisQueue = [];
    this.isAnalyzing = false;
    this.debounceTimer = null;
    this.monitoringInterval = null;
    
    // Dependencies
    this.notificationManager = notificationManager;
    this.analysisComparison = analysisComparison;
    
    // Configuration
    this.config = {
      debounceDelay: 3000, // 3 seconds
      minEntryChangeThreshold: 2, // Minimum entries to trigger analysis
      maxAnalysisFrequency: 60000, // 1 minute between analyses
      monitoringEnabled: true
    };
    
    // State tracking
    this.currentState = {
      entryCount: 0,
      lastModified: null,
      keywords: [],
      tone: null,
      sentiment: null
    };
    
    this.previousState = null;
  }

  /**
   * Start monitoring the page for changes
   */
  startMonitoring() {
    if (!this.config.monitoringEnabled) return;
    
    console.log('[RealtimeMonitor] Starting monitoring...');
    
    // Initial state capture
    this.captureCurrentState();
    
    // Set up MutationObserver for DOM changes
    this.setupMutationObserver();
    
    // Set up periodic monitoring
    this.setupPeriodicMonitoring();
    
    // Show status indicator
    this.showStatusIndicator();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    console.log('[RealtimeMonitor] Stopping monitoring...');
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    this.hideStatusIndicator();
  }

  /**
   * Set up MutationObserver to watch for DOM changes
   */
  setupMutationObserver() {
    const targetNode = document.querySelector('#entry-item-list') || document.body;
    
    this.observer = new MutationObserver((mutations) => {
      let shouldAnalyze = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if new entries were added
          const addedEntries = mutation.addedNodes.length;
          if (addedEntries > 0) {
            shouldAnalyze = true;
          }
        } else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
          // Check if existing entries were modified
          shouldAnalyze = true;
        }
      });
      
      if (shouldAnalyze) {
        this.debouncedAnalysis();
      }
    });
    
    this.observer.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'data-id']
    });
  }

  /**
   * Set up periodic monitoring for changes
   */
  setupPeriodicMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.checkForChanges();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Debounced analysis to prevent excessive API calls
   */
  debouncedAnalysis() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.triggerAnalysis();
    }, this.config.debounceDelay);
  }

  /**
   * Check for significant changes in the page
   */
  checkForChanges() {
    const currentEntryCount = this.getCurrentEntryCount();
    const entryChange = Math.abs(currentEntryCount - this.lastEntryCount);
    
    // Check if enough time has passed since last analysis
    const timeSinceLastAnalysis = this.lastAnalysisTime ? 
      Date.now() - this.lastAnalysisTime : Infinity;
    
    if (entryChange >= this.config.minEntryChangeThreshold && 
        timeSinceLastAnalysis >= this.config.maxAnalysisFrequency) {
      console.log(`[RealtimeMonitor] Significant change detected: ${entryChange} entries`);
      this.triggerAnalysis();
    }
  }

  /**
   * Trigger analysis of current page state
   */
  async triggerAnalysis() {
    if (this.isAnalyzing) {
      console.log('[RealtimeMonitor] Analysis already in progress, queuing...');
      this.analysisQueue.push(Date.now());
      return;
    }
    
    this.isAnalyzing = true;
    this.updateStatusIndicator('analyzing');
    
    try {
      console.log('[RealtimeMonitor] Starting analysis...');
      
      // Capture current state before analysis
      this.captureCurrentState();
      
      // Perform analysis using existing content script methods
      const analysisResult = await this.performAnalysis();
      
      if (analysisResult) {
        // Compare with previous state
        const comparison = this.analysisComparison.compareResults(
          this.previousState, 
          this.currentState
        );
        
        // Check for significant changes
        if (comparison.hasSignificantChanges) {
          this.notificationManager.showNotification('analysis_update', {
            type: 'significant_change',
            data: comparison,
            timestamp: Date.now()
          });
        }
        
        // Update state
        this.previousState = { ...this.currentState };
        this.lastAnalysisTime = Date.now();
        
        console.log('[RealtimeMonitor] Analysis completed successfully');
      }
      
    } catch (error) {
      console.error('[RealtimeMonitor] Analysis failed:', error);
      this.notificationManager.showNotification('error', {
        type: 'analysis_failed',
        message: error.message
      });
    } finally {
      this.isAnalyzing = false;
      this.updateStatusIndicator('idle');
      
      // Process queued analyses
      if (this.analysisQueue.length > 0) {
        this.analysisQueue.shift();
        setTimeout(() => this.triggerAnalysis(), 1000);
      }
    }
  }

  /**
   * Perform analysis using existing content script methods
   */
  async performAnalysis() {
    // Use existing analysis methods from content.js
    const entries = this.getEntries();
    if (!entries.length) return null;
    
    const chunks = this.chunkByParagraph(entries);
    
    try {
      const results = await Promise.all(chunks.map(async (chunk) => {
        return await chrome.runtime.sendMessage({ 
          type: 'GEMINI_ANALYZE', 
          text: chunk 
        });
      }));
      
      const dataArr = results.filter(Boolean);
      if (!dataArr.length) return null;
      
      // Process results similar to existing showPopup method
      const keywords = [...new Set(dataArr.flatMap(d => d.keywords))];
      const tones = dataArr.map(d => d.tone).filter(Boolean);
      const tone = tones.length ? tones[0] : '';
      const summaries = dataArr.map(d => d.summary).filter(Boolean);
      
      // Update current state
      this.currentState = {
        entryCount: entries.length,
        lastModified: Date.now(),
        keywords: keywords,
        tone: tone,
        sentiment: this.calculateSentiment(tone),
        summary: summaries[0] || ''
      };
      
      return this.currentState;
      
    } catch (error) {
      console.error('[RealtimeMonitor] Analysis error:', error);
      throw error;
    }
  }

  /**
   * Capture current state of the page
   */
  captureCurrentState() {
    this.lastEntryCount = this.getCurrentEntryCount();
  }

  /**
   * Get current entry count
   */
  getCurrentEntryCount() {
    const entries = this.getEntries();
    return entries.length;
  }

  /**
   * Get entries using existing method from content.js
   */
  getEntries() {
    let entries = Array.from(document.querySelectorAll('li[data-id] .content'));
    if (!entries.length) {
      entries = Array.from(document.querySelectorAll('.entry .content'));
    }
    if (!entries.length) {
      entries = Array.from(document.querySelectorAll('#entry-item-list .content'));
    }
    if (!entries.length) {
      entries = Array.from(document.querySelectorAll('[data-id] .content'));
    }
    return entries.map(e => e.innerText.trim()).filter(Boolean);
  }

  /**
   * Chunk entries by paragraph (from existing content.js)
   */
  chunkByParagraph(entryArray, maxLength = 2000) {
    const chunks = [];
    let current = "";
    for (let entry of entryArray) {
      if ((current + entry + "\n").length < maxLength) {
        current += entry + "\n";
      } else {
        if (current) chunks.push(current);
        current = entry + "\n";
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  /**
   * Calculate sentiment score from tone
   */
  calculateSentiment(tone) {
    const sentimentMap = {
      'coşkulu': 0.8,
      'mutlu': 0.7,
      'nötr': 0.5,
      'üzgün': 0.3,
      'sinirli': 0.2,
      'ironik': 0.4,
      'sarkastik': 0.3
    };
    return sentimentMap[tone?.toLowerCase()] || 0.5;
  }

  /**
   * Show status indicator
   */
  showStatusIndicator() {
    let indicator = document.getElementById('eksi-map-realtime-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'eksi-map-realtime-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 123, 255, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 10000;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        transition: all 0.3s ease;
        cursor: pointer;
      `;
      document.body.appendChild(indicator);
      
      // Add click handler to toggle monitoring
      indicator.addEventListener('click', () => {
        this.toggleMonitoring();
      });
    }
    
    this.updateStatusIndicator('idle');
  }

  /**
   * Update status indicator
   */
  updateStatusIndicator(status) {
    const indicator = document.getElementById('eksi-map-realtime-indicator');
    if (!indicator) return;
    
    const statusConfig = {
      idle: {
        text: '🟢 İzleniyor',
        color: 'rgba(40, 167, 69, 0.9)',
        shadow: 'rgba(40, 167, 69, 0.3)'
      },
      analyzing: {
        text: '🔄 Analiz...',
        color: 'rgba(255, 193, 7, 0.9)',
        shadow: 'rgba(255, 193, 7, 0.3)'
      },
      disabled: {
        text: '🔴 Kapalı',
        color: 'rgba(108, 117, 125, 0.9)',
        shadow: 'rgba(108, 117, 125, 0.3)'
      }
    };
    
    const config = statusConfig[status] || statusConfig.idle;
    indicator.textContent = config.text;
    indicator.style.background = config.color;
    indicator.style.boxShadow = `0 4px 15px ${config.shadow}`;
  }

  /**
   * Hide status indicator
   */
  hideStatusIndicator() {
    const indicator = document.getElementById('eksi-map-realtime-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Toggle monitoring on/off
   */
  toggleMonitoring() {
    this.config.monitoringEnabled = !this.config.monitoringEnabled;
    
    if (this.config.monitoringEnabled) {
      this.startMonitoring();
    } else {
      this.stopMonitoring();
    }
    
    // Save preference
    localStorage.setItem('eksiMapRealtimeEnabled', this.config.monitoringEnabled);
  }

  /**
   * Load configuration from storage
   */
  loadConfiguration() {
    const saved = localStorage.getItem('eksiMapRealtimeConfig');
    if (saved) {
      this.config = { ...this.config, ...JSON.parse(saved) };
    }
    
    const enabled = localStorage.getItem('eksiMapRealtimeEnabled');
    if (enabled !== null) {
      this.config.monitoringEnabled = enabled === 'true';
    }
  }

  /**
   * Save configuration to storage
   */
  saveConfiguration() {
    localStorage.setItem('eksiMapRealtimeConfig', JSON.stringify(this.config));
    localStorage.setItem('eksiMapRealtimeEnabled', this.config.monitoringEnabled);
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      isMonitoring: this.config.monitoringEnabled,
      isAnalyzing: this.isAnalyzing,
      lastAnalysisTime: this.lastAnalysisTime,
      currentEntryCount: this.currentState.entryCount,
      analysisQueueLength: this.analysisQueue.length,
      totalAnalyses: this.getTotalAnalyses()
    };
  }

  /**
   * Get total number of analyses performed
   */
  getTotalAnalyses() {
    const history = JSON.parse(localStorage.getItem('eksiMapHistory') || '[]');
    return history.length;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RealtimeMonitor;
} 