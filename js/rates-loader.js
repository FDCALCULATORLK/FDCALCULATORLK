/**
 * FD Lanka - Rates Loader Module
 * Fetches and caches data/rates.json dynamically on page load.
 */

window.FDLankaRates = {
  data: null,
  isLoaded: false,
  loadError: null,

  async fetchRates() {
    try {
      // Fetch rates.json with a cache-busting timestamp query parameter
      const response = await fetch('../data/rates.json?t=' + Date.now(), {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error fetching rates: status ${response.status}`);
      }

      const json = await response.json();
      this.data = json;
      this.isLoaded = true;
      console.log('[RatesLoader] Successfully loaded rates data:', json);
      
      // Dispatch event for UI controller
      window.dispatchEvent(new CustomEvent('fd-rates-loaded', { detail: json }));
      return json;
    } catch (err) {
      console.warn('[RatesLoader] Fetch failed, attempting relative fallback path...', err);
      try {
        const fallbackRes = await fetch('./data/rates.json?t=' + Date.now());
        if (!fallbackRes.ok) throw new Error('Fallback failed');
        const fallbackJson = await fallbackRes.json();
        this.data = fallbackJson;
        this.isLoaded = true;
        window.dispatchEvent(new CustomEvent('fd-rates-loaded', { detail: fallbackJson }));
        return fallbackJson;
      } catch (fallbackErr) {
        console.error('[RatesLoader] Critical: Unable to load rates data.', fallbackErr);
        this.loadError = fallbackErr;
        window.dispatchEvent(new CustomEvent('fd-rates-error', { detail: fallbackErr }));
        return null;
      }
    }
  }
};

// Auto initialize on script load
document.addEventListener('DOMContentLoaded', () => {
  window.FDLankaRates.fetchRates();
});
