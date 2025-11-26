# Cambios Críticos Necesarios

## 1. Cambiar `userProfiles` → `profiles` en TODOS los archivos

### Archivos a actualizar:
- `src/hooks/useProfileEdit.ts` - Línea con `.collection('userProfiles')`
- `src/hooks/useEventRegistration.ts` - Línea con `.collection('userProfiles')`
- `src/hooks/useParticipantProfile.ts` - Línea con `.collection('userProfiles')`
- `src/utils/privacyHelpers.ts` - Comentarios/docs si los hay

**Buscar y reemplazar:**
```
Buscar: .collection('userProfiles')
Reemplazar: .collection('profiles')
```

## 2. Estructura de Profile Real (según imágenes)

La tabla `profiles` tiene:

```typescript
interface UserProfile {
  uid: string;
  fullName: string;
  nickname?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  dateOfBirth?: string; // "2025-09-03"
  nationalId?: string;

  bloodType?: string; // "O+"
  allergies?: string;
  medications?: string;
  medicalNotes?: string;

  // ARRAY de contactos
  contacts: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    relationship: string; // "Esposa", "Padre", etc
    whatsapp?: boolean;
  }>;

  // ARRAY de seguros
  insurances?: Array<{
    provider?: string;
    planName?: string;
    policyNumber?: string;
    isPrimary?: boolean;
    notes?: string;
  }>;

  // Objetos anidados
  address?: {
    city?: string;
    country?: string; // "República Dominicana"
    state?: string;
  };

  aeroAmbulance?: {
    enrolled?: boolean;
    memberId?: string;
    notes?: string;
    phone?: string;
    provider?: string;
  };

  bike?: {
    brand?: string; // "s"
    color?: string;
    model?: string; // "s"
    plate?: string; // "s"
  };

  preferredCare?: {
    city?: string;
    clinicName?: string;
    doctorName?: string;
    doctorPhone?: string;
  };

  preferences?: {
    showAddress?: boolean;
    showAeroAmbulance?: boolean;
    showAllergies?: boolean;
    showBikeInfo?: boolean;
    showBloodTypePublic?: boolean;
    showDOB?: boolean;
    showInsurances?: boolean;
    showMedicalNotes?: boolean;
    showMedications?: boolean;
    showPreferredCare?: boolean;
  };

  updatedAt: Timestamp;
}
```

## 3. ProfileSetupScreen - Necesita manejo de arrays

Ya está actualizado en el archivo que escribí. Los contactos se manejan como array con botones "Agregar" y "Eliminar".

## 4. Hacer TODOS los campos opcionales en validaciones

En `src/utils/validation.ts`:

```typescript
// ELIMINAR o hacer opcionales todas las validaciones de campos requeridos
// Solo validar formato si el campo existe, pero NO requerir nada

export const validatePersonalInfo = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Solo validar SI existe
  if (data.fullName && data.fullName.length < 3) {
    errors.push({
      field: 'fullName',
      message: 'El nombre debe tener al menos 3 caracteres',
    });
  }

  if (data.primaryPhone && data.primaryPhone.length < 10) {
    errors.push({
      field: 'primaryPhone',
      message: 'El teléfono es inválido',
    });
  }

  return errors;
};
```

## 5. AppNavigator - Ya está correcto

El flujo actual:
- Login exitoso → AuthContext verifica si existe perfil en `profiles` collection
- Si `hasProfile = false` → Muestra ProfileSetupScreen (no puede ir atrás)
- Si `hasProfile = true` → Muestra Main (puede editar perfil cuando quiera)

## 6. Comandos SQL para ejecutar (si fuera necesario)

```bash
# Buscar y reemplazar en todos los hooks
grep -r "userProfiles" src/hooks/
# Luego reemplazar manualmente en cada archivo encontrado
```

## Resumen de lo que YA está hecho:

✅ AuthContext actualizado para verificar `profiles` collection
✅ hasProfile controla si muestra ProfileSetup o Main
✅ useProfileSetup actualizado con estructura correcta
✅ ProfileSetupScreen con manejo de arrays de contactos
✅ Types actualizados con estructura real

## Lo que FALTA hacer manualmente:

1. Actualizar `useProfileEdit.ts` para usar `profiles` y estructura correcta
2. Actualizar `useEventRegistration.ts` para usar `profiles`
3. Actualizar `useParticipantProfile.ts` para usar `profiles`
4. Actualizar `ProfileEditScreen.tsx` con campos correctos y arrays
5. Actualizar `EventRegistrationScreen.tsx` si usa perfiles
6. Actualizar validaciones para hacer TODO opcional

La forma más rápida es buscar "userProfiles" en todo el proyecto y reemplazar por "profiles".
