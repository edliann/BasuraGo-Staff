import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { signIn } from '@/services/facilityStaff';

function getLoginError(error: unknown): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : '';

  if (code === 'auth/user-disabled') {
    return 'This account is disabled. Contact your administrator.';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-email' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  ) {
    return 'The email or password is incorrect.';
  }
  if (
    code === 'auth/network-request-failed' ||
    code === 'auth/too-many-requests' ||
    code === 'functions/unavailable' ||
    code === 'functions/deadline-exceeded'
  ) {
    return 'The service is unavailable. Check your connection and try again.';
  }

  return 'Unable to sign in. Please try again.';
}

export default function LoginScreen() {
  const {
    status,
    error: authorizationError,
    clearError,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authorized') {
    return <Redirect href="/dashboard" />;
  }
  if (status === 'initializing' || (status === 'checking' && !loginError)) {
    return <LoadingScreen />;
  }

  async function handleSignIn() {
    setLoginError('');
    clearError();
    if (!email.trim() || !password) {
      setLoginError('Enter your email and password to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (signInError) {
      console.error('Facility staff sign-in failed:', signInError);
      setLoginError(getLoginError(signInError));
    } finally {
      setSubmitting(false);
    }
  }

  const message = loginError || authorizationError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.heading}>
            <Text style={styles.brand}>BasuraGo</Text>
            <Text style={styles.role}>FACILITY STAFF</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to access your assigned facility.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!submitting}
              returnKeyType="next"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              editable={!submitting}
              onSubmitEditing={handleSignIn}
              returnKeyType="done"
            />

            {message ? (
              <Text style={styles.error} accessibilityRole="alert">
                {message}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (submitting || pressed) && styles.buttonMuted,
              ]}
              onPress={handleSignIn}
              disabled={submitting}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  heading: {
    marginBottom: 36,
  },
  brand: {
    color: '#1F7A3F',
    fontSize: 34,
    fontWeight: '800',
  },
  role: {
    marginTop: 4,
    color: '#55705C',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    marginTop: 36,
    color: '#18231B',
    fontSize: 27,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    color: '#59665C',
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 10,
  },
  label: {
    marginTop: 8,
    color: '#26342A',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D5DED6',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#18231B',
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    minHeight: 54,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1F7A3F',
  },
  buttonMuted: {
    opacity: 0.68,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
