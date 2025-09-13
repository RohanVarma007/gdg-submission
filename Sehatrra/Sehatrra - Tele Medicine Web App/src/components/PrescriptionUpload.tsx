import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface PrescriptionUploadProps {
  consultationId: Id<"consultations">;
  onClose: () => void;
}

export function PrescriptionUpload({ consultationId, onClose }: PrescriptionUploadProps) {
  const [prescription, setPrescription] = useState([
    { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const consultation = useQuery(api.consultations.getConsultation, { consultationId });
  const updateConsultation = useMutation(api.consultations.updateConsultationStatus);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const savePrescription = useMutation(api.prescriptions.createPrescription);

  const addMedicine = () => {
    setPrescription([...prescription, { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedicine = (index: number) => {
    setPrescription(prescription.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const updated = prescription.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setPrescription(updated);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      toast.error("Please upload a PDF or image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      
      // Save prescription with file
      await savePrescription({
        consultationId,
        medications: prescription.filter(med => med.medicine.trim()),
        notes: notes.trim(),
        attachmentId: storageId,
      });

      toast.success("Prescription uploaded successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to upload prescription");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    const validMedicines = prescription.filter(med => med.medicine.trim());
    
    if (validMedicines.length === 0 && !notes.trim()) {
      toast.error("Please add at least one medicine or notes");
      return;
    }

    setIsUploading(true);
    try {
      await updateConsultation({
        consultationId,
        status: "completed",
        notes: notes.trim(),
      });

      toast.success("Prescription saved successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to save prescription");
      console.error("Save error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!consultation) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="pill-card-large max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Upload Prescription
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                For {consultation.patientName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Upload Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Digital Prescription */}
            <div className="pill-widget-blue p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Create Digital Prescription
              </h3>
              
              <div className="space-y-4">
                {prescription.map((med, index) => (
                  <div key={index} className="pill-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Medicine {index + 1}
                      </span>
                      {prescription.length > 1 && (
                        <button
                          onClick={() => removeMedicine(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Medicine name"
                        value={med.medicine}
                        onChange={(e) => updateMedicine(index, "medicine", e.target.value)}
                        className="pill-input"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g., 500mg)"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                        className="pill-input"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g., 2x daily)"
                        value={med.frequency}
                        onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                        className="pill-input"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g., 7 days)"
                        value={med.duration}
                        onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                        className="pill-input"
                      />
                    </div>
                    
                    <textarea
                      placeholder="Special instructions (optional)"
                      value={med.instructions}
                      onChange={(e) => updateMedicine(index, "instructions", e.target.value)}
                      className="pill-input mt-3 min-h-[60px] resize-none"
                    />
                  </div>
                ))}
                
                <button
                  onClick={addMedicine}
                  className="w-full pill-button-secondary"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Another Medicine
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="pill-widget-purple p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Upload Prescription File
              </h3>
              
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">
                    Click to upload prescription
                  </p>
                  <p className="text-sm text-slate-500">
                    PDF or Image files (max 5MB)
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Doctor's Notes */}
          <div className="pill-widget-green p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Doctor's Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add consultation notes, diagnosis, recommendations..."
              className="pill-input min-h-[120px] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 pill-button bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="flex-1 pill-button-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                "Save Prescription"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
