/**
 * Central place to configure tutorial videos.
 *
 * IMPORTANT:
 * - These are placeholder URLs for demonstration.
 * - Replace with your real video URLs (YouTube unlisted, Vimeo, Cloudflare Stream, etc.).
 * - The UI will only show a video card when the URL exists.
 * 
 * VIDEO HOSTING OPTIONS:
 * - YouTube (unlisted): https://youtube.com/watch?v=YOUR_VIDEO_ID
 * - Vimeo: https://vimeo.com/YOUR_VIDEO_ID
 * - Cloudflare Stream: https://customer-YOUR_ID.cloudflarestream.com/YOUR_VIDEO_ID/manifest/video.m3u8
 * - Loom: https://www.loom.com/share/YOUR_VIDEO_ID
 */
export const TUTORIAL_VIDEOS = {
  scamVigil: {
    // 60-second demo showing how to scan a suspicious link or message
    scan: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with actual video
    
    // 60-second tour of the Protection Center and Quick Actions
    protectionCenter: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with actual video
    
    // 60-second overview of Community Alerts and how to report scams
    communityAlerts: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with actual video
  },
  chargebackShield: {
    // 60-second demo showing how to scan an order for fraud signals
    scanOrder: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with actual video
    
    // 60-second guide on managing disputes and uploading evidence
    disputes: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with actual video
    
    // 60-second tutorial on connecting Shopify/Stripe integrations
    integrations: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Replace with actual video
  },
} as const;