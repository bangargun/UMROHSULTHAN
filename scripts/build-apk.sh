#!/bin/bash
set -e

echo "=========================================="
echo "  SULTHAN HARAMAIN - ANDROID APK BUILDER  "
echo "=========================================="

echo "[1/4] Building Next.js Web Assets..."
npm run build

echo "[2/4] Syncing Assets to Android Native Project..."
npx cap sync android

echo "[3/4] Checking Android Build Environment..."
if command -v gradle &> /dev/null; then
    echo "Building APK via Gradle..."
    cd android && ./gradlew assembleDebug
    echo "=========================================="
    echo " SUCCESS! APK Build Completed:"
    echo " Location: android/app/build/outputs/apk/debug/app-debug.apk"
    echo "=========================================="
else
    echo "=========================================="
    echo " Android Project Synced Successfully!"
    echo " To compile the final APK file:"
    echo " Option 1: Open project in Android Studio (run 'npx cap open android')"
    echo " Option 2: Run './gradlew assembleDebug' inside the 'android/' directory"
    echo "=========================================="
fi
