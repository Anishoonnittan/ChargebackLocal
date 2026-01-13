import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
* Process incoming orders every minute
* Automatically scans orders from connected stores
*/
crons.interval(
  "process-incoming-orders",
  { minutes: 1 },
  internal.orderProcessor.processPendingOrders
);

// Post-auth monitoring tick (runs frequently; inside we respect each merchant's preferred time)
crons.interval(
  "post-auth-monitoring-tick",
  { minutes: 15 },
  internal.monitoringJobs.scheduledTick
);

export default crons;