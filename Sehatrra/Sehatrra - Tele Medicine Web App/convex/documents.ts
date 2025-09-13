import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const uploadDoctorDocument = mutation({
  args: {
    documentType: v.union(
      v.literal("mbbsDegree"),
      v.literal("medicalRegistration"),
      v.literal("specializationCertificate"),
      v.literal("governmentId"),
      v.literal("experienceCertificate"),
      v.literal("telemedicineTraining")
    ),
    fileId: v.id("_storage"),
    fileName: v.string(),
    metadata: v.optional(v.object({
      registrationNumber: v.optional(v.string()),
      issuingCouncil: v.optional(v.string()),
      specialization: v.optional(v.string()),
      idType: v.optional(v.union(v.literal("aadhaar"), v.literal("passport"), v.literal("pan"), v.literal("driving_license"))),
      idNumber: v.optional(v.string()),
      organization: v.optional(v.string()),
      issuingOrganization: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "doctor") {
      throw new Error("Only doctors can upload medical documents");
    }

    const currentDocuments = profile.documents || {};
    const uploadedAt = Date.now();

    let updatedDocuments = { ...currentDocuments };

    switch (args.documentType) {
      case "mbbsDegree":
        updatedDocuments.mbbsDegree = {
          fileId: args.fileId,
          fileName: args.fileName,
          uploadedAt,
          verified: false,
        };
        break;

      case "medicalRegistration":
        if (!args.metadata?.registrationNumber || !args.metadata?.issuingCouncil) {
          throw new Error("Registration number and issuing council are required");
        }
        updatedDocuments.medicalRegistration = {
          fileId: args.fileId,
          fileName: args.fileName,
          registrationNumber: args.metadata.registrationNumber,
          issuingCouncil: args.metadata.issuingCouncil,
          uploadedAt,
          verified: false,
        };
        break;

      case "specializationCertificate":
        if (!args.metadata?.specialization) {
          throw new Error("Specialization is required");
        }
        updatedDocuments.specializationCertificate = {
          fileId: args.fileId,
          fileName: args.fileName,
          specialization: args.metadata.specialization,
          uploadedAt,
          verified: false,
        };
        break;

      case "governmentId":
        if (!args.metadata?.idType || !args.metadata?.idNumber) {
          throw new Error("ID type and number are required");
        }
        updatedDocuments.governmentId = {
          fileId: args.fileId,
          fileName: args.fileName,
          idType: args.metadata.idType,
          idNumber: args.metadata.idNumber,
          uploadedAt,
          verified: false,
        };
        break;

      case "experienceCertificate":
        if (!args.metadata?.organization) {
          throw new Error("Organization name is required");
        }
        if (!updatedDocuments.experienceCertificates) {
          updatedDocuments.experienceCertificates = [];
        }
        updatedDocuments.experienceCertificates.push({
          fileId: args.fileId,
          fileName: args.fileName,
          organization: args.metadata.organization,
          uploadedAt,
        });
        break;

      case "telemedicineTraining":
        if (!args.metadata?.issuingOrganization) {
          throw new Error("Issuing organization is required");
        }
        updatedDocuments.telemedicineTraining = {
          fileId: args.fileId,
          fileName: args.fileName,
          issuingOrganization: args.metadata.issuingOrganization,
          uploadedAt,
        };
        break;
    }

    // Update profile with new documents
    await ctx.db.patch(profile._id, {
      documents: updatedDocuments,
      verificationStatus: "under_review",
    });

    // Create notification for admin
    await ctx.db.insert("notifications", {
      userId: userId, // This should be admin user ID in real implementation
      title: "Document Uploaded for Verification",
      message: `Dr. ${profile.name} has uploaded ${args.documentType} for verification`,
      type: "verification",
      isRead: false,
    });

    return profile._id;
  },
});

export const getDoctorDocuments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "doctor") return null;

    return {
      documents: profile.documents || {},
      verificationStatus: profile.verificationStatus || "pending",
      verificationNotes: profile.verificationNotes,
    };
  },
});

export const getDocumentUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return null;

    // Check if user owns this document or is admin
    const isOwner = profile.role === "doctor";
    const isAdmin = profile.role === "admin";

    if (!isOwner && !isAdmin) return null;

    return await ctx.storage.getUrl(args.fileId);
  },
});

export const verifyDoctorDocument = mutation({
  args: {
    doctorId: v.id("profiles"),
    documentType: v.union(
      v.literal("mbbsDegree"),
      v.literal("medicalRegistration"),
      v.literal("specializationCertificate"),
      v.literal("governmentId")
    ),
    verified: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const adminProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!adminProfile || adminProfile.role !== "admin") {
      throw new Error("Only admins can verify documents");
    }

    const doctorProfile = await ctx.db.get(args.doctorId);
    if (!doctorProfile || doctorProfile.role !== "doctor") {
      throw new Error("Doctor profile not found");
    }

    const documents = doctorProfile.documents || {};
    
    // Update document verification status
    switch (args.documentType) {
      case "mbbsDegree":
        if (documents.mbbsDegree) {
          documents.mbbsDegree.verified = args.verified;
        }
        break;
      case "medicalRegistration":
        if (documents.medicalRegistration) {
          documents.medicalRegistration.verified = args.verified;
        }
        break;
      case "specializationCertificate":
        if (documents.specializationCertificate) {
          documents.specializationCertificate.verified = args.verified;
        }
        break;
      case "governmentId":
        if (documents.governmentId) {
          documents.governmentId.verified = args.verified;
        }
        break;
    }

    // Check if all mandatory documents are verified
    const mbbsVerified = documents.mbbsDegree?.verified === true;
    const registrationVerified = documents.medicalRegistration?.verified === true;
    const idVerified = documents.governmentId?.verified === true;

    const allMandatoryVerified = mbbsVerified && registrationVerified && idVerified;
    
    let verificationStatus: "pending" | "under_review" | "verified" | "rejected" = "under_review";
    
    if (allMandatoryVerified) {
      verificationStatus = "verified";
    } else if (!args.verified) {
      verificationStatus = "rejected";
    }

    await ctx.db.patch(args.doctorId, {
      documents,
      verificationStatus,
      verificationNotes: args.notes,
      isAvailable: verificationStatus === "verified",
    });

    // Notify doctor
    await ctx.db.insert("notifications", {
      userId: doctorProfile.userId,
      title: verificationStatus === "verified" ? "Documents Verified!" : "Document Verification Update",
      message: verificationStatus === "verified" 
        ? "All your documents have been verified. You can now start accepting consultations."
        : `Your ${args.documentType} verification status has been updated. ${args.notes || ""}`,
      type: "verification",
      isRead: false,
    });

    return args.doctorId;
  },
});

export const getPendingVerifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "admin") return [];

    const pendingDoctors = await ctx.db
      .query("profiles")
      .withIndex("by_verification_status", (q) => q.eq("verificationStatus", "under_review"))
      .collect();

    return pendingDoctors.filter(doctor => doctor.role === "doctor");
  },
});
