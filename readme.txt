== FINDORA — Setup Instructions ==

Requirements:
  - Node.js 18+
  - npm
  - Expo Go app on a physical device (for mobile)
    OR Android Studio / Xcode for emulator/simulator

Setup:
  1. git clone https://github.com/mw-weishu/studioproject.git
  2. cd studioproject
  3. npm install
  4. Firebase is already configured in firebase.config.js.
     No local database setup is needed — Firebase is cloud-hosted
     (project: expo-routime on Firebase Realtime Database + Storage).

Run (development):
  - Web:     npx expo start --web
  - Mobile:  npx expo start
             (scan the QR code with the Expo Go app on Android or iOS)

Build (production):
  - Web:     npx expo export --platform web   (output in dist/)
  - Native:  eas build --platform android     (requires EAS CLI and account)
             eas build --platform ios          (requires Apple Developer account)
