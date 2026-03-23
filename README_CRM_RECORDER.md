# CRM-RECORDER - Call Monitoring System

## Overview
CRM-RECORDER is a mobile application designed for CRM call monitoring on company-provided Android devices. It allows supervisors to track whether staff are contacting assigned leads by recording phone calls.

## Features

### ✅ Implemented Features
1. **Manual Call Recording**
   - Start/stop recording manually
   - Enter phone number for each recording
   - Records in M4A format (high quality)

2. **Recordings Management**
   - List all recorded calls
   - Shows phone number, date, time, and duration
   - Call type indicator (incoming/outgoing)
   - Play recordings with simple controls
   - Delete recordings

3. **Storage**
   - Recordings stored in app's internal storage
   - Metadata saved locally (AsyncStorage)
   - Persistent across app restarts

4. **Permissions**
   - RECORD_AUDIO
   - READ_PHONE_STATE
   - READ_CALL_LOG
   - Requests permissions on first launch

## Android 10+ Limitations

### Important Technical Constraints

**Call Audio Recording on Modern Android:**

Starting from Android 10 (API 29), Google heavily restricted call recording capabilities:

1. **VOICE_CALL Audio Source Blocked**
   - The `VOICE_CALL` audio source (which records both sides of a call) requires system-level permissions
   - Standard apps cannot access it without manufacturer cooperation or root access

2. **Current Implementation**
   - This app uses the **MICROPHONE** audio source
   - Records from the device's microphone during calls
   - **Best used with speakerphone ON** for clearest recording of both parties

3. **Workarounds for Better Quality**
   - Keep phone on speakerphone during calls
   - Ensure quiet environment
   - Keep device close to both parties
   - Consider using company devices that support call recording (some manufacturers like Samsung, Xiaomi have built-in support)

### Automatic Call Detection

**Current Status: Manual Recording**

The current version requires manual start/stop of recordings because:

1. **PhoneStateListener Restrictions**
   - Android 10+ requires foreground service with specific permissions
   - Need to implement a persistent background service
   - Battery optimization may kill background services

2. **Future Enhancement Path**
   - Implement InCallService for automatic detection
   - This requires deeper system integration
   - May need to eject from Expo managed workflow to bare workflow
   - Would require custom native modules

## Usage Instructions

### For Company Supervisors

1. **Initial Setup**
   - Install app on company-provided devices
   - Grant all requested permissions
   - Ensure staff understand monitoring policy

2. **Recording a Call**
   - Before/during a call, tap "Start Recording"
   - Enter the lead's phone number
   - **Turn on speakerphone for best quality**
   - Tap "Stop Recording" when call ends

3. **Reviewing Recordings**
   - All recordings appear in the main list
   - Tap play button to listen
   - Check date/time to verify call attempts
   - Tap delete to remove recordings

### For Development/IT Team

**Building APK:**
```bash
# Navigate to frontend directory
cd /app/frontend

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform android
```

**Required Permissions in AndroidManifest:**
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.READ_CALL_LOG" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
```

## Known Issues & Recommendations

### Audio Quality
- **Issue**: Recording quality depends on microphone pickup
- **Solution**: Use speakerphone mode during calls

### Battery Usage
- **Issue**: Recording uses battery
- **Solution**: Keep devices charged, recording only active during calls

### Storage
- **Issue**: Recordings accumulate over time
- **Solution**: Regularly review and delete old recordings

### Device Compatibility
- **Best**: Samsung devices with built-in call recording support
- **Good**: Stock Android 10-13 devices
- **Limited**: Some budget devices with restricted audio access

## Future Enhancements

### Phase 2 (Automatic Recording)
1. Implement InCallService for automatic call detection
2. Background service for continuous monitoring
3. Automatic recording on call connect
4. Cloud backup integration

### Phase 3 (Advanced Features)
1. CRM integration API
2. Lead matching with phone numbers
3. Call analytics and reporting
4. Export recordings to cloud storage
5. Multi-user management dashboard

## Technical Stack

- **Frontend**: React Native (Expo)
- **Audio**: expo-audio
- **Storage**: AsyncStorage + FileSystem
- **UI**: React Native components with Material Icons

## Legal Compliance

⚠️ **Important**: Ensure compliance with local laws regarding call recording:
- Some jurisdictions require two-party consent
- Company policies must be clear
- Staff should be informed of monitoring
- Check your region's call recording laws before deployment

## Support

For technical issues or questions:
1. Check device compatibility (Android 10+ with microphone access)
2. Verify all permissions are granted
3. Test with speakerphone ON
4. Review logs for errors

---

**App Version**: 1.0.0  
**Last Updated**: March 2026  
**Compatible**: Android 10+
