# Flutter Google Sign-In Setup Guide (Android)

A complete step-by-step guide to set up Google Sign-In in a Flutter Android app.

---

## Prerequisites

- Flutter SDK installed
- A Google account
- Your Android app's **package name** (e.g., `com.yatrik.erp.yatrik_mobile`)
- Your **SHA-1 fingerprint**

### How to Get SHA-1 Fingerprint

```bash
# For debug keystore (Windows)
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android

# For debug keystore (Mac/Linux)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the `SHA1:` value (looks like `DD:BC:C9:63:C2:6C:28:E2:...`).

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** (or select an existing project)
3. Follow the wizard to create the project

---

## Step 2: Add Android App in Firebase

1. In Firebase Console → **Project Settings** (gear icon) → **General** tab
2. Click **"Add app"** → Select **Android**
3. Enter your **Android package name** (must match exactly what's in your `build.gradle`)
4. Enter app nickname (optional)
5. **Add your SHA-1 fingerprint** here
6. Click **Register app**
7. **Download `google-services.json`**

> ⚠️ **IMPORTANT:** If you add SHA-1 *after* downloading `google-services.json`, you must **re-download** it!

---

## Step 3: Enable Google Sign-In in Firebase Authentication

1. Firebase Console → **Authentication** (left sidebar)
2. Click **Sign-in method** tab
3. Click **Google**
4. Toggle **Enable**
5. Select a support email
6. Click **Save**

> ❌ If you skip this step, Google Sign-In will fail silently!

---

## Step 4: Place `google-services.json`

Place the downloaded file at **exactly** this path:

```
your_flutter_project/
├── android/
│   ├── app/
│   │   ├── google-services.json   ← HERE
│   │   ├── build.gradle.kts
│   │   └── src/
│   ├── build.gradle.kts
│   └── settings.gradle.kts
├── lib/
└── pubspec.yaml
```

**NOT** in `android/` root, **NOT** in project root — **inside `android/app/`**.

---

## Step 5: Configure Gradle Files

### If using Kotlin DSL (`.gradle.kts` files):

**`android/settings.gradle.kts`** — Add the Google Services plugin:

```kotlin
plugins {
    id("dev.flutter.flutter-plugin-loader") version "1.0.0"
    id("com.android.application") version "{your-agp-version}" apply false
    id("org.jetbrains.kotlin.android") version "{your-kotlin-version}" apply false
    id("com.google.gms.google-services") version "4.4.2" apply false   // ← ADD THIS
}
```

**`android/app/build.gradle.kts`** — Apply the plugin:

```kotlin
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")   // ← ADD THIS
}
```

### If using Groovy DSL (`.gradle` files):

**`android/build.gradle`:**

```groovy
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.2'   // ← ADD THIS
    }
}
```

**`android/app/build.gradle`:**

```groovy
// At the bottom of the file
apply plugin: 'com.google.gms.google-services'   // ← ADD THIS
```

---

## Step 6: Add Flutter Package

In `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  google_sign_in: ^6.2.1
```

Then run:

```bash
flutter pub get
```

---

## Step 7: Flutter Code — Google Sign-In Implementation

### Basic GoogleSignIn Initialization

```dart
import 'package:google_sign_in/google_sign_in.dart';

final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
  // Use WEB client ID, NOT Android client ID
  clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
);
```

### Where to Find Your Web Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Credentials** → **OAuth 2.0 Client IDs**
4. Look for the one labeled **"Web client (auto created by Google Service)"**
5. Copy that client ID

> ⚠️ **Use the WEB client ID, NOT the Android client ID!** This is a very common mistake.

### Full Sign-In Method Example

```dart
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  );

  Future<bool> signInWithGoogle() async {
    try {
      // Sign out first to force account picker
      await _googleSignIn.signOut();

      // Trigger the sign-in flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        // User cancelled the sign-in
        print('Google Sign-In cancelled by user');
        return false;
      }

      // Get authentication tokens
      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      final String? idToken = googleAuth.idToken;
      final String? accessToken = googleAuth.accessToken;

      print('ID Token: $idToken');
      print('Access Token: $accessToken');
      print('Email: ${googleUser.email}');
      print('Name: ${googleUser.displayName}');

      // Send tokens to your backend for verification
      // await apiService.googleSignIn(idToken!, accessToken!);

      return true;
    } catch (error) {
      print('Google Sign-In Error: $error');
      return false;
    }
  }
}
```

### UI Button Example

```dart
ElevatedButton.icon(
  onPressed: () async {
    final success = await AuthService().signInWithGoogle();
    if (success) {
      // Navigate to home page
    } else {
      // Show error
    }
  },
  icon: Image.network(
    'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
    height: 24,
    width: 24,
  ),
  label: Text('Continue with Google'),
)
```

---

## Common Errors & Solutions

### Error: `PlatformException(sign_in_failed, ...)`

| Cause | Fix |
|-------|-----|
| SHA-1 not in Firebase | Add SHA-1 in Firebase Console → Project Settings |
| Wrong SHA-1 (release vs debug) | Use **debug** SHA-1 for testing |
| `google-services.json` outdated | Re-download after adding SHA-1 |
| Google Sign-In not enabled | Enable in Firebase → Authentication → Sign-in method |
| Package name mismatch | Ensure same package name in `build.gradle`, `google-services.json`, and Firebase |

### Error: `ApiException: 10`

- Usually means **SHA-1 mismatch** or **missing Google Services plugin** in gradle
- Re-check SHA-1 and re-download `google-services.json`

### Error: `ApiException: 12500`

- Google Sign-In **not enabled** in Firebase Authentication
- Or support email not configured

### Sign-In Button Does Nothing

- Check `clientId` — must be **Web** client ID, not Android
- Check that `google_sign_in` package is in `pubspec.yaml`
- Run `flutter clean` then `flutter pub get`

---

## Quick Checklist

- [ ] Firebase project created
- [ ] Android app registered in Firebase with **correct package name**
- [ ] **SHA-1 fingerprint** added in Firebase Console
- [ ] Google Sign-In **enabled** in Firebase Authentication → Sign-in method
- [ ] `google-services.json` downloaded (**after** adding SHA-1) and placed in `android/app/`
- [ ] Google Services Gradle plugin added in `settings.gradle.kts` and `app/build.gradle.kts`
- [ ] `google_sign_in: ^6.2.1` added in `pubspec.yaml`
- [ ] Using **Web client ID** (not Android client ID) in `GoogleSignIn()` initialization
- [ ] Ran `flutter clean` and `flutter pub get`

---

## File Structure Summary

```
your_flutter_project/
├── android/
│   ├── app/
│   │   ├── google-services.json        ← Firebase config (MANDATORY)
│   │   ├── build.gradle.kts            ← Apply google-services plugin here
│   │   └── src/
│   ├── build.gradle.kts
│   └── settings.gradle.kts             ← Declare google-services plugin here
├── lib/
│   ├── providers/
│   │   └── auth_provider.dart          ← GoogleSignIn logic goes here
│   ├── services/
│   │   └── api_service.dart            ← Backend API calls with Google tokens
│   └── screens/
│       └── login_page.dart             ← Google Sign-In button UI
├── pubspec.yaml                        ← google_sign_in dependency
└── ios/
    └── Runner/
        └── GoogleService-Info.plist    ← iOS config (if needed)
```

---

## Need More Help?

- [Official `google_sign_in` package docs](https://pub.dev/packages/google_sign_in)
- [Firebase Auth Flutter guide](https://firebase.google.com/docs/auth/flutter/federated-auth)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Firebase Console](https://console.firebase.google.com/)
