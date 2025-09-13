import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface VideoCallProps {
  consultationId: Id<"consultations">;
  isVideoCall: boolean;
  onEndCall: () => void;
}

export function VideoCall({ consultationId, isVideoCall, onEndCall }: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Waiting to connect...");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const signalingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const consultation = useQuery(api.consultations.getConsultation, { consultationId });
  const currentProfile = useQuery(api.profiles.getCurrentProfile);
  const participants = useQuery(api.webrtc.getCallParticipants, { consultationId });
  const signals = useQuery(api.webrtc.getSignals, { consultationId });
  const sendSignal = useMutation(api.webrtc.sendSignal);
  const initiateCall = useMutation(api.webrtc.initiateCall);
  const updateConsultationStatus = useMutation(api.consultations.updateConsultationStatus);

  const isDoctor = currentProfile?.role === "doctor";

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  // Handle incoming signals
  useEffect(() => {
    if (!signals || !peerConnectionRef.current) return;

    signals.forEach(async (signalData) => {
      const { signal } = signalData;
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        switch (signal.type) {
          case 'offer':
            await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            if (participants) {
              const targetUserId = isDoctor ? participants.patient.id : participants.doctor.id;
              await sendSignal({
                consultationId,
                signal: { type: 'answer', data: answer },
                targetUserId,
              });
            }
            break;
            
          case 'answer':
            await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
            break;
            
          case 'ice-candidate':
            await pc.addIceCandidate(new RTCIceCandidate(signal.data));
            break;
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    });
  }, [signals, participants, consultationId, sendSignal, isDoctor]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    pc.onicecandidate = async (event) => {
      if (event.candidate && participants) {
        const targetUserId = isDoctor ? participants.patient.id : participants.doctor.id;
        await sendSignal({
          consultationId,
          signal: { type: 'ice-candidate', data: event.candidate },
          targetUserId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus("Connected");
        setIsConnecting(false);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionStatus(
        state === 'connected' ? 'Connected' :
        state === 'connecting' ? 'Connecting...' :
        state === 'disconnected' ? 'Disconnected' :
        state === 'failed' ? 'Connection failed' :
        'Waiting to connect...'
      );
      
      if (state === 'failed') {
        toast.error("Connection failed. Please try again.");
      }
    };

    return pc;
  }, [consultationId, sendSignal, participants, isDoctor]);

  const startCall = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus("Getting camera and microphone...");
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setConnectionStatus("Setting up connection...");
      
      // Create peer connection
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Initiate the call in the database
      await initiateCall({ consultationId });

      // If this is the caller (doctor), create and send offer
      if (isDoctor && participants) {
        setConnectionStatus("Creating call offer...");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        await sendSignal({
          consultationId,
          signal: { type: 'offer', data: offer },
          targetUserId: participants.patient.id,
        });
      }

      setIsCallActive(true);
      callStartTimeRef.current = Date.now();
      
      await updateConsultationStatus({
        consultationId,
        status: "in_progress"
      });

      toast.success("Video call started!");
      setConnectionStatus("Waiting for other participant...");
      
    } catch (error) {
      setIsConnecting(false);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error("Camera/microphone access denied. Please allow permissions and try again.");
      } else {
        toast.error("Failed to start video call. Please check your camera and microphone.");
      }
      console.error("Error starting call:", error);
    }
  };

  const endCall = async () => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Clear signaling interval
      if (signalingIntervalRef.current) {
        clearInterval(signalingIntervalRef.current);
      }

      setIsCallActive(false);
      setCallDuration(0);
      setIsConnecting(false);
      setConnectionStatus("Call ended");
      
      await updateConsultationStatus({
        consultationId,
        status: "completed"
      });

      toast.success("Call ended");
      onEndCall();
    } catch (error) {
      toast.error("Error ending call");
      console.error("Error ending call:", error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        toast.success(audioTrack.enabled ? "Microphone unmuted" : "Microphone muted");
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        toast.success(videoTrack.enabled ? "Camera turned on" : "Camera turned off");
      }
    }
  };

  // Auto-start call for patients when doctor initiates
  useEffect(() => {
    if (!isDoctor && consultation?.status === "in_progress" && !isCallActive && !isConnecting) {
      startCall();
    }
  }, [consultation?.status, isDoctor, isCallActive, isConnecting]);

  if (!consultation) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/90 backdrop-blur-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
            {isDoctor ? consultation.patientName?.charAt(0) : consultation.doctorName?.charAt(0)}
          </div>
          <div>
            <div className="text-white font-semibold">
              {isDoctor ? consultation.patientName : `Dr. ${consultation.doctorName}`}
            </div>
            <div className="text-slate-300 text-sm">
              {isCallActive ? `Call duration: ${formatDuration(callDuration)}` : connectionStatus}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCallActive ? 'bg-green-500 text-white' : 
            isConnecting ? 'bg-yellow-500 text-white' : 
            'bg-slate-500 text-white'
          }`}>
            {isCallActive ? 'Connected' : isConnecting ? 'Connecting...' : 'Video Call'}
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-slate-800"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-slate-800 rounded-lg overflow-hidden border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Connection status overlay */}
        {!isCallActive && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                {isConnecting ? (
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {isDoctor ? consultation.patientName : `Dr. ${consultation.doctorName}`}
              </h3>
              <p className="text-slate-300 mb-8">{connectionStatus}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-900/90 backdrop-blur-sm p-6">
        <div className="flex justify-center items-center gap-6">
          {!isCallActive && !isConnecting ? (
            <button
              onClick={startCall}
              className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          ) : isConnecting ? (
            <button
              onClick={endCall}
              className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <>
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMuted ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  )}
                </svg>
              </button>

              {/* Video Toggle Button */}
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                  isVideoOff 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isVideoOff ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  )}
                </svg>
              </button>

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-full flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17l-1.5 1.5m-5.485-1.242L3 21l18-18" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
