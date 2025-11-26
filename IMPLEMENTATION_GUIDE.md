# Guía de Implementación - Sistema de Perfiles y Registro de Eventos

## Estado Actual

He implementado la infraestructura completa para los 4 flujos solicitados:

### ✅ Completado

1. **Type Definitions** (`src/types/index.ts`)
   - Interfaces completas para UserProfile, Event, Route, EventRegistration
   - Tipos para Gender, VehicleType, EmergencyRelationship, PrivacySettings
   - ParticipantStats para estadísticas de usuarios

2. **Utilidades**
   - `src/utils/privacyHelpers.ts` - Función getVisibleProfile para filtrar datos según privacidad
   - `src/utils/validation.ts` - Validaciones completas de formularios

3. **Form Components** (`src/components/forms/`)
   - FormInput - Input con validación y errores
   - FormPicker - Selector modal con opciones
   - FormDatePicker - Selector de fechas (requiere dependencia)
   - FormToggle - Switch con label y descripción

4. **Custom Hooks** (`src/hooks/`)
   - `useProfileSetup.ts` - Hook para wizard de setup inicial
   - `useProfileEdit.ts` - Hook para edición de perfil
   - `useEventRegistration.ts` - Hook para registro a eventos
   - `useParticipantProfile.ts` - Hook para ver perfiles de otros

5. **Profile Components** (`src/components/profile/`)
   - ProfileHeader - Avatar y nombre
   - ProfileSection - Wrapper para secciones
   - InfoRow - Fila de información
   - VehicleCard - Card de vehículo
   - StatsCard - Card de estadísticas
   - PrivacyBanner - Banner de privacidad
   - PrivateInfo - Mensaje de info privada
   - StepIndicator - Indicador de pasos para wizard

6. **Screens**
   - `ProfileSetupScreen.tsx` - Wizard multi-paso completo (4 pasos)

## Dependencias Requeridas

### Instalar ahora:

```bash
npm install @react-native-community/datetimepicker
cd ios && pod install && cd ..
```

## Pantallas Pendientes

### 1. ProfileEditScreen.tsx

```typescript
// src/screens/ProfileEditScreen.tsx
// Similar a ProfileSetupScreen pero:
// - Permite navegación atrás
// - Muestra todos los campos en una sola pantalla con ScrollView
// - Usa useProfileEdit hook
// - Botón "Guardar Cambios" en header
// - Alert si hay cambios sin guardar al ir atrás
```

### 2. EventDetailScreen.tsx

```typescript
// src/screens/EventDetailScreen.tsx
// Mostrar:
// - Información del evento (nombre, fecha, ubicación, descripción)
// - Lista de rutas disponibles
// - Botón "Inscribirme" o "Ya estás inscrito" (según existingRegistration)
// - Al tap en "Inscribirme" → navigation.navigate('EventRegistration', { eventId })
```

### 3. EventRegistrationScreen.tsx

```typescript
// src/screens/EventRegistrationScreen.tsx
// Usar useEventRegistration hook
// Secciones:
// 1. Selección de Ruta (radio buttons)
// 2. Información Personal (pre-llenada, editable)
// 3. Contacto de Emergencia (pre-llenada, editable)
// 4. Información de Vehículo (condicional)
// Botón "Confirmar Inscripción" (disabled si no hay ruta seleccionada)
```

### 4. ParticipantProfileScreen.tsx

```typescript
// src/screens/ParticipantProfileScreen.tsx
// Usar useParticipantProfile hook
// Mostrar:
// - ProfileHeader
// - ProfileSection con InfoRow para cada campo (o PrivateInfo si no visible)
// - VehicleCard (si visible)
// - StatsCard
// - PrivacyBanner (si perfil es privado)
// - Botón "Editar mi perfil" si isOwnProfile
```

## Actualización de Navigation

### AppNavigator.tsx

Agregar nuevas screens:

```typescript
<Stack.Screen
  name="ProfileSetup"
  component={ProfileSetupScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="ProfileEdit"
  component={ProfileEditScreen}
  options={{ title: 'Editar Perfil' }}
/>
<Stack.Screen
  name="EventRegistration"
  component={EventRegistrationScreen}
  options={{ title: 'Inscripción' }}
/>
<Stack.Screen
  name="ParticipantProfile"
  component={ParticipantProfileScreen}
  options={{ title: 'Perfil' }}
/>
```

## Actualización de AuthContext

### src/contexts/AuthContext.tsx

Agregar verificación de perfil después del login:

```typescript
const handleAuthSuccess = async (user: FirebaseAuthTypes.User) => {
  try {
    const profileDoc = await db()
      .collection('userProfiles')
      .doc(user.uid)
      .get();

    if (!profileDoc.exists) {
      // NO tiene perfil → Forzar creación
      navigation.replace('ProfileSetup');
    } else {
      // Tiene perfil → Dashboard normal
      navigation.replace('Main');
    }
  } catch (error) {
    console.error('Error checking profile:', error);
  }
};
```

## Colecciones de Firestore

### Estructura requerida:

1. **userProfiles/{userId}**
   - Ver interface UserProfile en src/types/index.ts

2. **events/{eventId}**
   - Ver interface Event en src/types/index.ts

3. **events/{eventId}/routes/{routeId}**
   - Ver interface RouteDoc en src/types/index.ts

4. **eventRegistrations/{registrationId}**
   - Ver interface EventRegistration en src/types/index.ts

## Reglas de Seguridad de Firestore (Sugeridas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User Profiles
    match /userProfiles/{userId} {
      allow read: if true; // Filtrado por privacidad en app
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Events
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;

      // Routes subcollection
      match /routes/{routeId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }

    // Event Registrations
    match /eventRegistrations/{registrationId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Testing Checklist

### ProfileSetup
- [ ] Wizard avanza correctamente por los 4 pasos
- [ ] Validaciones funcionan en cada paso
- [ ] No se puede ir atrás desde paso 0
- [ ] Perfil se crea correctamente en Firestore
- [ ] Redirección a Main después de crear perfil

### ProfileEdit
- [ ] Carga perfil existente
- [ ] Cambios se guardan correctamente
- [ ] Alert si hay cambios sin guardar
- [ ] Validaciones funcionan

### EventRegistration
- [ ] Carga evento, rutas y perfil del usuario
- [ ] Datos se pre-llenan del perfil
- [ ] Selección de ruta funciona
- [ ] Validación de cupos disponibles
- [ ] Registro se crea correctamente
- [ ] Contador de participantes se incrementa

### ParticipantProfile
- [ ] Carga perfil del participante
- [ ] Privacidad se respeta correctamente
- [ ] Estadísticas se cargan
- [ ] Diferencia entre perfil propio y ajeno

## Integración con Pantallas Existentes

### EventsScreen
Agregar navegación a EventDetailScreen:

```typescript
onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
```

### ParticipantsScreen
Agregar navegación a ParticipantProfile:

```typescript
onPress={() => navigation.navigate('ParticipantProfile', {
  userId: participant.userId,
  eventId: eventId
})}
```

### ProfileScreen
Agregar navegación a ProfileEdit:

```typescript
<Button
  title="Editar Perfil"
  onPress={() => navigation.navigate('ProfileEdit')}
/>
```

## Notas Importantes

1. **DatePicker**: Requiere instalación de `@react-native-community/datetimepicker`
2. **Privacy**: La función `getVisibleProfile` maneja toda la lógica de privacidad
3. **Validation**: Usar funciones de `utils/validation.ts` para validar formularios
4. **Loading States**: Todos los hooks manejan estados de loading y error
5. **Firestore Timestamps**: Usar `db.FieldValue.serverTimestamp()` para timestamps

## Próximos Pasos

1. Instalar dependencia @react-native-community/datetimepicker
2. Implementar las 3 pantallas pendientes
3. Actualizar AppNavigator con nuevas rutas
4. Actualizar AuthContext para verificar perfil
5. Agregar navegación desde pantallas existentes
6. Configurar reglas de Firestore
7. Testing completo del flujo

## Soporte

Toda la infraestructura está lista. Los hooks manejan la lógica de negocio, los componentes de UI están listos para usar, y las validaciones están implementadas.

Las pantallas pendientes solo necesitan ensamblar estos componentes usando los hooks correspondientes.
