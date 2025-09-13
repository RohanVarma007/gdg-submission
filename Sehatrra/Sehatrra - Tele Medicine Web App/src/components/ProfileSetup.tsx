import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { DoctorDocumentUpload } from "./DoctorDocumentUpload";

interface ProfileSetupProps {
  onComplete: () => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: "" as "patient" | "doctor" | "pharmacy" | "admin" | "",
    name: "",
    phone: "",
    language: "en" as "en" | "hi" | "pa",
    location: {
      address: "",
      city: "",
      state: "",
      pincode: "",
      latitude: 0,
      longitude: 0,
    },
    // Doctor-specific
    specialization: "",
    experience: 0,
    qualifications: [] as string[],
    consultationFee: 500,
    // Pharmacy-specific
    pharmacyName: "",
    licenseNumber: "",
    // Patient-specific
    dateOfBirth: "",
    gender: "" as "male" | "female" | "other" | "",
    bloodGroup: "",
    emergencyContact: {
      name: "",
      phone: "",
      relation: "",
    },
  });

  const createProfile = useMutation(api.profiles.createProfile);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.role || !formData.name || !formData.phone) {
        toast.error("Please fill in all required fields");
        return;
      }
    }
    
    if (step === 2 && formData.role === "doctor") {
      // For doctors, go to document upload step
      setStep(3);
      return;
    }
    
    handleSubmit();
  };

  const handleSubmit = async () => {
    try {
      const profileData: any = {
        role: formData.role,
        name: formData.name,
        phone: formData.phone,
        language: formData.language,
      };

      // Add location if provided
      if (formData.location.address) {
        profileData.location = formData.location;
      }

      // Add role-specific fields
      if (formData.role === "doctor") {
        profileData.specialization = formData.specialization || "General Physician";
        profileData.experience = formData.experience || 1;
        profileData.qualifications = formData.qualifications.length > 0 ? formData.qualifications : ["MBBS"];
        profileData.consultationFee = formData.consultationFee;
      } else if (formData.role === "pharmacy") {
        profileData.pharmacyName = formData.pharmacyName;
        profileData.licenseNumber = formData.licenseNumber;
      } else if (formData.role === "patient") {
        if (formData.dateOfBirth) profileData.dateOfBirth = formData.dateOfBirth;
        if (formData.gender) profileData.gender = formData.gender;
        if (formData.bloodGroup) profileData.bloodGroup = formData.bloodGroup;
        if (formData.emergencyContact.name) {
          profileData.emergencyContact = formData.emergencyContact;
        }
      }

      await createProfile(profileData);
      toast.success("Profile created successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to create profile");
      console.error("Profile creation error:", error);
    }
  };

  const addQualification = () => {
    const input = document.getElementById("qualification-input") as HTMLInputElement;
    if (input && input.value.trim()) {
      setFormData({
        ...formData,
        qualifications: [...formData.qualifications, input.value.trim()]
      });
      input.value = "";
    }
  };

  const removeQualification = (index: number) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter((_, i) => i !== index)
    });
  };

  // Step 3: Document Upload for Doctors
  if (step === 3 && formData.role === "doctor") {
    return <DoctorDocumentUpload onBack={() => setStep(2)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="pill-card-large max-w-2xl w-full">
        <div className="p-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? "bg-cyan-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-700"}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? "bg-cyan-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}>
                2
              </div>
              {formData.role === "doctor" && (
                <>
                  <div className={`w-16 h-1 ${step >= 3 ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-700"}`}></div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= 3 ? "bg-cyan-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}>
                    3
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold gradient-text mb-2">Welcome to HealthConnect</h1>
                <p className="text-slate-600 dark:text-slate-400">Let's set up your profile to get started</p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  I am a *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "patient", icon: "🏥", label: "Patient", desc: "Book consultations & manage health" },
                    { value: "doctor", icon: "👨‍⚕️", label: "Doctor", desc: "Provide consultations & care" },
                    { value: "pharmacy", icon: "💊", label: "Pharmacy", desc: "Manage medicine orders" },
                    { value: "admin", icon: "⚙️", label: "Admin", desc: "System administration" },
                  ].map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setFormData({ ...formData, role: role.value as any })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 ${
                        formData.role === role.value
                          ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-cyan-300"
                      }`}
                    >
                      <div className="text-2xl mb-2">{role.icon}</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{role.label}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{role.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pill-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pill-input"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Preferred Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                    className="pill-input"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Role-specific Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {formData.role === "doctor" && "Doctor Information"}
                  {formData.role === "patient" && "Patient Information"}
                  {formData.role === "pharmacy" && "Pharmacy Information"}
                  {formData.role === "admin" && "Admin Information"}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Please provide additional details for your profile
                </p>
              </div>

              {/* Doctor-specific fields */}
              {formData.role === "doctor" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="pill-input"
                      placeholder="e.g., Cardiology, General Medicine"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                      className="pill-input"
                      placeholder="5"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Qualifications
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        id="qualification-input"
                        type="text"
                        className="pill-input flex-1"
                        placeholder="e.g., MBBS, MD"
                        onKeyPress={(e) => e.key === "Enter" && addQualification()}
                      />
                      <button
                        type="button"
                        onClick={addQualification}
                        className="pill-button-secondary px-4"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.qualifications.map((qual, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 rounded-full text-sm"
                        >
                          {qual}
                          <button
                            onClick={() => removeQualification(index)}
                            className="text-cyan-600 hover:text-cyan-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Consultation Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData({ ...formData, consultationFee: parseInt(e.target.value) || 500 })}
                      className="pill-input"
                      placeholder="500"
                      min="100"
                    />
                  </div>
                </div>
              )}

              {/* Patient-specific fields */}
              {formData.role === "patient" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="pill-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="pill-input"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Blood Group
                    </label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="pill-input"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="pill-widget-blue p-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Emergency Contact</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                        })}
                        className="pill-input"
                        placeholder="Contact Name"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="tel"
                          value={formData.emergencyContact.phone}
                          onChange={(e) => setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                          })}
                          className="pill-input"
                          placeholder="Phone Number"
                        />
                        <input
                          type="text"
                          value={formData.emergencyContact.relation}
                          onChange={(e) => setFormData({
                            ...formData,
                            emergencyContact: { ...formData.emergencyContact, relation: e.target.value }
                          })}
                          className="pill-input"
                          placeholder="Relation"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pharmacy-specific fields */}
              {formData.role === "pharmacy" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Pharmacy Name *
                    </label>
                    <input
                      type="text"
                      value={formData.pharmacyName}
                      onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                      className="pill-input"
                      placeholder="Enter pharmacy name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="pill-input"
                      placeholder="Enter license number"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Location (optional for all roles) */}
              <div className="pill-widget-green p-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Location (Optional)</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, address: e.target.value }
                    })}
                    className="pill-input"
                    placeholder="Street Address"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value }
                      })}
                      className="pill-input"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={formData.location.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, state: e.target.value }
                      })}
                      className="pill-input"
                      placeholder="State"
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.location.pincode}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, pincode: e.target.value }
                    })}
                    className="pill-input"
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 pill-button bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 pill-button-primary"
            >
              {step === 2 && formData.role !== "doctor" ? "Complete Setup" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
