import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ConsultationChat } from "./ConsultationChat";
import { VideoCall } from "./VideoCall";

interface ConsultationViewProps {
  consultationId: Id<"consultations">;
  onBack: () => void;
}

export function ConsultationView({ consultationId, onBack }: ConsultationViewProps) {
  const [activeCall, setActiveCall] = useState<"video" | "audio" | null>(null);
  const consultation = useQuery(api.consultations.getConsultation, { consultationId });

  const handleStartVideoCall = () => {
    setActiveCall("video");
  };

  const handleStartAudioCall = () => {
    setActiveCall("audio");
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  if (!consultation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultation Info */}
        <div className="lg:col-span-1">
          <div className="pill-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Consultation Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Patient</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {consultation.patientName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Doctor</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {consultation.doctorName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Scheduled Time</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {new Date(consultation.scheduledTime).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  consultation.status === "completed" ? "status-completed" :
                  consultation.status === "in_progress" ? "status-in-progress" :
                  consultation.status === "scheduled" ? "status-scheduled" :
                  "status-cancelled"
                }`}>
                  {consultation.status.replace("_", " ")}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Symptoms</p>
                <p className="text-slate-800 dark:text-slate-200">
                  {consultation.symptoms}
                </p>
              </div>
            </div>
          </div>

          {consultation.notes && (
            <div className="pill-card p-6">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Doctor's Notes
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                {consultation.notes}
              </p>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {activeCall ? (
            <VideoCall
              consultationId={consultationId}
              isVideoCall={activeCall === "video"}
              onEndCall={handleEndCall}
            />
          ) : (
            <ConsultationChat
              consultationId={consultationId}
              onStartVideoCall={handleStartVideoCall}
              onStartAudioCall={handleStartAudioCall}
            />
          )}
        </div>
      </div>
    </div>
  );
}
