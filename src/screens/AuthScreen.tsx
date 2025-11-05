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
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/qrider.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            {/* <Text style={styles.heroTitle}>Bienvenido a QRider</Text> */}
            <Text style={styles.heroSubtitle}>
              Tu compañero de aventuras sobre ruedas
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </Text>
              <View style={styles.accentLine} />
            </View>

            {isSignUp && (
              <View style={styles.inputWrapper}>
                {/* <Icon name="person" size={20} color={theme.colors.gray[500]} /> */}
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholderTextColor={theme.colors.gray[500]}
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              {/* <Icon name="mail" size={20} color={theme.colors.gray[500]} /> */}
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
            </View>

            <View style={styles.inputWrapper}>
              {/* <Icon name="lock-closed" size={20} color={theme.colors.gray[500]} /> */}
              <TextInput
                placeholderTextColor={theme.colors.gray[500]}
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            {isSignUp && (
              <View style={styles.inputWrapper}>
                {/* <Icon name="lock-closed" size={20} color={theme.colors.gray[500]} /> */}
                <TextInput
                  placeholderTextColor={theme.colors.gray[500]}
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>
            )}

            <Button
              title={isSignUp ? 'Crear cuenta gratuita' : 'Iniciar sesión'}
              onPress={handleAuth}
              loading={loading}
              style={styles.authButton}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>o continúa con</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleAuth}
              disabled={loading}
            >
              <Icon name="logo-google" size={22} color="#4285F4" />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>

            {!isSignUp && (
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              </Text>
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                <Text style={styles.switchLink}>
                  {isSignUp ? 'Iniciar sesión' : 'Crear cuenta'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
    paddingBottom: -theme.spacing.lg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 150,
    height: 150,
    marginBottom: 0,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formHeader: {
    marginBottom: theme.spacing.xl,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  accentLine: {
    width: 60,
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  authButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[300],
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    height: 56,
  },
  googleButtonText: {
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '600',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  forgotText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.xs,
  },
  switchLink: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
