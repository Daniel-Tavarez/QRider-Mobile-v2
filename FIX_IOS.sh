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
rm -rf ~/Library/Developer/Xcode/DerivedData

echo ""
echo "📦 Verificando CocoaPods..."
if ! command -v pod &> /dev/null; then
    echo "   Instalando CocoaPods..."
    sudo gem install cocoapods
else
    echo "   ✅ CocoaPods instalado: $(pod --version)"
fi

echo ""
echo "🧹 Limpiando cache de CocoaPods..."
pod cache clean --all 2>/dev/null || true

echo ""
echo "📦 Desintegrando pods anteriores..."
pod deintegrate 2>/dev/null || true

echo ""
echo "📦 Actualizando repositorio de CocoaPods..."
pod repo update

echo ""
echo "📦 Instalando dependencias (esto puede tardar 5-10 minutos)..."
echo "   Por favor, ten paciencia..."
pod install --repo-update --verbose

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
echo "O directamente:"
echo ""
echo "   npx react-native run-ios --scheme QRiderRD"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""