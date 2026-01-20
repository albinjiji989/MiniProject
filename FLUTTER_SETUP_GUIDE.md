# Flutter SDK Setup Guide for Windows

## 🎯 Current Situation
- ✅ You have Android Studio installed
- ✅ You have the Flutter project at `D:\Second\MiniProject\petconnect_app`
- ❌ Flutter SDK is not installed yet
- ❌ Dart SDK is not configured

## 📥 Step 1: Download Flutter SDK

### Option A: Direct Download (Recommended)
1. Visit: https://docs.flutter.dev/get-started/install/windows
2. Download the latest stable Flutter SDK (zip file)
3. Extract to: `C:\src\flutter` (or any location you prefer)

### Option B: Using Git
```powershell
cd C:\src
git clone https://github.com/flutter/flutter.git -b stable
```

## 🔧 Step 2: Add Flutter to PATH

### Method 1: Using System Environment Variables (Permanent)
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables", find "Path" and click "Edit"
5. Click "New" and add: `C:\src\flutter\bin`
6. Click "OK" on all dialogs
7. **Restart your terminal/PowerShell**

### Method 2: Using PowerShell Command (Temporary)
```powershell
$env:Path += ";C:\src\flutter\bin"
```

## ✅ Step 3: Verify Flutter Installation

Open a **NEW** PowerShell window and run:
```powershell
flutter doctor -v
```

You should see output checking your Flutter installation.

## 🔧 Step 4: Fix Any Issues

Flutter doctor will show what's missing. Common fixes:

### Android SDK License
```powershell
flutter doctor --android-licenses
```
Accept all licenses by typing 'y'

### Android Studio Plugin
1. Open Android Studio
2. Go to: File → Settings → Plugins
3. Search for "Flutter" and install
4. Search for "Dart" and install
5. Restart Android Studio

## 📱 Step 5: Configure Android Studio for Your Project

1. **Open Android Studio**
2. Click "Open" (not "New Project")
3. Navigate to: `D:\Second\MiniProject\petconnect_app`
4. Select the `petconnect_app` folder and click "OK"

### If Asked for Flutter SDK Path:
- Point to: `C:\src\flutter` (or wherever you extracted Flutter)

### If Asked for Dart SDK Path:
- Point to: `C:\src\flutter\bin\cache\dart-sdk`
- (Dart comes bundled with Flutter)

## 🚀 Step 6: Run Your Flutter App

### From Android Studio:
1. Wait for indexing to complete
2. Connect your Android device or start an emulator
3. Click the green "Run" button (▶️)

### From Command Line:
```powershell
cd D:\Second\MiniProject\petconnect_app
flutter pub get
flutter run
```

## 🔍 Troubleshooting

### "flutter: command not found"
- Flutter is not in PATH
- Restart your terminal after adding to PATH
- Verify PATH: `echo $env:Path`

### "Unable to locate Android SDK"
1. Open Android Studio
2. Go to: File → Settings → Appearance & Behavior → System Settings → Android SDK
3. Note the SDK location (usually `C:\Users\YourName\AppData\Local\Android\Sdk`)
4. Set environment variable:
   ```powershell
   $env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
   ```

### "Dart SDK not found"
- Dart comes with Flutter
- Path should be: `C:\src\flutter\bin\cache\dart-sdk`
- Run `flutter doctor` to ensure Flutter is properly installed

### "cmdline-tools component is missing"
1. Open Android Studio
2. Go to: File → Settings → Appearance & Behavior → System Settings → Android SDK
3. Click "SDK Tools" tab
4. Check "Android SDK Command-line Tools (latest)"
5. Click "Apply"

## 📋 Quick Setup Commands

Run these in PowerShell (after installing Flutter SDK):

```powershell
# Navigate to your project
cd D:\Second\MiniProject\petconnect_app

# Get dependencies
flutter pub get

# Check for issues
flutter doctor -v

# Accept Android licenses
flutter doctor --android-licenses

# Run the app
flutter run
```

## 🎯 Expected Flutter Doctor Output

After setup, `flutter doctor` should show:
```
[✓] Flutter (Channel stable, 3.x.x)
[✓] Android toolchain - develop for Android devices
[✓] Chrome - develop for the web
[✓] Android Studio (version 2023.x)
[✓] VS Code (optional)
[✓] Connected device (if device/emulator is connected)
```

## 📱 Setting Up Android Emulator

If you don't have a physical device:

1. Open Android Studio
2. Click "Device Manager" (phone icon on right side)
3. Click "Create Device"
4. Select a device (e.g., Pixel 5)
5. Download a system image (e.g., Android 13)
6. Click "Finish"
7. Click the play button to start the emulator

## 🔗 Useful Links

- Flutter Installation: https://docs.flutter.dev/get-started/install/windows
- Flutter Doctor: https://docs.flutter.dev/get-started/install/windows#run-flutter-doctor
- Android Studio Setup: https://developer.android.com/studio/install

## ⚡ Quick Start (After SDK Installation)

```powershell
# 1. Open PowerShell in your project directory
cd D:\Second\MiniProject\petconnect_app

# 2. Get dependencies
flutter pub get

# 3. Check everything is ready
flutter doctor

# 4. List available devices
flutter devices

# 5. Run the app
flutter run
```

## 🎉 Success Indicators

You're ready when:
- ✅ `flutter doctor` shows no critical errors
- ✅ Android Studio recognizes the project as Flutter
- ✅ You can see "Run" and "Debug" buttons in Android Studio
- ✅ `flutter devices` shows your device/emulator
- ✅ You can run `flutter run` without errors
