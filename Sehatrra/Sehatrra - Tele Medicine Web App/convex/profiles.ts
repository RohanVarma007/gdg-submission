import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const createProfile = mutation({
  args: {
    role: v.union(v.literal("patient"), v.literal("doctor"), v.literal("pharmacy"), v.literal("admin")),
    name: v.string(),
    phone: v.string(),
    language: v.union(v.literal("en"), v.literal("hi"), v.literal("pa")),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
    })),
    // Doctor-specific fields
    specialization: v.optional(v.string()),
    experience: v.optional(v.number()),
    qualifications: v.optional(v.array(v.string())),
    consultationFee: v.optional(v.number()),
    // Pharmacy-specific fields
    pharmacyName: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    // Patient-specific fields
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    bloodGroup: v.optional(v.string()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relation: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    const profileData = {
      userId,
      ...args,
      isAvailable: args.role === "doctor" ? true : undefined,
    };

    return await ctx.db.insert("profiles", profileData);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    language: v.optional(v.union(v.literal("en"), v.literal("hi"), v.literal("pa"))),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
    })),
    // Doctor-specific fields
    specialization: v.optional(v.string()),
    experience: v.optional(v.number()),
    qualifications: v.optional(v.array(v.string())),
    consultationFee: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
    // Pharmacy-specific fields
    pharmacyName: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    // Patient-specific fields
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    bloodGroup: v.optional(v.string()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relation: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, args);
    return profile._id;
  },
});

export const getAvailableDoctors = query({
  args: {},
  handler: async (ctx) => {
    const doctors = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "doctor"))
      .collect();

    return doctors.filter(doctor => 
      doctor.isAvailable !== false && 
      doctor.verificationStatus === "verified"
    );
  },
});

export const getNearbyDoctors = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radius: v.number(), // in kilometers
  },
  handler: async (ctx, args) => {
    const doctors = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "doctor"))
      .collect();

    // Filter available and verified doctors first
    const availableDoctors = doctors.filter(doctor => 
      doctor.isAvailable !== false && 
      doctor.verificationStatus === "verified"
    );

    // Calculate distance and filter by radius
    const nearbyDoctors = availableDoctors
      .map(doctor => {
        if (!doctor.location) return null;
        
        const distance = calculateDistance(
          args.latitude,
          args.longitude,
          doctor.location.latitude,
          doctor.location.longitude
        );
        return { ...doctor, distance };
      })
      .filter((doctor): doctor is NonNullable<typeof doctor> => 
        doctor !== null && doctor.distance <= args.radius
      )
      .sort((a, b) => a.distance - b.distance);

    return nearbyDoctors;
  },
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export const getHealthRecords = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "patient") return [];

    const records = await ctx.db
      .query("healthRecords")
      .withIndex("by_patient", (q) => q.eq("patientId", profile._id))
      .order("desc")
      .collect();

    // Get doctor information for each record
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        if (record.doctorId) {
          const doctor = await ctx.db.get(record.doctorId);
          return { ...record, doctor };
        }
        return record;
      })
    );

    return enrichedRecords;
  },
});

export const getAllProfiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile || currentProfile.role !== "admin") return [];

    const profiles = await ctx.db.query("profiles").collect();
    return profiles;
  },
});

export const getDoctorStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "doctor") return null;

    const consultations = await ctx.db
      .query("consultations")
      .withIndex("by_doctor", (q) => q.eq("doctorId", profile._id))
      .collect();

    const totalConsultations = consultations.length;
    const completedConsultations = consultations.filter(c => c.status === "completed").length;
    const scheduledConsultations = consultations.filter(c => c.status === "scheduled").length;
    const totalEarnings = consultations
      .filter(c => c.status === "completed" && c.paymentStatus === "paid")
      .reduce((sum, c) => sum + c.fee, 0);

    return {
      totalConsultations,
      completedConsultations,
      scheduledConsultations,
      totalEarnings,
    };
  },
});

export const getDoctorsUnderReview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile || currentProfile.role !== "admin") return [];

    const doctors = await ctx.db
      .query("profiles")
      .withIndex("by_role", (q) => q.eq("role", "doctor"))
      .collect();

    return doctors.filter(doctor => doctor.verificationStatus === "under_review");
  },
});

export const approveDoctorVerification = mutation({
  args: {
    doctorId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile || currentProfile.role !== "admin") {
      throw new Error("Only admins can approve doctor verification");
    }

    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Doctor not found");
    }

    await ctx.db.patch(args.doctorId, {
      verificationStatus: "verified",
    });

    return { success: true };
  },
});

export const rejectDoctorVerification = mutation({
  args: {
    doctorId: v.id("profiles"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const currentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!currentProfile || currentProfile.role !== "admin") {
      throw new Error("Only admins can reject doctor verification");
    }

    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new Error("Doctor not found");
    }

    await ctx.db.patch(args.doctorId, {
      verificationStatus: "rejected",
      verificationNotes: args.reason,
    });

    return { success: true };
  },
});
