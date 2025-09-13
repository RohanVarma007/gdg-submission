import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getNearbyServices = query({
  args: {
    type: v.union(v.literal("ambulance"), v.literal("pharmacy"), v.literal("hospital"), v.literal("clinic")),
    latitude: v.number(),
    longitude: v.number(),
    radius: v.number(), // in kilometers
  },
  handler: async (ctx, args) => {
    const services = await ctx.db
      .query("services")
      .withIndex("by_type_and_active", (q) => 
        q.eq("type", args.type).eq("isActive", true)
      )
      .collect();

    // Calculate distance and filter by radius
    const nearbyServices = services
      .map(service => {
        const distance = calculateDistance(
          args.latitude,
          args.longitude,
          service.location.latitude,
          service.location.longitude
        );
        return { ...service, distance };
      })
      .filter(service => service.distance <= args.radius)
      .sort((a, b) => a.distance - b.distance);

    return nearbyServices;
  },
});

export const createEmergencyRequest = mutation({
  args: {
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.optional(v.string()),
    }),
    type: v.union(v.literal("ambulance"), v.literal("medical"), v.literal("accident")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const patient = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!patient) throw new Error("Profile not found");

    const emergencyId = await ctx.db.insert("emergencyRequests", {
      patientId: patient._id,
      location: args.location,
      type: args.type,
      description: args.description,
      status: "active",
    });

    // Create notification for nearby services
    await ctx.db.insert("notifications", {
      userId: userId,
      title: "Emergency Request Created",
      message: `Emergency request for ${args.type} has been created and sent to nearby services.`,
      type: "emergency",
      isRead: false,
    });

    return emergencyId;
  },
});

export const getEmergencyRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) return [];

    if (profile.role === "patient") {
      const requests = await ctx.db
        .query("emergencyRequests")
        .withIndex("by_patient", (q) => q.eq("patientId", profile._id))
        .order("desc")
        .collect();

      return requests;
    }

    // For service providers, return all active requests
    const activeRequests = await ctx.db
      .query("emergencyRequests")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    return activeRequests;
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

export const addSampleServices = mutation({
  args: {},
  handler: async (ctx) => {
    // Sample pharmacies
    const pharmacies = [
      {
        name: "MedPlus Pharmacy",
        type: "pharmacy" as const,
        phone: "+91-9876543210",
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: "123 Main Street, Connaught Place",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110001",
        },
        isActive: true,
        rating: 4.5,
        homeDelivery: true,
        medicines: [
          { name: "Paracetamol", stock: 100, price: 25, expiryDate: "2025-12-31" },
          { name: "Amoxicillin", stock: 50, price: 120, expiryDate: "2025-06-30" },
          { name: "Aspirin", stock: 75, price: 35, expiryDate: "2025-09-15" },
        ],
      },
      {
        name: "Apollo Pharmacy",
        type: "pharmacy" as const,
        phone: "+91-9876543211",
        location: {
          latitude: 28.6129,
          longitude: 77.2295,
          address: "456 Health Avenue, Karol Bagh",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110005",
        },
        isActive: true,
        rating: 4.7,
        homeDelivery: true,
        medicines: [
          { name: "Crocin", stock: 80, price: 30, expiryDate: "2025-11-20" },
          { name: "Azithromycin", stock: 40, price: 180, expiryDate: "2025-08-10" },
        ],
      },
    ];

    // Sample hospitals
    const hospitals = [
      {
        name: "All India Institute of Medical Sciences",
        type: "hospital" as const,
        phone: "+91-11-26588500",
        location: {
          latitude: 28.5672,
          longitude: 77.2100,
          address: "Ansari Nagar, AIIMS",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110029",
        },
        isActive: true,
        rating: 4.8,
        specialties: ["Cardiology", "Neurology", "Oncology", "Emergency Medicine"],
        facilities: ["ICU", "Emergency Room", "Surgery", "Radiology"],
        emergencyServices: true,
      },
      {
        name: "Safdarjung Hospital",
        type: "hospital" as const,
        phone: "+91-11-26165060",
        location: {
          latitude: 28.5738,
          longitude: 77.2073,
          address: "Ring Road, Safdarjung Enclave",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110029",
        },
        isActive: true,
        rating: 4.3,
        specialties: ["General Medicine", "Surgery", "Pediatrics"],
        facilities: ["Emergency Room", "ICU", "Laboratory"],
        emergencyServices: true,
      },
    ];

    // Sample ambulances
    const ambulances = [
      {
        name: "Delhi Ambulance Service",
        type: "ambulance" as const,
        phone: "+91-9876543212",
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: "Emergency Services Hub, CP",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110001",
        },
        isActive: true,
        rating: 4.6,
        vehicleNumber: "DL-01-AB-1234",
        isAvailable: true,
      },
      {
        name: "Red Cross Ambulance",
        type: "ambulance" as const,
        phone: "+91-9876543213",
        location: {
          latitude: 28.6289,
          longitude: 77.2065,
          address: "Red Cross Building, Parliament Street",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110001",
        },
        isActive: true,
        rating: 4.4,
        vehicleNumber: "DL-02-CD-5678",
        isAvailable: true,
      },
    ];

    // Insert all services
    const allServices = [...pharmacies, ...hospitals, ...ambulances];
    
    for (const service of allServices) {
      await ctx.db.insert("services", service);
    }

    return { message: "Sample services added successfully", count: allServices.length };
  },
});
