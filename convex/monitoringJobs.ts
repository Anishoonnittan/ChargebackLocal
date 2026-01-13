import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatLocalDayKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function getLocalMinutes(nowMs: number, timezoneOffsetMinutes: number) {
  // JS offset follows Date.getTimezoneOffset(): minutes to add to local time to get UTC.
  // local = utc - offset.
  const localDate = new Date(nowMs - timezoneOffsetMinutes * 60_000);
  return {
    localDate,
    localMinutes: localDate.getHours() * 60 + localDate.getMinutes(),
  };
}

async function runPostAuthMonitoringForUser(ctx: any, userId: any) {
  const monitoringOrders = await ctx.db
    .query("postAuthOrders")
    .filter((q: any) => q.eq(q.field("status"), "UNDER_MONITORING"))
    .collect()
    .then((orders: any[]) => orders.filter((o) => !o.userId || o.userId === userId));

  let movedToCleared = 0;
  let stillMonitoring = 0;
  const now = Date.now();

  for (const order of monitoringOrders) {
    const daysInMonitoring = Math.floor((now - order.createdAt) / (24 * 60 * 60 * 1000));

    if (daysInMonitoring >= 120) {
      movedToCleared += 1;
      await ctx.db.patch(order._id, {
        status: "CLEARED",
        clearedAt: Date.now(),
        lastCheckedAt: now,
        updatedAt: now,
      });
      continue;
    }

    stillMonitoring += 1;
    await ctx.db.patch(order._id, {
      lastCheckedAt: now,
      updatedAt: now,
    });
  }

  return {
    scanned: monitoringOrders.length,
    stillMonitoring,
    movedToCleared,
  };
}

/**
 * Runs every 15 minutes. For each merchant (preAuthConfig row), checks whether it's time (based on their preferred local time),
 * and ensures we run at most once per merchant per local day.
 */
export const scheduledTick = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const configs = await ctx.db.query("preAuthConfig").collect();

    const now = Date.now();
    const utcNow = new Date(now);
    const utcMinutes = utcNow.getUTCHours() * 60 + utcNow.getUTCMinutes();

    let merchantsTriggered = 0;
    let totalOrdersScanned = 0;
    let totalMovedToCleared = 0;

    for (const config of configs) {
      const preferredMinutes =
        typeof config.postAuthDailyCheckTimeMinutes === "number"
          ? config.postAuthDailyCheckTimeMinutes
          : 2 * 60; // default 2:00 AM

      const timezoneOffsetMinutes =
        typeof config.postAuthTimezoneOffsetMinutes === "number"
          ? config.postAuthTimezoneOffsetMinutes
          : 0;

      // Convert current UTC time to merchant's saved local time.
      // Using bucket-based compare because we tick every 15 minutes.
      const localNowMinutes = (utcMinutes - timezoneOffsetMinutes + 1440) % 1440;
      const nowBucket = Math.floor(localNowMinutes / 15);
      const preferredBucket = Math.floor(preferredMinutes / 15);

      if (nowBucket !== preferredBucket) {
        continue;
      }

      const { localDate } = getLocalMinutes(now, timezoneOffsetMinutes);
      const localDayKey = formatLocalDayKey(localDate);

      if (config.postAuthLastRunLocalDayKey === localDayKey) {
        continue; // already ran today
      }

      const result = await runPostAuthMonitoringForUser(ctx, config.userId);

      await ctx.db.patch(config._id, {
        postAuthLastRunLocalDayKey: localDayKey,
        updatedAt: Date.now(),
      });

      merchantsTriggered += 1;
      totalOrdersScanned += result.scanned;
      totalMovedToCleared += result.movedToCleared;
    }

    return {
      merchantsTriggered,
      totalOrdersScanned,
      totalMovedToCleared,
    };
  },
});

/**
 * Manual trigger ("Run check now").
 * Runs post-auth monitoring update immediately for the current session user.
 */
export const runNow = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.sessionToken))
      .first()
      .then(async (session: any) => {
        if (!session) return null;
        if (session.expiresAt < Date.now()) {
          await ctx.db.delete(session._id);
          return null;
        }
        return ctx.db.get(session.userId);
      });

    if (!user) {
      throw new Error("Not authenticated");
    }

    const result = await runPostAuthMonitoringForUser(ctx, user._id);
    return { success: true, ...result };
  },
});

// Internal helper so runNow can call via scheduler.
export const _runForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx: any, args: any) => {
    return await runPostAuthMonitoringForUser(ctx, args.userId);
  },
});