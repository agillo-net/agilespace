import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserFromId } from "./auth";

// Query to get all active work sessions for the current user
export const getActiveForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    
    return await ctx.db
      .query("workSessions")
      .withIndex("by_active", (q) => q
        .eq("userId", user._id)
        .eq("isActive", true)
      )
      .collect();
  },
});

// Query to get completed work sessions for the current user
export const getCompletedForCurrentUser = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    const limit = args.limit ?? 10;
    
    return await ctx.db
      .query("workSessions")
      .withIndex("by_user", (q) => q
        .eq("userId", user._id)
      )
      .filter((q) => q.eq(q.field("isActive"), false))
      .order("desc")
      .take(limit);
  },
});

// Mutation to create a new work session
export const create = mutation({
  args: {
    issueId: v.string(),
    issueTitle: v.string(),
    issueNumber: v.number(),
    issueRepository: v.string(),
    issueUrl: v.string(),
    notes: v.optional(v.string()),
    participants: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    
    return await ctx.db.insert("workSessions", {
      issueId: args.issueId,
      issueTitle: args.issueTitle,
      issueNumber: args.issueNumber,
      issueRepository: args.issueRepository,
      issueUrl: args.issueUrl,
      startTime: Date.now(),
      duration: 0,
      isActive: true,
      isPaused: false,
      notes: args.notes ?? "",
      userId: user._id,
      participants: args.participants ?? [],
    });
  },
});

// Mutation to complete a work session
export const complete = mutation({
  args: {
    id: v.id("workSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Work session not found");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    if (session.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Calculate the final duration
    let finalDuration = session.duration;
    if (!session.isPaused) {
      const currentTime = Date.now();
      finalDuration += (currentTime - session.startTime);
    }

    return await ctx.db.patch(args.id, {
      isActive: false,
      endTime: Date.now(),
      duration: finalDuration,
    });
  },
});

// Mutation to toggle pause/resume for a work session
export const togglePause = mutation({
  args: {
    id: v.id("workSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Work session not found");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    if (session.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    let updatedDuration = session.duration;
    const currentTime = Date.now();

    // If we're pausing, add the elapsed time to duration
    if (!session.isPaused) {
      updatedDuration += (currentTime - session.startTime);
    }

    return await ctx.db.patch(args.id, {
      isPaused: !session.isPaused,
      startTime: !session.isPaused ? 0 : currentTime, // Reset start time when pausing, set to now when resuming
      duration: updatedDuration,
    });
  },
});

// Mutation to update work session notes
export const updateNotes = mutation({
  args: {
    id: v.id("workSessions"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Work session not found");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    if (session.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args.id, {
      notes: args.notes,
    });
  },
});

// Mutation to update work session participants
export const updateParticipants = mutation({
  args: {
    id: v.id("workSessions"),
    participants: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Work session not found");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    if (session.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.patch(args.id, {
      participants: args.participants,
    });
  },
});

// Mutation to delete a work session
export const remove = mutation({
  args: {
    id: v.id("workSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Work session not found");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    if (session.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.delete(args.id);
  },
});

// Query to get aggregated statistics by user
export const getTimeStatsByUser = query({
  args: {
    startDate: v.optional(v.number()), // start timestamp in ms
    endDate: v.optional(v.number()),   // end timestamp in ms
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    const endDate = args.endDate || Date.now();
    const startDate = args.startDate || (endDate - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

    // Get all completed sessions within date range
    const sessions = await ctx.db
      .query("workSessions")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .filter(q => 
        q.and(
          q.eq(q.field("isActive"), false),
          q.gte(q.field("startTime"), startDate),
          q.lte(q.field("startTime"), endDate)
        )
      )
      .collect();

    // Group by date and calculate total duration
    const statsByDate = new Map();
    
    for (const session of sessions) {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      const currentTotal = statsByDate.get(date) || 0;
      statsByDate.set(date, currentTotal + session.duration);
    }

    // Convert to array for return
    const result = Array.from(statsByDate.entries()).map(([date, totalDuration]) => ({
      date,
      totalDuration,
    }));

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
});

// Query to get aggregated statistics by team member
export const getTimeStatsByTeam = query({
  args: {
    startDate: v.optional(v.number()), // start timestamp in ms
    endDate: v.optional(v.number()),   // end timestamp in ms
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await getUserFromId(ctx, identity.tokenIdentifier);
    const endDate = args.endDate || Date.now();
    const startDate = args.startDate || (endDate - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

    // Get all completed sessions within date range
    const sessions = await ctx.db
      .query("workSessions")
      .filter(q => 
        q.and(
          q.eq(q.field("isActive"), false),
          q.gte(q.field("startTime"), startDate),
          q.lte(q.field("startTime"), endDate)
        )
      )
      .collect();

    // Group by user and calculate total duration
    const statsByUser = new Map();
    
    for (const session of sessions) {
      const currentTotal = statsByUser.get(session.userId) || 0;
      statsByUser.set(session.userId, currentTotal + session.duration);
    }

    // Convert to array for return
    const result = Array.from(statsByUser.entries()).map(([userId, totalDuration]) => ({
      userId,
      totalDuration,
    }));

    // Sort by total duration (descending)
    return result.sort((a, b) => b.totalDuration - a.totalDuration);
  }
});