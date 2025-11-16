# 🔧 Solución al Error: "Multiple projects with .xcodeproj"

## ❌ Error que estás viendo:

```
xcodebuild: error: The directory /Users/.../ios contains 2 projects,
including multiple projects with the current extension (.xcodeproj).
Specify the project to use with the -project option.
```

## ✅ SOLUCIÓN RÁPIDA (Opción 1 - Recomendada)

Ejecuta este script que arregla todo automáticamente:

```bash
./FIX_IOS.sh
```

Luego:

```bash
npm run ios
```

## ✅ SOLUCIÓN MANUAL (Opción 2)

### Paso 1: Verificar proyectos duplicados

```bash
cd ios
ls -la *.xcodeproj
```

Deberías ver solo **QRiderRD.xcodeproj**. Si ves otros proyectos, elimínalos.

### Paso 2: Eliminar proyectos duplicados

```bash
# Elimina cualquier proyecto que NO sea QRiderRD.xcodeproj
# Por ejemplo, si hay uno llamado QRider.xcodeproj:
rm -rf QRider.xcodeproj
```

### Paso 3: Limpiar y reinstalar

```bash
# Limpiar todo
rm -rf Pods
rm -rf Podfile.lock
rm -rf build

# Reinstalar
pod install

# Volver al directorio raíz
cd ..
```

### Paso 4: Ejecutar con proyecto específico

```bash
npm run ios
```

El script ya incluye `--project-path ios/QRiderRD.xcodeproj` automáticamente.

## ✅ SOLUCIÓN ALTERNATIVA (Opción 3)

Si las opciones anteriores no funcionan, abre directamente en Xcode:

```bash
# Asegúrate de abrir el workspace, NO el proyecto
open ios/QRiderRD.xcworkspace
```

Luego en Xcode:
1. Selecciona el esquema "QRiderRD"
2. Selecciona un simulador
3. Presiona el botón Play (▶️)

## 🔍 ¿Por qué pasa esto?

Este error ocurre cuando hay múltiples archivos `.xcodeproj` en el directorio `ios/`.

Posibles causas:
- Proyecto renombrado dejando el antiguo
- Migración de un proyecto anterior
- Clonación de múltiples ramas

## 🛠️ Comandos útiles para diagnosticar

### Ver todos los proyectos:
```bash
find ios -name "*.xcodeproj" -type d
```

### Ver estructura del directorio ios:
```bash
ls -la ios/
```

Deberías ver:
- ✅ `QRiderRD.xcodeproj` - EL PROYECTO CORRECTO
- ✅ `QRiderRD.xcworkspace` - EL QUE DEBES ABRIR
- ✅ `Pods/` - Dependencias
- ✅ `Podfile` - Configuración
- ❌ Ningún otro `.xcodeproj`

## 📝 Después de arreglar

Una vez que el error esté solucionado, estos comandos deberían funcionar:

```bash
# Desarrollo normal
npm run ios

# Limpiar y reinstalar si hay problemas
npm run ios:clean

# Reparar configuración completa
npm run ios:fix
```

## 🚨 Si el script FIX_IOS.sh da error de permisos

```bash
chmod +x FIX_IOS.sh
./FIX_IOS.sh
```

## ✨ Verificación final

Después de ejecutar la solución, verifica que todo esté bien:

```bash
# 1. Solo debe haber UN proyecto
ls ios/*.xcodeproj

# 2. Los pods deben estar instalados
ls ios/Pods

# 3. El workspace debe existir
ls ios/*.xcworkspace
```

Si todo está bien, verás:
- ✅ ios/QRiderRD.xcodeproj
- ✅ ios/Pods
- ✅ ios/QRiderRD.xcworkspace

---

## 🎯 Resumen: Tres formas de solucionarlo

### 1. Automática (Más fácil)
```bash
./FIX_IOS.sh
npm run ios
```

### 2. Manual rápida
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

### 3. Desde Xcode
```bash
open ios/QRiderRD.xcworkspace
# Luego presiona Play en Xcode
```

---

**¡Elige la opción que prefieras y tu app funcionará!** 🚀
