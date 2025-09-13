import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createSampleServices = mutation({
  args: {},
  handler: async (ctx) => {
    // Sample pharmacies
    const pharmacies = [
      {
        name: "LifeCare Pharmacy",
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
        isAvailable: true,
        homeDelivery: true,
        medicines: [
          { name: "Paracetamol", stock: 100, price: 25, expiryDate: "2025-12-31" },
          { name: "Amoxicillin", stock: 50, price: 120, expiryDate: "2025-06-30" },
          { name: "Crocin", stock: 75, price: 30, expiryDate: "2025-09-15" },
          { name: "Aspirin", stock: 60, price: 15, expiryDate: "2025-11-20" },
        ],
      },
      {
        name: "MedPlus Pharmacy",
        type: "pharmacy" as const,
        phone: "+91-9876543211",
        location: {
          latitude: 28.5355,
          longitude: 77.3910,
          address: "456 Health Avenue, Sector 18",
          city: "Noida",
          state: "Uttar Pradesh",
          pincode: "201301",
        },
        isActive: true,
        rating: 4.2,
        isAvailable: true,
        homeDelivery: true,
        medicines: [
          { name: "Dolo 650", stock: 80, price: 35, expiryDate: "2025-08-15" },
          { name: "Azithromycin", stock: 40, price: 180, expiryDate: "2025-07-10" },
          { name: "Cetirizine", stock: 90, price: 45, expiryDate: "2025-10-25" },
        ],
      },
    ];

    // Sample hospitals
    const hospitals = [
      {
        name: "City General Hospital",
        type: "hospital" as const,
        phone: "+91-11-26123456",
        location: {
          latitude: 28.6304,
          longitude: 77.2177,
          address: "789 Medical Complex, Karol Bagh",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110005",
        },
        isActive: true,
        rating: 4.3,
        emergencyServices: true,
        specialties: ["Cardiology", "Neurology", "Emergency Medicine", "General Surgery"],
        facilities: ["ICU", "Emergency Room", "Laboratory", "Radiology", "Pharmacy"],
      },
      {
        name: "Rural Health Center",
        type: "clinic" as const,
        phone: "+91-9876543212",
        location: {
          latitude: 28.4595,
          longitude: 77.0266,
          address: "Village Health Center, Gurgaon Road",
          city: "Gurgaon",
          state: "Haryana",
          pincode: "122001",
        },
        isActive: true,
        rating: 4.0,
        emergencyServices: false,
        specialties: ["General Medicine", "Pediatrics", "Gynecology"],
        facilities: ["OPD", "Basic Laboratory", "Vaccination Center"],
      },
    ];

    // Sample ambulances
    const ambulances = [
      {
        name: "Emergency Ambulance Service",
        type: "ambulance" as const,
        phone: "+91-108",
        location: {
          latitude: 28.6129,
          longitude: 77.2295,
          address: "Emergency Station, India Gate",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110003",
        },
        isActive: true,
        rating: 4.8,
        vehicleNumber: "DL-01-AB-1234",
        isAvailable: true,
      },
      {
        name: "Rural Ambulance Unit",
        type: "ambulance" as const,
        phone: "+91-9876543213",
        location: {
          latitude: 28.4089,
          longitude: 77.3178,
          address: "Rural Health Station, Faridabad",
          city: "Faridabad",
          state: "Haryana",
          pincode: "121001",
        },
        isActive: true,
        rating: 4.5,
        vehicleNumber: "HR-51-CD-5678",
        isAvailable: true,
      },
    ];

    // Insert all sample services
    const allServices = [...pharmacies, ...hospitals, ...ambulances];
    
    for (const service of allServices) {
      await ctx.db.insert("services", service);
    }

    return { message: "Sample services created successfully", count: allServices.length };
  },
});

export const createSampleDoctors = mutation({
  args: {},
  handler: async (ctx) => {
    // Return credentials for manual signup since we can't create auth users directly
    const demoCredentials = [
      {
        name: "Dr. Scamittesh",
        email: "scamittesh@demo.com",
        password: "doctor123"
      },
      {
        name: "Dr. Priya Sharma", 
        email: "priya@demo.com",
        password: "doctor123"
      },
      {
        name: "Dr. Amrit Singh",
        email: "amrit@demo.com", 
        password: "doctor123"
      }
    ];

    return { 
      message: "Demo doctor credentials ready. Please sign up manually with these credentials and create doctor profiles.", 
      count: 3,
      credentials: demoCredentials
    };
  },
});

export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear all application data (but keep auth data)
    const tables = [
      "profiles",
      "services", 
      "consultations",
      "chatMessages",
      "healthRecords",
      "emergencyRequests",
      "medicineOrders",
      "notifications",
      "symptomChecks",
      "signals"
    ];

    let totalDeleted = 0;
    
    for (const tableName of tables) {
      const records = await ctx.db.query(tableName as any).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
        totalDeleted++;
      }
    }

    return { message: `Cleared ${totalDeleted} records from ${tables.length} tables`, count: totalDeleted };
  },
});
