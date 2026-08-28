'use client';

import React, { useEffect, useState } from 'react';
import { Brain, Target, TrendingUp, TrendingDown, Zap, AlertTriangle, BookOpen, Sparkles } from 'lucide-react';

interface WeakTopic {
  topic: string;
  subject: string;
  confidence: number;
  lastTested?: string;
}

interface AgentUsage {
  [agentId: string]: number;
}

interface LearningProfile {
  weakTopics: WeakTopic[];
  strongTopics: Array<{ topic: string; subject: string; mastery?: number }>;
  misconceptions: Array<{ concept: string; correction: string; occurrences?: number }>;
  preferences: Record<string, unknown>;
  recentInteractions: number;
  totalInteractions: number;
}

interface NeuralWidgetProps {
  courseId?: string;
}

const AGENT_META: Record<string, { name: string; emoji: string }> = {
  science_tutor: { name: 'Dr. Neuro', emoji: '🔬' },
  math_solver: { name: 'Prof. Sigma', emoji: '📐' },
  writing_evaluator: { name: 'Ms. Lexis', emoji: '✍️' },
  speaking_coach: { name: 'Coach Aria', emoji: '🎤' },
  progress_analyzer: { name: 'Sentinel', emoji: '📊' },
  prompt_engineer: { name: 'Codex', emoji: '🤖' },
  marketing_mentor: { name: 'Maven', emoji: '💼' },
  content_recommender: { name: 'Navigator', emoji: '🧭' },
};

export default function NeuralDashboardWidget({ courseId }: NeuralWidgetProps) {
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [agentUsage, setAgentUsage] = useState<AgentUsage>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const params = courseId ? `?courseId=${courseId}` : '';
        const res = await fetch(`/api/ai/neural/profile${params}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile || null);
          setAgentUsage(data.agentUsage || {});
        }
      } catch {
        // Non-critical widget
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [courseId]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!profile || profile.totalInteractions === 0) {
    return (
      <div className="bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-violet-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={20} className="text-violet-500" />
          <h3 className="text-sm font-bold text-foreground">🧠 Your AI Learning Brain</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Start asking questions in the <span className="font-bold text-primary">AI Tutor</span> to activate your Neural Learning Profile.
          Our 8 specialized AI agents will build a personalized map of your strengths, weaknesses, and optimal study path.
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {Object.entries(AGENT_META).slice(0, 4).map(([id, meta]) => (
            <span key={id} className="text-[10px] px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold">
              {meta.emoji} {meta.name}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground font-semibold">+4 more</span>
        </div>
      </div>
    );
  }

  const topAgents = Object.entries(agentUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-violet-500/20 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Brain size={18} className="text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">🧠 Your AI Learning Brain</h3>
            <p className="text-[10px] text-muted-foreground">{profile.totalInteractions} total interactions · {profile.recentInteractions} this week</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-600 dark:text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Active
        </span>
      </div>

      {/* Weak Topics */}
      {profile.weakTopics.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Target size={13} className="text-red-500" />
            <span className="text-xs font-bold text-foreground">Focus Areas</span>
          </div>
          <div className="space-y-2">
            {profile.weakTopics.slice(0, 5).map((wt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-semibold text-foreground">{wt.topic}</span>
                    <span className="text-[10px] text-muted-foreground">{wt.subject}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(wt.confidence || 0.3) * 100}%`,
                        background: wt.confidence < 0.4 ? '#ef4444' : wt.confidence < 0.7 ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong Topics */}
      {profile.strongTopics.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={13} className="text-green-500" />
            <span className="text-xs font-bold text-foreground">Strong Areas</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.strongTopics.slice(0, 6).map((st, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-semibold">
                ✓ {st.topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Misconceptions */}
      {profile.misconceptions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={13} className="text-amber-500" />
            <span className="text-xs font-bold text-foreground">Common Mistakes</span>
          </div>
          <div className="space-y-1.5">
            {profile.misconceptions.slice(0, 3).map((mc, i) => (
              <div key={i} className="text-[11px] bg-amber-500/5 border border-amber-500/15 rounded-lg p-2">
                <span className="text-red-500 line-through">{mc.concept}</span>
                <span className="text-muted-foreground mx-1">→</span>
                <span className="text-green-600 dark:text-green-400 font-medium">{mc.correction}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Usage */}
      {topAgents.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={13} className="text-violet-500" />
            <span className="text-xs font-bold text-foreground">Your AI Team</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {topAgents.map(([agentId, count]) => {
              const meta = AGENT_META[agentId] || { name: agentId, emoji: '🤖' };
              return (
                <div key={agentId} className="flex items-center gap-2 bg-card/50 border border-border rounded-xl p-2">
                  <span className="text-sm">{meta.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-foreground truncate">{meta.name}</p>
                    <p className="text-[9px] text-muted-foreground">{count} interactions</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
