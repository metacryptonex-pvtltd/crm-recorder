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
} from 'react-native';
import { AudioPlayer } from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { callMonitoringService } from '../services/CallMonitoringService';
import { CallRecording } from '../types/recording';

// Conditionally import CallDetectorManager only on native platforms
let CallDetectorManager: any = null;
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    CallDetectorManager = require('react-native-call-detection').default;
  } catch (e) {
    console.log('Call detection not available');
  }
}

export default function HomeScreen() {
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isRecordingNow, setIsRecordingNow] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<AudioPlayer | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [callDetector, setCallDetector] = useState<any>(null);
  const [currentCallNumber, setCurrentCallNumber] = useState<string>('');

  useEffect(() => {
    initializeApp();

    return () => {
      if (sound) {
        sound.remove();
      }
      if (callDetector) {
        callDetector.dispose();
      }
    };
  }, []);

  const initializeApp = async () => {
    const permsGranted = await requestPermissions();
    if (permsGranted) {
      await callMonitoringService.initialize();
      await loadRecordings();
      
      // Check if monitoring was previously enabled
      const wasMonitoring = callMonitoringService.getIsMonitoring();
      if (wasMonitoring) {
        setIsMonitoring(true);
        setupCallDetection();
      }
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
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
          return true;
        } else {
          Alert.alert(
            'Permissions Required',
            'CRM-RECORDER needs microphone, phone state, and call log permissions to automatically record calls.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } else {
        setHasPermissions(true);
        return true;
      }
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  };

  const setupCallDetection = () => {
    if (Platform.OS !== 'android') {
      if (Platform.OS === 'web') {
        // For web preview, show info message
        Alert.alert(
          'Preview Mode',
          'Automatic call detection works on real Android devices. This is a web preview.',
          [{ text: 'OK' }]
        );
        return;
      }
      Alert.alert('Not Supported', 'Automatic call detection is only available on Android');
      return;
    }

    if (!CallDetectorManager) {
      Alert.alert('Error', 'Call detection module not available');
      return;
    }

    try {
      const detector = new CallDetectorManager(
        (event, phoneNumber) => {
          console.log('Call event:', event, phoneNumber);
          
          if (event === 'Disconnected') {
            // Call ended
            console.log('Call ended');
            setIsRecordingNow(false);
            setCurrentCallNumber('');
            callMonitoringService.onCallEnded();
            loadRecordings(); // Refresh list
          } else if (event === 'Incoming' || event === 'Offhook') {
            // Call started (Offhook = answered)
            if (event === 'Offhook' && !callMonitoringService.getIsRecording()) {
              const number = phoneNumber || 'Unknown';
              console.log('Call started:', number);
              setIsRecordingNow(true);
              setCurrentCallNumber(number);
              
              const callType = currentCallNumber ? 'incoming' : 'outgoing';
              callMonitoringService.onCallStarted(number, callType);
            }
          }
        },
        false, // readPhoneNumber - we'll get it from call log if possible
        () => {
          console.log('Call detector initialized');
        },
        (error) => {
          console.error('Call detector error:', error);
        }
      );

      setCallDetector(detector);
    } catch (error) {
      console.error('Failed to setup call detection:', error);
      Alert.alert('Error', 'Failed to setup automatic call detection');
    }
  };

  const loadRecordings = async () => {
    try {
      const allRecordings = await callMonitoringService.getAllRecordings();
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

  const handleToggleMonitoring = async () => {
    if (!hasPermissions) {
      await requestPermissions();
      return;
    }

    if (isMonitoring) {
      // Stop monitoring
      await callMonitoringService.stopMonitoring();
      if (callDetector) {
        callDetector.dispose();
        setCallDetector(null);
      }
      setIsMonitoring(false);
      setIsRecordingNow(false);
      Alert.alert('Monitoring Stopped', 'Call recording is now disabled');
    } else {
      // Start monitoring
      await callMonitoringService.startMonitoring();
      setupCallDetection();
      setIsMonitoring(true);
      Alert.alert(
        'Monitoring Started',
        'CRM-RECORDER will now automatically record all incoming and outgoing calls.\n\n💡 Tip: Use speakerphone for best recording quality.',
        [{ text: 'Got it' }]
      );
    }
  };

  const playRecording = async (recording: CallRecording) => {
    try {
      if (sound) {
        await sound.remove();
        setSound(null);
      }

      if (playingId === recording.id) {
        setPlayingId(null);
        return;
      }

      const player = new AudioPlayer({ uri: recording.filePath });
      await player.play();

      setSound(player);
      setPlayingId(recording.id);

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
            const success = await callMonitoringService.deleteRecording(recording.id);
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
        <Text style={styles.headerSubtitle}>Automatic Call Monitoring</Text>
      </View>

      {/* Monitoring Controls */}
      <View style={styles.controls}>
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isMonitoring ? '#10b981' : '#ef4444' }]} />
            <Text style={styles.statusText}>
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
            </Text>
          </View>
          {isRecordingNow && (
            <View style={styles.recordingIndicator}>
              <MaterialIcons name="fiber-manual-record" size={16} color="#ef4444" />
              <Text style={styles.recordingText}>Recording: {currentCallNumber}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            isMonitoring ? styles.stopButton : styles.startButton
          ]}
          onPress={handleToggleMonitoring}
        >
          <MaterialIcons
            name={isMonitoring ? 'stop' : 'play-arrow'}
            size={28}
            color="#fff"
          />
          <Text style={styles.toggleButtonText}>
            {isMonitoring ? 'Stop Auto-Recording' : 'Start Auto-Recording'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          {isMonitoring 
            ? '✅ All calls will be recorded automatically' 
            : 'Tap Start to enable automatic call recording'}
        </Text>
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
              Enable auto-recording to start monitoring calls
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
  statusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recordingText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
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
});
