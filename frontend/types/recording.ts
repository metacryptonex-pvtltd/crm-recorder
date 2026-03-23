export interface CallRecording {
  id: string;
  phoneNumber: string;
  timestamp: number;
  duration: number;
  filePath: string;
  callType: 'incoming' | 'outgoing';
  dateFormatted: string;
  timeFormatted: string;
}

export interface RecordingState {
  isRecording: boolean;
  currentCallNumber?: string;
  startTime?: number;
}
