# CRM-RECORDER - Automatic Call Monitoring System

## 🎯 Overview
CRM-RECORDER is an automatic call recording app for Android devices. Once enabled, it automatically records ALL incoming and outgoing calls without any manual intervention - perfect for monitoring CRM staff performance on company-provided devices.

## ✨ Key Features

### ✅ **Automatic Call Recording**
- **One-tap enable/disable**: Just tap "Start Auto-Recording" once
- **Completely automatic**: Records all calls without asking for phone numbers
- **Background monitoring**: Works even when app is in background
- **Smart detection**: Automatically detects incoming and outgoing calls
- **Auto phone number capture**: Extracts phone numbers from calls automatically

### 📱 **Modern Interface**
- Clear monitoring status indicator (Active/Inactive)
- Real-time recording indicator during active calls
- Professional blue-themed UI
- Simple ON/OFF toggle button

### 📂 **Recordings Management**
- Automatic list of all recorded calls
- Shows phone number, date, time, and duration
- Call type indicator (incoming ↓ / outgoing ↑)
- Tap to play any recording
- Easy delete functionality
- Pull to refresh

## 🚀 How It Works

### For Company Supervisors

**1. First-Time Setup (Do Once)**
- Install app on company device
- Open app and grant permissions:
  - ✅ Microphone (RECORD_AUDIO)
  - ✅ Phone State (READ_PHONE_STATE)
  - ✅ Call Log (READ_CALL_LOG)
- Tap "Start Auto-Recording"
- Done! App will now work automatically

**2. Automatic Recording**
- When any call starts (incoming or outgoing):
  - App automatically starts recording
  - Shows "Recording: [phone number]" indicator
  - Records entire conversation
- When call ends:
  - Automatically stops recording
  - Saves with phone number, date, time
  - Adds to recordings list

**3. Reviewing Calls**
- Open app to see list of all recordings
- Each entry shows:
  - 📞 Phone number
  - 📅 Date and time
  - ⏱️ Call duration  
  - ↓/↑ Incoming/Outgoing indicator
- Tap ▶ Play button to listen
- Tap 🗑️ Delete to remove

## 📋 Usage Guide

### Daily Operation

```
┌─────────────────────────┐
│  Open App (First Time)  │
│  Grant Permissions      │
│  Tap "Start Recording"  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Monitoring Active ✅   │
│  (Leave it running)     │
└───────────┬─────────────┘
            │
            ▼
     Staff Makes Call
            │
            ▼
┌─────────────────────────┐
│  Auto Starts Recording  │
│  "Recording: +1234..."  │
└───────────┬─────────────┘
            │
            ▼
      Call Ends
            │
            ▼
┌─────────────────────────┐
│  Auto Saves Recording   │
│  Appears in List        │
└─────────────────────────┘
```

### No Manual Steps Needed!
- ❌ No need to click "Start" before each call
- ❌ No need to enter phone numbers
- ❌ No need to click "Stop" after calls
- ✅ Everything happens automatically!

## ⚠️ Important: Android 10+ Audio Quality

### Recording Limitation
Due to Android 10+ security restrictions:
- App records from **MICROPHONE** (not direct call audio)
- Both parties can be heard, but quality depends on setup

### **For Best Quality** (IMPORTANT!)
1. **Use Speakerphone Mode**  
   - Turn on speaker during calls
   - This ensures both sides are clearly recorded
   
2. **Quiet Environment**
   - Record in quiet office space
   - Minimize background noise

3. **Keep Phone Nearby**
   - Don't place phone far away during calls
   - Keep within 1-2 feet for best results

### Why This Limitation?
- Google blocked direct call audio access in Android 10+
- Requires manufacturer-specific features or root access
- Our app uses the legal, Play Store-compliant method
- **All call recorder apps face this same limitation**

## 🔧 Technical Details

### How Auto-Detection Works
- **PhoneStateListener**: Monitors phone call states
- **Call Events**: Detects Incoming, Offhook (answered), Disconnected
- **Background Service**: Runs continuously when monitoring enabled
- **Audio Recording**: Uses expo-audio with high-quality M4A format

### Storage
- **Location**: App's internal storage (`/recordings/`)
- **Format**: M4A (high quality, compatible)
- **Metadata**: Stored in AsyncStorage
- **Privacy**: Only accessible within the app

### Permissions Required
```xml
RECORD_AUDIO              → Record call audio
READ_PHONE_STATE          → Detect when calls start/end
READ_CALL_LOG             → Get phone numbers
FOREGROUND_SERVICE        → Keep monitoring active
FOREGROUND_SERVICE_MICROPHONE → Allow background recording
```

## 📱 Building the APK

### Quick Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
cd /app/frontend
eas build --platform android --profile preview

# Download APK from the link provided
# Install on company devices
```

### Result
- Signed APK file (ready to install)
- Size: ~200-400MB
- Android 10+ compatible
- No Google Play required

See `/app/BUILD_INSTRUCTIONS.md` for detailed build options.

## 💡 Best Practices

### For IT Teams
1. **Pre-configure devices**: Install app before giving to staff
2. **Enable monitoring**: Turn on auto-recording during setup
3. **Test first**: Make test calls to verify recording works
4. **Check storage**: Ensure devices have enough space
5. **Regular cleanup**: Review and delete old recordings monthly

### For Staff Using Devices
1. **Keep app open** (at least once) after device restart
2. **Use speakerphone** for best recording quality
3. **Don't force-close app** from task manager
4. **Keep device charged** during business hours
5. **Don't disable permissions** in settings

### For Supervisors
1. **Review regularly**: Check recordings weekly
2. **Look for patterns**: Missing calls indicate issues
3. **Verify quality**: Sample recordings to check audio clarity
4. **Maintain compliance**: Follow local call recording laws

## 🔐 Legal & Compliance

### ⚠️ IMPORTANT LEGAL NOTICE

**Call Recording Laws Vary by Region:**

- **Two-Party Consent**: Some regions require ALL parties to know they're being recorded
- **Company Policy**: Ensure staff are informed of monitoring
- **Notification**: Consider notifying customers during calls
- **Data Protection**: Comply with GDPR/privacy laws in your region

**Before Deployment:**
1. ✅ Check local call recording laws
2. ✅ Update company policy documents
3. ✅ Inform all staff about monitoring
4. ✅ Consider legal consultation
5. ✅ Add call notification if required

## 🛠️ Troubleshooting

### App Not Recording
**Problem**: Calls aren't being recorded  
**Solutions**:
- Check monitoring status is "Active" (green dot)
- Verify all permissions are granted
- Restart app after giving permissions
- Check phone isn't in battery saver mode
- Ensure app isn't restricted in background

### Poor Audio Quality
**Problem**: Can't hear one side of conversation  
**Solutions**:
- ✅ **USE SPEAKERPHONE!** (Most important)
- Reduce background noise
- Keep phone closer during calls
- Test with different devices/manufacturers
- Some devices have better microphones

### Phone Number Shows "Unknown"
**Problem**: Recording saved without number  
**Solutions**:
- Grant READ_CALL_LOG permission
- Wait a moment after call connects
- Some blocked numbers can't be detected
- VoIP calls may not show numbers

### Recordings Disappear
**Problem**: Old recordings are missing  
**Solutions**:
- Check device storage isn't full
- App data not cleared in settings
- Device wasn't factory reset
- Recordings stored in app data (deleted if app uninstalled)

### App Stops Monitoring
**Problem**: Monitoring turns off by itself  
**Solutions**:
- Disable battery optimization for app
- Add app to "Protected apps" list (manufacturer-specific)
- Don't swipe app away from recent apps
- Keep app open in background

## 📊 Device Compatibility

### ✅ Best Performance
- Samsung Galaxy devices (S20+, A-series)
- Google Pixel phones (6+)
- OnePlus devices (8+)
- Xiaomi/Redmi (with MIUI 12+)

### ⚠️ May Require Extra Setup
- Huawei devices (battery optimization)
- Oppo/Realme (background restrictions)
- Vivo devices (auto-start settings)

### Minimum Requirements
- Android 10 or higher
- 2GB RAM minimum
- 500MB free storage
- Active microphone

## 🚀 Future Enhancements

### Planned Features
- [ ] Cloud backup integration
- [ ] CRM system API integration
- [ ] Advanced call analytics
- [ ] Multi-device management dashboard
- [ ] Export to CSV/Excel
- [ ] Search by phone number
- [ ] Call tagging and notes
- [ ] Scheduled auto-delete old recordings

## 📞 Support & FAQ

### Q: Does this work on iPhone?
A: No, automatic call detection is Android-only due to iOS restrictions.

### Q: Can I record specific numbers only?
A: Currently records all calls. Filtering feature coming in future update.

### Q: How much storage do recordings use?
A: Approximately 1MB per minute of recording (~30MB per hour).

### Q: Can staff disable monitoring?
A: They can stop monitoring in-app. Consider using MDM to prevent app removal/modification.

### Q: Is this legal in my country?
A: Check local laws. Many regions require consent. Consult legal advisor.

### Q: Why not use Google Play Store recorder apps?
A: Custom app provides better control, branding, and integration with your CRM system.

---

## 📝 Summary

**CRM-RECORDER** is a set-and-forget automatic call monitoring solution:

1. ✅ **Install once** → Works automatically
2. ✅ **One tap enable** → Records all calls
3. ✅ **No manual steps** → Completely automatic
4. ✅ **Full call history** → Easy to review
5. ✅ **Professional UI** → Easy to use

Perfect for CRM teams, sales monitoring, quality assurance, and staff performance tracking on company-provided Android devices.

---

**Version**: 2.0.0 (Automatic Recording)  
**Last Updated**: March 2026  
**Compatible**: Android 10+  
**License**: Proprietary - Company Internal Use
