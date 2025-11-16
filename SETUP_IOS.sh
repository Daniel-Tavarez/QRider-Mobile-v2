#!/bin/bash

echo "🍎 QRider RD - Setup Completo para iOS"
echo "======================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Este script debe ejecutarse en macOS"
    exit 1
fi

echo "📦 Verificando dependencias..."
echo ""

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "⚠️  Homebrew no está instalado"
    echo "   Instalando Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check for CocoaPods
if ! command -v pod &> /dev/null; then
    echo "⚠️  CocoaPods no está instalado"
    echo "   Instalando CocoaPods..."
    sudo gem install cocoapods
fi

# Check for Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Por favor instala Node.js 20+ desde: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js versión 20 o superior es requerida (actual: $(node -v))"
    exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ CocoaPods $(pod --version)"
echo "✅ Ruby $(ruby -v | cut -d' ' -f2)"
echo ""

# Install npm dependencies
echo "📦 Instalando dependencias de npm..."
npm install

echo ""
echo "📱 Instalando pods de iOS..."
cd ios

# Remove old pods if they exist
if [ -d "Pods" ]; then
    echo "   Limpiando pods antiguos..."
    rm -rf Pods Podfile.lock
fi

# Install pods
pod install --repo-update

cd ..

echo ""
echo "✅ ¡Setup completado!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Para ejecutar la aplicación:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   npm run ios"
echo ""
echo "O abre en Xcode:"
echo ""
echo "   open ios/QRiderRD.xcworkspace"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Notas importantes:"
echo "   • Siempre abre .xcworkspace, NO .xcodeproj"
echo "   • Bundle ID: com.qriderrd"
echo "   • Firebase y Google Sign-In están configurados"
echo "   • Background location está habilitado"
echo ""
