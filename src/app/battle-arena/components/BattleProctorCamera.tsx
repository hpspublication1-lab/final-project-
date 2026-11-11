'use client';

/**
 * Samyak CEE Mastery — Peer-to-Peer Battle Proctor Camera
 * Renders local proctoring webcam preview and remote opponent live stream via WebRTC.
 * Uses public STUN infrastructure with zero external paid third-party dependencies.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Shield, ShieldCheck, User } from 'lucide-react';

interface BattleProctorCameraProps {
  localPlayerName: string;
  opponentName: string;
  isOpponentConnected: boolean;
  onSendSignal?: (type: 'offer' | 'answer' | 'ice-candidate', data: any) => void;
  incomingSignal?: { type: string; data: any; senderSessionId: string } | null;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const BattleProctorCamera: React.FC<BattleProctorCameraProps> = ({
  localPlayerName,
  opponentName,
  isOpponentConnected,
  onSendSignal,
  incomingSignal,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [remoteStreamActive, setRemoteStreamActive] = useState<boolean>(false);

  // Initialize Local Media Stream
  const initLocalStream = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraPermissionError('Camera API not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { max: 15 } },
        audio: false, // Video-only proctoring saves bandwidth
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCameraPermissionError(null);
    } catch (err: any) {
      console.warn('[ProctorCamera] Webcam access denied or unavailable:', err?.message);
      setCameraPermissionError('Camera optional or permission denied.');
      setCameraActive(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    initLocalStream();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      pcRef.current?.close();
    };
  }, [initLocalStream]);

  // WebRTC Peer Connection Setup
  const getOrCreatePeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && onSendSignal) {
        onSendSignal('ice-candidate', event.candidate.toJSON());
      }
    };

    // Handle Remote Track Arrival
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setRemoteStreamActive(true);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [onSendSignal]);

  // Handle Incoming WebRTC Signals
  useEffect(() => {
    if (!incomingSignal || !incomingSignal.type) return;

    const handleSignal = async () => {
      const pc = getOrCreatePeerConnection();

      try {
        if (incomingSignal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (onSendSignal) {
            onSendSignal('answer', answer);
          }
        } else if (incomingSignal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal.data));
        } else if (incomingSignal.type === 'ice-candidate') {
          if (incomingSignal.data) {
            await pc.addIceCandidate(new RTCIceCandidate(incomingSignal.data));
          }
        }
      } catch (err: any) {
        console.warn('[ProctorCamera] WebRTC signaling error:', err?.message);
      }
    };

    handleSignal();
  }, [incomingSignal, getOrCreatePeerConnection, onSendSignal]);

  // Initiate WebRTC Call when opponent connects and camera is active
  const initiateCall = useCallback(async () => {
    if (!onSendSignal || !isOpponentConnected) return;

    try {
      const pc = getOrCreatePeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      onSendSignal('offer', offer);
    } catch (err: any) {
      console.warn('[ProctorCamera] Failed to create WebRTC offer:', err?.message);
    }
  }, [onSendSignal, isOpponentConnected, getOrCreatePeerConnection]);

  useEffect(() => {
    if (cameraActive && isOpponentConnected) {
      initiateCall();
    }
  }, [cameraActive, isOpponentConnected, initiateCall]);

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
      }
    } else {
      initLocalStream();
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 backdrop-blur-md shadow-lg">
      {/* Local Student Facecam */}
      <div className="relative w-24 h-20 sm:w-28 sm:h-20 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
        {cameraActive ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 text-xs text-center p-1">
            <User className="w-5 h-5 mb-0.5 text-slate-400" />
            <span className="truncate max-w-[80px]">{localPlayerName.split(' ')[0]}</span>
          </div>
        )}

        <div className="absolute bottom-1 left-1 flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded text-[10px] text-emerald-400 font-medium">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>You</span>
        </div>

        <button
          type="button"
          onClick={toggleCamera}
          title={cameraActive ? 'Disable Camera' : 'Enable Camera'}
          className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
        >
          {cameraActive ? <Camera className="w-3 h-3 text-emerald-400" /> : <CameraOff className="w-3 h-3 text-red-400" />}
        </button>
      </div>

      {/* Proctoring Status Badge */}
      <div className="hidden sm:flex flex-col items-center justify-center px-1">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full mb-1">
          <Shield className="w-3 h-3" />
          <span>PROCTORED</span>
        </div>
        <span className="text-[10px] text-slate-400">P2P Encrypted</span>
      </div>

      {/* Opponent Facecam */}
      <div className="relative w-24 h-20 sm:w-28 sm:h-20 bg-slate-950 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
        {remoteStreamActive ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 text-xs text-center p-1">
            <User className="w-5 h-5 mb-0.5 text-amber-400" />
            <span className="truncate max-w-[80px]">{opponentName ? opponentName.split(' ')[0] : 'Opponent'}</span>
            <span className="text-[9px] text-slate-500">{isOpponentConnected ? 'Cam off' : 'Waiting...'}</span>
          </div>
        )}

        <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-black/60 px-1 py-0.5 rounded text-[10px] text-amber-300 font-medium">
          <span>{opponentName ? opponentName.split(' ')[0] : 'Opponent'}</span>
        </div>
      </div>
    </div>
  );
};

export default BattleProctorCamera;
