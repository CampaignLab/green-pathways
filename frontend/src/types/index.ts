
export const processingSteps = ['uploading', 'transcribing', 'preparing', 'completed'];

export type ProcessingStep = typeof processingSteps[number] | "error";

export interface AudioSubmission {
  id: string;
  contentType: string;
  status?: ProcessingStep;
  recording?: Blob;
  transcript?: string;
  greenpaper?: string;
  email?: string;
  createdAt?: Date;
  name?: string;
  postcode?: string;
  mpEmailAddress?: string;
}

export interface AudioRecorderProps {
  onRecordingComplete: (recording: Blob) => void;
}

export interface EmotionalAnalysisResult {
  emotion: 'anxious' | 'hopeful' | 'angry' | 'concerned' | 'mixed' | 'neutral';
  confidence: number;
  summary: string;
}