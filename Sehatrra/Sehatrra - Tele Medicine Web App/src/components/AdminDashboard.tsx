import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "doctors" | "services">("overview");
  const [loading, setLoading] = useState(false);
  const [doctorCredentials, setDoctorCredentials] = useState<any[]>([]);
  
  const createSampleServices = useMutation(api.sampleData.createSampleServices);
  const createSampleDoctors = useMutation(api.sampleData.createSampleDoctors);
  const createSampleDoctorProfiles = useMutation(api.doctors.createSampleDoctors);
  const clearAllData = useMutation(api.sampleData.clearAllData);
  const doctorsUnderReview = useQuery(api.profiles.getDoctorsUnderReview);
  const approveDoctorVerification = useMutation(api.profiles.approveDoctorVerification);
  const rejectDoctorVerification = useMutation(api.profiles.rejectDoctorVerification);

  const handleCreateSampleData = async (type: 'services' | 'doctors') => {
    setLoading(true);
    try {
      if (type === 'services') {
        const result = await createSampleServices();
        toast.success(`Created ${result.count} sample services`);
      } else {
        const result = await createSampleDoctors();
        if (result.credentials) {
          setDoctorCredentials(result.credentials);
        }
        // Also create the actual doctor profiles
        await createSampleDoctorProfiles();
        toast.success(`Created sample doctors! You can now book consultations.`);
      }
    } catch (error) {
      toast.error(`Failed to create sample ${type}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm("Are you sure you want to clear all application data? This cannot be undone.")) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await clearAllData();
      setDoctorCredentials([]); // Clear displayed credentials
      toast.success(`Cleared ${result.count} records`);
    } catch (error) {
      toast.error("Failed to clear data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorId: Id<"profiles">) => {
    try {
      await approveDoctorVerification({ doctorId });
      toast.success("Doctor verification approved!");
    } catch (error) {
      toast.error("Failed to approve doctor");
      console.error(error);
    }
  };

  const handleRejectDoctor = async (doctorId: Id<"profiles">, reason?: string) => {
    try {
      await rejectDoctorVerification({ doctorId, reason });
      toast.success("Doctor verification rejected");
    } catch (error) {
      toast.error("Failed to reject doctor");
      console.error(error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="pill-card p-8">
        <h2 className="text-3xl font-bold gradient-text mb-8 text-center">Admin Dashboard</h2>
        
        <div className="dashboard-content">
          <div className="pill-widget-blue p-6 mb-8">
            <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-3">Welcome to Sehatrra Admin</h3>
            <p className="text-blue-700 dark:text-blue-300">
              Use the controls below to manage the platform and populate it with sample data for demonstration purposes.
            </p>
          </div>

          <div className="pill-grid mb-8">
            <div className="pill-card p-6">
              <div className="pill-icon bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Healthcare Services</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Create sample pharmacies, hospitals, clinics, and ambulance services with realistic data.
              </p>
              <button
                onClick={() => handleCreateSampleData('services')}
                disabled={loading}
                className="pill-button-primary w-full"
              >
                {loading ? "Creating..." : "Create Sample Services"}
              </button>
            </div>

            <div className="pill-card p-6">
              <div className="pill-icon bg-gradient-to-br from-green-500 to-emerald-500 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Doctor Profiles</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Create sample doctor profiles with different specializations and languages.
              </p>
              <button
                onClick={() => handleCreateSampleData('doctors')}
                disabled={loading}
                className="pill-button-secondary w-full"
              >
                {loading ? "Creating..." : "Create Sample Doctors"}
              </button>
            </div>

            <div className="pill-card p-6">
              <div className="pill-icon bg-gradient-to-br from-red-500 to-pink-500 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Clear All Data</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Remove all application data to start fresh. This will not affect user accounts.
              </p>
              <button
                onClick={handleClearAllData}
                disabled={loading}
                className="pill-button-danger w-full"
              >
                {loading ? "Clearing..." : "Clear All Data"}
              </button>
            </div>
          </div>

          {/* Doctor Credentials Display */}
          {doctorCredentials.length > 0 && (
            <div className="pill-widget-green p-6 mb-8">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-4">🔑 Demo Doctor Login Credentials</h4>
              <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                Use these credentials to sign in as demo doctors and test the platform:
              </p>
              <div className="space-y-3">
                {doctorCredentials.map((cred, index) => (
                  <div key={index} className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl border border-green-200 dark:border-green-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-green-800 dark:text-green-200">Name:</span>
                        <span className="ml-2 text-green-700 dark:text-green-300">{cred.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800 dark:text-green-200">Email:</span>
                        <span className="ml-2 text-green-700 dark:text-green-300 font-mono">{cred.email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800 dark:text-green-200">Password:</span>
                        <span className="ml-2 text-green-700 dark:text-green-300 font-mono">{cred.password}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400">
                  💡 <strong>Tip:</strong> Sign out of your current account and use these credentials to test the doctor dashboard and consultation features.
                </p>
              </div>
            </div>
          )}

          <div className="pill-widget-yellow p-6 mb-8">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">📋 Platform Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Multi-language support (English, Hindi, Punjabi)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Role-based dashboards (Patient, Doctor, Pharmacy, Admin)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  AI-powered symptom checker
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Video/audio consultations
                </li>
              </ul>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Nearby services with GPS location
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Emergency SOS system
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Medicine ordering and delivery
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Health records management
                </li>
              </ul>
            </div>
          </div>

          <div className="pill-widget-green p-6">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3">🚀 Getting Started</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ol className="text-sm text-green-700 dark:text-green-300 space-y-2">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Create sample data using the buttons above
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Use the demo doctor credentials to test different roles
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Try booking consultations as a patient
                </li>
              </ol>
              <ol className="text-sm text-green-700 dark:text-green-300 space-y-2" start={4}>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  Test the emergency features and nearby services
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                  Use the AI symptom checker
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
                  Explore doctor verification and admin features
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
