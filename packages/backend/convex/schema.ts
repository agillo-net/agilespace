import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table to store authenticated users
  users: defineTable({
    // Auth information
    tokenIdentifier: v.string(), // Clerk user ID
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"]),

  // Work sessions table to store user's tracked time with GitHub issues
  workSessions: defineTable({
    // The GitHub issue being tracked
    issueId: v.string(),
    issueTitle: v.string(),
    issueNumber: v.number(),
    issueRepository: v.string(),
    issueUrl: v.string(),
    
    // Session information
    startTime: v.number(), // timestamp in ms
    endTime: v.optional(v.number()), // timestamp in ms, optional for active sessions
    duration: v.number(), // in ms
    isActive: v.boolean(),
    isPaused: v.boolean(),
    notes: v.string(),
    
    // User information
    userId: v.string(), // Clerk user ID
    participants: v.array(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_active", ["userId", "isActive"])
    .index("by_issue", ["issueId"]),
});