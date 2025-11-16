#!/bin/bash

echo "🔧 Corrigiendo proyecto iOS..."
cd "$(dirname "$0")/ios"

echo "🧹 Limpiando..."
rm -rf Pods Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*QRiderRD*

echo "📦 Instalando pods (5-10 minutos)..."
pod install --repo-update

cd ..

echo "✅ ¡Listo! Ahora ejecuta:"
echo "npm run ios"
