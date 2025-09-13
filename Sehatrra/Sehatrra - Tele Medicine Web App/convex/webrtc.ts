import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// WebRTC signaling for video calls
export const sendSignal = mutation({
  args: {
    consultationId: v.id("consultations"),
    signal: v.object({
      type: v.string(),
      data: v.any(),
    }),
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.insert("signals", {
      consultationId: args.consultationId,
      fromUserId: userId,
      targetUserId: args.targetUserId,
      signal: args.signal,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const getSignals = query({
  args: {
    consultationId: v.id("consultations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const signals = await ctx.db
      .query("signals")
      .withIndex("by_consultation_and_target", (q) => 
        q.eq("consultationId", args.consultationId).eq("targetUserId", userId)
      )
      .order("desc")
      .take(50);

    return signals.reverse(); // Return in chronological order
  },
});

export const initiateCall = mutation({
  args: {
    consultationId: v.id("consultations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const consultation = await ctx.db.get(args.consultationId);
    if (!consultation) throw new Error("Consultation not found");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    // Check if user is authorized
    if (profile._id !== consultation.doctorId && profile._id !== consultation.patientId) {
      throw new Error("Not authorized");
    }

    // Update consultation status
    await ctx.db.patch(args.consultationId, {
      status: "in_progress",
    });

    return { success: true, roomId: consultation.roomId };
  },
});

export const getCallParticipants = query({
  args: {
    consultationId: v.id("consultations"),
  },
  handler: async (ctx, args) => {
    const consultation = await ctx.db.get(args.consultationId);
    if (!consultation) return null;

    const patient = await ctx.db.get(consultation.patientId);
    const doctor = await ctx.db.get(consultation.doctorId);

    if (!patient || !doctor) return null;

    return {
      patient: {
        id: patient.userId,
        name: patient.name,
        profileId: patient._id,
      },
      doctor: {
        id: doctor.userId,
        name: doctor.name,
        profileId: doctor._id,
        phone: doctor.phone,
      },
    };
  },
});
