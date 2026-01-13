import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to get userId from session token
async function getUserIdFromSession(ctx: any, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return session.userId;
}

// Helper for consistent admin checks
async function requireAdminUser(ctx: any, sessionToken: string) {
  const userId = await getUserIdFromSession(ctx, sessionToken);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db.get(userId);
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  if (!isAdmin) {
    throw new Error("Access denied");
  }

  return { userId, user };
}

// Helper to compute reply counts (used for list UI)
async function getPublicReplyCountForTicket(ctx: any, ticketId: any) {
  const replies = await ctx.db
    .query("ticketReplies")
    .filter((q: any) => q.eq(q.field("ticketId"), ticketId))
    .collect();

  // Only count non-internal replies for the customer-facing list.
  return replies.filter((r: any) => !r.isInternal).length;
}

// ============================================
// MUTATIONS (7)
// ============================================

// 1. Create a new support ticket
export const createTicket = mutation({
  args: {
    sessionToken: v.string(),
    subject: v.string(),
    description: v.string(),
    category: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    app: v.union(v.literal("scamvigil"), v.literal("chargeback")),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    // Generate ticket number
    const ticketCount = await ctx.db.query("supportTickets").collect();
    const ticketNumber = `TICKET-${String(ticketCount.length + 1).padStart(6, "0")}`;

    const ticketId = await ctx.db.insert("supportTickets", {
      ticketNumber,
      userId,
      subject: args.subject,
      description: args.description,
      category: args.category,
      priority: args.priority,
      status: "open",
      app: args.app,
      attachments: args.attachments || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { ticketId, ticketNumber };
  },
});

// 2. Add a reply to a ticket
export const addReply = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("supportTickets"),
    message: v.string(),
    isInternal: v.optional(v.boolean()),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    const isAgent = user?.role === "admin" || user?.role === "superadmin";

    const replyId = await ctx.db.insert("ticketReplies", {
      ticketId: args.ticketId,
      userId,
      message: args.message,
      isInternal: args.isInternal || false,
      isAgent,
      attachments: args.attachments || [],
      createdAt: Date.now(),
    });

    // Update ticket's updatedAt
    await ctx.db.patch(args.ticketId, {
      updatedAt: Date.now(),
      status: isAgent ? "in_progress" : "waiting",
    });

    return replyId;
  },
});

// 3. Update ticket status
export const updateTicketStatus = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("supportTickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting"),
      v.literal("resolved"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: Date.now(),
      resolvedAt: args.status === "resolved" ? Date.now() : undefined,
      closedAt: args.status === "closed" ? Date.now() : undefined,
    });

    return { success: true };
  },
});

// 4. Assign ticket to agent
export const assignTicket = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("supportTickets"),
    agentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin" && user?.role !== "superadmin") {
      throw new Error("Only admins can assign tickets");
    }

    await ctx.db.patch(args.ticketId, {
      assignedTo: args.agentId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// 5. Rate ticket (customer satisfaction)
export const rateTicket = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("supportTickets"),
    rating: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    const ticket = await ctx.db.get(args.ticketId);
    if (ticket?.userId !== userId) {
      throw new Error("You can only rate your own tickets");
    }

    await ctx.db.patch(args.ticketId, {
      rating: args.rating,
      ratingFeedback: args.feedback,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// 6. Add internal note (admin only)
export const addInternalNote = mutation({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("supportTickets"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin" && user?.role !== "superadmin") {
      throw new Error("Only admins can add internal notes");
    }

    const ticket = await ctx.db.get(args.ticketId);
    const notes = ticket?.internalNotes || [];
    notes.push({
      userId,
      note: args.note,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.ticketId, {
      internalNotes: notes,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// 7. Create canned response (admin only)
export const createCannedResponse = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    content: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin" && user?.role !== "superadmin") {
      throw new Error("Only admins can create canned responses");
    }

    const responseId = await ctx.db.insert("cannedResponses", {
      title: args.title,
      content: args.content,
      category: args.category,
      createdBy: userId,
      createdAt: Date.now(),
    });

    return responseId;
  },
});

// ============================================
// QUERIES (6)
// ============================================

// 1. Get user's tickets
export const getUserTickets = query({
  args: {
    sessionToken: v.string(),
    app: v.optional(v.union(v.literal("scamvigil"), v.literal("chargeback"))),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) return [];

    let tickets = await ctx.db
      .query("supportTickets")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    if (args.app) {
      tickets = tickets.filter((t) => t.app === args.app);
    }

    // UI expects replyCount for list previews.
    const ticketsWithReplyCount = await Promise.all(
      tickets.map(async (t) => {
        const replyCount = await getPublicReplyCountForTicket(ctx, t._id);
        return { ...t, replyCount };
      })
    );

    return ticketsWithReplyCount;
  },
});

// 2. Get ticket by ID with replies
export const getTicketById = query({
  args: { 
    sessionToken: v.string(),
    ticketId: v.id("supportTickets") 
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const user = await ctx.db.get(userId);
    const isAdmin = user?.role === "admin" || user?.role === "superadmin";

    // Only ticket owner or admin can view
    if (ticket.userId !== userId && !isAdmin) {
      throw new Error("Access denied");
    }

    // Get replies
    const replies = await ctx.db
      .query("ticketReplies")
      .filter((q) => q.eq(q.field("ticketId"), args.ticketId))
      .order("asc")
      .collect();

    // Filter out internal notes if not admin
    const filteredReplies = isAdmin ? replies : replies.filter((r) => !r.isInternal);

    // Get user info for each reply
    const repliesWithUsers = await Promise.all(
      filteredReplies.map(async (reply) => {
        const replyUser = await ctx.db.get(reply.userId);
        return {
          ...reply,
          // UI calls this field `isStaff`.
          isStaff: !!reply.isAgent,
          userName: replyUser?.name || "Unknown",
          userEmail: replyUser?.email || "",
        };
      })
    );

    // Get assigned agent info
    let assignedAgent = null;
    if (ticket.assignedTo) {
      const agent = await ctx.db.get(ticket.assignedTo);
      assignedAgent = {
        id: ticket.assignedTo,
        name: agent?.name || "Unknown",
        email: agent?.email || "",
      };
    }

    return {
      ...ticket,
      replies: repliesWithUsers,
      assignedAgent,
    };
  },
});

// 3. Get all tickets (admin only)
export const getAllTickets = query({
  args: {
    sessionToken: v.string(),
    status: v.optional(v.string()),
    app: v.optional(v.union(v.literal("scamvigil"), v.literal("chargeback"))),
  },
  handler: async (ctx, args) => {
    await requireAdminUser(ctx, args.sessionToken);

    let tickets = await ctx.db.query("supportTickets").order("desc").collect();

    if (args.status) {
      tickets = tickets.filter((t) => t.status === args.status);
    }

    if (args.app) {
      tickets = tickets.filter((t) => t.app === args.app);
    }

    // Get user info for each ticket
    const ticketsWithUsers = await Promise.all(
      tickets.map(async (ticket) => {
        const ticketUser = await ctx.db.get(ticket.userId);
        return {
          ...ticket,
          userName: ticketUser?.name || "Unknown",
          userEmail: ticketUser?.email || "",
        };
      })
    );

    return ticketsWithUsers;
  },
});

// 4. Get support statistics (admin only)
export const getSupportStats = query({
  args: {
    sessionToken: v.string(),
    app: v.optional(v.union(v.literal("scamvigil"), v.literal("chargeback"))),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (user?.role !== "admin" && user?.role !== "superadmin") {
      return null;
    }

    let tickets = await ctx.db.query("supportTickets").collect();

    if (args.app) {
      tickets = tickets.filter((t) => t.app === args.app);
    }

    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const closed = tickets.filter((t) => t.status === "closed").length;

    // Calculate average response time
    const resolvedTickets = tickets.filter((t) => t.resolvedAt);
    const avgResponseTime =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => sum + (t.resolvedAt! - t.createdAt), 0) /
          resolvedTickets.length
        : 0;

    // Calculate average rating
    const ratedTickets = tickets.filter((t) => t.rating);
    const avgRating =
      ratedTickets.length > 0
        ? ratedTickets.reduce((sum, t) => sum + (t.rating || 0), 0) / ratedTickets.length
        : 0;

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      avgResponseTime: Math.round(avgResponseTime / 1000 / 60), // minutes
      avgRating: Math.round(avgRating * 10) / 10,
    };
  },
});

// 5. Get support categories
export const getCategories = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query("supportCategories").collect();
    return categories;
  },
});

// 6. Get canned responses (admin only)
export const getCannedResponses = query({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminUser(ctx, args.sessionToken);

    let responses = await ctx.db.query("cannedResponses").collect();

    if (args.category) {
      responses = responses.filter((r) => r.category === args.category);
    }

    return responses;
  },
});

// ============================================
// COMPATIBILITY QUERIES (used by app screens)
// ============================================

// Some UI screens call these names directly.

export const getTicket = query({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("supportTickets"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const user = await ctx.db.get(userId);
    const isAdmin = user?.role === "admin" || user?.role === "superadmin";

    if (ticket.userId !== userId && !isAdmin) {
      throw new Error("Access denied");
    }

    return ticket;
  },
});

export const getTicketReplies = query({
  args: {
    sessionToken: v.string(),
    ticketId: v.id("supportTickets"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserIdFromSession(ctx, args.sessionToken);
    if (!userId) throw new Error("Not authenticated");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const user = await ctx.db.get(userId);
    const isAdmin = user?.role === "admin" || user?.role === "superadmin";

    if (ticket.userId !== userId && !isAdmin) {
      throw new Error("Access denied");
    }

    const replies = await ctx.db
      .query("ticketReplies")
      .filter((q: any) => q.eq(q.field("ticketId"), args.ticketId))
      .order("asc")
      .collect();

    const visibleReplies = isAdmin ? replies : replies.filter((r: any) => !r.isInternal);

    return visibleReplies.map((r: any) => ({
      ...r,
      // UI uses `isStaff`.
      isStaff: !!r.isAgent,
    }));
  },
});

export const getAdminStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminUser(ctx, args.sessionToken);

    const tickets = await ctx.db.query("supportTickets").collect();

    const openTickets = tickets.filter((t: any) => t.status === "open").length;
    const inProgressTickets = tickets.filter((t: any) => t.status === "in_progress").length;

    const now = new Date();
    const startOfTodayUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0
    );

    const resolvedToday = tickets.filter((t: any) => {
      if (!t.resolvedAt) return false;
      return t.resolvedAt >= startOfTodayUtc;
    }).length;

    const ratedTickets = tickets.filter((t: any) => typeof t.rating === "number");
    const avgRating =
      ratedTickets.length > 0
        ? ratedTickets.reduce((sum: number, t: any) => sum + (t.rating || 0), 0) /
          ratedTickets.length
        : 0;

    return {
      openTickets,
      inProgressTickets,
      resolvedToday,
      avgRating,
    };
  },
});