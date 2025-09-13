import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getConsultation = query({
  args: { consultationId: v.id("consultations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const consultation = await ctx.db.get(args.consultationId);
    if (!consultation) {
      throw new Error("Consultation not found");
    }

    // Get patient and doctor profiles
    const patient = await ctx.db.get(consultation.patientId);
    const doctor = await ctx.db.get(consultation.doctorId);

    return {
      ...consultation,
      patientName: patient?.name || "Unknown Patient",
      doctorName: doctor?.name || "Unknown Doctor",
    };
  },
});

export const getChatMessages = query({
  args: { consultationId: v.id("consultations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_consultation", (q) => q.eq("consultationId", args.consultationId))
      .order("asc")
      .collect();

    return messages;
  },
});

export const sendChatMessage = mutation({
  args: {
    consultationId: v.id("consultations"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const consultation = await ctx.db.get(args.consultationId);
    if (!consultation) {
      throw new Error("Consultation not found");
    }

    // Verify user is part of this consultation
    if (consultation.patientId !== profile._id && consultation.doctorId !== profile._id) {
      throw new Error("Not authorized to send messages in this consultation");
    }

    await ctx.db.insert("chatMessages", {
      consultationId: args.consultationId,
      senderId: profile._id,
      message: args.message,
    });
  },
});

export const getAvailableSlots = query({
  args: { doctorId: v.id("profiles"), date: v.string() },
  handler: async (ctx, args) => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const dateTime = new Date(`${args.date}T${timeString}:00`);
        
        if (dateTime.getTime() > Date.now()) {
          slots.push({
            time: timeString,
            datetime: dateTime.getTime(),
            available: true,
          });
        }
      }
    }
    
    return slots;
  },
});

export const getMyConsultations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    let consultations;
    if (profile.role === "patient") {
      consultations = await ctx.db
        .query("consultations")
        .withIndex("by_patient", (q) => q.eq("patientId", profile._id))
        .order("desc")
        .collect();
    } else if (profile.role === "doctor") {
      consultations = await ctx.db
        .query("consultations")
        .withIndex("by_doctor", (q) => q.eq("doctorId", profile._id))
        .order("desc")
        .collect();
    } else {
      return [];
    }

    // Get patient and doctor names for each consultation
    const consultationsWithNames = await Promise.all(
      consultations.map(async (consultation) => {
        const patient = await ctx.db.get(consultation.patientId);
        const doctor = await ctx.db.get(consultation.doctorId);
        
        return {
          ...consultation,
          patientName: patient?.name || "Unknown Patient",
          doctorName: doctor?.name || "Unknown Doctor",
        };
      })
    );

    return consultationsWithNames;
  },
});

export const bookConsultation = mutation({
  args: {
    doctorId: v.id("profiles"),
    scheduledTime: v.number(),
    symptoms: v.string(),
    type: v.union(v.literal("video"), v.literal("audio"), v.literal("chat")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const patientProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!patientProfile || patientProfile.role !== "patient") {
      throw new Error("Only patients can book consultations");
    }

    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Invalid doctor");
    }

    const consultationId = await ctx.db.insert("consultations", {
      patientId: patientProfile._id,
      doctorId: args.doctorId,
      scheduledTime: args.scheduledTime,
      duration: 30, // Default 30 minutes
      status: "scheduled",
      type: args.type,
      symptoms: args.symptoms,
      fee: doctor.consultationFee || 500,
      paymentStatus: "pending",
    });

    return consultationId;
  },
});

export const updateConsultationStatus = mutation({
  args: {
    consultationId: v.id("consultations"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const consultation = await ctx.db.get(args.consultationId);
    if (!consultation) {
      throw new Error("Consultation not found");
    }

    // Verify user is part of this consultation
    if (consultation.patientId !== profile._id && consultation.doctorId !== profile._id) {
      throw new Error("Not authorized to update this consultation");
    }

    const updateData: any = { status: args.status };
    if (args.notes) {
      updateData.notes = args.notes;
    }

    await ctx.db.patch(args.consultationId, updateData);
  },
});
