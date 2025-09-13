import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface DoctorDocumentUploadProps {
  onBack: () => void;
}

export function DoctorDocumentUpload({ onBack }: DoctorDocumentUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    registrationNumber: "",
    issuingCouncil: "",
    specialization: "",
    idType: "aadhaar" as "aadhaar" | "passport" | "pan" | "driving_license",
    idNumber: "",
    organization: "",
    issuingOrganization: "",
  });

  const fileInputRefs = {
    mbbsDegree: useRef<HTMLInputElement>(null),
    medicalRegistration: useRef<HTMLInputElement>(null),
    specializationCertificate: useRef<HTMLInputElement>(null),
    governmentId: useRef<HTMLInputElement>(null),
    experienceCertificate: useRef<HTMLInputElement>(null),
    telemedicineTraining: useRef<HTMLInputElement>(null),
  };

  const doctorDocuments = useQuery(api.documents.getDoctorDocuments);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const uploadDocument = useMutation(api.documents.uploadDoctorDocument);

  const handleFileUpload = async (
    documentType: keyof typeof fileInputRefs,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file (JPEG, PNG)");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(documentType);
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

      // Prepare metadata based on document type
      let metadata: any = {};
      
      switch (documentType) {
        case "medicalRegistration":
          if (!formData.registrationNumber || !formData.issuingCouncil) {
            toast.error("Please fill in registration number and issuing council");
            return;
          }
          metadata = {
            registrationNumber: formData.registrationNumber,
            issuingCouncil: formData.issuingCouncil,
          };
          break;
        case "specializationCertificate":
          if (!formData.specialization) {
            toast.error("Please specify your specialization");
            return;
          }
          metadata = { specialization: formData.specialization };
          break;
        case "governmentId":
          if (!formData.idNumber) {
            toast.error("Please enter your ID number");
            return;
          }
          metadata = {
            idType: formData.idType,
            idNumber: formData.idNumber,
          };
          break;
        case "experienceCertificate":
          if (!formData.organization) {
            toast.error("Please enter the organization name");
            return;
          }
          metadata = { organization: formData.organization };
          break;
        case "telemedicineTraining":
          if (!formData.issuingOrganization) {
            toast.error("Please enter the issuing organization");
            return;
          }
          metadata = { issuingOrganization: formData.issuingOrganization };
          break;
      }

      // Upload document
      await uploadDocument({
        documentType,
        fileId: storageId as Id<"_storage">,
        fileName: file.name,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      toast.success(`${getDocumentLabel(documentType)} uploaded successfully!`);
      
      // Clear the file input
      if (fileInputRefs[documentType].current) {
        fileInputRefs[documentType].current.value = "";
      }
      
    } catch (error) {
      toast.error(`Failed to upload ${getDocumentLabel(documentType)}`);
      console.error("Upload error:", error);
    } finally {
      setUploading(null);
    }
  };

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      mbbsDegree: "MBBS Degree Certificate",
      medicalRegistration: "Medical Registration Certificate",
      specializationCertificate: "Specialization Certificate",
      governmentId: "Government ID",
      experienceCertificate: "Experience Certificate",
      telemedicineTraining: "Telemedicine Training Certificate",
    };
    return labels[type] || type;
  };

  const getDocumentStatus = (type: string) => {
    const docs = doctorDocuments?.documents;
    if (!docs) return "not_uploaded";
    
    switch (type) {
      case "mbbsDegree":
        return docs.mbbsDegree ? (docs.mbbsDegree.verified ? "verified" : "pending") : "not_uploaded";
      case "medicalRegistration":
        return docs.medicalRegistration ? (docs.medicalRegistration.verified ? "verified" : "pending") : "not_uploaded";
      case "specializationCertificate":
        return docs.specializationCertificate ? (docs.specializationCertificate.verified ? "verified" : "pending") : "not_uploaded";
      case "governmentId":
        return docs.governmentId ? (docs.governmentId.verified ? "verified" : "pending") : "not_uploaded";
      case "experienceCertificate":
        return docs.experienceCertificates && docs.experienceCertificates.length > 0 ? "uploaded" : "not_uploaded";
      case "telemedicineTraining":
        return docs.telemedicineTraining ? "uploaded" : "not_uploaded";
      default:
        return "not_uploaded";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "pending":
        return (
          <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "uploaded":
        return (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
    }
  };

  const mandatoryDocs = ["mbbsDegree", "medicalRegistration", "governmentId"];
  const optionalDocs = ["specializationCertificate", "experienceCertificate", "telemedicineTraining"];

  const allMandatoryUploaded = mandatoryDocs.every(doc => getDocumentStatus(doc) !== "not_uploaded");

  if (!doctorDocuments) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Document Verification</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Upload your medical documents for verification. All mandatory documents are required to start practicing.
          </p>
          
          {doctorDocuments.verificationStatus && (
            <div className={`mt-4 p-4 rounded-2xl ${
              doctorDocuments.verificationStatus === "verified" 
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : doctorDocuments.verificationStatus === "rejected"
                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
            }`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(doctorDocuments.verificationStatus)}
                <div>
                  <div className="font-semibold">
                    {doctorDocuments.verificationStatus === "verified" && "Documents Verified ✅"}
                    {doctorDocuments.verificationStatus === "under_review" && "Under Review 🔍"}
                    {doctorDocuments.verificationStatus === "rejected" && "Verification Failed ❌"}
                    {doctorDocuments.verificationStatus === "pending" && "Pending Verification ⏳"}
                  </div>
                  {doctorDocuments.verificationNotes && (
                    <p className="text-sm mt-1">{doctorDocuments.verificationNotes}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mandatory Documents */}
        <div className="pill-card-large p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
            Mandatory Documents
          </h2>
          
          <div className="space-y-6">
            {/* MBBS Degree */}
            <div className="pill-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getDocumentStatus("mbbsDegree"))}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      MBBS Degree Certificate
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      From NMC/MCI-approved medical college
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRefs.mbbsDegree.current?.click()}
                  disabled={uploading === "mbbsDegree"}
                  className="pill-button-primary disabled:opacity-50"
                >
                  {uploading === "mbbsDegree" ? "Uploading..." : "Upload"}
                </button>
              </div>
              <input
                ref={fileInputRefs.mbbsDegree}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileUpload("mbbsDegree", e)}
                className="hidden"
              />
            </div>

            {/* Medical Registration */}
            <div className="pill-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getDocumentStatus("medicalRegistration"))}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Medical Registration Certificate
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      SMC/NMC Registration Certificate
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRefs.medicalRegistration.current?.click()}
                  disabled={uploading === "medicalRegistration"}
                  className="pill-button-primary disabled:opacity-50"
                >
                  {uploading === "medicalRegistration" ? "Uploading..." : "Upload"}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Registration Number"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                  className="pill-input"
                />
                <input
                  type="text"
                  placeholder="Issuing Council (e.g., Delhi Medical Council)"
                  value={formData.issuingCouncil}
                  onChange={(e) => setFormData({...formData, issuingCouncil: e.target.value})}
                  className="pill-input"
                />
              </div>
              
              <input
                ref={fileInputRefs.medicalRegistration}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileUpload("medicalRegistration", e)}
                className="hidden"
              />
            </div>

            {/* Government ID */}
            <div className="pill-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getDocumentStatus("governmentId"))}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Government-Issued Photo ID
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Aadhaar, Passport, PAN, or Driving License
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRefs.governmentId.current?.click()}
                  disabled={uploading === "governmentId"}
                  className="pill-button-primary disabled:opacity-50"
                >
                  {uploading === "governmentId" ? "Uploading..." : "Upload"}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <select
                  value={formData.idType}
                  onChange={(e) => setFormData({...formData, idType: e.target.value as any})}
                  className="pill-input"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="passport">Passport</option>
                  <option value="pan">PAN Card</option>
                  <option value="driving_license">Driving License</option>
                </select>
                <input
                  type="text"
                  placeholder="ID Number"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                  className="pill-input"
                />
              </div>
              
              <input
                ref={fileInputRefs.governmentId}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileUpload("governmentId", e)}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Optional Documents */}
        <div className="pill-card-large p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">+</span>
            Optional Documents (Recommended)
          </h2>
          
          <div className="space-y-6">
            {/* Specialization Certificate */}
            <div className="pill-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getDocumentStatus("specializationCertificate"))}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Specialization Certificate
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      MD, MS, DNB, DM, MCh, PG Diplomas, etc.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRefs.specializationCertificate.current?.click()}
                  disabled={uploading === "specializationCertificate"}
                  className="pill-button-secondary disabled:opacity-50"
                >
                  {uploading === "specializationCertificate" ? "Uploading..." : "Upload"}
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Specialization (e.g., Cardiology, Orthopedics)"
                value={formData.specialization}
                onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                className="pill-input mb-4"
              />
              
              <input
                ref={fileInputRefs.specializationCertificate}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileUpload("specializationCertificate", e)}
                className="hidden"
              />
            </div>

            {/* Experience Certificate */}
            <div className="pill-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getDocumentStatus("experienceCertificate"))}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Experience Certificate
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      From previous hospitals or clinics
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRefs.experienceCertificate.current?.click()}
                  disabled={uploading === "experienceCertificate"}
                  className="pill-button-secondary disabled:opacity-50"
                >
                  {uploading === "experienceCertificate" ? "Uploading..." : "Upload"}
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Organization/Hospital Name"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
                className="pill-input mb-4"
              />
              
              <input
                ref={fileInputRefs.experienceCertificate}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileUpload("experienceCertificate", e)}
                className="hidden"
              />
            </div>

            {/* Telemedicine Training */}
            <div className="pill-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(getDocumentStatus("telemedicineTraining"))}
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      Telemedicine Training Certificate
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      As per NMC guidelines
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRefs.telemedicineTraining.current?.click()}
                  disabled={uploading === "telemedicineTraining"}
                  className="pill-button-secondary disabled:opacity-50"
                >
                  {uploading === "telemedicineTraining" ? "Uploading..." : "Upload"}
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Issuing Organization"
                value={formData.issuingOrganization}
                onChange={(e) => setFormData({...formData, issuingOrganization: e.target.value})}
                className="pill-input mb-4"
              />
              
              <input
                ref={fileInputRefs.telemedicineTraining}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileUpload("telemedicineTraining", e)}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 pill-button-primary"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            📋 Document Requirements
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• All documents must be clear and readable</li>
            <li>• Accepted formats: PDF, JPEG, PNG (max 5MB each)</li>
            <li>• Registration numbers will be verified with NMC portal</li>
            <li>• Verification typically takes 24-48 hours</li>
            <li>• You'll be notified once verification is complete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
