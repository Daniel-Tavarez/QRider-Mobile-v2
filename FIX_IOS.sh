#!/bin/bash

echo "🔧 Reparando configuración de iOS..."
echo ""

# Cambiar al directorio del proyecto
cd "$(dirname "$0")"

# Verificar que estamos en macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Este script debe ejecutarse en macOS"
    exit 1
fi

echo "🧹 Limpiando archivos de build antiguos..."
cd ios

# Limpiar builds antiguos
rm -rf build
rm -rf DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/*QRiderRD*

# Verificar proyectos duplicados
XCODEPROJ_COUNT=$(find . -maxdepth 1 -name "*.xcodeproj" -type d | wc -l)
echo "📦 Proyectos encontrados: $XCODEPROJ_COUNT"

if [ $XCODEPROJ_COUNT -gt 1 ]; then
    echo "⚠️  Múltiples proyectos encontrados. Limpiando..."

    # Listar proyectos
    find . -maxdepth 1 -name "*.xcodeproj" -type d

    # Mantener solo QRiderRD.xcodeproj
    find . -maxdepth 1 -name "*.xcodeproj" -type d ! -name "QRiderRD.xcodeproj" -exec rm -rf {} +

    echo "✅ Proyectos duplicados eliminados"
fi

echo ""
echo "🧹 Limpiando pods antiguos..."
rm -rf Pods
rm -rf Podfile.lock
rm -rf ~/Library/Caches/CocoaPods

echo ""
echo "📦 Instalando CocoaPods si no está instalado..."
if ! command -v pod &> /dev/null; then
    echo "   Instalando CocoaPods..."
    sudo gem install cocoapods
else
    echo "   ✅ CocoaPods ya está instalado: $(pod --version)"
fi

echo ""
echo "📦 Instalando dependencias de pods (esto puede tardar unos minutos)..."
pod deintegrate 2>/dev/null || true
pod install --repo-update

cd ..

echo ""
echo "🧹 Limpiando cache de npm..."
rm -rf node_modules/.cache

echo ""
echo "🧹 Limpiando cache de Metro..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

echo ""
echo "✅ ¡Reparación completada!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Ahora ejecuta:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   npm run ios"
echo ""
echo "O especifica el proyecto:"
echo ""
echo "   npx react-native run-ios --project-path ios/QRiderRD.xcodeproj"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
