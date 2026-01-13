// Twitter/X Content Script - TrueProfile Pro Extension
// Detects Twitter profiles and injects Trust Score badges

(function() {
  'use strict';
  
  console.log('TrueProfile Pro - Twitter/X content script loaded');
  
  let badgeInjected = false;
  
  function isProfilePage() {
    return window.location.pathname.match(/^\/[a-zA-Z0-9_]+$/) &&
           !window.location.pathname.includes('/status/');
  }
  
  function extractProfileData() {
    const data = {
      platform: 'twitter',
      profileUrl: window.location.href,
      name: null,
      bio: null,
      verified: false,
      followers: null,
      following: null,
      posts: null
    };
    
    // Name
    const nameEl = document.querySelector('[data-testid="UserName"] span span');
    if (nameEl) data.name = nameEl.textContent.trim();
    
    // Bio
    const bioEl = document.querySelector('[data-testid="UserDescription"]');
    if (bioEl) data.bio = bioEl.textContent.trim();
    
    // Verified
    data.verified = !!document.querySelector('[aria-label*="Verified"]');
    
    // Stats
    const followingLink = document.querySelector('a[href$="/following"] span span');
    const followersLink = document.querySelector('a[href$="/verified_followers"] span span, a[href$="/followers"] span span');
    
    if (followingLink) data.following = parseInt(followingLink.textContent.replace(/,/g, '')) || 0;
    if (followersLink) data.followers = parseInt(followersLink.textContent.replace(/,/g, '')) || 0;
    
    return data;
  }
  
  function injectTrustBadge(result) {
    if (badgeInjected && document.getElementById('trueprofile-badge')) return;
    
    const profileHeader = document.querySelector('[data-testid="UserName"]')?.parentElement?.parentElement;
    if (!profileHeader) return;
    
    const badge = document.createElement('div');
    badge.id = 'trueprofile-badge';
    badge.innerHTML = `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: ${result.riskLevel === 'low' ? '#10B981' : result.riskLevel === 'medium' ? '#F59E0B' : '#EF4444'};
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 8px;
        cursor: pointer;
      ">
        <span>${result.riskLevel === 'low' ? '✅' : result.riskLevel === 'medium' ? '⚠️' : '🚨'}</span>
        <span>Trust: ${result.trustScore}%</span>
      </div>
    `;
    
    badge.onclick = () => {
      alert(`Trust Score: ${result.trustScore}%\nRisk: ${result.riskLevel}\n\nOpen TrueProfile Pro for details.`);
    };
    
    profileHeader.appendChild(badge);
    badgeInjected = true;
  }
  
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'scanProfile' && isProfilePage()) {
      const profileData = extractProfileData();
      chrome.runtime.sendMessage({
        action: 'performScan',
        data: { profileUrl: profileData.profileUrl, profileData, platform: 'twitter' }
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
          data: { profileUrl: profileData.profileUrl, profileData, platform: 'twitter' }
        });
      }, 2000);
    }
  });
  
})();