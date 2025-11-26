export interface ValidationError {
  field: string;
  message: string;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

export const validatePersonalInfo = (data: {
  displayName: string;
  email: string;
  phone: string;
  birthDate?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.displayName || data.displayName.length < 3) {
    errors.push({
      field: 'displayName',
      message: 'El nombre debe tener al menos 3 caracteres',
    });
  }

  if (data.displayName && data.displayName.length > 50) {
    errors.push({
      field: 'displayName',
      message: 'El nombre no puede tener más de 50 caracteres',
    });
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'El email es inválido',
    });
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.push({
      field: 'phone',
      message: 'El teléfono es inválido',
    });
  }

  if (data.birthDate) {
    const age = calculateAge(data.birthDate);
    if (age < 13) {
      errors.push({
        field: 'birthDate',
        message: 'Debes tener al menos 13 años',
      });
    }
    if (age > 100) {
      errors.push({
        field: 'birthDate',
        message: 'La fecha de nacimiento es inválida',
      });
    }
  }

  return errors;
};

export const validateMedicalInfo = (data: {
  bloodType?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.bloodType) {
    errors.push({
      field: 'bloodType',
      message: 'El tipo de sangre es requerido',
    });
  }

  if (!data.emergencyContact) {
    errors.push({
      field: 'emergencyContact',
      message: 'El contacto de emergencia es requerido',
    });
    return errors;
  }

  if (!data.emergencyContact.name || data.emergencyContact.name.length < 3) {
    errors.push({
      field: 'emergencyContact.name',
      message: 'El nombre del contacto de emergencia es requerido',
    });
  }

  if (
    !data.emergencyContact.phone ||
    !validatePhone(data.emergencyContact.phone)
  ) {
    errors.push({
      field: 'emergencyContact.phone',
      message: 'El teléfono del contacto de emergencia es inválido',
    });
  }

  if (!data.emergencyContact.relationship) {
    errors.push({
      field: 'emergencyContact.relationship',
      message: 'La relación con el contacto de emergencia es requerida',
    });
  }

  return errors;
};

export const validateProfile = (data: any): ValidationError[] => {
  const personalErrors = validatePersonalInfo(data);
  const medicalErrors = validateMedicalInfo(data);

  return [...personalErrors, ...medicalErrors];
};
