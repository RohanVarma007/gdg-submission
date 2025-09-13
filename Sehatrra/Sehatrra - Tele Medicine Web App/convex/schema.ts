import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with role-based access
  profiles: defineTable({
    userId: v.id("users"),
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
    isAvailable: v.optional(v.boolean()),
    // Doctor verification status
    verificationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("verified"),
      v.literal("rejected")
    )),
    verificationNotes: v.optional(v.string()),
    // Doctor documents
    documents: v.optional(v.object({
      mbbsDegree: v.optional(v.object({
        fileId: v.id("_storage"),
        fileName: v.string(),
        uploadedAt: v.number(),
        verified: v.optional(v.boolean()),
      })),
      medicalRegistration: v.optional(v.object({
        fileId: v.id("_storage"),
        fileName: v.string(),
        registrationNumber: v.string(),
        issuingCouncil: v.string(),
        uploadedAt: v.number(),
        verified: v.optional(v.boolean()),
      })),
      specializationCertificate: v.optional(v.object({
        fileId: v.id("_storage"),
        fileName: v.string(),
        specialization: v.string(),
        uploadedAt: v.number(),
        verified: v.optional(v.boolean()),
      })),
      governmentId: v.optional(v.object({
        fileId: v.id("_storage"),
        fileName: v.string(),
        idType: v.union(v.literal("aadhaar"), v.literal("passport"), v.literal("pan"), v.literal("driving_license")),
        idNumber: v.string(),
        uploadedAt: v.number(),
        verified: v.optional(v.boolean()),
      })),
      experienceCertificates: v.optional(v.array(v.object({
        fileId: v.id("_storage"),
        fileName: v.string(),
        organization: v.string(),
        uploadedAt: v.number(),
      }))),
      telemedicineTraining: v.optional(v.object({
        fileId: v.id("_storage"),
        fileName: v.string(),
        issuingOrganization: v.string(),
        uploadedAt: v.number(),
      })),
    })),
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
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_role_and_availability", ["role", "isAvailable"])
    .index("by_verification_status", ["verificationStatus"]),

  // Health records for patients
  healthRecords: defineTable({
    patientId: v.id("profiles"),
    type: v.union(v.literal("consultation"), v.literal("prescription"), v.literal("lab_report"), v.literal("vaccination")),
    title: v.string(),
    description: v.string(),
    doctorId: v.optional(v.id("profiles")),
    attachments: v.optional(v.array(v.id("_storage"))),
    medications: v.optional(v.array(v.object({
      name: v.string(),
      dosage: v.string(),
      frequency: v.string(),
      duration: v.string(),
    }))),
    vitals: v.optional(v.object({
      bloodPressure: v.optional(v.string()),
      heartRate: v.optional(v.number()),
      temperature: v.optional(v.number()),
      weight: v.optional(v.number()),
      height: v.optional(v.number()),
    })),
    isEmergency: v.optional(v.boolean()),
  })
    .index("by_patient", ["patientId"])
    .index("by_patient_and_type", ["patientId", "type"])
    .index("by_doctor", ["doctorId"]),

  // Consultation bookings and video calls
  consultations: defineTable({
    patientId: v.id("profiles"),
    doctorId: v.id("profiles"),
    scheduledTime: v.number(),
    duration: v.number(), // in minutes
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show")
    ),
    type: v.union(v.literal("video"), v.literal("audio"), v.literal("chat")),
    symptoms: v.string(),
    notes: v.optional(v.string()),
    prescription: v.optional(v.array(v.object({
      medicine: v.string(),
      dosage: v.string(),
      frequency: v.string(),
      duration: v.string(),
      instructions: v.optional(v.string()),
    }))),
    fee: v.number(),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("refunded")),
    roomId: v.optional(v.string()), // for video call room
  })
    .index("by_patient", ["patientId"])
    .index("by_doctor", ["doctorId"])
    .index("by_status", ["status"])
    .index("by_scheduled_time", ["scheduledTime"]),

  // Chat messages for consultations
  chatMessages: defineTable({
    consultationId: v.id("consultations"),
    senderId: v.id("profiles"),
    message: v.string(),
  })
    .index("by_consultation", ["consultationId"])
    .index("by_sender", ["senderId"]),

  // Nearby services (ambulances, pharmacies, hospitals)
  services: defineTable({
    name: v.string(),
    type: v.union(v.literal("ambulance"), v.literal("pharmacy"), v.literal("hospital"), v.literal("clinic")),
    phone: v.string(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
      city: v.string(),
      state: v.string(),
      pincode: v.string(),
    }),
    isActive: v.boolean(),
    rating: v.optional(v.number()),
    // Ambulance-specific
    vehicleNumber: v.optional(v.string()),
    isAvailable: v.optional(v.boolean()),
    // Pharmacy-specific
    medicines: v.optional(v.array(v.object({
      name: v.string(),
      stock: v.number(),
      price: v.number(),
      expiryDate: v.optional(v.string()),
    }))),
    homeDelivery: v.optional(v.boolean()),
    // Hospital/Clinic-specific
    specialties: v.optional(v.array(v.string())),
    facilities: v.optional(v.array(v.string())),
    emergencyServices: v.optional(v.boolean()),
  })
    .index("by_type", ["type"])
    .index("by_type_and_active", ["type", "isActive"])
    .index("by_location", ["location.city", "location.state"]),

  // Emergency SOS requests
  emergencyRequests: defineTable({
    patientId: v.id("profiles"),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
    }),
    type: v.union(v.literal("ambulance"), v.literal("medical"), v.literal("accident")),
    description: v.string(),
    status: v.union(v.literal("active"), v.literal("responded"), v.literal("resolved"), v.literal("cancelled")),
    assignedServiceId: v.optional(v.id("services")),
    estimatedArrival: v.optional(v.number()),
  })
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"]),

  // Medicine inventory and orders
  medicineOrders: defineTable({
    patientId: v.id("profiles"),
    pharmacyId: v.id("services"),
    prescriptionId: v.optional(v.id("healthRecords")),
    medicines: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    totalAmount: v.number(),
    deliveryType: v.union(v.literal("pickup"), v.literal("delivery")),
    deliveryAddress: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("preparing"), v.literal("ready"), v.literal("delivered"), v.literal("cancelled")),
    paymentStatus: v.union(v.literal("pending"), v.literal("paid")),
  })
    .index("by_patient", ["patientId"])
    .index("by_pharmacy", ["pharmacyId"])
    .index("by_status", ["status"]),

  // Notifications and alerts
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("appointment"),
      v.literal("medicine"),
      v.literal("emergency"),
      v.literal("reminder"),
      v.literal("system"),
      v.literal("verification")
    ),
    isRead: v.boolean(),
    actionUrl: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_scheduled", ["scheduledFor"]),

  // AI symptom checker interactions
  symptomChecks: defineTable({
    patientId: v.id("profiles"),
    symptoms: v.array(v.string()),
    responses: v.array(v.object({
      question: v.string(),
      answer: v.string(),
    })),
    aiSuggestion: v.string(),
    urgencyLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("emergency")),
    recommendedAction: v.string(),
    followUpNeeded: v.boolean(),
  })
    .index("by_patient", ["patientId"])
    .index("by_urgency", ["urgencyLevel"]),

  // WebRTC signaling for video calls
  signals: defineTable({
    consultationId: v.id("consultations"),
    fromUserId: v.string(),
    targetUserId: v.string(),
    signal: v.object({
      type: v.string(),
      data: v.any(),
    }),
    timestamp: v.number(),
  })
    .index("by_consultation_and_target", ["consultationId", "targetUserId"])
    .index("by_timestamp", ["timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
