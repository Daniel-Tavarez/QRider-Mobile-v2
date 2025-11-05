import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

export function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();

  const showError = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const showSuccess = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showError('Error', 'Por favor completa todos los campos');
      return;
    }

    if (isSignUp) {
      if (!displayName) {
        showError('Error', 'El nombre es requerido');
        return;
      }
      if (password !== confirmPassword) {
        showError('Error', 'Las contraseñas no coinciden');
        return;
      }
      if (password.length < 6) {
        showError('Error', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        showSuccess('¡Cuenta creada!', 'Tu perfil de emergencia está listo');
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = getErrorMessage(error.code);
      showError('Error de autenticación', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google auth error:', error);
      showError('Error', 'No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showError('Error', 'Ingresa tu email para recuperar la contraseña');
      return;
    }

    try {
      await resetPassword(email);
      showSuccess(
        'Email enviado',
        'Revisa tu correo para restablecer tu contraseña',
      );
    } catch (error) {
      showError('Error', 'No se pudo enviar el email de recuperación');
    }
  };

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email o contraseña incorrectos';
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde';
      default:
        return 'Ha ocurrido un error. Intenta de nuevo';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Image
                source={require('../assets/qrider.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </Text>

            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoComplete="name"
                placeholderTextColor={theme.colors.gray[500]}
              />
            )}

            <TextInput
              placeholderTextColor={theme.colors.gray[500]}
              style={styles.input}
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              placeholderTextColor={theme.colors.gray[500]}
              style={styles.input}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {isSignUp && (
              <TextInput
                placeholderTextColor={theme.colors.gray[500]}
                style={styles.input}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password"
              />
            )}

            <Button
              title={isSignUp ? 'Crear cuenta gratuita' : 'Iniciar sesión'}
              onPress={handleAuth}
              loading={loading}
              style={styles.authButton}
            />

            {/* Google Sign In */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleAuth}
              disabled={loading}
            >
              <Icon name="logo-google" size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>
                {isSignUp
                  ? 'Crear cuenta con Google'
                  : 'Iniciar sesión con Google'}
              </Text>
            </TouchableOpacity>

            {!isSignUp && (
              <Button
                title="¿Olvidaste tu contraseña?"
                onPress={handleForgotPassword}
                variant="outline"
                style={styles.forgotButton}
              />
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              </Text>
              <Button
                title={isSignUp ? 'Iniciar sesión' : 'Crear cuenta'}
                onPress={() => setIsSignUp(!isSignUp)}
                variant="outline"
                size="small"
                style={styles.switchButton}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  keyboardView: {
    flex: 1,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoPlaceholder: {
    width: 180,
    height: 150,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -theme.spacing.md,
  },
  formCard: {
    marginBottom: theme.spacing.lg,
  },
  formTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    color: theme.colors.text,
  },
  authButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  googleButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '600',
  },
  forgotButton: {
    marginBottom: theme.spacing.lg,
  },
  switchContainer: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  switchButton: {
    minHeight: 36,
  },
});
