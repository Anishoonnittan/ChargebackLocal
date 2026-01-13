// LinkedIn Content Script - TrueProfile Pro Extension
// Detects LinkedIn profiles and injects Trust Score badges

(function() {
  'use strict';
  
  console.log('TrueProfile Pro - LinkedIn content script loaded');
  
  let badgeInjected = false;
  
  function isProfilePage() {
    return window.location.pathname.includes('/in/') && 
           !window.location.pathname.includes('/posts/');
  }
  
  function extractProfileData() {
    const data = {
      platform: 'linkedin',
      profileUrl: window.location.href,
      name: null,
      headline: null,
      verified: false,
      connections: null
    };
    
    // Name
    const nameEl = document.querySelector('.pv-text-details__left-panel h1, h1.text-heading-xlarge');
    if (nameEl) data.name = nameEl.textContent.trim();
    
    // Headline
    const headlineEl = document.querySelector('.pv-text-details__left-panel .text-body-medium, .text-body-medium');
    if (headlineEl) data.headline = headlineEl.textContent.trim();
    
    // Connections
    const connectionsEl = document.querySelector('.pv-top-card--list-bullet li, .pvs-header__optional-link');
    if (connectionsEl) {
      const match = connectionsEl.textContent.match(/(\d+(?:,\d+)*)\+?\s*connections?/i);
      if (match) {
        data.connections = parseInt(match[1].replace(/,/g, ''));
      }
    }
    
    return data;
  }
  
  function injectTrustBadge(result) {
    if (badgeInjected && document.getElementById('trueprofile-badge')) return;
    
    const profileHeader = document.querySelector('.pv-text-details__left-panel, .ph5');
    if (!profileHeader) return;
    
    const badge = document.createElement('div');
    badge.id = 'trueprofile-badge';
    badge.innerHTML = `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: ${result.riskLevel === 'low' ? '#10B981' : result.riskLevel === 'medium' ? '#F59E0B' : '#EF4444'};
        color: white;
        padding: 8px 14px;
        border-radius: 16px;
        font-size: 13px;
        font-weight: 600;
        margin-top: 12px;
        cursor: pointer;
      ">
        <span>${result.riskLevel === 'low' ? '✅' : result.riskLevel === 'medium' ? '⚠️' : '⚠️'}</span>
        <span>Trust Score: ${result.trustScore}%</span>
      </div>
    `;
    
    badge.onclick = () => {
      alert(`LinkedIn Trust Score: ${result.trustScore}%\nRisk Level: ${result.riskLevel}\n\nOpen TrueProfile Pro app for detailed analysis.`);
    };
    
    profileHeader.appendChild(badge);
    badgeInjected = true;
  }
  
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'scanProfile' && isProfilePage()) {
      const profileData = extractProfileData();
      chrome.runtime.sendMessage({
        action: 'performScan',
        data: { profileUrl: profileData.profileUrl, profileData, platform: 'linkedin' }
      });
    }
    if (message.action === 'scanComplete') {
      injectTrustBadge(message.result);
    }
  });
  
  chrome.storage.sync.get(['autoScan'], (result) => {
    if (result.autoScan && isProfilePage()) {
      setTimeout(() => {
        const profileData = extractProfileData();
        chrome.runtime.sendMessage({
          action: 'performScan',
          data: { profileUrl: profileData.profileUrl, profileData, platform: 'linkedin' }
        });
      }, 2000);
    }
  });
  
})();