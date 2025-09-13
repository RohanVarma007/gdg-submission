import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPrescription = mutation({
  args: {
    consultationId: v.id("consultations"),
    medications: v.array(v.object({
      medicine: v.string(),
      dosage: v.string(),
      frequency: v.string(),
      duration: v.string(),
      instructions: v.optional(v.string()),
    })),
    notes: v.optional(v.string()),
    attachmentId: v.optional(v.id("_storage")),
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

    if (!profile || profile.role !== "doctor") {
      throw new Error("Only doctors can create prescriptions");
    }

    // Update consultation with prescription
    await ctx.db.patch(args.consultationId, {
      status: "completed",
      prescription: args.medications,
      notes: args.notes,
    });

    // Create health record
    const healthRecordId = await ctx.db.insert("healthRecords", {
      patientId: consultation.patientId,
      type: "prescription",
      title: "Prescription",
      description: args.notes || "Prescription from consultation",
      doctorId: profile._id,
      medications: args.medications.map(med => ({
        name: med.medicine,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
      })),
      attachments: args.attachmentId ? [args.attachmentId] : undefined,
    });

    return healthRecordId;
  },
});

export const getPrescriptionsByPatient = query({
  args: { patientId: v.id("profiles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const prescriptions = await ctx.db
      .query("healthRecords")
      .withIndex("by_patient_and_type", (q) => 
        q.eq("patientId", args.patientId).eq("type", "prescription")
      )
      .order("desc")
      .collect();

    return prescriptions;
  },
});
