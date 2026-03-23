# Building Signed APK for CRM-RECORDER

## Method 1: Using EAS Build (Recommended - Easy & Professional)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo Account
```bash
eas login
```
*If you don't have an Expo account, create one at https://expo.dev*

### Step 3: Configure EAS Build
```bash
cd /app/frontend
eas build:configure
```

This will create an `eas.json` file.

### Step 4: Build APK
```bash
# For APK (easy to install, larger size)
eas build --platform android --profile preview

# For AAB (for Google Play Store, smaller size)
eas build --platform android --profile production
```

**What happens:**
- EAS will ask if you want to generate a new Android keystore (say YES)
- It will automatically handle signing
- Build happens in the cloud (you don't need Android Studio)
- Takes 10-20 minutes

### Step 5: Download APK
After build completes:
- You'll get a download link in the terminal
- Or visit: https://expo.dev/accounts/YOUR_USERNAME/projects/crm-recorder/builds
- Download the APK file

### Step 6: Install on Devices
- Transfer APK to Android devices
- Enable "Install from Unknown Sources" in Android settings
- Tap the APK to install

---

## Method 2: Local Build (More Control)

### Prerequisites
```bash
# Install Android SDK
sudo apt-get update
sudo apt-get install -y android-sdk

# Or use Android Studio
```

### Step 1: Eject to Bare Workflow
```bash
cd /app/frontend
npx expo prebuild --platform android
```

### Step 2: Generate Keystore
```bash
# Generate signing key
keytool -genkeypair -v -storetype PKCS12 \
  -keystore crm-recorder.keystore \
  -alias crm-recorder \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be asked for:
# - Keystore password (remember this!)
# - Your name and organization details
```

### Step 3: Configure Gradle
Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('crm-recorder.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'crm-recorder'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 4: Build APK
```bash
cd android
./gradlew assembleRelease

# APK will be at:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## Method 3: Quick Test Build (Unsigned)

For quick testing (won't work on all devices):

```bash
cd /app/frontend
expo build:android -t apk
```

---

## Recommended: EAS Build Configuration

Create `/app/frontend/eas.json`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

---

## Distribution Options

### Option 1: Direct APK Installation
- Download APK from EAS build
- Share via USB, email, or cloud storage
- Install on each device manually

### Option 2: Internal Testing (Google Play)
- Build AAB (not APK)
- Upload to Google Play Console
- Create internal testing track
- Share test link with employees

### Option 3: MDM (Mobile Device Management)
- If your company uses MDM (like Microsoft Intune, VMware Workspace ONE)
- Upload APK to MDM
- Push to all company devices automatically

---

## Troubleshooting

### Build Fails - Missing Dependencies
```bash
cd /app/frontend
yarn install
npx expo install --check
```

### "Unsigned APK" Error
- Use EAS Build (handles signing automatically)
- Or create keystore manually (see Method 2)

### "App Not Installed" Error
- Enable "Install from Unknown Sources"
- Uninstall old version first
- Check Android version compatibility (need Android 10+)

---

## Quick Start Command (Easiest)

```bash
# One-line command to build APK
cd /app/frontend && npx eas-cli build --platform android --profile preview --non-interactive
```

This will:
✅ Auto-generate signing key
✅ Build in cloud
✅ Give you download link
✅ No Android Studio needed

---

## Important Notes

1. **Keep Your Keystore Safe**: If you lose it, you can't update the app
2. **Same Keystore for Updates**: Always use the same keystore to update the app
3. **APK vs AAB**: 
   - APK = Direct install (300-500MB)
   - AAB = Google Play only (100-200MB)
4. **First Build Takes Time**: 15-30 minutes for first build
5. **Subsequent Builds**: 5-10 minutes

---

## After Building

### Test the APK
1. Install on one test device first
2. Test all features (recording, playback, delete)
3. Check permissions work correctly
4. Test call recording with speakerphone

### Deploy to Team
1. Share APK link or file
2. Provide installation instructions
3. Include user guide (see README_CRM_RECORDER.md)
4. Explain speakerphone requirement

---

## Support

For build issues:
- Check Expo docs: https://docs.expo.dev/build/setup/
- EAS Build dashboard: https://expo.dev/accounts/[your-username]/projects
- Expo Discord: https://chat.expo.dev/
