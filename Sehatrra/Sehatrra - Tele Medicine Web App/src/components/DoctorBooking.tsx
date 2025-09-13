import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface DoctorBookingProps {
  onBack: () => void;
}

export function DoctorBooking({ onBack }: DoctorBookingProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Id<"profiles"> | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [consultationType, setConsultationType] = useState<"video" | "audio" | "chat">("video");
  const [symptoms, setSymptoms] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  const nearbyDoctors = useQuery(api.profiles.getNearbyDoctors, 
    userLocation ? { 
      latitude: userLocation.latitude, 
      longitude: userLocation.longitude, 
      radius: 50 
    } : "skip"
  );
  
  const allDoctors = useQuery(api.profiles.getAvailableDoctors);
  
  const availableSlots = useQuery(api.consultations.getAvailableSlots, 
    selectedDoctor && selectedDate ? { 
      doctorId: selectedDoctor, 
      date: selectedDate 
    } : "skip"
  );

  const bookConsultation = useMutation(api.consultations.bookConsultation);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. Showing all doctors.");
          // Fallback to show all doctors
          setUserLocation({ latitude: 28.6139, longitude: 77.2090 }); // Delhi coordinates
        }
      );
    }
  }, []);

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !symptoms.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const scheduledTime = new Date(`${selectedDate}T${selectedTime}`).getTime();
    
    try {
      await bookConsultation({
        doctorId: selectedDoctor,
        scheduledTime,
        type: consultationType,
        symptoms: symptoms.trim(),
      });
      
      toast.success("Consultation booked successfully!");
      onBack();
    } catch (error) {
      toast.error("Failed to book consultation");
      console.error("Booking error:", error);
    }
  };

  const selectedDoctorData = (nearbyDoctors && nearbyDoctors.length > 0 ? nearbyDoctors : allDoctors || []).find(d => d._id === selectedDoctor);

  if (showPayment && selectedDoctorData) {
    return (
      <div className="dashboard-container">
        <div className="max-w-2xl mx-auto">
          <div className="pill-card-large p-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setShowPayment(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                Payment Details
              </h2>
            </div>

            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="pill-widget-blue p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Booking Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Doctor:</span>
                    <span className="font-medium">Dr. {selectedDoctorData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Date & Time:</span>
                    <span className="font-medium">
                      {new Date(`${selectedDate}T${selectedTime}`).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Type:</span>
                    <span className="font-medium capitalize">{consultationType} Call</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                    <span className="font-medium">30 minutes</span>
                  </div>
                  <hr className="border-slate-200 dark:border-slate-700" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{selectedDoctorData.consultationFee || 500}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Payment Method
                </h3>
                
                <div className="grid gap-3">
                  <div className="pill-card p-4 border-2 border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Credit/Debit Card
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Visa, Mastercard, RuPay
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pill-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          UPI Payment
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          PhonePe, Google Pay, Paytm
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pill-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Net Banking
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          All major banks supported
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 pill-button bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  Back
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 pill-button-success"
                >
                  Pay ₹{selectedDoctorData.consultationFee || 500} & Book
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold gradient-text">Book Consultation</h1>
        </div>

        {!selectedDoctor ? (
          <div className="space-y-6">
            <div className="pill-card-large p-6">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Available Doctors Nearby
              </h2>
              
              {!nearbyDoctors && !allDoctors ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                </div>
              ) : (nearbyDoctors && nearbyDoctors.length > 0) || (allDoctors && allDoctors.length > 0) ? (
                <div className="grid gap-4">
                  {(nearbyDoctors && nearbyDoctors.length > 0 ? nearbyDoctors : allDoctors || []).map((doctor) => (
                    <div
                      key={doctor._id}
                      className="pill-card p-6 hover:scale-[1.02] cursor-pointer transition-all duration-300"
                      onClick={() => setSelectedDoctor(doctor._id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                          {doctor.name.charAt(0)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                Dr. {doctor.name}
                              </h3>
                              <p className="text-slate-600 dark:text-slate-400">
                                {doctor.specialization || "General Physician"}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                ₹{doctor.consultationFee || 500}
                              </div>
                              <div className="text-sm text-slate-500">per consultation</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 mb-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-medium">4.8/5</span>
                              <span className="text-sm text-slate-500">(127 reviews)</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-green-600 font-medium">95% Success Rate</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {doctor.experience || 5}+ years exp
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {doctor.location?.city || "Delhi"} • {(doctor as any).distance?.toFixed(1) || "2.5"} km away
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {doctor.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    No Doctors Available
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    There are no verified doctors available at the moment.
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    💡 Tip: Use the Admin Dashboard to create sample doctors for testing.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Doctor Info */}
            <div className="pill-card-large p-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  Book with Dr. {selectedDoctorData?.name}
                </h2>
              </div>
              
              {selectedDoctorData && (
                <div className="pill-widget-green p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {selectedDoctorData.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Dr. {selectedDoctorData.name}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedDoctorData.specialization} • ₹{selectedDoctorData.consultationFee || 500}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Booking Form */}
            <div className="pill-card-large p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6">
                Consultation Details
              </h3>
              
              <div className="space-y-6">
                {/* Consultation Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Consultation Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: "video", icon: "📹", label: "Video Call" },
                      { type: "audio", icon: "📞", label: "Audio Call" },
                      { type: "chat", icon: "💬", label: "Chat" },
                    ].map(({ type, icon, label }) => (
                      <button
                        key={type}
                        onClick={() => setConsultationType(type as any)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                          consultationType === type
                            ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-cyan-300"
                        }`}
                      >
                        <div className="text-2xl mb-2">{icon}</div>
                        <div className="text-sm font-medium">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="pill-input"
                    required
                  />
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Available Time Slots
                    </label>
                    {!availableSlots ? (
                      <div className="flex justify-center py-4">
                        <div className="loading-spinner"></div>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No slots available for this date</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                              selectedTime === slot.time
                                ? "border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                                : "border-slate-200 dark:border-slate-700 hover:border-cyan-300"
                            }`}
                          >
                            <div className="font-medium">{slot.time}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Symptoms */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Describe your symptoms *
                  </label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Please describe your symptoms, concerns, or reason for consultation..."
                    className="pill-input min-h-[120px] resize-none"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="flex-1 pill-button bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Back to Doctors
                  </button>
                  <button
                    onClick={() => setShowPayment(true)}
                    disabled={!selectedDate || !selectedTime || !symptoms.trim()}
                    className="flex-1 pill-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
