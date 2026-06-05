import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Modal, StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';
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
      throw new Error('Google Sign-In is not supported in Expo Go. Use Email or Phone login.');
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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const { login, googleLogin } = useAuthStore();

  const handleEmailLogin = async () => {
    if (!email || !password) return Alert.alert('Missing Fields', 'Please fill in all fields.');
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
        'Continue with Google',
        'Select a demo profile:',
        [
          { text: 'Member Account', onPress: async () => { setGoogleLoading(true); try { await googleLogin('mock_user'); } catch (err) { Alert.alert('Error', err.message); } finally { setGoogleLoading(false); } } },
          { text: 'Partner Account', onPress: async () => { setGoogleLoading(true); try { await googleLogin('mock_owner'); } catch (err) { Alert.alert('Error', err.message); } finally { setGoogleLoading(false); } } },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#0F0F0F', '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Volt accent glow blob top-right */}
      <View style={styles.glowBlob} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo mark */}
        <View style={styles.logoSection}>
          <View style={styles.logoMark}>
            <MaterialCommunityIcons name="dumbbell" size={28} color="#000" />
          </View>
          <Text style={styles.logoText}>GYMZY</Text>
          <Text style={styles.tagline}>FIND YOUR CLUB · TRAIN HARDER</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.subText}>Sign in to continue your journey</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <View style={[styles.inputRow, emailFocused && styles.inputRowFocused]}>
              <MaterialCommunityIcons
                name="email-outline" size={18}
                color={emailFocused ? COLORS.primary : COLORS.textMuted}
              />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={[styles.inputRow, passFocused && styles.inputRowFocused]}>
              <MaterialCommunityIcons
                name="lock-outline" size={18}
                color={passFocused ? COLORS.primary : COLORS.textMuted}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnLoading]}
            onPress={handleEmailLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social row */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={18} color="#EA4335" />
                  <Text style={styles.socialText}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => navigation.navigate('PhoneOTP')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="phone-outline" size={18} color={COLORS.primary} />
              <Text style={styles.socialText}>Phone OTP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Gymzy? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Web Google Modal */}
      <Modal visible={googleModalVisible} transparent animationType="fade" onRequestClose={() => setGoogleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Profile</Text>
            <Text style={styles.modalSub}>Select a demo account to continue</Text>

            <TouchableOpacity style={styles.modalPrimary} onPress={async () => { setGoogleModalVisible(false); setGoogleLoading(true); try { await googleLogin('mock_user'); } catch (err) { Alert.alert('Error', err.message); } finally { setGoogleLoading(false); } }}>
              <Text style={styles.modalPrimaryText}>Gym Member</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalSecondary} onPress={async () => { setGoogleModalVisible(false); setGoogleLoading(true); try { await googleLogin('mock_owner'); } catch (err) { Alert.alert('Error', err.message); } finally { setGoogleLoading(false); } }}>
              <Text style={styles.modalSecondaryText}>Gym Partner</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setGoogleModalVisible(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },

  glowBlob: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(200,255,0,0.06)',
  },

  logoSection: { alignItems: 'center', marginBottom: SPACING['3xl'] },
  logoMark: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.glow,
  },
  logoText: { fontSize: FONTS.sizes['4xl'], fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 4 },
  tagline: { fontSize: FONTS.sizes['2xs'], fontWeight: '700', color: COLORS.textMuted, letterSpacing: 2.5, marginTop: 6 },

  form: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  welcomeText: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  subText: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginBottom: SPACING.xl },

  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 52,
  },
  inputRowFocused: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(200,255,0,0.03)',
  },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '500' },

  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.sm, ...SHADOWS.glow,
  },
  primaryBtnLoading: { opacity: 0.8 },
  primaryBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.base, letterSpacing: 1.5 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '700', marginHorizontal: SPACING.md, letterSpacing: 1 },

  socialRow: { flexDirection: 'row', gap: SPACING.sm },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md, height: 48,
    borderWidth: 1, borderColor: COLORS.border,
  },
  socialText: { color: COLORS.textPrimary, fontWeight: '600', fontSize: FONTS.sizes.base },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
  footerLink: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlayStrong, justifyContent: 'flex-end', padding: SPACING.base },
  modalCard: {
    backgroundColor: COLORS.bgModal, borderRadius: RADIUS['2xl'],
    padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.xl,
  },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  modalPrimary: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  modalPrimaryText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.base, letterSpacing: 0.5 },
  modalSecondary: {
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md,
    height: 52, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm,
  },
  modalSecondaryText: { color: COLORS.textPrimary, fontWeight: '700', fontSize: FONTS.sizes.base },
  modalCancel: { alignItems: 'center', paddingVertical: SPACING.sm },
  modalCancelText: { color: COLORS.textMuted, fontWeight: '600', fontSize: FONTS.sizes.base },
});

export default LoginScreen;
