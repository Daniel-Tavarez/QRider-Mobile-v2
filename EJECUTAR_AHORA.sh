#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "🔧 SOLUCIÓN DE ERRORES DE iOS"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Los errores que ves en Xcode son NORMALES antes de ejecutar este script:"
echo "  ❌ Unable to find module dependency: 'Firebase'"
echo "  ❌ Unable to find module dependency: 'GoogleSignIn'"
echo "  ❌ React-Core/RCTBridgeModule.h file not found"
echo ""
echo "Estos módulos NO EXISTEN hasta que ejecutemos 'pod install'"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

# Verificar macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Este script debe ejecutarse en macOS"
    exit 1
fi

# Verificar CocoaPods
if ! command -v pod &> /dev/null; then
    echo "❌ CocoaPods no está instalado"
    echo "Instálalo con: sudo gem install cocoapods"
    exit 1
fi

cd "$(dirname "$0")/ios"

echo "🧹 Paso 1/3: Limpiando archivos antiguos..."
rm -rf Pods Podfile.lock build
rm -rf ~/Library/Developer/Xcode/DerivedData/*QRiderRD*
echo "   ✅ Limpieza completada"
echo ""

echo "📦 Paso 2/3: Instalando pods (esto tomará 5-10 minutos)..."
echo "   Por favor, ten paciencia. Verás MUCHOS logs, es normal."
echo ""
pod install --repo-update --verbose

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error al instalar pods"
    echo "Intenta ejecutar: pod repo update && pod install"
    exit 1
fi

cd ..

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ ¡INSTALACIÓN COMPLETADA!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Los siguientes módulos están ahora disponibles:"
echo "  ✅ Firebase"
echo "  ✅ GoogleSignIn"
echo "  ✅ React-Core"
echo ""
echo "════════════════════════════════════════════════════════"
echo "🚀 Paso 3/3: Ejecutando la app..."
echo "════════════════════════════════════════════════════════"
echo ""

npm run ios

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error al ejecutar la app"
    echo "Intenta ejecutar manualmente: npm run ios"
    exit 1
fi
