import { query, mutation, DatabaseReader } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Interface for the user object
export interface User {
  _id: string;
  _creationTime: number;
  tokenIdentifier: string;
  name?: string;
  email?: string;
  imageUrl?: string;
}

/**
 * Get a user from their tokenIdentifier (Clerk user ID)
 * Creates the user if they don't exist
 */
export async function getUserFromId(
  ctx: { db: DatabaseReader },
  tokenIdentifier: string
): Promise<User> {
  // Query for the user in the users table
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();

  // If the user exists, return them
  if (user) {
    return user as User;
  }

  // Should never happen since users are created when they first log in
  throw new ConvexError("User not found. Please log out and log back in.");
}

/**
 * Create a new user in the database or update their information if they already exist
 */
export const createOrUpdateUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (user) {
      // User exists, update their information
      return await ctx.db.patch(user._id, {
        name: args.name ?? user.name,
        email: args.email ?? identity.email ?? user.email,
        imageUrl: args.imageUrl ?? user.imageUrl,
      });
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        name: args.name ?? identity.name,
        email: args.email ?? identity.email,
        imageUrl: args.imageUrl,
      });
    }
  },
});

/**
 * Get the current authenticated user
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await getUserFromId(ctx, identity.tokenIdentifier);
  },
});