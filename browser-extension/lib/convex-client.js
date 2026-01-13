// Convex Client for Browser Extension
// This is a lightweight wrapper since we can't use React hooks in extensions

// IMPORTANT:
// In a browser extension we can't rely on Expo env injection. We store the deployment URL
// in chrome.storage.sync under `convexUrl`.
//
// You (or the web sign-in flow) should set it once, e.g.:
// chrome.storage.sync.set({ convexUrl: "https://YOUR-DEPLOYMENT.convex.cloud" })
const DEFAULT_CONVEX_URL = null;

class ConvexClient {
  constructor() {
    this.url = DEFAULT_CONVEX_URL;
    this.authToken = null;
  }

  async ensureConfigured() {
    if (this.url) {
      return;
    }

    const { convexUrl } = await chrome.storage.sync.get(["convexUrl"]);

    if (!convexUrl || typeof convexUrl !== "string") {
      throw new Error(
        "ScamShield Pro extension is missing Convex URL (convexUrl). Set it in chrome.storage.sync, or update browser-extension/lib/convex-client.js with your deployment URL."
      );
    }

    this.url = convexUrl;
  }

  async setAuth(token) {
    this.authToken = token;
    // Save to storage
    await chrome.storage.sync.set({ convexAuthToken: token });
  }

  async getAuth() {
    if (!this.authToken) {
      const { convexAuthToken } = await chrome.storage.sync.get(['convexAuthToken']);
      this.authToken = convexAuthToken;
    }
    return this.authToken;
  }

  async query(functionName, args = {}) {
    await this.ensureConfigured();
    const token = await this.getAuth();
    
    const response = await fetch(`${this.url}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        path: functionName,
        args,
        format: 'json'
      })
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.value;
  }

  async mutation(functionName, args = {}) {
    await this.ensureConfigured();
    const token = await this.getAuth();
    
    const response = await fetch(`${this.url}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        path: functionName,
        args,
        format: 'json'
      })
    });

    if (!response.ok) {
      throw new Error(`Mutation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.value;
  }

  async action(functionName, args = {}) {
    await this.ensureConfigured();
    const token = await this.getAuth();
    
    const response = await fetch(`${this.url}/api/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        path: functionName,
        args,
        format: 'json'
      })
    });

    if (!response.ok) {
      throw new Error(`Action failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.value;
  }
}

// Export singleton instance
const convexClient = new ConvexClient();
export default convexClient;