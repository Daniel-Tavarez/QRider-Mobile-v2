# Cómo obtener y agregar el SHA-1 a Firebase

## Paso 1: Obtén tu SHA-1 fingerprint

Ejecuta este comando en tu terminal (en la raíz del proyecto):

```bash
cd android && ./gradlew signingReport
```

Busca la sección **Task :app:signingReport** y copia el **SHA-1** que está bajo "Variant: debug"

Debería verse algo como:
```
SHA1: A1:B2:C3:D4:E5:F6:G7:H8:I9:J0:K1:L2:M3:N4:O5:P6:Q7:R8:S9:T0
```

## Paso 2: Agrega el SHA-1 en Firebase Console

1. Ve a: https://console.firebase.google.com/project/qriderrd/settings/general
2. Baja hasta "Tus apps"
3. Busca tu app Android (com.qriderrd)
4. Haz clic en el ícono de configuración (⚙️) de la app
5. Busca la sección "Huellas digitales de certificado SHA"
6. Haz clic en "Agregar huella digital"
7. Pega tu SHA-1 y guarda

## Paso 3: Descarga el nuevo google-services.json

1. En la misma página, baja y busca el botón "Descargar google-services.json"
2. Descarga el archivo
3. **REEMPLAZA** el archivo en: `android/app/google-services.json`

El nuevo archivo debe tener el `oauth_client` con datos, algo como:
```json
{
  "oauth_client": [
    {
      "client_id": "476161322544-XXXXXXXXXX.apps.googleusercontent.com",
      "client_type": 3
    }
  ]
}
```

## Paso 4: Reconstruye la app

```bash
cd android
./gradlew clean
cd ..
npm run android
```

## Paso 5: Prueba Google Sign-In

Ahora el botón de Google Sign-In debería funcionar sin el error DEVELOPER_ERROR.

---

## Alternativa rápida (si no puedes ejecutar gradlew):

Usa el SHA-1 del keystore debug por defecto de Android:
```
SHA1: DA:39:A3:EE:5E:6B:4B:0D:32:55:BF:EF:95:60:18:90:AF:D8:07:09
```

Pero es mejor usar el tuyo real ejecutando `./gradlew signingReport`.
