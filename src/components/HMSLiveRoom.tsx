'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectLocalPeer,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
  selectHMSMessages,
  useVideo,
  HMSPeer,
} from '@100mslive/react-sdk';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  Hand,
  LogOut,
  MessageSquare,
  Users,
  Send,
  Loader2,
  ShieldAlert,
  Radio,
  Volume2,
} from 'lucide-react';

// ─── Individual Peer Video Tile ───────────────────────────────────────────────

function PeerTile({ peer, isLocal }: { peer: HMSPeer; isLocal?: boolean }) {
  const { videoRef } = useVideo({
    trackId: peer.videoTrack,
  });

  return (
    <div className="relative bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 flex flex-col justify-center items-center aspect-video group">
      {peer.videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-200 border border-slate-700">
            {peer.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-slate-300">{peer.name || 'Participant'}</span>
        </div>
      )}

      {/* Overlay Badge */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-semibold text-white flex items-center gap-2 border border-white/10">
        <span className={`w-2 h-2 rounded-full ${peer.isAudioMuted ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
        <span>{peer.name} {isLocal ? '(You)' : ''}</span>
        {peer.roleName && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-indigo-500/30 text-indigo-300 rounded border border-indigo-500/30 capitalize">
            {peer.roleName}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Active Room Interface ───────────────────────────────────────────────────

function RoomContent({ roomId, defaultName }: { roomId: string; defaultName?: string }) {
  const hmsActions = useHMSActions();
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const isAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isScreenShared = useHMSStore(selectIsLocalScreenShared);
  const messages = useHMSStore(selectHMSMessages);

  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(!isVideoEnabled);
  };

  const toggleScreenShare = async () => {
    try {
      await hmsActions.setScreenShareEnabled(!isScreenShared);
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  const toggleHandRaise = async () => {
    setIsHandRaised(!isHandRaised);
    // Send hand raise notification or metadata
    hmsActions.sendBroadcastMessage(isHandRaised ? 'Lowered hand' : 'Raised hand ✋');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    await hmsActions.sendBroadcastMessage(chatMessage.trim());
    setChatMessage('');
  };

  const leaveRoom = async () => {
    await hmsActions.leave();
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] min-h-[550px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Main Stream Area */}
      <div className="flex-1 flex flex-col justify-between p-4 bg-slate-950 relative">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 mb-4 z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              100ms LIVE WEBRTC
            </span>
            <span className="text-xs font-medium text-slate-400">Room: {roomId.slice(0, 8)}...</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>{peers.length} Online</span>
            </div>
          </div>
        </div>

        {/* Peer Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center justify-center overflow-y-auto p-2">
          {peers.map((peer: any) => (
            <PeerTile key={peer.id} peer={peer} isLocal={peer.isLocal} />
          ))}
          {peers.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm">Connecting to live classroom video grid...</p>
            </div>
          )}
        </div>


        {/* Floating Controls Bar */}
        <div className="mt-4 flex items-center justify-center gap-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 max-w-xl mx-auto w-full z-10 shadow-xl">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-xl transition-all ${
              isAudioEnabled
                ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                : 'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30'
            }`}
            title={isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-xl transition-all ${
              isVideoEnabled
                ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                : 'bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30'
            }`}
            title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-xl transition-all ${
              isScreenShared
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
            }`}
            title="Share Screen"
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            onClick={toggleHandRaise}
            className={`p-3 rounded-xl transition-all ${
              isHandRaised
                ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/30'
                : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
            }`}
            title="Raise Hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`p-3 rounded-xl transition-all lg:hidden ${
              chatOpen ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'
            }`}
            title="Toggle Live Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          <button
            onClick={leaveRoom}
            className="p-3 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 transition-all"
            title="Leave Class"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Chat Sidebar */}
      {chatOpen && (
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between h-72 lg:h-auto">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>In-Class Discussion</span>
            </div>
            <span className="text-xs text-slate-400">{messages.length} msgs</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No messages yet. Ask a doubt!</p>
            ) : (
              messages.map((msg: any) => (
                <div key={msg.id} className="text-xs bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">

                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-indigo-300">{msg.senderName}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed break-words">{msg.message}</p>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950/50 flex gap-2">
            <input
              type="text"
              placeholder="Ask teacher a question..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="flex-1 bg-slate-800 text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!chatMessage.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ─── Entry Container Component ───────────────────────────────────────────────

function RoomJoiner({
  roomId,
  role = 'guest',
  userName = 'Student',
}: {
  roomId: string;
  role?: string;
  userName?: string;
}) {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinClass = async () => {
    setLoading(true);
    setError(null);
    try {
      let authToken = '';
      let nameToUse = userName;
      const cleanedInput = roomId.trim();

      // If the input looks like a 100ms Room Code (e.g. "xyz-abc-def" or formatted with dashes)
      if (cleanedInput.includes('-') && !cleanedInput.startsWith('http')) {
        authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode: cleanedInput });
      } else {
        // Request signed server token from Next.js API
        const res = await fetch('/api/100ms/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: cleanedInput, role }),
        });
        const data = await res.json();

        if (!res.ok || !data.token) {
          throw new Error(data.error || 'Failed to fetch 100ms room token');
        }
        authToken = data.token;
        nameToUse = data.userName || userName;
      }

      // Join 100ms room using WebRTC actions
      await hmsActions.join({
        authToken,
        userName: nameToUse,
      });
    } catch (err: any) {
      console.error('100ms join error:', err);
      setError(err?.message || 'Could not connect to live class');
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return <RoomContent roomId={roomId} defaultName={userName} />;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
        <Radio className="w-8 h-8 animate-pulse" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-100">Interactive 100ms Live Class</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1">
          Join real-time video classroom with direct teacher audio/video, screen share, hand raise, and live Q&A.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl max-w-md">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={joinClass}
        disabled={loading}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting WebRTC Stream...
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            Join Interactive Live Classroom
          </>
        )}
      </button>
    </div>
  );
}

export default function HMSLiveRoom(props: { roomId: string; role?: string; userName?: string }) {
  return (
    <HMSRoomProvider>
      <RoomJoiner {...props} />
    </HMSRoomProvider>
  );
}
