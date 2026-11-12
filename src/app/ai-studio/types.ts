/**
 * SAMYAK AI Learning Studio & Notebook Workspace — Type Definitions
 * Grounded RAG, Triple-Visual-Distinction Stream & Audio Deep-Dive Studio
 */

export type SourceType = 'pdf' | 'web' | 'youtube' | 'ocr_notes';

export interface GroundingSource {
  id: string;
  title: string;
  type: SourceType;
  authorOrOrigin: string;
  tokenCount: number;
  pageCount?: number;
  durationMin?: number;
  active: boolean;
  indexedAt: string;
  reliabilityScore: number; // e.g. 98.2%
  fileSizeMb?: number;
}

export interface SourceFactBlock {
  type: 'source_fact';
  text: string;
  sourceId: string;
  sourceTitle: string;
  pageNumber: number;
  verbatimExcerpt: string;
  semanticSimilarityScore: number; // 0 - 100%
  pdfUrl?: string;
}

export interface ModelHeuristicBlock {
  type: 'model_heuristic';
  title: string;
  text: string;
  eliminationTactic: string;
  timeSavingsSec: number; // e.g. 30 seconds
  examPillar: 'Physics' | 'Chemistry' | 'Botany' | 'Zoology' | 'Mathematics';
}

export interface EvidenceWarningBlock {
  type: 'evidence_warning';
  message: string;
  missingTopic: string;
  suggestedSource: string;
}

export type MessageContentBlock = SourceFactBlock | ModelHeuristicBlock | EvidenceWarningBlock;

export interface WorkstationMessage {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  userQuery?: string;
  blocks: MessageContentBlock[];
}

export interface PodcastTranscriptLine {
  id: string;
  speaker: string;
  speakerRole: string; // e.g. 'CEE Chemistry Lead' | 'Medical Examiner'
  avatarColor: string;
  timeSec: number;
  text: string;
}

export interface AudioPodcastEpisode {
  id: string;
  title: string;
  topic: string;
  durationSec: number;
  speakers: {
    speakerA: { name: string; title: string };
    speakerB: { name: string; title: string };
  };
  transcript: PodcastTranscriptLine[];
}
