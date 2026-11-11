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
  BarChart2,
  Clock,
  CheckCircle2,
  Trophy,
  X,
  Zap,
  Sparkles,
  Award,
  Vote,
  Flame
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

interface LivePollData {
  id: string;
  question: string;
  options: { id: string; label: string; text: string }[];
  correctOption?: string; // 'a' | 'b' | 'c' | 'd'
  durationSec: number;
  startedAt: number;
  creatorName: string;
}

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

  // In-Class Live Poll States (Physics Wallah Standard)
  const [activePoll, setActivePoll] = useState<LivePollData | null>(null);
  const [pollTimeRemaining, setPollTimeRemaining] = useState<number>(0);
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const [pollVoteSubmitted, setPollVoteSubmitted] = useState<boolean>(false);
  const [pollVoteTallies, setPollVoteTallies] = useState<Record<string, number>>({ a: 0, b: 0, c: 0, d: 0 });
  const [pollFastestResponder, setPollFastestResponder] = useState<{ name: string; timeSec: number } | null>(null);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [showPollOverlay, setShowPollOverlay] = useState(true);

  // New poll form fields for teacher/presenter
  const [newPollQuestion, setNewPollQuestion] = useState('Identify the correct relation from the board equation:');
  const [newPollOptions, setNewPollOptions] = useState<Record<string, string>>({
    a: 'Option A: Direct proportional relation (v ∝ √T)',
    b: 'Option B: Inverse square relation (F ∝ 1/r²)',
    c: 'Option C: State of dynamic thermodynamic equilibrium',
    d: 'Option D: Dimensionless scalar invariant',
  });
  const [newPollCorrect, setNewPollCorrect] = useState<'a' | 'b' | 'c' | 'd'>('b');
  const [newPollDuration, setNewPollDuration] = useState<number>(30);

  // Listen for broadcast messages containing poll events
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (!latest?.message) return;

    try {
      if (latest.message.startsWith('[POLL_START]:')) {
        const payload: LivePollData = JSON.parse(latest.message.replace('[POLL_START]:', ''));
        setActivePoll(payload);
        const elapsed = Math.max(0, Math.floor((Date.now() - payload.startedAt) / 1000));
        setPollTimeRemaining(Math.max(0, payload.durationSec - elapsed));
        setSelectedPollOption(null);
        setPollVoteSubmitted(false);
        setPollVoteTallies({ a: 0, b: 0, c: 0, d: 0 });
        setPollFastestResponder(null);
        setShowPollOverlay(true);
      } else if (latest.message.startsWith('[POLL_VOTE]:')) {
        const vote: { pollId: string; option: string; peerName: string; timeSec: number } = JSON.parse(
          latest.message.replace('[POLL_VOTE]:', '')
        );
        if (activePoll && vote.pollId === activePoll.id) {
          setPollVoteTallies((prev) => ({
            ...prev,
            [vote.option]: (prev[vote.option] || 0) + 1,
          }));
          if (activePoll.correctOption === vote.option) {
            setPollFastestResponder((prev) => (!prev || vote.timeSec < prev.timeSec ? { name: vote.peerName, timeSec: vote.timeSec } : prev));
          }
        }
      }
    } catch {
      // not a JSON poll message, regular chat message
    }
  }, [messages, activePoll]);

  // Countdown timer for active poll
  useEffect(() => {
    if (!activePoll || pollTimeRemaining <= 0) return;
    const timer = setInterval(() => {
      setPollTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activePoll, pollTimeRemaining]);

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
    hmsActions.sendBroadcastMessage(isHandRaised ? 'Lowered hand' : 'Raised hand ✋');
  };

  const handleLaunchPoll = async () => {
    const pollId = `poll_${Date.now()}`;
    const pollData: LivePollData = {
      id: pollId,
      question: newPollQuestion.trim() || 'Select the correct option for the question on screen:',
      options: [
        { id: 'a', label: 'A', text: newPollOptions.a },
        { id: 'b', label: 'B', text: newPollOptions.b },
        { id: 'c', label: 'C', text: newPollOptions.c },
        { id: 'd', label: 'D', text: newPollOptions.d },
      ],
      correctOption: newPollCorrect,
      durationSec: newPollDuration,
      startedAt: Date.now(),
      creatorName: localPeer?.name || defaultName || 'Educator',
    };

    setActivePoll(pollData);
    setPollTimeRemaining(newPollDuration);
    setSelectedPollOption(null);
    setPollVoteSubmitted(false);
    setPollVoteTallies({ a: 0, b: 0, c: 0, d: 0 });
    setPollFastestResponder(null);
    setShowCreatePollModal(false);
    setShowPollOverlay(true);

    try {
      await hmsActions.sendBroadcastMessage(`[POLL_START]:${JSON.stringify(pollData)}`);
    } catch (err) {
      console.warn('Could not broadcast poll to 100ms peers:', err);
    }
  };

  const handleSubmitVote = async (opt: string) => {
    if (!activePoll || pollVoteSubmitted) return;
    setSelectedPollOption(opt);
    setPollVoteSubmitted(true);

    const timeSec = Math.max(1, activePoll.durationSec - pollTimeRemaining);
    const peerName = localPeer?.name || defaultName || 'Student';

    setPollVoteTallies((prev) => ({
      ...prev,
      [opt]: (prev[opt] || 0) + 1,
    }));

    if (activePoll.correctOption === opt) {
      setPollFastestResponder((prev) => (!prev || timeSec < prev.timeSec ? { name: peerName, timeSec } : prev));
    }

    try {
      await hmsActions.sendBroadcastMessage(
        `[POLL_VOTE]:${JSON.stringify({
          pollId: activePoll.id,
          option: opt,
          peerName,
          timeSec,
        })}`
      );
    } catch (err) {
      console.warn('Could not broadcast vote:', err);
    }
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

        {/* In-Class Live Poll Overlay Card (Physics Wallah Signature) */}
        {activePoll && showPollOverlay && (
          <div className="absolute top-20 right-6 z-30 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-5 space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider font-mono">
                  In-Class Live Poll
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  pollTimeRemaining <= 5 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-200'
                }`}>
                  <Clock size={12} />
                  <span>{pollTimeRemaining}s</span>
                </span>
                <button
                  onClick={() => setShowPollOverlay(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  title="Minimize poll"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <p className="text-xs font-bold text-slate-100 leading-relaxed">
              {activePoll.question}
            </p>

            {/* Voting Options (Before Poll End & Not Voted) */}
            {!pollVoteSubmitted && pollTimeRemaining > 0 ? (
              <div className="space-y-2">
                {activePoll.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSubmitVote(opt.id)}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-left text-xs font-semibold text-slate-200 transition-all flex items-center gap-2.5 group cursor-pointer"
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-700 group-hover:bg-indigo-500 group-hover:text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {opt.label}
                    </span>
                    <span className="leading-snug flex-1">{opt.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* Results Bar Graph Mode */
              <div className="space-y-2.5 pt-1">
                {pollVoteSubmitted && (
                  <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Your choice ({selectedPollOption?.toUpperCase()}) locked! Class Live Tally:</span>
                  </p>
                )}
                {activePoll.options.map((opt) => {
                  const totalVotes = Object.values(pollVoteTallies).reduce((a, b) => a + b, 0);
                  const votes = pollVoteTallies[opt.id] || 0;
                  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  const isCorrect = activePoll.correctOption === opt.id;
                  const isUserPick = selectedPollOption === opt.id;

                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={`flex items-center gap-1.5 ${isCorrect ? 'text-emerald-400' : isUserPick ? 'text-indigo-400' : 'text-slate-300'}`}>
                          <span>{opt.label}.</span>
                          <span className="truncate max-w-[180px]">{opt.text}</span>
                          {isCorrect && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{pct}% ({votes})</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCorrect ? 'bg-emerald-500' : isUserPick ? 'bg-indigo-500' : 'bg-slate-600'
                          }`}
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Fastest Correct Responder Highlight */}
                {pollFastestResponder && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Zap size={14} className="fill-amber-400 text-amber-400" />
                      <span>Fastest Correct:</span>
                      <span className="text-white font-black">{pollFastestResponder.name}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {pollFastestResponder.timeSec}s
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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

          {/* In-Class Live Poll (A/B/C/D) Launcher Button */}
          <button
            onClick={() => {
              if (activePoll) {
                setShowPollOverlay(!showPollOverlay);
              } else {
                setShowCreatePollModal(true);
              }
            }}
            className={`p-3 rounded-xl transition-all relative ${
              activePoll
                ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-lg shadow-amber-500/30'
                : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
            }`}
            title={activePoll ? 'Toggle Active In-Class Poll' : 'Launch In-Class Live Poll (PW Style)'}
          >
            <BarChart2 className="w-5 h-5" />
            {activePoll && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-1 -right-1 ring-2 ring-slate-950 animate-ping" />
            )}
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

      {/* Create In-Class Live Poll Modal (Educator / Host) */}
      {showCreatePollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Launch In-Class Live Poll (A/B/C/D)
                </h3>
              </div>
              <button
                onClick={() => setShowCreatePollModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Question / Prompt Text
                </label>
                <input
                  type="text"
                  value={newPollQuestion}
                  onChange={(e) => setNewPollQuestion(e.target.value)}
                  placeholder="e.g. Choose the correct formula for velocity of sound in gas:"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 4 Choices */}
              {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-lg text-xs font-mono font-black flex items-center justify-center shrink-0 ${
                    newPollCorrect === opt ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {opt.toUpperCase()}
                  </span>
                  <input
                    type="text"
                    value={newPollOptions[opt]}
                    onChange={(e) => setNewPollOptions({ ...newPollOptions, [opt]: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPollCorrect(opt)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                      newPollCorrect === opt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Set as correct answer"
                  >
                    {newPollCorrect === opt ? '✓ Correct' : 'Mark Correct'}
                  </button>
                </div>
              ))}

              {/* Timer Duration */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-400">Countdown Duration:</span>
                <div className="flex items-center gap-1.5">
                  {[30, 45, 60].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setNewPollDuration(dur)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                        newPollDuration === dur ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCreatePollModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchPoll}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BarChart2 size={14} />
                <span>Launch Live Poll</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
