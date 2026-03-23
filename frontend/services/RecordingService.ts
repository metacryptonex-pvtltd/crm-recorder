import { AudioRecorder, AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CallRecording } from '../types/recording';

const RECORDINGS_KEY = 'call_recordings';
const RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings/`;

export class RecordingService {
  private recorder: AudioRecorder | null = null;
  private isRecording = false;

  async initialize() {
    try {
      // Create recordings directory if it doesn't exist using new API
      try {
        const dirInfo = await FileSystem.File.getInfoAsync(RECORDINGS_DIR);
        if (!dirInfo.exists) {
          await FileSystem.Directory.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
        }
      } catch (e) {
        // Fallback to legacy API
        const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
        }
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  }

  async startRecording(phoneNumber: string, callType: 'incoming' | 'outgoing'): Promise<boolean> {
    try {
      if (this.isRecording) {
        console.log('Already recording');
        return false;
      }

      // Create new recorder
      this.recorder = new AudioRecorder();
      
      // Prepare recording
      await this.recorder.prepareAsync({
        android: {
          extension: '.m4a',
          audioEncoder: 'aac',
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: 'high',
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      // Start recording
      await this.recorder.startAsync();
      this.isRecording = true;

      // Store recording metadata
      await AsyncStorage.setItem('current_recording', JSON.stringify({
        phoneNumber,
        callType,
        startTime: Date.now(),
      }));

      console.log('Recording started for:', phoneNumber);
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.recorder = null;
      return false;
    }
  }

  async stopRecording(): Promise<CallRecording | null> {
    try {
      if (!this.recorder || !this.isRecording) {
        console.log('No active recording to stop');
        return null;
      }

      // Stop the recording
      const uri = await this.recorder.stopAsync();
      
      if (!uri) {
        console.log('No recording URI found');
        return null;
      }

      // Get metadata
      const metadataStr = await AsyncStorage.getItem('current_recording');
      if (!metadataStr) {
        console.log('No recording metadata found');
        return null;
      }

      const metadata = JSON.parse(metadataStr);
      const endTime = Date.now();
      const duration = Math.floor((endTime - metadata.startTime) / 1000); // in seconds

      // Generate filename
      const timestamp = new Date().getTime();
      const filename = `call_${metadata.phoneNumber}_${timestamp}.m4a`;
      const newPath = `${RECORDINGS_DIR}${filename}`;

      // Move file to recordings directory
      try {
        await FileSystem.File.moveAsync(uri, newPath);
      } catch (e) {
        // Fallback to legacy API
        await FileSystem.moveAsync({
          from: uri,
          to: newPath,
        });
      }

      // Create recording object
      const date = new Date(metadata.startTime);
      const callRecording: CallRecording = {
        id: timestamp.toString(),
        phoneNumber: metadata.phoneNumber,
        timestamp: metadata.startTime,
        duration,
        filePath: newPath,
        callType: metadata.callType,
        dateFormatted: date.toLocaleDateString(),
        timeFormatted: date.toLocaleTimeString(),
      };

      // Save to storage
      await this.saveRecording(callRecording);

      // Clear current recording metadata
      await AsyncStorage.removeItem('current_recording');

      this.recorder = null;
      this.isRecording = false;

      console.log('Recording saved:', callRecording);
      return callRecording;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recorder = null;
      this.isRecording = false;
      return null;
    }
  }

  private async saveRecording(recording: CallRecording) {
    try {
      const recordingsStr = await AsyncStorage.getItem(RECORDINGS_KEY);
      const recordings: CallRecording[] = recordingsStr ? JSON.parse(recordingsStr) : [];
      recordings.unshift(recording); // Add to beginning
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
    } catch (error) {
      console.error('Failed to save recording metadata:', error);
    }
  }

  async getAllRecordings(): Promise<CallRecording[]> {
    try {
      const recordingsStr = await AsyncStorage.getItem(RECORDINGS_KEY);
      return recordingsStr ? JSON.parse(recordingsStr) : [];
    } catch (error) {
      console.error('Failed to get recordings:', error);
      return [];
    }
  }

  async deleteRecording(id: string): Promise<boolean> {
    try {
      const recordings = await this.getAllRecordings();
      const recording = recordings.find(r => r.id === id);
      
      if (!recording) {
        return false;
      }

      // Delete file
      try {
        await FileSystem.File.deleteAsync(recording.filePath);
      } catch (e) {
        // Fallback to legacy API
        await FileSystem.deleteAsync(recording.filePath, { idempotent: true });
      }

      // Remove from metadata
      const updatedRecordings = recordings.filter(r => r.id !== id);
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updatedRecordings));

      return true;
    } catch (error) {
      console.error('Failed to delete recording:', error);
      return false;
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const recordingService = new RecordingService();
