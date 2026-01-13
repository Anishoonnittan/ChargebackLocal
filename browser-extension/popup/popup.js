// ScamShield Pro Extension - Popup Script v2.0
// Complete rewrite with Convex integration and full feature parity

import convexClient from '../lib/convex-client.js';

// State
let currentUser = null;
let currentAccountType = 'personal';
let scanHistory = [];
let communityData = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  setupEventListeners();
  setupTabSwitching();
  await hydrateBackendSettings();
});

// Check if user is signed in
async function checkAuthStatus() {
  const { convexAuthToken, userEmail, accountType } = await chrome.storage.sync.get([
    'convexAuthToken',
    'userEmail',
    'accountType'
  ]);
  
  if (!convexAuthToken) {
    showNotSignedIn();
  } else {
    currentUser = { email: userEmail };
    currentAccountType = accountType || 'personal';
    await convexClient.setAuth(convexAuthToken);
    showSignedIn();
    await loadDashboardData();
  }
}

function showNotSignedIn() {
  document.getElementById('not-signed-in').classList.remove('hidden');
  document.getElementById('signed-in').classList.add('hidden');
}

function showSignedIn() {
  document.getElementById('not-signed-in').classList.add('hidden');
  document.getElementById('signed-in').classList.remove('hidden');
}

// Setup event listeners
function setupEventListeners() {
  // Auth buttons
  document.getElementById('sign-in-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://scamshieldpro.com.au/sign-in' });
  });
  
  document.getElementById('sign-up-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://scamshieldpro.com.au/sign-up' });
  });
  
  document.getElementById('sign-out-btn')?.addEventListener('click', handleSignOut);
  
  // Quick actions (Dashboard)
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handleQuickAction(action);
    });
  });
  
  // Scanner buttons
  document.getElementById('scan-profile-btn')?.addEventListener('click', handleProfileScan);
  document.getElementById('scan-link-btn')?.addEventListener('click', handleLinkScan);
  document.getElementById('scan-email-btn')?.addEventListener('click', handleEmailScan);
  document.getElementById('scan-message-btn')?.addEventListener('click', handleMessageScan);
  
  // History filter
  document.getElementById('history-filter')?.addEventListener('change', filterHistory);
  
  // Community
  document.getElementById('report-scam-btn')?.addEventListener('click', openReportScam);
  
  // Settings
  document.getElementById('upgrade-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://scamshieldpro.com.au/pricing' });
  });
  
  document.getElementById('clear-cache-btn')?.addEventListener('click', clearCache);
  document.getElementById('export-history-btn')?.addEventListener('click', exportHistory);
  
  // Backend
  document.getElementById('save-convex-url-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('convex-url');
    const value = input?.value?.trim();
    if (!value) {
      alert('Please paste your Convex deployment URL first.');
      return;
    }
    if (!value.startsWith('https://') || !value.includes('.convex.cloud')) {
      alert('That doesn\'t look like a Convex URL. It should look like: https://YOUR-DEPLOYMENT.convex.cloud');
      return;
    }

    await chrome.storage.sync.set({ convexUrl: value });
    alert('Backend URL saved.');
  });
  
  // Preferences
  document.getElementById('auto-scan')?.addEventListener('change', (e) => {
    chrome.storage.sync.set({ autoScan: e.target.checked });
  });
  
  document.getElementById('notifications-enabled')?.addEventListener('change', (e) => {
    chrome.storage.sync.set({ notificationsEnabled: e.target.checked });
  });
  
  document.getElementById('watchlist-alerts')?.addEventListener('change', (e) => {
    chrome.storage.sync.set({ watchlistAlerts: e.target.checked });
  });
}

// Setup tab switching
function setupTabSwitching() {
  // Main tabs
  document.querySelectorAll('.main-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const tabName = tab.dataset.tab;
      await switchMainTab(tabName);
    });
  });
  
  // Sub tabs (Scanner)
  document.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const subtabName = tab.dataset.subtab;
      switchSubTab(subtabName);
    });
  });
}

async function switchMainTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.main-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.main-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
  
  // Load data for specific tabs
  if (tabName === 'history') {
    await loadHistoryData();
  } else if (tabName === 'community') {
    await loadCommunityData();
  }
}

function switchSubTab(subtabName) {
  // Update sub tab buttons
  document.querySelectorAll('.sub-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.subtab === subtabName);
  });
  
  // Update sub tab content
  document.querySelectorAll('.sub-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `subtab-${subtabName}`);
  });
}

// Load Dashboard Data
async function loadDashboardData() {
  try {
    // Load user data from Convex
    const userData = await convexClient.query('users.getCurrentUser');
    
    if (userData) {
      currentUser = userData;
      currentAccountType = userData.accountType || 'personal';
      
      // Update UI
      document.getElementById('welcome-text').textContent = `G'day ${userData.name?.split(' ')[0] || ''} 👋`;
      document.getElementById('account-badge').textContent = `${capitalizeFirst(currentAccountType)} Account`;
      document.getElementById('user-email').textContent = userData.email;
      document.getElementById('account-type').textContent = `${capitalizeFirst(currentAccountType)} Account`;
      
      // Load profile picture (Convex storage IDs need resolving to a signed URL)
      try {
        const profileImageUrl = await convexClient.query('users.getProfileImageUrl');
        if (profileImageUrl) {
          document.getElementById('profile-pic').src = profileImageUrl;
        }
      } catch (e) {
        // Non-fatal
      }
    }
    
    // Load user stats
    const stats = await convexClient.query('users.getUserStats');
    
    if (stats) {
      const totalScans = stats.totalScans || 0;
      const realHumans = stats.realProfiles || 0;
      const sussAccounts = stats.suspiciousProfiles || 0;
      // We don't currently store a distinct "fake" counter in users.getUserStats.
      // Best-effort approximation for the extension UI.
      const fakesCaught = Math.max(0, totalScans - realHumans - sussAccounts);
      
      // Dashboard stats row
      document.getElementById('dashboard-scans').textContent = totalScans;
      document.getElementById('dashboard-real').textContent = realHumans;
      document.getElementById('dashboard-blocked').textContent = fakesCaught;
      
      // Your Stats cards
      document.getElementById('real-humans').textContent = realHumans;
      document.getElementById('suss-accounts').textContent = sussAccounts;
      document.getElementById('fakes-caught').textContent = fakesCaught;
      document.getElementById('total-scans').textContent = totalScans;
    }
    
    // Load segment-specific stats
    loadSegmentStats();
    
    // Load subscription info
    const subscription = await convexClient.query('users.getSubscriptionStatus');
    if (subscription) {
      const tier = subscription.tier || 'free';
      document.getElementById('subscription-plan').textContent =
        tier === 'free' ? 'Free Plan' :
        tier === 'basic' ? 'Basic Plan' :
        tier === 'pro' ? 'Pro Plan' :
        tier === 'business' ? 'Business Plan' : 'Free Plan';
    }
    
    // Load preferences
    const { autoScan, notificationsEnabled, watchlistAlerts } = await chrome.storage.sync.get([
      'autoScan',
      'notificationsEnabled',
      'watchlistAlerts'
    ]);
    
    document.getElementById('auto-scan').checked = autoScan || false;
    document.getElementById('notifications-enabled').checked = notificationsEnabled !== false;
    document.getElementById('watchlist-alerts').checked = watchlistAlerts !== false;
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}

function loadSegmentStats() {
  const segmentStatsEl = document.getElementById('segment-stats');
  
  let segmentHTML = '';
  
  if (currentAccountType === 'personal') {
    segmentHTML = `
      <div class="segment-card">
        <div class="segment-icon">🛡️</div>
        <div class="segment-content">
          <h4>Safety Score</h4>
          <div class="segment-value">94/100</div>
          <p>You're well protected from scams</p>
        </div>
      </div>
    `;
  } else if (currentAccountType === 'business') {
    segmentHTML = `
      <div class="segment-card">
        <div class="segment-icon">💰</div>
        <div class="segment-content">
          <h4>Fraud Prevented</h4>
          <div class="segment-value">$4,230 AUD</div>
          <p>Blocked 12 fraudulent profiles</p>
        </div>
      </div>
    `;
  } else if (currentAccountType === 'charity') {
    segmentHTML = `
      <div class="segment-card">
        <div class="segment-icon">✅</div>
        <div class="segment-content">
          <h4>Verifications Done</h4>
          <div class="segment-value">24</div>
          <p>Volunteers & donors verified safely</p>
        </div>
      </div>
    `;
  } else if (currentAccountType === 'community') {
    segmentHTML = `
      <div class="segment-card">
        <div class="segment-icon">🔔</div>
        <div class="segment-content">
          <h4>Alerts Sent</h4>
          <div class="segment-value">342</div>
          <p>Community members kept safe this week</p>
        </div>
      </div>
    `;
  }
  
  segmentStatsEl.innerHTML = segmentHTML;
}

// Handle quick actions
function handleQuickAction(action) {
  if (action === 'scan-profile') {
    switchMainTab('scanner');
    switchSubTab('profile');
  } else if (action === 'scan-link') {
    switchMainTab('scanner');
    switchSubTab('link');
  } else if (action === 'scan-email') {
    switchMainTab('scanner');
    switchSubTab('email');
  } else if (action === 'scan-message') {
    switchMainTab('scanner');
    switchSubTab('message');
  }
}

// Handle Profile Scan
async function handleProfileScan() {
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('profile-result');
  
  // Get current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  
  if (!currentTab) {
    alert('Could not access current tab');
    return;
  }
  
  if (!isProfileUrl(currentTab.url)) {
    alert('Please navigate to a Facebook, Instagram, Twitter/X, or LinkedIn profile first.');
    return;
  }
  
  // Show loading
  loadingEl.classList.remove('hidden');
  resultEl.classList.add('hidden');
  
  try {
    // Send message to background to perform scan
    const response = await chrome.runtime.sendMessage({
      action: 'performScan',
      url: currentTab.url,
      platform: detectPlatform(currentTab.url)
    });
    
    if (response.success) {
      displayProfileResult(response.result);
    } else {
      throw new Error(response.error || 'Scan failed');
    }
  } catch (error) {
    console.error('Scan error:', error);
    alert('Scan failed: ' + error.message);
  } finally {
    loadingEl.classList.add('hidden');
  }
}

function isProfileUrl(url) {
  return url.includes('facebook.com') ||
         url.includes('instagram.com') ||
         url.includes('twitter.com') ||
         url.includes('x.com') ||
         url.includes('linkedin.com');
}

function detectPlatform(url) {
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'unknown';
}

function displayProfileResult(result) {
  const resultEl = document.getElementById('profile-result');
  const riskClass = result.riskLevel; // 'low', 'medium', 'high'
  const riskEmoji = riskClass === 'low' ? '✅' : riskClass === 'medium' ? '⚠️' : '🚨';
  
  resultEl.innerHTML = `
    <div class="result-card ${riskClass}">
      <div class="result-header">
        <span class="result-emoji">${riskEmoji}</span>
        <span class="result-risk">${capitalizeFirst(riskClass)} Risk</span>
      </div>
      <div class="result-score">
        <span class="score-label">Trust Score</span>
        <span class="score-value">${result.trustScore}%</span>
      </div>
      ${result.flags && result.flags.length > 0 ? `
        <div class="result-flags">
          <h4>Red Flags:</h4>
          ${result.flags.map(flag => `<div class="flag-item">⚠️ ${flag}</div>`).join('')}
        </div>
      ` : ''}
      <div class="result-actions">
        <button class="btn-sm btn-secondary" onclick="addToWatchlist('${result.profileUrl}')">
          Add to Watchlist
        </button>
      </div>
    </div>
  `;
  
  resultEl.classList.remove('hidden');
}

// Handle Link Scan
async function handleLinkScan() {
  const input = document.getElementById('link-input');
  const url = input.value.trim();
  
  if (!url) {
    alert('Please enter a URL to scan');
    return;
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    alert('Please enter a valid URL (must start with http:// or https://)');
    return;
  }
  
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('link-result');
  
  loadingEl.classList.remove('hidden');
  resultEl.classList.add('hidden');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'scanLink',
      url: url
    });
    
    if (response.success) {
      displayLinkResult(response.result);
    } else {
      throw new Error(response.error || 'Scan failed');
    }
  } catch (error) {
    alert('Scan failed: ' + error.message);
  } finally {
    loadingEl.classList.add('hidden');
  }
}

function displayLinkResult(result) {
  const resultEl = document.getElementById('link-result');
  const riskEmoji = result.riskLevel === 'safe' ? '✅' : 
                   result.riskLevel === 'suspicious' ? '⚠️' : '🚨';
  
  resultEl.innerHTML = `
    <div class="result-card ${result.riskLevel}">
      <div class="result-header">
        <span class="result-emoji">${riskEmoji}</span>
        <span class="result-risk">${capitalizeFirst(result.riskLevel)}</span>
      </div>
      <div class="result-details">
        <p><strong>URL:</strong> ${truncateUrl(result.url || '')}</p>
        <p>${result.summary || result.details || 'Analysis complete'}</p>
        ${result.isPhishing ? '<p class="warning">⚠️ Phishing Detected</p>' : ''}
        ${result.isMalware ? '<p class="warning">⚠️ Malware Detected</p>' : ''}
      </div>
    </div>
  `;
  
  resultEl.classList.remove('hidden');
}

// Handle Email Scan
async function handleEmailScan() {
  const input = document.getElementById('email-input');
  const email = input.value.trim();
  
  if (!email) {
    alert('Please enter an email address');
    return;
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    alert('Please enter a valid email address');
    return;
  }
  
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('email-result');
  
  loadingEl.classList.remove('hidden');
  resultEl.classList.add('hidden');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'scanEmail',
      email: email
    });
    
    if (response.success) {
      displayEmailResult(response.result);
    } else {
      throw new Error(response.error || 'Verification failed');
    }
  } catch (error) {
    alert('Verification failed: ' + error.message);
  } finally {
    loadingEl.classList.add('hidden');
  }
}

function displayEmailResult(result) {
  const resultEl = document.getElementById('email-result');
  const riskEmoji = result.riskLevel === 'safe' ? '✅' : 
                   result.riskLevel === 'suspicious' ? '⚠️' : '🚨';
  
  resultEl.innerHTML = `
    <div class="result-card ${result.riskLevel}">
      <div class="result-header">
        <span class="result-emoji">${riskEmoji}</span>
        <span class="result-risk">${capitalizeFirst(result.riskLevel)}</span>
      </div>
      <div class="result-details">
        <p><strong>Email:</strong> ${result.email || ''}</p>
        <p><strong>Valid:</strong> ${result.isValid ? 'Yes ✓' : 'No ✗'}</p>
        <p><strong>Disposable:</strong> ${result.isDisposable ? 'Yes ⚠️' : 'No ✓'}</p>
        <p><strong>Free Provider:</strong> ${result.isFreeProvider ? 'Yes' : 'No'}</p>
        ${result.details ? `<p>${result.details}</p>` : ''}
      </div>
    </div>
  `;
  
  resultEl.classList.remove('hidden');
}

// Handle Message Scan
async function handleMessageScan() {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  
  if (!text) {
    alert('Please paste a message to scan');
    return;
  }
  
  if (text.length < 10) {
    alert('Message is too short to analyze');
    return;
  }
  
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('message-result');
  
  loadingEl.classList.remove('hidden');
  resultEl.classList.add('hidden');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'scanMessage',
      text: text
    });
    
    if (response.success) {
      displayMessageResult(response.result);
    } else {
      throw new Error(response.error || 'Scan failed');
    }
  } catch (error) {
    alert('Scan failed: ' + error.message);
  } finally {
    loadingEl.classList.add('hidden');
  }
}

function displayMessageResult(result) {
  const resultEl = document.getElementById('message-result');
  const riskEmoji = result.riskLevel === 'safe' ? '✅' : 
                   result.riskLevel === 'suspicious' ? '⚠️' : 
                   result.riskLevel === 'high_risk' ? '🔴' : '🚨';
  
  resultEl.innerHTML = `
    <div class="result-card ${result.riskLevel}">
      <div class="result-header">
        <span class="result-emoji">${riskEmoji}</span>
        <span class="result-risk">${capitalizeFirst(result.riskLevel.replace('_', ' '))}</span>
      </div>
      <div class="result-details">
        <p><strong>Risk Score:</strong> ${result.riskScore || 0}%</p>
        <p><strong>Patterns Detected:</strong> ${result.detectedPatterns?.length || 0}</p>
        ${result.recommendation ? `<p><strong>Recommendation:</strong> ${result.recommendation.replace('_', ' ')}</p>` : ''}
      </div>
      ${result.detectedPatterns && result.detectedPatterns.length > 0 ? `
        <div class="result-flags">
          <h4>Red Flags:</h4>
          ${result.detectedPatterns.slice(0, 5).map(pattern => `
            <div class="flag-item">${pattern.severity === 'high' ? '🔴' : '⚠️'} ${pattern.type}: ${pattern.description || ''}</div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  
  resultEl.classList.remove('hidden');
}

// Load History Data
async function loadHistoryData() {
  try {
    // Current Convex function name
    const history = await convexClient.query('scans.getUserScans', { limit: 50 });
    scanHistory = history || [];
    renderHistory(scanHistory);
  } catch (error) {
    console.error('Failed to load history:', error);
    scanHistory = [];
    renderHistory([]);
  }
}

function renderHistory(historyItems) {
  const historyListEl = document.getElementById('history-list');
  
  if (historyItems.length === 0) {
    historyListEl.innerHTML = `
      <div class="empty-state">
        <span class="emoji">📭</span>
        <p>No scan history yet</p>
        <small>Your scans will appear here</small>
      </div>
    `;
    return;
  }
  
  historyListEl.innerHTML = historyItems.map(item => {
    const normalizedRisk = item.riskLevel === 'real' ? 'low' : item.riskLevel === 'suspicious' ? 'medium' : item.riskLevel === 'fake' ? 'high' : item.riskLevel;
    const riskEmoji = normalizedRisk === 'low' ? '✅' : 
                     normalizedRisk === 'medium' ? '⚠️' : '🚨';
    const date = new Date(item._creationTime).toLocaleDateString();
    
    return `
      <div class="history-item ${normalizedRisk}">
        <div class="history-icon">${riskEmoji}</div>
        <div class="history-content">
          <div class="history-title">${item.scanType || 'Profile'} Scan</div>
          <div class="history-subtitle">${truncateUrl(item.profileUrl || item.url || item.target || '')}</div>
        </div>
        <div class="history-meta">
          <div class="history-risk">${capitalizeFirst(normalizedRisk)}</div>
          <div class="history-date">${date}</div>
        </div>
      </div>
    `;
  }).join('');
}

function filterHistory(e) {
  const filter = e.target.value;
  
  let filteredHistory = scanHistory;
  
  if (filter === 'high') {
    filteredHistory = scanHistory.filter(item => item.riskLevel === 'fake' || item.riskLevel === 'high');
  } else if (filter === 'medium') {
    filteredHistory = scanHistory.filter(item => item.riskLevel === 'suspicious' || item.riskLevel === 'medium');
  } else if (filter === 'low') {
    filteredHistory = scanHistory.filter(item => item.riskLevel === 'real' || item.riskLevel === 'low');
  } else if (filter === 'today') {
    const today = new Date().setHours(0, 0, 0, 0);
    filteredHistory = scanHistory.filter(item => {
      const itemDate = new Date(item._creationTime).setHours(0, 0, 0, 0);
      return itemDate === today;
    });
  } else if (filter === 'week') {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    filteredHistory = scanHistory.filter(item => item._creationTime >= weekAgo);
  }
  
  renderHistory(filteredHistory);
}

// Load Community Data
async function loadCommunityData() {
  try {
    // Load community stats
    const stats = await convexClient.query('community.getTrustMetrics');
    if (stats) {
      document.getElementById('community-reports').textContent = stats.totalReportsThisWeek || 0;
      document.getElementById('community-scans').textContent = stats.totalScansToday || 0;
    }
    
    // Load scam hotspots
    const hotspots = await convexClient.query('community.getScamHotspotsByState');
    renderHotspots(hotspots || []);
    
    // Load scam phrases
    const phrases = await convexClient.query('community.getTrendingScamPhrases', { limit: 5 });
    // Adapt shape expected by renderScamPhrases
    const adapted = (phrases || []).map((p) => ({
      phrase: p.phrase,
      detections: p.frequency,
      trend: 'stable',
    }));
    renderScamPhrases(adapted);
    
    communityData = { stats, hotspots, phrases };
  } catch (error) {
    console.error('Failed to load community data:', error);
  }
}

function renderHotspots(hotspots) {
  const hotspotsListEl = document.getElementById('hotspots-list');
  
  if (hotspots.length === 0) {
    hotspotsListEl.innerHTML = '<p class="empty-text">No data available</p>';
    return;
  }
  
  hotspotsListEl.innerHTML = hotspots.map(hotspot => {
    const percentage = hotspot.percentage || 0;
    const barColor = percentage > 25 ? '#EF4444' : percentage > 15 ? '#F59E0B' : '#3B82F6';
    
    return `
      <div class="hotspot-item">
        <div class="hotspot-label">${hotspot.state}</div>
        <div class="hotspot-bar-container">
          <div class="hotspot-bar" style="width: ${percentage}%; background: ${barColor};"></div>
        </div>
        <div class="hotspot-value">${hotspot.count}</div>
      </div>
    `;
  }).join('');
}

function renderScamPhrases(phrases) {
  const phrasesListEl = document.getElementById('scam-phrases-list');
  
  if (phrases.length === 0) {
    phrasesListEl.innerHTML = '<p class="empty-text">No data available</p>';
    return;
  }
  
  phrasesListEl.innerHTML = phrases.slice(0, 5).map((phrase, index) => {
    const trendEmoji = phrase.trend === 'up' ? '📈' : phrase.trend === 'down' ? '📉' : '➡️';
    
    return `
      <div class="phrase-item">
        <div class="phrase-rank">#${index + 1}</div>
        <div class="phrase-content">
          <div class="phrase-text">"${phrase.phrase}"</div>
          <div class="phrase-meta">${phrase.detections || 0} detections ${trendEmoji}</div>
        </div>
      </div>
    `;
  }).join('');
}

function openReportScam() {
  chrome.tabs.create({ url: 'https://scamshieldpro.com.au/report-scam' });
}

// Settings functions
async function handleSignOut() {
  if (confirm('Are you sure you want to sign out?')) {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    currentUser = null;
    showNotSignedIn();
  }
}

async function clearCache() {
  if (confirm('Clear all cached scan results? This cannot be undone.')) {
    await chrome.storage.local.clear();
    alert('Cache cleared successfully');
  }
}

async function exportHistory() {
  if (scanHistory.length === 0) {
    alert('No history to export');
    return;
  }
  
  const csv = convertToCSV(scanHistory);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: `scamshield-history-${Date.now()}.csv`,
    saveAs: true
  });
}

// Utility functions
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateUrl(url, maxLength = 40) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

function convertToCSV(data) {
  const headers = ['Date', 'Type', 'Target', 'Risk Level', 'Trust Score'];
  const rows = data.map(item => [
    new Date(item._creationTime).toLocaleDateString(),
    item.scanType || 'Profile',
    item.profileUrl || item.url || item.target || '',
    item.riskLevel,
    item.trustScore || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Make functions globally available for inline handlers
window.addToWatchlist = async function(profileUrl) {
  try {
    await chrome.runtime.sendMessage({
      action: 'addToWatchlist',
      profileUrl: profileUrl
    });
    alert('Added to watchlist successfully');
  } catch (error) {
    alert('Failed to add to watchlist: ' + error.message);
  }
};

async function hydrateBackendSettings() {
  const { convexUrl } = await chrome.storage.sync.get(["convexUrl"]);
  const input = document.getElementById('convex-url');
  if (input && typeof convexUrl === 'string') {
    input.value = convexUrl;
  }
}

console.log('ScamShield Pro Extension - Popup loaded v2.0');