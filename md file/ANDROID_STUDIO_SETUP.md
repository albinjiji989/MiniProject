# Android Studio Setup for PetConnect Flutter App

## ✅ Current Status
- ✅ Flutter SDK installed at: `C:\Users\ADMIN\Downloads\flutter_windows_3.38.7-stable\flutter`
- ✅ Flutter version: 3.38.7
- ✅ Dart version: 3.10.7
- ✅ Project dependencies installed
- ⚠️ Android cmdline-tools missing (need to fix)
- ⚠️ Android licenses not accepted (need to fix)

## 🔧 Step 1: Fix Android SDK Command-line Tools

### In Android Studio:
1. Open Android Studio
2. Click **File → Settings** (or **Configure → Settings** from welcome screen)
3. Navigate to: **Appearance & Behavior → System Settings → Android SDK**
4. Click the **SDK Tools** tab
5. Check these items:
   - ✅ **Android SDK Command-line Tools (latest)**
   - ✅ **Android SDK Build-Tools**
   - ✅ **Android SDK Platform-Tools**
   - ✅ **Android Emulator**
6. Click **Apply** → **OK**
7. Wait for installation to complete

## 🔧 Step 2: Accept Android Licenses

Open PowerShell and run:
```powershell
flutter doctor --android-licenses
```

Type **y** and press Enter for each license.

## 🔧 Step 3: Install Flutter & Dart Plugins

### In Android Studio:
1. Click **File → Settings → Plugins**
2. Click **Marketplace** tab
3. Search for **"Flutter"**
4. Click **Install** on the Flutter plugin
   - This will also install the Dart plugin automatically
5. Click **Restart IDE**

## 🔧 Step 4: Open Your Flutter Project

### Method 1: From Android Studio
1. Click **File → Open**
2. Navigate to: `D:\Second\MiniProject\petconnect_app`
3. Click **OK**

### Method 2: From File Explorer
1. Right-click the `petconnect_app` folder
2. Select **Open Folder as Android Studio Project**

### If Asked for SDK Paths:
- **Flutter SDK path:** `C:\Users\ADMIN\Downloads\flutter_windows_3.38.7-stable\flutter`
- **Dart SDK path:** `C:\Users\ADMIN\Downloads\flutter_windows_3.38.7-stable\flutter\bin\cache\dart-sdk`

## 🔧 Step 5: Configure Run Configuration

After opening the project:

1. Wait for **Gradle sync** to complete (bottom right corner)
2. Wait for **indexing** to complete (bottom status bar)
3. At the top toolbar, you should see:
   - Device selector (select your device/emulator)
   - Run button (green play ▶️)
   - Debug button (bug icon 🐛)

### If No Device Shows:
You need to either:
- Connect a physical Android device via USB (enable USB debugging)
- Create an Android emulator (see Step 6)

## 🔧 Step 6: Create Android Emulator (Optional)

If you don't have a physical device:

1. Click the **Device Manager** icon (phone icon on right sidebar)
2. Click **Create Device**
3. Select a device definition (e.g., **Pixel 5**)
4. Click **Next**
5. Download a system image:
   - Recommended: **Android 13 (Tiramisu)** or **Android 14**
   - Click **Download** next to the system image
   - Wait for download to complete
6. Click **Next** → **Finish**
7. Click the **Play** button (▶️) to start the emulator

## 🚀 Step 7: Run Your App

### From Android Studio:
1. Select your device/emulator from the device dropdown
2. Click the green **Run** button (▶️)
3. Wait for the app to build and launch

### From PowerShell:
```powershell
cd D:\Second\MiniProject\petconnect_app
flutter run
```

## 🔍 Verify Everything Works

Run this command to check your setup:
```powershell
flutter doctor -v
```

You should see:
```
[✓] Flutter (Channel stable, 3.38.7)
[✓] Android toolchain - develop for Android devices
[✓] Chrome - develop for the web
[✓] Connected device
```

## 📱 Testing the App

Once the app launches, test these features:

### Authentication:
- ✅ Register new account
- ✅ Login with email/password
- ✅ Google Sign In

### Adoption Module:
- ✅ Browse adoption pets
- ✅ Filter by species/breed
- ✅ View pet details
- ✅ Submit adoption application
- ✅ View my applications
- ✅ View adopted pets

### Pet Shop Module:
- ✅ Browse shop pets
- ✅ View pet details
- ✅ Make reservation
- ✅ Process payment (Razorpay)
- ✅ View my reservations
- ✅ Add to wishlist
- ✅ View purchased pets

### My Pets Module:
- ✅ Add new pet
- ✅ View my pets
- ✅ Edit pet details
- ✅ Delete pet

## 🔧 Troubleshooting

### "Gradle sync failed"
```powershell
cd D:\Second\MiniProject\petconnect_app
flutter clean
flutter pub get
```
Then restart Android Studio.

### "Unable to locate Android SDK"
1. File → Settings → Appearance & Behavior → System Settings → Android SDK
2. Note the SDK location (usually `C:\Users\ADMIN\AppData\Local\Android\sdk`)
3. Set environment variable:
   - Variable: `ANDROID_HOME`
   - Value: `C:\Users\ADMIN\AppData\Local\Android\sdk`

### "Device not showing"
- For physical device: Enable USB debugging in Developer Options
- For emulator: Create one in Device Manager
- Run `flutter devices` to see available devices

### "Build failed"
```powershell
cd D:\Second\MiniProject\petconnect_app\android
.\gradlew clean
cd ..
flutter clean
flutter pub get
flutter run
```

### "Hot reload not working"
- Make sure you're running in debug mode (not release)
- Try pressing `r` in the terminal for hot reload
- Try pressing `R` for hot restart

## 🎯 Quick Commands Reference

```powershell
# Navigate to project
cd D:\Second\MiniProject\petconnect_app

# Check Flutter setup
flutter doctor -v

# Get dependencies
flutter pub get

# Clean build
flutter clean

# List devices
flutter devices

# Run app
flutter run

# Run on specific device
flutter run -d <device-id>

# Build APK
flutter build apk

# Build release APK
flutter build apk --release

# Run tests
flutter test
```

## 🌐 Backend Configuration

Your app is configured to connect to:
```
https://mini-project-ebon-omega.vercel.app/api
```

Make sure:
- ✅ Backend is deployed on Vercel
- ✅ CORS is configured for mobile apps
- ✅ All environment variables are set
- ✅ Database is accessible

## 📝 Important Files

- **lib/config/env_config.dart** - API and credentials configuration
- **lib/main.dart** - App entry point
- **android/app/build.gradle** - Android build configuration
- **pubspec.yaml** - Dependencies and assets

## 🎉 Success Indicators

You're ready when:
- ✅ Android Studio shows no errors
- ✅ Device/emulator is visible in device selector
- ✅ Run button is enabled (not grayed out)
- ✅ `flutter doctor` shows no critical errors
- ✅ App builds and launches successfully
- ✅ You can login and navigate the app

## 🔗 Useful Links

- Flutter Docs: https://docs.flutter.dev
- Android Studio: https://developer.android.com/studio
- Flutter DevTools: https://docs.flutter.dev/tools/devtools
- Dart Packages: https://pub.dev
