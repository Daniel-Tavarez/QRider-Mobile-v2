# 🔧 Solución al Error: unknown option '--project-path'

## ❌ Error que viste:

```
error: unknown option '--project-path'
```

## ✅ YA ESTÁ ARREGLADO

El `package.json` ahora usa los flags compatibles con el nuevo CLI (v20+), que detecta automáticamente el proyecto de Xcode.

## 🚀 Ahora ejecuta:

```bash
npm run ios
```

¡Eso es todo! El comando ahora usa las opciones correctas.

---

## 📝 ¿Qué cambió?

**Antes (CLI antiguo):**
```bash
react-native run-ios --project-path ios/QRiderRD.xcodeproj
```

Luego intentamos con:
```bash
react-native run-ios --scheme QRiderRD --xcodeproj ios/QRiderRD.xcodeproj
```

**Ahora (CLI 20+):**
```bash
react-native run-ios --scheme QRiderRD
```

El CLI se encarga de encontrar automáticamente `ios/QRiderRD.xcodeproj`.

---

## 🎯 Comandos disponibles:

```bash
# Ejecutar la app
npm run ios

# Limpiar e instalar pods
npm run ios:clean

# Reparar configuración completa
npm run ios:fix

# Comando directo
npx react-native run-ios --scheme QRiderRD
```

---

## 📱 Alternativa: Usar Xcode

```bash
open ios/QRiderRD.xcworkspace
```

Luego presiona Play (▶️) en Xcode.

---

## ✨ Listo para usar

Ejecuta y disfruta:

```bash
npm run ios
```

🎉
