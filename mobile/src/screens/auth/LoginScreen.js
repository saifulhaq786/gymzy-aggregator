import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

let GoogleSignin;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  GoogleSignin.configure({ webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID' });
} catch (e) {
  GoogleSignin = {
    configure: () => {},
    hasPlayServices: async () => true,
    signIn: async () => {
      throw new Error('Google Sign-In is not supported in Expo Go. Please use Email or Phone login to test.');
    }
  };
}

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);

  const { login, googleLogin } = useAuthStore();

  const handleEmailLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      setGoogleModalVisible(true);
    } else {
      Alert.alert(
        'Google Sign-In (Simulation)',
        'Select a simulated Google profile to test the app state:',
        [
          {
            text: 'Demo Gym Member (Jane Doe)',
            onPress: async () => {
              setGoogleLoading(true);
              try {
                await googleLogin('mock_user');
              } catch (err) {
                Alert.alert('Google Login Failed', err.response?.data?.message || err.message);
              } finally {
                setGoogleLoading(false);
              }
            }
          },
          {
            text: 'Demo Gym Owner (John Smith)',
            onPress: async () => {
              setGoogleLoading(true);
              try {
                await googleLogin('mock_owner');
              } catch (err) {
                Alert.alert('Google Login Failed', err.response?.data?.message || err.message);
              } finally {
                setGoogleLoading(false);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🏋️ GYMZY</Text>
          <Text style={styles.tagline}>Find your perfect gym, nearby.</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleEmailLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} disabled={googleLoading}>
              {googleLoading ? (
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
              ) : (
                <>
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialText}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => navigation.navigate('PhoneOTP')}
            >
              <MaterialCommunityIcons name="phone" size={18} color={COLORS.textPrimary} />
              <Text style={styles.socialText}>Phone</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Web Fallback Simulation Modal */}
      <Modal
        visible={googleModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Google Sign-In</Text>
            <Text style={styles.modalSubtitle}>Select a simulated profile to test the app:</Text>

            <TouchableOpacity
              style={[styles.modalOptionBtn, { backgroundColor: COLORS.primary }]}
              onPress={async () => {
                setGoogleModalVisible(false);
                setGoogleLoading(true);
                try {
                  await googleLogin('mock_user');
                } catch (err) {
                  Alert.alert('Google Login Failed', err.response?.data?.message || err.message);
                } finally {
                  setGoogleLoading(false);
                }
              }}
            >
              <Text style={styles.modalOptionText}>Demo Gym Member (Jane Doe)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOptionBtn, { backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: COLORS.border }]}
              onPress={async () => {
                setGoogleModalVisible(false);
                setGoogleLoading(true);
                try {
                  await googleLogin('mock_owner');
                } catch (err) {
                  Alert.alert('Google Login Failed', err.response?.data?.message || err.message);
                } finally {
                  setGoogleLoading(false);
                }
              }}
            >
              <Text style={[styles.modalOptionText, { color: COLORS.textPrimary }]}>Demo Gym Owner (John Smith)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setGoogleModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, width: '100%', maxWidth: 480, paddingHorizontal: SPACING.base, paddingTop: 80, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: SPACING['3xl'] },
  logo: { fontSize: 36, fontWeight: '900', color: COLORS.primary, letterSpacing: 2 },
  tagline: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginTop: SPACING.xs },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginBottom: SPACING.xl },

  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.md },

  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.glow,
  },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: FONTS.sizes.md },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginHorizontal: SPACING.sm },

  socialRow: { flexDirection: 'row', gap: SPACING.sm },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialIcon: { fontSize: 16, fontWeight: '900', color: '#EA4335' },
  socialText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: FONTS.sizes.base },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
  footerLink: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalOptionBtn: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalOptionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONTS.sizes.base,
  },
  modalCancelBtn: {
    marginTop: SPACING.xs,
    padding: SPACING.sm,
  },
  modalCancelText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: FONTS.sizes.base,
  },
});

export default LoginScreen;
