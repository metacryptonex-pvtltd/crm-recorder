import { AudioRecorder } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CallRecording } from '../types/recording';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const RECORDINGS_KEY = 'call_recordings';
const MONITORING_KEY = 'call_monitoring_enabled';
const RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings/`;

class CallMonitoringService {
  private recorder: AudioRecorder | null = null;
  private isRecording = false;
  private isMonitoring = false;
  private currentCallInfo: { phoneNumber: string; callType: 'incoming' | 'outgoing'; startTime: number } | null = null;

  async initialize() {
    try {
      // Create recordings directory if it doesn't exist
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

      // Load monitoring state
      const monitoringState = await AsyncStorage.getItem(MONITORING_KEY);
      if (monitoringState === 'true') {
        this.isMonitoring = true;
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  }

  async startMonitoring(): Promise<boolean> {
    try {
      this.isMonitoring = true;
      await AsyncStorage.setItem(MONITORING_KEY, 'true');
      console.log('Call monitoring started');
      return true;
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      return false;
    }
  }

  async stopMonitoring(): Promise<boolean> {
    try {
      this.isMonitoring = false;
      await AsyncStorage.setItem(MONITORING_KEY, 'false');
      
      // Stop any active recording
      if (this.isRecording) {
        await this.stopRecording();
      }
      
      console.log('Call monitoring stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
      return false;
    }
  }

  async onCallStarted(phoneNumber: string, callType: 'incoming' | 'outgoing') {
    if (!this.isMonitoring) {
      console.log('Monitoring disabled, not recording');
      return;
    }

    if (this.isRecording) {
      console.log('Already recording a call');
      return;
    }

    try {
      this.currentCallInfo = {
        phoneNumber,
        callType,
        startTime: Date.now(),
      };

      // Start recording
      this.recorder = new AudioRecorder();
      
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

      await this.recorder.startAsync();
      this.isRecording = true;

      console.log('Auto-recording started for:', phoneNumber, callType);
    } catch (error) {
      console.error('Failed to start auto-recording:', error);
      this.recorder = null;
      this.isRecording = false;
    }
  }

  async onCallEnded() {
    if (!this.isRecording) {
      return;
    }

    await this.stopRecording();
  }

  private async stopRecording(): Promise<CallRecording | null> {
    try {
      if (!this.recorder || !this.isRecording || !this.currentCallInfo) {
        console.log('No active recording to stop');
        return null;
      }

      // Stop the recording
      const uri = await this.recorder.stopAsync();
      
      if (!uri) {
        console.log('No recording URI found');
        return null;
      }

      const endTime = Date.now();
      const duration = Math.floor((endTime - this.currentCallInfo.startTime) / 1000);

      // Generate filename
      const timestamp = new Date().getTime();
      const filename = `call_${this.currentCallInfo.phoneNumber}_${timestamp}.m4a`;
      const newPath = `${RECORDINGS_DIR}${filename}`;

      // Move file to recordings directory
      try {
        await FileSystem.File.moveAsync(uri, newPath);
      } catch (e) {
        await FileSystem.moveAsync({
          from: uri,
          to: newPath,
        });
      }

      // Create recording object
      const date = new Date(this.currentCallInfo.startTime);
      const callRecording: CallRecording = {
        id: timestamp.toString(),
        phoneNumber: this.currentCallInfo.phoneNumber,
        timestamp: this.currentCallInfo.startTime,
        duration,
        filePath: newPath,
        callType: this.currentCallInfo.callType,
        dateFormatted: date.toLocaleDateString(),
        timeFormatted: date.toLocaleTimeString(),
      };

      // Save to storage
      await this.saveRecording(callRecording);

      console.log('Auto-recording saved:', callRecording);

      // Clear state
      this.recorder = null;
      this.isRecording = false;
      this.currentCallInfo = null;

      return callRecording;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recorder = null;
      this.isRecording = false;
      this.currentCallInfo = null;
      return null;
    }
  }

  private async saveRecording(recording: CallRecording) {
    try {
      const recordingsStr = await AsyncStorage.getItem(RECORDINGS_KEY);
      const recordings: CallRecording[] = recordingsStr ? JSON.parse(recordingsStr) : [];
      recordings.unshift(recording);
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

  getIsMonitoring(): boolean {
    return this.isMonitoring;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const callMonitoringService = new CallMonitoringService();
