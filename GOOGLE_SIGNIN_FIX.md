# Solución al error DEVELOPER_ERROR de Google Sign-In

El error DEVELOPER_ERROR ocurre porque falta la configuración correcta del OAuth Client ID en Firebase.

## Pasos para solucionar:

### 1. Ve a Firebase Console
Abre: https://console.firebase.google.com/project/qriderrd/authentication/providers

### 2. Habilita Google Sign-In
1. En la pestaña "Sign-in method"
2. Busca "Google" en la lista de proveedores
3. Haz clic en "Google" y luego en "Habilitar"
4. Guarda los cambios

### 3. Obtén el Web Client ID correcto
1. Ve a: https://console.firebase.google.com/project/qriderrd/settings/general
2. Baja hasta la sección de "Tus apps"
3. Busca tu app Web (debe tener un icono `</>`
4. Copia el **Client ID** que empieza con algo como: `XXXXXXXX.apps.googleusercontent.com`

### 4. Actualiza el código
Abre el archivo: `src/contexts/AuthContext.tsx`

Encuentra la línea:
```typescript
GoogleSignin.configure({
  webClientId: '969099536473-89gcn8vq9dg7t7nqg8s2r6u5p5otqhbl.apps.googleusercontent.com',
});
```

Reemplaza el `webClientId` con el que copiaste en el paso 3.

### 5. Descarga el nuevo google-services.json
1. Ve a: https://console.firebase.google.com/project/qriderrd/settings/general
2. Baja hasta "Tus apps"
3. Selecciona tu app Android
4. Descarga el archivo `google-services.json` actualizado
5. Reemplaza el archivo en: `android/app/google-services.json`

### 6. Reconstruye la app
```bash
cd android
./gradlew clean
cd ..
npm run android
```

## Solución rápida alternativa:

Si ya tienes el Web Client ID correcto de Firebase, simplemente actualiza esta línea en `src/contexts/AuthContext.tsx`:

```typescript
GoogleSignin.configure({
  webClientId: 'TU_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com',
});
```

El Web Client ID debe ser el de la **aplicación Web** en Firebase, no el de Android.

## Verificación:

El google-services.json actualizado debe tener una estructura como esta:
```json
{
  "client": [
    {
      "oauth_client": [
        {
          "client_id": "XXXXX.apps.googleusercontent.com",
          "client_type": 3
        }
      ]
    }
  ]
}
```

Si tu archivo no tiene `oauth_client`, necesitas seguir los pasos anteriores.
