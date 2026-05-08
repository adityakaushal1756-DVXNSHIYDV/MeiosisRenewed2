import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, Fonts } from '../../lib/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(app)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#040C18', '#071828', '#040C18']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Glow blob */}
      <View style={styles.glowBlob} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Meiosis Brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[Colors.neon, '#00C97A']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="activity" size={28} color={Colors.ink} />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>MEIOSIS</Text>
            <Text style={styles.brandSub}>Patient Portal</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSub}>Sign in to access your health records</Text>

            {/* Email Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputWrapperFocused]}>
                <Feather name="mail" size={16} color={focusedField === 'email' ? Colors.neon : Colors.mist} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.mist}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="next"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputWrapperFocused]}>
                <Feather name="lock" size={16} color={focusedField === 'password' ? Colors.neon : Colors.mist} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.mist}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={Colors.mist} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isLoading ? ['#2A8A5A', '#1D6B45'] : [Colors.neon, '#00C97A']}
                style={styles.signInGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.ink} size="small" />
                ) : (
                  <>
                    <Text style={styles.signInText}>Sign In</Text>
                    <Feather name="arrow-right" size={18} color={Colors.ink} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Meiosis Health OS</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Feather name="shield" size={14} color={Colors.neon} />
              <Text style={styles.infoText}>
                Your health data is end-to-end encrypted. Only you and your authorized doctors can access it.
              </Text>
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
    backgroundColor: Colors.ink,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  glowBlob: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.neonDim,
    opacity: 0.4,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 28,
    ...Fonts.black,
    color: Colors.white,
    letterSpacing: 6,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 12,
    ...Fonts.medium,
    color: Colors.mist,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: Colors.panel,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
  },
  cardTitle: {
    fontSize: 24,
    ...Fonts.bold,
    color: Colors.white,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: Colors.mist,
    marginBottom: Spacing.xxl,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 11,
    ...Fonts.semibold,
    color: Colors.mist,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: Colors.neon,
    backgroundColor: Colors.neonDim,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.sky,
    ...Fonts.medium,
  },
  signInBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  signInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    gap: 8,
  },
  signInText: {
    fontSize: 16,
    ...Fonts.bold,
    color: Colors.ink,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 10,
    color: Colors.mist,
    marginHorizontal: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    ...Fonts.semibold,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.neonDim,
    borderWidth: 1,
    borderColor: 'rgba(82, 255, 157, 0.15)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.mist,
    lineHeight: 18,
  },
});
