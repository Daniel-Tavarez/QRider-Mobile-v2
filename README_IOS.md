# 🍎 QRider RD - Guía iOS

## ✅ TODO ESTÁ LISTO - Solo ejecuta el setup

La aplicación iOS está **100% configurada y lista** para usar. Solo necesitas ejecutar un comando.

## 🚀 Inicio Rápido (1 minuto)

```bash
# Ejecuta el script de setup automático
./SETUP_IOS.sh
```

Este script:
- ✅ Verifica que tengas todas las herramientas necesarias
- ✅ Instala CocoaPods si no lo tienes
- ✅ Instala todas las dependencias
- ✅ Configura el proyecto completo

Luego ejecuta:

```bash
npm run ios
```

**¡Y listo!** La app se abrirá en el simulador.

---

## 📋 ¿Qué se ha configurado automáticamente?

### ✅ 1. Firebase & Google Sign-In
- `AppDelegate.swift` - Inicializa Firebase al arrancar
- `GoogleService-Info.plist` - Credenciales de Firebase
- URL Schemes configurados para Google Sign-In
- Bundle ID: `com.qriderrd`

### ✅ 2. TrackingService Nativo
- `TrackingService.swift` - Servicio de ubicación en background
- `TrackingServiceBridge.m` - Puente React Native
- `QRiderRD-Bridging-Header.h` - Header para interoperabilidad
- Monitoreo de ubicación 24/7

### ✅ 3. Permisos y Capabilities
- NSLocationWhenInUseUsageDescription ✅
- NSLocationAlwaysUsageDescription ✅
- NSLocationAlwaysAndWhenInUseUsageDescription ✅
- Background Modes: Location updates ✅

### ✅ 4. Dependencias (Podfile)
- Firebase/Core, Auth, Firestore
- GoogleSignIn ~> 7.0
- Todas las dependencias de React Native
- Configurado para Xcode 15+ e iOS 17+

### ✅ 5. Proyecto Xcode
- Todos los archivos Swift y Objective-C agregados
- Build Settings configurados correctamente
- Bridging Header configurado
- Bundle Identifier: `com.qriderrd`
- iOS Deployment Target: 13.4+

---

## 📱 Requisitos del Sistema

- **macOS** 13.0 o superior
- **Xcode** 15.0 o superior
- **Node.js** 20 o superior
- **CocoaPods** (se instala automáticamente)
- **iOS Simulator** o dispositivo físico con iOS 13.4+

---

## 🛠️ Comandos Útiles

### Ejecutar en simulador
```bash
npm run ios
```

### Ejecutar en dispositivo específico
```bash
npm run ios -- --device "iPhone de Daniel"
```

### Limpiar y reinstalar pods
```bash
npm run ios:clean
```

### Abrir en Xcode
```bash
open ios/QRiderRD.xcworkspace
```

**⚠️ IMPORTANTE:** Siempre abre `QRiderRD.xcworkspace`, **NUNCA** `QRiderRD.xcodeproj`

---

## 🔧 Si algo falla

### Error: "Command pod not found"
```bash
sudo gem install cocoapods
```

### Error: "No such module 'Firebase'"
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Error: Simulator no inicia
```bash
xcrun simctl shutdown all
xcrun simctl erase all
npm run ios
```

### Error: Google Sign-In no funciona
1. Verifica que el Bundle ID sea exactamente `com.qriderrd`
2. Asegúrate de que has configurado el SHA-1 en Firebase Console (para Android)
3. Para iOS, verifica que el Client ID esté en `Info.plist`

---

## 🎯 Características Implementadas

### Autenticación ✅
- Email/Password con Firebase
- Google Sign-In
- Persistencia de sesión
- Manejo de errores

### Ubicación ✅
- Tracking en foreground
- Tracking en background
- Geofencing (cercas geográficas)
- Detección automática de checkpoints
- Sincronización offline

### Base de Datos ✅
- Firebase Firestore
- Tiempo real
- Modo offline
- Sincronización automática

### Navegación ✅
- Stack navigation
- Tab navigation
- Rutas protegidas
- Deep linking

---

## 📂 Estructura del Proyecto iOS

```
ios/
├── QRiderRD/
│   ├── AppDelegate.swift              # Inicializa Firebase
│   ├── TrackingService.swift          # Servicio de ubicación
│   ├── TrackingServiceBridge.m        # Puente RN
│   ├── QRiderRD-Bridging-Header.h     # Bridging header
│   ├── Info.plist                     # Permisos y config
│   └── Images.xcassets/               # Assets e iconos
├── GoogleService-Info.plist           # Config de Firebase
├── Podfile                            # Dependencias CocoaPods
└── QRiderRD.xcworkspace              # ⚠️ ABRE ESTE ARCHIVO
```

---

## 🔐 Configuración de Firebase

El proyecto usa estos identificadores:

- **Bundle ID**: `com.qriderrd`
- **Project ID**: `qriderrd`
- **Client ID**: `476161322544-8kfo5qkmkc5f47c51lcapf6bbve59gfb.apps.googleusercontent.com`

### Para producción:

1. Ve a [Firebase Console](https://console.firebase.google.com/project/qriderrd/settings/general)
2. Verifica que el Bundle ID `com.qriderrd` esté registrado
3. Descarga el `GoogleService-Info.plist` actualizado si haces cambios
4. Reemplázalo en `ios/GoogleService-Info.plist`

---

## 📝 Notas Importantes

### Google Sign-In

El Google Sign-In está configurado con:
- Reversed Client ID en URL Schemes
- GIDClientID en Info.plist
- Inicialización en AppDelegate

### Background Location

La app puede trackear ubicación en background:
- ✅ `allowsBackgroundLocationUpdates = true`
- ✅ UIBackgroundModes incluye `location`
- ✅ Se solicita permiso "Always" al usuario

### Bridging Header

El Bridging Header permite que Swift y Objective-C trabajen juntos:
- Se configura automáticamente en Build Settings
- Path: `QRiderRD/QRiderRD-Bridging-Header.h`

---

## 🎓 Primeros Pasos Después del Setup

1. **Ejecuta el setup**
   ```bash
   ./SETUP_IOS.sh
   ```

2. **Inicia la app**
   ```bash
   npm run ios
   ```

3. **Prueba Google Sign-In**
   - La app se abrirá en el simulador
   - Haz clic en "Continuar con Google"
   - Inicia sesión con tu cuenta Google

4. **Prueba el tracking**
   - Crea o únete a un evento
   - Haz clic en "Iniciar Evento"
   - La app comenzará a trackear tu ubicación

---

## ✨ ¡Eso es todo!

La configuración de iOS está **100% completa**. Solo ejecuta:

```bash
./SETUP_IOS.sh
npm run ios
```

Y la aplicación funcionará perfectamente en iOS. 🎉

---

## 📞 Soporte

Si encuentras algún problema:

1. ✅ Verifica que ejecutaste `./SETUP_IOS.sh`
2. ✅ Asegúrate de abrir `.xcworkspace` y no `.xcodeproj`
3. ✅ Verifica que tu Mac tenga Xcode 15+ instalado
4. ✅ Limpia y reinstala pods: `npm run ios:clean`

Para más detalles técnicos, consulta `IOS_SETUP.md`
