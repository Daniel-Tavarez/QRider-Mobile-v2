# Instrucciones para habilitar Google Sign-In

El código ya está configurado correctamente. Para que Google Sign-In funcione, necesitas reconstruir la aplicación nativa.

## Pasos para Android:

1. **Detén el servidor Metro si está corriendo**

2. **Limpia el build anterior:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

3. **Reconstruye e instala la app:**
   ```bash
   npm run android
   ```
   O alternativamente:
   ```bash
   npx react-native run-android
   ```

## Pasos para iOS (si usas iOS):

1. **Instala los pods:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. **Reconstruye la app:**
   ```bash
   npm run ios
   ```

## Verificación:

Una vez reconstruida la app, el botón de Google Sign-In debería funcionar correctamente. El error "cannot read property of GoogleSignin of undefined" desaparecerá.

## Nota importante:

- El paquete `@react-native-google-signin/google-signin` ya está instalado
- La configuración en `AuthContext.tsx` ya está lista
- Solo falta el linking nativo que se hace al reconstruir la app
