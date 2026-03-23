import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
  StatusBar,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { AudioPlayer } from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { recordingService } from '../services/RecordingService';
import { CallRecording } from '../types/recording';

export default function HomeScreen() {
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<AudioPlayer | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualPhoneNumber, setManualPhoneNumber] = useState('');

  useEffect(() => {
    initializeApp();

    return () => {
      if (sound) {
        sound.remove();
      }
    };
  }, []);

  const initializeApp = async () => {
    await requestPermissions();
    await recordingService.initialize();
    await loadRecordings();
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
          PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (allGranted) {
          setHasPermissions(true);
          Alert.alert(
            'Permissions Granted',
            'CRM-RECORDER is ready to record calls for business monitoring.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Permissions Required',
            'This app requires audio recording and phone state permissions to function properly for CRM call monitoring.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // iOS - permissions requested when needed
        setHasPermissions(true);
      }
    } catch (err) {
      console.error('Permission error:', err);
    }
  };

  const loadRecordings = async () => {
    try {
      const allRecordings = await recordingService.getAllRecordings();
      setRecordings(allRecordings);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecordings();
    setRefreshing(false);
  }, []);

  const handleStartRecording = async () => {
    if (!hasPermissions) {
      await requestPermissions();
      return;
    }

    setShowManualDialog(true);
  };

  const startManualRecording = async () => {
    if (!manualPhoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }

    const success = await recordingService.startRecording(manualPhoneNumber, 'outgoing');
    if (success) {
      setIsRecording(true);
      setShowManualDialog(false);
      setManualPhoneNumber('');
      Alert.alert('Recording Started', 'Call recording is now active');
    } else {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    const recording = await recordingService.stopRecording();
    if (recording) {
      setIsRecording(false);
      await loadRecordings();
      Alert.alert('Recording Saved', `Call with ${recording.phoneNumber} has been recorded`);
    }
  };

  const playRecording = async (recording: CallRecording) => {
    try {
      // Stop current playback if any
      if (sound) {
        await sound.remove();
        setSound(null);
      }

      // If clicking the same recording, just stop
      if (playingId === recording.id) {
        setPlayingId(null);
        return;
      }

      // Load and play new recording
      const player = new AudioPlayer({ uri: recording.filePath });
      await player.play();

      setSound(player);
      setPlayingId(recording.id);

      // When playback finishes (we'll use a timeout based on duration)
      setTimeout(() => {
        setPlayingId(null);
      }, recording.duration * 1000);
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const deleteRecording = async (recording: CallRecording) => {
    Alert.alert(
      'Delete Recording',
      `Delete call with ${recording.phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await recordingService.deleteRecording(recording.id);
            if (success) {
              await loadRecordings();
            }
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderRecordingItem = ({ item }: { item: CallRecording }) => {
    const isPlaying = playingId === item.id;

    return (
      <View style={styles.recordingCard}>
        <View style={styles.recordingHeader}>
          <MaterialIcons
            name={item.callType === 'incoming' ? 'call-received' : 'call-made'}
            size={24}
            color={item.callType === 'incoming' ? '#10b981' : '#3b82f6'}
          />
          <View style={styles.recordingInfo}>
            <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
            <Text style={styles.dateTime}>
              {item.dateFormatted} • {item.timeFormatted}
            </Text>
            <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
          </View>
        </View>

        <View style={styles.recordingActions}>
          <TouchableOpacity
            style={[styles.actionButton, isPlaying && styles.actionButtonActive]}
            onPress={() => playRecording(item)}
          >
            <MaterialIcons
              name={isPlaying ? 'stop' : 'play-arrow'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteRecording(item)}
          >
            <MaterialIcons name="delete" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="phone-in-talk" size={32} color="#fff" />
          <Text style={styles.headerTitle}>CRM-RECORDER</Text>
        </View>
        <Text style={styles.headerSubtitle}>Call Monitoring System</Text>
      </View>

      {/* Recording Controls */}
      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleStartRecording}
          >
            <MaterialIcons name="fiber-manual-record" size={32} color="#fff" />
            <Text style={styles.recordButtonText}>Start Recording</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.recordButton, styles.stopButton]}
            onPress={handleStopRecording}
          >
            <MaterialIcons name="stop" size={32} color="#fff" />
            <Text style={styles.recordButtonText}>Stop Recording</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recordings List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          Recorded Calls ({recordings.length})
        </Text>
        
        {recordings.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="phone-disabled" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubtext}>
              Start recording calls to monitor CRM activities
            </Text>
          </View>
        ) : (
          <FlatList
            data={recordings}
            renderItem={renderRecordingItem}
            keyExtractor={item => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Manual Recording Dialog */}
      <Modal
        visible={showManualDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowManualDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Manual Recording</Text>
            <Text style={styles.modalSubtitle}>
              Enter the phone number for this call
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={manualPhoneNumber}
              onChangeText={setManualPhoneNumber}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowManualDialog(false);
                  setManualPhoneNumber('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.startButton]}
                onPress={startManualRecording}
              >
                <Text style={styles.modalButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#1e40af',
    padding: 20,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    marginTop: 4,
  },
  controls: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  recordButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
    color: '#1f2937',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  recordingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  recordingInfo: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  duration: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonActive: {
    backgroundColor: '#dc2626',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  startButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});
