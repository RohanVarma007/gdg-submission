import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createSampleDoctors = mutation({
  args: {},
  handler: async (ctx) => {
    // First, create dummy user entries in the users table for the demo doctors
    const demoUser1 = await ctx.db.insert("users", {
      name: "Dr. Scamittesh",
      email: "scamittesh@demo.com",
    });

    const demoUser2 = await ctx.db.insert("users", {
      name: "Dr. Priya Sharma", 
      email: "priya@demo.com",
    });

    const demoUser3 = await ctx.db.insert("users", {
      name: "Dr. Amrit Singh",
      email: "amrit@demo.com",
    });

    // Create 3 sample doctors with the created user IDs
    await ctx.db.insert("profiles", {
      userId: demoUser1,
      role: "doctor" as const,
      name: "Dr. Scamittesh",
      phone: "+91-9876543220",
      language: "en" as const,
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: "123 Medical Center",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
      },
      specialization: "Cardiology",
      experience: 15,
      qualifications: ["MBBS", "MD Cardiology"],
      consultationFee: 800,
      isAvailable: true,
      verificationStatus: "verified" as const,
    });

    await ctx.db.insert("profiles", {
      userId: demoUser2,
      role: "doctor" as const,
      name: "Dr. Priya Sharma",
      phone: "+91-9876543221",
      language: "hi" as const,
      location: {
        latitude: 28.5355,
        longitude: 77.3910,
        address: "456 Health Plaza",
        city: "Noida",
        state: "UP",
        pincode: "201301",
      },
      specialization: "Pediatrics",
      experience: 12,
      qualifications: ["MBBS", "MD Pediatrics"],
      consultationFee: 600,
      isAvailable: true,
      verificationStatus: "verified" as const,
    });

    await ctx.db.insert("profiles", {
      userId: demoUser3,
      role: "doctor" as const,
      name: "Dr. Amrit Singh",
      phone: "+91-9876543222",
      language: "pa" as const,
      location: {
        latitude: 28.4595,
        longitude: 77.0266,
        address: "789 Wellness Center",
        city: "Gurgaon",
        state: "Haryana",
        pincode: "122001",
      },
      specialization: "General Medicine",
      experience: 10,
      qualifications: ["MBBS", "MD Internal Medicine"],
      consultationFee: 500,
      isAvailable: true,
      verificationStatus: "verified" as const,
    });

    return {
      message: "Created 3 sample doctors. You can now book consultations!",
      count: 3,
    };
  },
});
