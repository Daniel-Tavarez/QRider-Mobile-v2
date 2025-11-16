# 🔧 Solución al Error de gRPC-Core.modulemap

## ❌ Error:

```
module map file 'gRPC-Core.modulemap' not found
```

Este es un problema conocido con Firebase/Firestore y CocoaPods.

## ✅ SOLUCIÓN RÁPIDA:

```bash
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod deintegrate
pod install --repo-update
cd ..
npm run ios
```

## 🔧 Opción más fácil:

```bash
./FIX_IOS.sh
npm run ios
```

El script `FIX_IOS.sh` ya incluye toda la limpieza necesaria.

## 📝 ¿Por qué pasa esto?

Este error ocurre cuando:
1. Los headers de CocoaPods no se generan correctamente
2. El cache de CocoaPods está corrupto
3. Hay conflictos en las dependencias de Firebase

## ✨ Solución Manual Completa:

```bash
# Paso 1: Ir al directorio ios
cd ios

# Paso 2: Limpiar TODO
rm -rf Pods
rm -rf Podfile.lock
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData

# Paso 3: Desintegrar pods
pod deintegrate

# Paso 4: Limpiar cache
pod cache clean --all

# Paso 5: Actualizar repos
pod repo update

# Paso 6: Instalar pods frescos
pod install --repo-update --verbose

# Paso 7: Volver
cd ..

# Paso 8: Ejecutar
npm run ios
```

## 🎯 Alternativa: Xcode

```bash
# Después de limpiar pods
open ios/QRiderRD.xcworkspace
```

En Xcode:
1. Product → Clean Build Folder (⇧⌘K)
2. Cerrar Xcode completamente
3. Volver a abrir
4. Presionar Play

## ⚠️ IMPORTANTE:

- Abre `.xcworkspace`, NO `.xcodeproj`
- Necesitas al menos 5GB de espacio libre
- Actualiza CocoaPods: `sudo gem install cocoapods`

---

**El script FIX_IOS.sh resuelve este problema automáticamente.** 🚀
