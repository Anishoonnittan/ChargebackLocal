// Instagram Content Script - TrueProfile Pro Extension
// Detects Instagram profiles and injects Trust Score badges

(function() {
  'use strict';
  
  console.log('TrueProfile Pro - Instagram content script loaded');
  
  let badgeInjected = false;
  
  function isProfilePage() {
    return window.location.pathname.match(/^\/[a-zA-Z0-9._]+\/?$/) &&
           !window.location.pathname.includes('/p/') &&
           !window.location.pathname.includes('/reel/');
  }
  
  function extractProfileData() {
    const data = {
      platform: 'instagram',
      profileUrl: window.location.href,
      name: null,
      bio: null,
      verified: false,
      followers: null,
      following: null,
      posts: null,
      profilePicUrl: null
    };
    
    // Username
    const usernameEl = document.querySelector('header h2');
    if (usernameEl) data.name = usernameEl.textContent.trim();
    
    // Bio
    const bioEl = document.querySelector('header section > div > span, ._aa_c span');
    if (bioEl) data.bio = bioEl.textContent.trim();
    
    // Verified
    data.verified = !!document.querySelector('[aria-label*="Verified"]');
    
    // Stats (followers, following, posts)
    const statsEls = document.querySelectorAll('header section ul li span span, header section ul li a span span');
    if (statsEls.length >= 3) {
      data.posts = parseInt(statsEls[0].textContent.replace(/,/g, '')) || 0;
      data.followers = parseInt(statsEls[1].textContent.replace(/,/g, '')) || 0;
      data.following = parseInt(statsEls[2].textContent.replace(/,/g, '')) || 0;
    }
    
    // Profile pic
    const profilePicEl = document.querySelector('header img');
    if (profilePicEl) data.profilePicUrl = profilePicEl.src;
    
    return data;
  }
  
  function injectTrustBadge(result) {
    if (badgeInjected && document.getElementById('trueprofile-badge')) return;
    
    const profileHeader = document.querySelector('header section');
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
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        margin-top: 12px;
        cursor: pointer;
      ">
        <span>${result.riskLevel === 'low' ? '🛡️' : result.riskLevel === 'medium' ? '⚠️' : '🚨'}</span>
        <span>Trust Score: ${result.trustScore}%</span>
      </div>
    `;
    
    badge.onclick = () => {
      alert(`Trust Score: ${result.trustScore}%\nRisk Level: ${result.riskLevel}\n\nOpen TrueProfile Pro app for full details.`);
    };
    
    profileHeader.appendChild(badge);
    badgeInjected = true;
  }
  
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'scanProfile' && isProfilePage()) {
      const profileData = extractProfileData();
      chrome.runtime.sendMessage({
        action: 'performScan',
        data: { profileUrl: profileData.profileUrl, profileData, platform: 'instagram' }
      });
    }
    if (message.action === 'scanComplete') {
      injectTrustBadge(message.result);
    }
  });
  
  // Auto-scan
  chrome.storage.sync.get(['autoScan'], (result) => {
    if (result.autoScan && isProfilePage()) {
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'scanProfile' });
        const profileData = extractProfileData();
        chrome.runtime.sendMessage({
          action: 'performScan',
          data: { profileUrl: profileData.profileUrl, profileData, platform: 'instagram' }
        });
      }, 2000);
    }
  });
  
})();