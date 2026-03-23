# Building CRM-RECORDER with Android Studio

## Method 1: Download Code from Emergent

### Step 1: Download Project Files

You can download the code in several ways:

#### Option A: Using Git (if available)
```bash
# If you have Git access to this workspace
git clone [your-repo-url]
```

#### Option B: Download as ZIP
1. In Emergent interface, look for "Download Code" or "Export" button
2. Download the entire `/app/frontend` folder
3. Extract on your local machine

#### Option C: Manual Download Key Files
Download these essential folders/files from `/app/frontend`:
```
frontend/
├── app/              (All screens)
├── assets/           (Images, icons)
├── services/         (Recording services)
├── types/            (TypeScript types)
├── package.json
├── app.json
├── eas.json
├── tsconfig.json
├── metro.config.js
└── .env              (Environment variables)
```

---

## Method 2: Create Archive for Download

I can create a compressed archive for you:

```bash
# Run this in Emergent to create downloadable archive
cd /app
tar -czf crm-recorder-complete.tar.gz frontend/

# This creates: crm-recorder-complete.tar.gz
# Download this file and extract on your machine
```

---

## Step 2: Setup on Your Local Machine

### Prerequisites
Install these on your computer:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/

2. **Android Studio**
   - Download: https://developer.android.com/studio
   - During installation, select:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device

3. **Java Development Kit (JDK 17)**
   - Download: https://www.oracle.com/java/technologies/downloads/
   - Or use OpenJDK

4. **Yarn** (package manager)
   ```bash
   npm install -g yarn
   ```

---

## Step 3: Prepare Project for Android Studio

### 1. Extract and Install Dependencies
```bash
# Extract the downloaded files
cd /path/to/crm-recorder-frontend

# Install dependencies
yarn install

# Install Expo CLI globally
npm install -g expo-cli
```

### 2. Generate Native Android Project
```bash
# This creates the android/ folder
npx expo prebuild --platform android

# Say YES when asked about generating native folders
```

This will create:
```
frontend/
├── android/          ← New! Native Android project
│   ├── app/
│   ├── build.gradle
│   └── settings.gradle
├── app/
├── package.json
└── ...
```

---

## Step 4: Open in Android Studio

### 1. Launch Android Studio
- Open Android Studio
- Click "Open an Existing Project"
- Navigate to: `/path/to/crm-recorder-frontend/android`
- Click "OK"

### 2. Wait for Gradle Sync
- Android Studio will automatically sync Gradle
- This may take 5-10 minutes first time
- Status shown in bottom toolbar

### 3. Configure SDK
- Go to: **Tools → SDK Manager**
- Ensure these are installed:
  - Android SDK Platform 33 or higher
  - Android SDK Build-Tools
  - Android SDK Platform-Tools

---

## Step 5: Generate Signing Key

### Create Keystore
```bash
# In your project directory
cd android/app

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore crm-recorder.keystore \
  -alias crm-recorder \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for:
# - Keystore password (remember this!)
# - Your name
# - Organization name
# - City, State, Country
```

**⚠️ IMPORTANT**: Save this keystore file safely! You'll need it for all future updates.

---

## Step 6: Configure Gradle for Signing

### 1. Create `android/gradle.properties`
```properties
# Add these lines (replace with your actual passwords)
MYAPP_UPLOAD_STORE_FILE=crm-recorder.keystore
MYAPP_UPLOAD_KEY_ALIAS=crm-recorder
MYAPP_UPLOAD_STORE_PASSWORD=your_keystore_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

### 2. Edit `android/app/build.gradle`

Find the `android` block and add:

```gradle
android {
    ...
    
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Step 7: Build APK in Android Studio

### Option A: Using Android Studio GUI

1. **Select Build Variant**
   - Click "Build Variants" tab (bottom left)
   - Select "release" for app module

2. **Build APK**
   - Menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Wait for build to complete (5-10 minutes)
   - Notification will show when done

3. **Locate APK**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### Option B: Using Command Line (Faster)

```bash
# Navigate to android folder
cd android

# Build release APK
./gradlew assembleRelease

# On Windows:
gradlew.bat assembleRelease

# APK will be at:
# app/build/outputs/apk/release/app-release.apk
```

---

## Step 8: Install APK

### On Real Device
```bash
# Connect device via USB
# Enable USB Debugging on device

# Install APK
adb install app/build/outputs/apk/release/app-release.apk
```

### Transfer Manually
1. Copy `app-release.apk` to device
2. Open file on device
3. Tap to install
4. Enable "Install from Unknown Sources" if prompted

---

## Troubleshooting

### Error: "SDK location not found"
**Solution**: Create `android/local.properties`:
```properties
sdk.dir=/path/to/Android/Sdk

# Example paths:
# Mac: /Users/YourName/Library/Android/sdk
# Windows: C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
# Linux: /home/YourName/Android/Sdk
```

### Error: "Package 'react-native-call-detection' not found"
**Solution**: 
```bash
# Install dependencies again
cd /path/to/frontend
yarn install

# Rebuild android folder
rm -rf android/
npx expo prebuild --platform android
```

### Error: "Execution failed for task ':app:signReleaseBundle'"
**Solution**: Check your keystore configuration in `gradle.properties`

### Build Takes Too Long
**Solution**: Enable Gradle daemon
```bash
# Add to android/gradle.properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

### "Minimum SDK version" Error
**Solution**: Edit `android/app/build.gradle`
```gradle
android {
    defaultConfig {
        minSdkVersion 26  // Change to 26 or 29
        targetSdkVersion 33
    }
}
```

---

## Quick Reference Commands

```bash
# Install dependencies
yarn install

# Generate android folder
npx expo prebuild --platform android

# Open in Android Studio
# File → Open → select android/ folder

# Build APK (command line)
cd android
./gradlew assembleRelease

# Build AAB for Play Store
./gradlew bundleRelease

# Clean build
./gradlew clean

# Install on device
adb install app/build/outputs/apk/release/app-release.apk

# Check connected devices
adb devices
```

---

## File Locations Reference

```
After prebuild, your structure:
frontend/
├── android/                    ← Open this in Android Studio
│   ├── app/
│   │   ├── src/
│   │   ├── build.gradle       ← Edit for signing
│   │   └── crm-recorder.keystore
│   ├── gradle.properties      ← Add keystore credentials
│   ├── build.gradle
│   └── settings.gradle
├── app/                        ← Your React Native code
├── services/
├── package.json
└── app.json
```

---

## APK Output Locations

- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB (Play Store)**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Comparison: EAS Build vs Android Studio

| Feature | EAS Build | Android Studio |
|---------|-----------|----------------|
| **Setup Time** | 5 minutes | 30-60 minutes |
| **Build Time** | 15-20 min | 5-10 min |
| **Requires** | Internet | Local setup |
| **Cost** | Free tier | Free |
| **Customization** | Limited | Full control |
| **Best For** | Quick builds | Development |

---

## Next Steps After Building

1. **Test APK**
   - Install on test device
   - Make test calls
   - Verify recording works
   - Check audio quality

2. **Distribute**
   - Share APK file directly
   - Use company MDM
   - Upload to Google Play (internal testing)

3. **Updates**
   - Keep same keystore for updates
   - Increment version in `app.json`
   - Rebuild and redistribute

---

## Need Help?

Common issues:
- **Gradle build failed**: Check Android Studio → Build → Clean Project
- **Dependencies error**: Delete `node_modules/`, run `yarn install`
- **Keystore issues**: Regenerate keystore, update gradle.properties
- **APK not installing**: Check minimum Android version (should be 10+)

---

Would you like me to create the downloadable archive now? I can package the entire project for you.
