import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { DoctorBooking } from "./DoctorBooking";
import { ConsultationView } from "./ConsultationView";
import { toast } from "sonner";

export function PatientDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "consultations" | "health" | "emergency">("overview");
  const [selectedConsultation, setSelectedConsultation] = useState<Id<"consultations"> | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  
  const profile = useQuery(api.profiles.getCurrentProfile);
  const consultations = useQuery(api.consultations.getMyConsultations);
  const healthRecords = useQuery(api.profiles.getHealthRecords);

  if (selectedConsultation) {
    return (
      <ConsultationView
        consultationId={selectedConsultation}
        onBack={() => setSelectedConsultation(null)}
      />
    );
  }

  if (showBooking) {
    return (
      <DoctorBooking onBack={() => setShowBooking(false)} />
    );
  }

  const upcomingConsultations = consultations?.filter(c => 
    c.status === "scheduled" && c.scheduledTime > Date.now()
  ) || [];

  const recentConsultations = consultations?.filter(c => 
    c.status === "completed" || c.status === "cancelled"
  ).slice(0, 3) || [];

  return (
    <div className="dashboard-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Welcome back, {profile?.name}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your health and connect with healthcare providers
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Overview", icon: "🏠" },
          { id: "consultations", label: "Consultations", icon: "👨‍⚕️" },
          { id: "health", label: "Health Records", icon: "📋" },
          { id: "emergency", label: "Emergency", icon: "🚨" },
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
          {/* Quick Actions */}
          <div className="pill-grid">
            <div className="pill-widget-blue p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="pill-icon bg-gradient-to-br from-blue-500 to-cyan-500">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {upcomingConsultations.length}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Upcoming Consultations
              </h3>
              <button
                onClick={() => setShowBooking(true)}
                className="pill-button-primary w-full"
              >
                📅 Book / 🎥 Video Call
              </button>
            </div>

            <div className="pill-widget-green p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="pill-icon bg-gradient-to-br from-green-500 to-emerald-500">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {healthRecords?.length || 0}
                </span>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Health Records
              </h3>
              <button
                onClick={() => setActiveTab("health")}
                className="pill-button-secondary w-full"
              >
                View Records
              </button>
            </div>

            <div className="pill-widget-red p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="pill-icon bg-gradient-to-br from-red-500 to-pink-500 heartbeat-animation">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Emergency SOS
              </h3>
              <button
                onClick={() => setActiveTab("emergency")}
                className="pill-button-danger w-full"
              >
                Emergency Help
              </button>
            </div>
          </div>

          {/* Upcoming Consultations */}
          {upcomingConsultations.length > 0 && (
            <div className="pill-card p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Upcoming Consultations
              </h2>
              <div className="space-y-4">
                {upcomingConsultations.map((consultation) => (
                  <div
                    key={consultation._id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => setSelectedConsultation(consultation._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {consultation.doctorName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                          Dr. {consultation.doctorName}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(consultation.scheduledTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="status-scheduled">
                        {consultation.type}
                      </span>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
              My Consultations
            </h2>
            <button
              onClick={() => setShowBooking(true)}
              className="pill-button-primary"
            >
              Book New Consultation
            </button>
          </div>

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
                      {consultation.doctorName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                        Dr. {consultation.doctorName}
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

      {activeTab === "health" && (
        <div className="dashboard-content">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6">
            Health Records
          </h2>
          <div className="space-y-4">
            {healthRecords?.map((record) => (
              <div key={record._id} className="pill-card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                      {record.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      {record.description}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(record._creationTime).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    record.type === "consultation" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" :
                    record.type === "prescription" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
                    record.type === "lab_report" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300" :
                    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  }`}>
                    {record.type.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "emergency" && (
        <div className="dashboard-content">
          <div className="pill-widget-red p-8 text-center">
            <div className="pill-icon-large bg-gradient-to-br from-red-500 to-pink-500 mx-auto mb-6 heartbeat-animation">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Emergency Services
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Get immediate help in case of medical emergencies
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="pill-button-danger">
                🚑 Call Ambulance
              </button>
              <button className="pill-button-danger">
                🏥 Find Hospital
              </button>
              <button className="pill-button-danger">
                📞 Emergency Contacts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
