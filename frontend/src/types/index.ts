
export const processingSteps = ['uploading', 'transcribing', 'preparing', 'completed'];

export type ProcessingStep = typeof processingSteps[number] | "error";

export interface Email {
  subject: string;
  body: string;
}

export interface AudioSubmission {
  id: string;
  contentType: string;
  status?: ProcessingStep;
  recording?: Blob;
  createdAt?: Date;
  transcript?: string;
  name?: string;
  postcode?: string;
  mpName?: string;
  mpEmailAddress?: string;
  greenpaper?: Email;
  mp?: Email;
}

export interface AudioRecorderProps {
  onRecordingComplete: (recording: Blob) => void;
}

export interface EmotionalAnalysisResult {
  emotion: 'anxious' | 'hopeful' | 'angry' | 'concerned' | 'mixed' | 'neutral';
  confidence: number;
  summary: string;
}