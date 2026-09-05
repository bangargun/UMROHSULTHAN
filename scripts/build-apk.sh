#!/bin/bash
set -e

echo "=========================================="
echo "  SULTHAN HARAMAIN - ANDROID APK BUILDER  "
echo "=========================================="

# 1. Setup Java & Android SDK paths
if [ -d "/opt/homebrew/opt/openjdk@21" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
elif [ -d "/opt/homebrew/opt/openjdk" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk"
fi

if [ -d "/opt/homebrew/share/android-commandlinetools" ]; then
  export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
elif [ -d "$HOME/Library/Android/sdk" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi

if [ -n "$JAVA_HOME" ]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

echo "[1/4] Building Next.js Web Assets..."
npm run build

echo "[2/4] Ensuring Assets Directory & Syncing to Android Native Project..."
mkdir -p out android/app/src/main/assets/public
npx cap sync android

echo "[3/4] Building Android APK via Gradle..."
cd android
echo "sdk.dir=${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}" > local.properties
./gradlew assembleDebug --no-daemon
cd ..

echo "[4/4] Copying APK to Web Download Public Folder..."
mkdir -p public/downloads
cp android/app/build/outputs/apk/debug/app-debug.apk public/sulthan-umroh.apk
cp android/app/build/outputs/apk/debug/app-debug.apk public/downloads/sulthan-umroh.apk

echo "=========================================="
echo " ✅ SUCCESS! ANDROID APK READY FOR USERS"
echo " File APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo " Web Download: public/sulthan-umroh.apk (https://portalumroh.../sulthan-umroh.apk)"
echo "=========================================="

