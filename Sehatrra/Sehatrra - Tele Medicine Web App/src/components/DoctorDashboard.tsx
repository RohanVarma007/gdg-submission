import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConsultationView } from "./ConsultationView";
import { DoctorDocumentUpload } from "./DoctorDocumentUpload";
import { toast } from "sonner";

export function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "consultations" | "patients" | "documents">("overview");
  const [selectedConsultation, setSelectedConsultation] = useState<Id<"consultations"> | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  
  const profile = useQuery(api.profiles.getCurrentProfile);
  const consultations = useQuery(api.consultations.getMyConsultations);
  const updateConsultationStatus = useMutation(api.consultations.updateConsultationStatus);

  if (selectedConsultation) {
    return (
      <ConsultationView
        consultationId={selectedConsultation}
        onBack={() => setSelectedConsultation(null)}
      />
    );
  }

  if (showDocuments) {
    return (
      <DoctorDocumentUpload onBack={() => setShowDocuments(false)} />
    );
  }

  const todayConsultations = consultations?.filter(c => {
    const consultationDate = new Date(c.scheduledTime);
    const today = new Date();
    return consultationDate.toDateString() === today.toDateString();
  }) || [];

  const upcomingConsultations = consultations?.filter(c => 
    c.status === "scheduled" && c.scheduledTime > Date.now()
  ) || [];

  const handleStartConsultation = async (consultationId: Id<"consultations">) => {
    try {
      await updateConsultationStatus({
        consultationId,
        status: "in_progress"
      });
      setSelectedConsultation(consultationId);
      toast.success("Consultation started");
    } catch (error) {
      toast.error("Failed to start consultation");
    }
  };

  const getVerificationStatusColor = (status?: string) => {
    switch (status) {
      case "verified": return "text-green-600 dark:text-green-400";
      case "under_review": return "text-yellow-600 dark:text-yellow-400";
      case "rejected": return "text-red-600 dark:text-red-400";
      default: return "text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="dashboard-container">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Dr. {profile?.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {profile?.specialization} • {profile?.experience} years experience
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              profile?.verificationStatus === "verified" 
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                : profile?.verificationStatus === "under_review"
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
            }`}>
              {profile?.verificationStatus === "verified" ? "✓ Verified" : 
               profile?.verificationStatus === "under_review" ? "⏳ Under Review" : 
               "⚠️ Pending Verification"}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={profile?.isAvailable || false}
                className="rounded"
                readOnly
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Available</span>
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Overview", icon: "🏠" },
          { id: "consultations", label: "Consultations", icon: "👥" },
          { id: "patients", label: "Patients", icon: "🏥" },
          { id: "documents", label: "Documents", icon: "📄" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={activeTab === tab.id ? "pill-tab-active" : "pill-tab-inactive"}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="pill-grid">
            <div className="pill-widget-blue p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="pill-icon bg-gradient-to-br from-blue-500 to-cyan-500">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0v10a2 2 0 002 2h4a2 2 0 002-2V7m-8 0H4a2 2 0 00-2 2v10a2 2 0 002 2h4m0-6h.01M16 11h.01" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {todayConsultations.length}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Today's Consultations
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {upcomingConsultations.length} upcoming
              </p>
            </div>

            <div className="pill-widget-green p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="pill-icon bg-gradient-to-br from-green-500 to-emerald-500">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {consultations?.filter(c => c.status === "completed").length || 0}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Total Patients
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Consultations completed
              </p>
            </div>

            <div className="pill-widget-purple p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="pill-icon bg-gradient-to-br from-purple-500 to-pink-500">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Verification Status
              </h3>
              <button
                onClick={() => setShowDocuments(true)}
                className="pill-button-purple w-full"
              >
                Manage Documents
              </button>
            </div>
          </div>

          {/* Today's Consultations */}
          {todayConsultations.length > 0 && (
            <div className="pill-card p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Today's Consultations
              </h2>
              <div className="space-y-4">
                {todayConsultations.map((consultation) => (
                  <div
                    key={consultation._id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {consultation.patientName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                          {consultation.patientName}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(consultation.scheduledTime).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {consultation.symptoms}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {consultation.status === "scheduled" ? (
                        <button
                          onClick={() => handleStartConsultation(consultation._id)}
                          className="pill-button-success pill-button-small"
                        >
                          Start Consultation
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedConsultation(consultation._id)}
                          className="pill-button-primary pill-button-small"
                        >
                          View Chat
                        </button>
                      )}
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        consultation.status === "completed" ? "status-completed" :
                        consultation.status === "in_progress" ? "status-in-progress" :
                        consultation.status === "scheduled" ? "status-scheduled" :
                        "status-cancelled"
                      }`}>
                        {consultation.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "consultations" && (
        <div className="dashboard-content">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6">
            All Consultations
          </h2>
          <div className="space-y-4">
            {consultations?.map((consultation) => (
              <div
                key={consultation._id}
                className="pill-card p-6 cursor-pointer hover:scale-[1.01] transition-transform"
                onClick={() => setSelectedConsultation(consultation._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {consultation.patientName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                        {consultation.patientName}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(consultation.scheduledTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {consultation.symptoms}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      consultation.status === "completed" ? "status-completed" :
                      consultation.status === "in_progress" ? "status-in-progress" :
                      consultation.status === "scheduled" ? "status-scheduled" :
                      "status-cancelled"
                    }`}>
                      {consultation.status.replace("_", " ")}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      ₹{consultation.fee}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "patients" && (
        <div className="dashboard-content">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6">
            Patient History
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            View detailed patient consultation history and records.
          </p>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="dashboard-content">
          <div className="pill-card p-8 text-center">
            <div className="pill-icon-large bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Document Verification
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Upload and manage your professional documents for verification
            </p>
            <button
              onClick={() => setShowDocuments(true)}
              className="pill-button-purple"
            >
              Manage Documents
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
