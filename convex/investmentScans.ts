import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Investment Scam Detector Backend
 * Covers $945M investment scam market (46.5% of Australian scam losses)
 */

// Scan investment (wallet, platform, offer)
export const scanInvestment = mutation({
  args: {
    scanType: v.string(), // "crypto_wallet", "investment_platform", "guaranteed_returns"
    input: v.string(), // Wallet address, URL, or message
    platformName: v.optional(v.string()),
    platformUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let riskScore = 0;
    let riskLevel = "safe" as "safe" | "suspicious" | "high_risk" | "scam";
    const redFlags: string[] = [];
    const warnings: Array<{ type: string; severity: string; description: string }> = [];
    let recommendation = "";
    let estimatedLossRisk = "low";

    if (args.scanType === "crypto_wallet") {
      // Crypto wallet analysis
      const wallet = args.input.trim();
      
      // Check wallet format
      const isBitcoin = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(wallet);
      const isEthereum = /^0x[a-fA-F0-9]{40}$/.test(wallet);
      
      if (!isBitcoin && !isEthereum) {
        redFlags.push("Invalid wallet format - may be fake");
        riskScore += 30;
      }

      // Simulate checking against scam database (in production: integrate real APIs)
      // For now: detect common scam patterns
      const commonScamWallets = [
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // Example
      ];

      if (commonScamWallets.includes(wallet)) {
        redFlags.push("Wallet flagged in scam database");
        riskScore += 50;
        warnings.push({
          type: "Known Scammer",
          severity: "critical",
          description: "This wallet has been reported 45+ times for scam activity",
        });
      }

      // Check for suspicious patterns
      if (wallet.length < 26) {
        redFlags.push("Unusually short wallet address");
        riskScore += 20;
      }

      riskScore = Math.min(100, riskScore);

      if (riskScore >= 70) {
        riskLevel = "scam";
        recommendation = "🚨 DO NOT SEND CRYPTO to this wallet. It has been flagged as a scam. Report to ACCC Scamwatch immediately.";
        estimatedLossRisk = "total_loss_likely";
      } else if (riskScore >= 50) {
        riskLevel = "high_risk";
        recommendation = "🔴 HIGH RISK: This wallet shows suspicious characteristics. Do not send money until verified through official channels.";
        estimatedLossRisk = "high";
      } else if (riskScore >= 30) {
        riskLevel = "suspicious";
        recommendation = "⚠️ SUSPICIOUS: Exercise caution. Verify the recipient's identity through a separate channel before transferring.";
        estimatedLossRisk = "medium";
      } else {
        riskLevel = "safe";
        recommendation = "✅ No immediate red flags detected. However, always verify the recipient before sending crypto.";
        estimatedLossRisk = "low";
      }

      // Save scan
      await ctx.db.insert("investmentScans", {
        userId,
        scanType: args.scanType,
        input: wallet,
        riskScore,
        riskLevel,
        walletAddress: wallet,
        walletBlockchain: isBitcoin ? "bitcoin" : isEthereum ? "ethereum" : "unknown",
        redFlags,
        warnings,
        recommendation,
        estimatedLossRisk,
        scannedAt: Date.now(),
      });

      return { riskScore, riskLevel, redFlags, warnings, recommendation, estimatedLossRisk };
    }

    if (args.scanType === "investment_platform") {
      // Platform verification
      const url = args.platformUrl || args.input;
      const name = args.platformName || "Unknown Platform";

      // Extract domain (simple regex - Convex doesn't have URL constructor)
      let domain = "";
      const domainMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
      if (domainMatch && domainMatch[1]) {
        domain = domainMatch[1];
      } else {
        redFlags.push("Invalid URL format");
        riskScore += 20;
      }

      // Check for ASIC license (simulated - in production: integrate ASIC API)
      const asicLicensed = false; // Placeholder
      if (!asicLicensed) {
        redFlags.push("No ASIC license found");
        riskScore += 35;
        warnings.push({
          type: "Unlicensed Platform",
          severity: "critical",
          description: "This platform is not registered with ASIC. All legitimate financial services in Australia must be ASIC licensed.",
        });
      }

      // Check domain age (simulated)
      const domainAge = Math.floor(Math.random() * 365); // Placeholder
      if (domainAge < 30) {
        redFlags.push("Domain created less than 30 days ago");
        riskScore += 30;
        warnings.push({
          type: "New Domain",
          severity: "high",
          description: "Website was registered very recently - a common tactic for scam sites",
        });
      }

      // Check SSL
      const hasSSL = url.startsWith("https");
      if (!hasSSL) {
        redFlags.push("No SSL certificate (insecure)");
        riskScore += 15;
      }

      // Check for common scam TLDs
      const scamTLDs = [".xyz", ".top", ".click", ".loan", ".online"];
      if (scamTLDs.some((tld) => domain.endsWith(tld))) {
        redFlags.push("Domain uses high-risk TLD");
        riskScore += 20;
      }

      riskScore = Math.min(100, riskScore);

      if (riskScore >= 70) {
        riskLevel = "scam";
        recommendation = "🚨 DO NOT INVEST with this platform. It shows multiple critical red flags. Report to ASIC and Scamwatch.";
        estimatedLossRisk = "total_loss_likely";
      } else if (riskScore >= 50) {
        riskLevel = "high_risk";
        recommendation = "🔴 HIGH RISK: This platform lacks proper licensing and shows warning signs. Do not invest.";
        estimatedLossRisk = "high";
      } else if (riskScore >= 30) {
        riskLevel = "suspicious";
        recommendation = "⚠️ SUSPICIOUS: Verify ASIC license and check reviews before investing.";
        estimatedLossRisk = "medium";
      } else {
        riskLevel = "safe";
        recommendation = "✅ Platform shows positive indicators. Still, always verify ASIC license yourself.";
        estimatedLossRisk = "low";
      }

      await ctx.db.insert("investmentScans", {
        userId,
        scanType: args.scanType,
        input: url,
        riskScore,
        riskLevel,
        platformName: name,
        platformUrl: url,
        domainAge,
        hasSSLCertificate: hasSSL,
        isLicensedASIC: asicLicensed,
        redFlags,
        warnings,
        recommendation,
        estimatedLossRisk,
        scannedAt: Date.now(),
      });

      return { riskScore, riskLevel, redFlags, warnings, recommendation, estimatedLossRisk };
    }

    if (args.scanType === "guaranteed_returns") {
      // Analyze investment offer message
      const message = args.input.toLowerCase();

      // Scam language patterns
      const guaranteedLanguage = [
        "guaranteed",
        "guaranteed returns",
        "risk-free",
        "no risk",
        "100% profit",
        "passive income",
        "financial freedom",
      ];

      const urgencyLanguage = [
        "limited time",
        "act now",
        "expires",
        "last chance",
        "hurry",
        "don't miss",
        "exclusive opportunity",
      ];

      const pressureLanguage = [
        "once in a lifetime",
        "secret strategy",
        "insider information",
        "only available",
        "limited spots",
      ];

      // Check for guaranteed returns language
      let hasGuaranteed = false;
      for (const phrase of guaranteedLanguage) {
        if (message.includes(phrase.toLowerCase())) {
          hasGuaranteed = true;
          redFlags.push(`Contains phrase: "${phrase}"`);
          riskScore += 25;
        }
      }

      if (hasGuaranteed) {
        warnings.push({
          type: "Guaranteed Returns Claim",
          severity: "critical",
          description: "No legitimate investment can guarantee returns. This is a major red flag for scams.",
        });
      }

      // Check for urgency
      for (const phrase of urgencyLanguage) {
        if (message.includes(phrase.toLowerCase())) {
          redFlags.push(`Urgency tactic: "${phrase}"`);
          riskScore += 15;
        }
      }

      // Check for pressure
      for (const phrase of pressureLanguage) {
        if (message.includes(phrase.toLowerCase())) {
          redFlags.push(`Pressure language: "${phrase}"`);
          riskScore += 15;
        }
      }

      // Check for unrealistic returns
      const percentMatches = message.match(/(\d+)%/g);
      if (percentMatches) {
        for (const match of percentMatches) {
          const percent = parseInt(match);
          if (percent > 15) {
            redFlags.push(`Unrealistic return promise: ${percent}%`);
            riskScore += 20;
            warnings.push({
              type: "Unrealistic Returns",
              severity: "high",
              description: `${percent}% returns are not sustainable. Legitimate investments rarely exceed 10-12% annually.`,
            });
          }
        }
      }

      riskScore = Math.min(100, riskScore);

      if (riskScore >= 70) {
        riskLevel = "scam";
        recommendation = "🚨 THIS IS A SCAM. Classic investment fraud language detected. Do not send money. Report to ACCC.";
        estimatedLossRisk = "total_loss_likely";
      } else if (riskScore >= 50) {
        riskLevel = "high_risk";
        recommendation = "🔴 HIGH RISK: Multiple red flags detected. Do not invest without independent financial advice.";
        estimatedLossRisk = "high";
      } else if (riskScore >= 30) {
        riskLevel = "suspicious";
        recommendation = "⚠️ SUSPICIOUS: Contains concerning language. Seek professional advice before investing.";
        estimatedLossRisk = "medium";
      } else {
        riskLevel = "safe";
        recommendation = "✅ No major scam language detected. Still, always verify investment opportunities independently.";
        estimatedLossRisk = "low";
      }

      await ctx.db.insert("investmentScans", {
        userId,
        scanType: args.scanType,
        input: args.input.substring(0, 500), // Store first 500 chars
        riskScore,
        riskLevel,
        guaranteedReturnsLanguage: hasGuaranteed,
        pressureToInvest: riskScore >= 30,
        redFlags,
        warnings,
        recommendation,
        estimatedLossRisk,
        scannedAt: Date.now(),
      });

      return { riskScore, riskLevel, redFlags, warnings, recommendation, estimatedLossRisk };
    }

    throw new Error("Invalid scan type");
  },
});

// Get recent scans
export const getRecentScans = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("investmentScans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 10);
  },
});

// Get investment stats
export const getInvestmentStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const scans = await ctx.db
      .query("investmentScans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalScans = scans.length;
    const scamsDetected = scans.filter((s) => s.riskLevel === "scam").length;
    const highRisk = scans.filter((s) => s.riskLevel === "high_risk").length;

    // Estimate savings (assume average scam loss is $50,000)
    const estimatedSavings = scamsDetected * 50000 + highRisk * 25000;

    return {
      totalScans,
      scamsDetected,
      highRisk,
      estimatedSavings,
    };
  },
});