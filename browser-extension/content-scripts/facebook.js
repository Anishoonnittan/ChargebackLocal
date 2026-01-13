// Facebook Content Script - ScamVigil Extension
// Detects Facebook profiles and injects Trust Score badges

(function() {
  'use strict';
  
  console.log('ScamVigil - Facebook content script loaded');
  
  let currentProfileUrl = null;
  let badgeInjected = false;
  
  // Detect if we're on a profile page
  function isProfilePage() {
    return window.location.pathname.match(/^\/[a-zA-Z0-9._-]+$/) || 
           window.location.pathname.includes('/profile.php');
  }
  
  // Extract profile data from Facebook DOM
  function extractProfileData() {
    const data = {
      platform: 'facebook',
      profileUrl: window.location.href,
      name: null,
      bio: null,
      verified: false,
      followers: null,
      following: null,
      posts: null,
      profilePicUrl: null
    };
    
    // Name (multiple possible selectors)
    const nameSelectors = [
      'h1[dir="auto"]',
      '[data-pagelet="ProfileName"] h1',
      '.x1heor9g .x1lliihq'
    ];
    
    for (const selector of nameSelectors) {
      const nameEl = document.querySelector(selector);
      if (nameEl && nameEl.textContent.trim()) {
        data.name = nameEl.textContent.trim();
        break;
      }
    }
    
    // Bio/About
    const bioEl = document.querySelector('[data-pagelet="ProfileTilesFeed_0"] span');
    if (bioEl) {
      data.bio = bioEl.textContent.trim();
    }
    
    // Verified badge
    const verifiedEl = document.querySelector('[aria-label*="Verified"]');
    data.verified = !!verifiedEl;
    
    // Profile picture
    const profilePicEl = document.querySelector('image[href*="scontent"]') || 
                         document.querySelector('img[data-imgperflogname="profileCoverPhoto"]');
    if (profilePicEl) {
      data.profilePicUrl = profilePicEl.getAttribute('href') || profilePicEl.src;
    }
    
    // Friends/Followers count (varies by profile type)
    const statsLinks = document.querySelectorAll('a[href*="/friends"]');
    statsLinks.forEach(link => {
      const text = link.textContent;
      const match = text.match(/(\d+(?:,\d+)*)\s*(friends|followers)/i);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        if (match[2].toLowerCase() === 'friends') {
          data.followers = count;
        }
      }
    });
    
    return data;
  }
  
  // Inject Trust Score badge into profile
  function injectTrustBadge(result) {
    if (badgeInjected) {
      // Update existing badge
      const existingBadge = document.getElementById('scamvigil-badge');
      if (existingBadge) {
        updateBadge(existingBadge, result);
        return;
      }
    }
    
    // Find profile header to inject badge
    const profileHeader = document.querySelector('[data-pagelet="ProfileActions"]') ||
                          document.querySelector('h1[dir="auto"]')?.parentElement ||
                          document.querySelector('.x1heor9g');
    
    if (!profileHeader) {
      console.warn('ScamVigil: Could not find profile header to inject badge');
      return;
    }
    
    // Create badge container
    const badge = document.createElement('div');
    badge.id = 'scamvigil-badge';
    badge.className = 'scamvigil-badge';
    
    const riskColor = getRiskColor(result.riskLevel);
    const riskEmoji = getRiskEmoji(result.riskLevel);
    
    badge.innerHTML = `
      <div class="scamvigil-badge-content" style="
        display: flex;
        align-items: center;
        gap: 8px;
        background: ${riskColor};
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        cursor: pointer;
        margin-top: 12px;
        transition: transform 0.2s;
      ">
        <span style="font-size: 18px;">${riskEmoji}</span>
        <span>Trust Score: ${result.trustScore}%</span>
        <span style="font-size: 16px;">${result.riskLevel === 'low' ? '✅' : result.riskLevel === 'medium' ? '⚠️' : '🚨'}</span>
      </div>
    `;
    
    // Hover effect
    badge.addEventListener('mouseenter', () => {
      badge.querySelector('.scamvigil-badge-content').style.transform = 'scale(1.05)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.querySelector('.scamvigil-badge-content').style.transform = 'scale(1)';
    });
    
    // Click to see details
    badge.addEventListener('click', () => {
      showDetailModal(result);
    });
    
    // Insert badge
    profileHeader.appendChild(badge);
    badgeInjected = true;
    
    console.log('ScamVigil: Badge injected successfully');
  }
  
  function updateBadge(badge, result) {
    const riskColor = getRiskColor(result.riskLevel);
    const riskEmoji = getRiskEmoji(result.riskLevel);
    
    badge.querySelector('.scamvigil-badge-content').style.background = riskColor;
    badge.querySelector('.scamvigil-badge-content').innerHTML = `
      <span style="font-size: 18px;">${riskEmoji}</span>
      <span>Trust Score: ${result.trustScore}%</span>
      <span style="font-size: 16px;">${result.riskLevel === 'low' ? '✅' : result.riskLevel === 'medium' ? '⚠️' : '🚨'}</span>
    `;
  }
  
  function getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'low': return '#10B981'; // Green
      case 'medium': return '#F59E0B'; // Yellow/Orange
      case 'high': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  }
  
  function getRiskEmoji(riskLevel) {
    switch (riskLevel) {
      case 'low': return '🛡️';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      default: return '🔍';
    }
  }
  
  // Show detailed modal
  function showDetailModal(result) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'scamvigil-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 24px; color: #111;">Trust Score Report</h2>
            <button id="scamvigil-modal-close" style="
              background: none;
              border: none;
              font-size: 28px;
              cursor: pointer;
              color: #666;
            ">×</button>
          </div>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="
              font-size: 48px;
              font-weight: bold;
              color: ${getRiskColor(result.riskLevel)};
            ">${result.trustScore}%</div>
            <div style="font-size: 18px; color: #666; text-transform: capitalize;">
              ${result.riskLevel} Risk
            </div>
          </div>
          
          ${result.flags && result.flags.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 16px; margin-bottom: 12px;">⚠️ Flags Detected:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                ${result.flags.map(flag => `<li style="margin-bottom: 8px;">${flag}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; margin-bottom: 8px;">📊 Analysis:</h3>
            <p style="color: #666; line-height: 1.6;">
              ${result.analysis || 'This profile has been analyzed using 7 security scanners including pattern-based detection, engagement analysis, and AI verification.'}
            </p>
          </div>
          
          <div style="display: flex; gap: 12px;">
            <button id="scamvigil-watchlist-btn" style="
              flex: 1;
              background: #14B8A6;
              color: white;
              border: none;
              border-radius: 8px;
              padding: 12px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
            ">Add to Watchlist</button>
            <button id="scamvigil-report-btn" style="
              flex: 1;
              background: #EF4444;
              color: white;
              border: none;
              border-radius: 8px;
              padding: 12px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
            ">Report Scam</button>
          </div>
          
          <div style="margin-top: 16px; text-align: center;">
            <a href="https://scamvigil.com.au" target="_blank" style="
              color: #14B8A6;
              font-size: 12px;
              text-decoration: none;
            ">Powered by ScamVigil 🛡️</a>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    document.getElementById('scamvigil-modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Watchlist button
    document.getElementById('scamvigil-watchlist-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        action: 'addToWatchlist',
        profileUrl: result.profileUrl
      }, (response) => {
        if (response.success) {
          alert('✅ Added to watchlist! We\'ll monitor this profile for you.');
          modal.remove();
        } else {
          alert('❌ Failed to add to watchlist: ' + response.error);
        }
      });
    });
    
    // Report button
    document.getElementById('scamvigil-report-btn').addEventListener('click', () => {
      window.open('https://scamvigil.com.au/report?url=' + encodeURIComponent(result.profileUrl), '_blank');
      modal.remove();
    });
  }
  
  // Listen for scan requests
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scanProfile') {
      performScan();
    }
    
    if (message.action === 'scanComplete') {
      injectTrustBadge(message.result);
    }
  });
  
  // Perform scan
  function performScan() {
    if (!isProfilePage()) {
      console.log('ScamVigil: Not a profile page, skipping scan');
      return;
    }
    
    const profileData = extractProfileData();
    currentProfileUrl = profileData.profileUrl;
    
    console.log('ScamVigil: Scanning profile...', profileData);
    
    chrome.runtime.sendMessage({
      action: 'performScan',
      data: {
        profileUrl: profileData.profileUrl,
        profileData,
        platform: 'facebook'
      }
    });
  }
  
  // Auto-scan on page load (if enabled)
  chrome.storage.sync.get(['autoScan'], (result) => {
    if (result.autoScan && isProfilePage()) {
      setTimeout(performScan, 2000); // Wait for page to fully load
    }
  });
  
  // Watch for URL changes (Facebook is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      badgeInjected = false;
      
      if (isProfilePage()) {
        chrome.storage.sync.get(['autoScan'], (result) => {
          if (result.autoScan) {
            setTimeout(performScan, 2000);
          }
        });
      }
    }
  }).observe(document, { subtree: true, childList: true });
  
})();