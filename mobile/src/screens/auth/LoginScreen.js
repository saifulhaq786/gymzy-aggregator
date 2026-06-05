import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Modal, StatusBar, Dimensions, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

let GoogleSignin;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  GoogleSignin.configure({ webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID' });
} catch {
  GoogleSignin = { configure: () => {}, hasPlayServices: async () => true, signIn: async () => { throw new Error('Use Email or Phone login.'); } };
}

const InputField = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightElement, onFocus, onBlur, focused }) => (
  <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
    <MaterialCommunityIcons name={icon} size={19} color={focused ? COLORS.primary : '#555'} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#444"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType || 'default'}
      autoCapitalize={autoCapitalize || 'none'}
      onFocus={onFocus}
      onBlur={onBlur}
    />
    {rightElement}
  </View>
);

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [focused, setFocused] = useState(null);
  const { login, googleLogin } = useAuthStore();

  const doGoogleLogin = async (type) => {
    setGoogleModalVisible(false);
    setGoogleLoading(true);
    try { await googleLogin(type); } catch (err) { Alert.alert('Error', err.message); } finally { setGoogleLoading(false); }
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('', 'Please fill in all fields.');
    setLoading(true);
    try { await login(email.trim(), password); }
    catch (err) { Alert.alert('Login failed', err.response?.data?.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => {
    if (Platform.OS === 'web') { setGoogleModalVisible(true); return; }
    Alert.alert('Demo login', 'Select a test profile:', [
      { text: 'Member', onPress: () => doGoogleLogin('mock_user') },
      { text: 'Partner', onPress: () => doGoogleLogin('mock_owner') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top 40% — brand section, no card */}
      <View style={styles.brandSection}>
        <Text style={styles.wordmark}>gymzy</Text>
        <Text style={styles.brandLine}>The fitness club for serious athletes</Text>
      </View>

      {/* Bottom 60% — form, slides up on keyboard */}
      <KeyboardAvoidingView
        style={styles.formSection}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.formInner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>Sign in</Text>

          <InputField
            icon="email-outline"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            focused={focused === 'email'}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />

          <InputField
            icon="lock-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            focused={focused === 'password'}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color="#555" />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryBtnText}>Continue</Text>}
          </TouchableOpacity>

          <View style={styles.divRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>or</Text>
            <View style={styles.divLine} />
          </View>

          <View style={styles.altRow}>
            <TouchableOpacity style={styles.altBtn} onPress={handleGoogle} disabled={googleLoading} activeOpacity={0.82}>
              {googleLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <MaterialCommunityIcons name="google" size={17} color="#EA4335" />
                    <Text style={styles.altBtnText}>Google</Text>
                  </>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.altBtn} onPress={() => navigation.navigate('PhoneOTP')} activeOpacity={0.82}>
              <MaterialCommunityIcons name="phone-outline" size={17} color={COLORS.primary} />
              <Text style={styles.altBtnText}>Phone</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New here? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>Create account →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal */}
      <Modal visible={googleModalVisible} transparent animationType="slide" onRequestClose={() => setGoogleModalVisible(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setGoogleModalVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Choose account</Text>
            <TouchableOpacity style={styles.sheetOption} onPress={() => doGoogleLogin('mock_user')}>
              <View style={styles.sheetAvatar}><Text style={styles.sheetAvatarText}>M</Text></View>
              <View>
                <Text style={styles.sheetName}>Member account</Text>
                <Text style={styles.sheetSub}>Find and book gyms</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetOption} onPress={() => doGoogleLogin('mock_owner')}>
              <View style={[styles.sheetAvatar, { backgroundColor: '#1A2A0A' }]}><Text style={[styles.sheetAvatarText, { color: COLORS.primary }]}>P</Text></View>
              <View>
                <Text style={styles.sheetName}>Partner account</Text>
                <Text style={styles.sheetSub}>Manage your gym</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // ── Brand section ──────────────────────────────────────────────
  brandSection: {
    height: SCREEN_HEIGHT * 0.35,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['2xl'],
    // Subtle volt gradient at very top
    backgroundColor: '#000',
  },
  wordmark: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -3,
    lineHeight: 54,
    marginBottom: SPACING.xs,
  },
  brandLine: {
    fontSize: FONTS.sizes.base,
    color: '#555',
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // ── Form section ───────────────────────────────────────────────
  formSection: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  formInner: {
    padding: SPACING.xl,
    paddingTop: SPACING['2xl'],
  },
  formTitle: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.8,
    marginBottom: SPACING.xl,
  },

  // ── Inputs ─────────────────────────────────────────────────────
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#161616',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 54,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#111',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: '400',
  },

  // ── Primary CTA ────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  primaryBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: FONTS.sizes.md,
    letterSpacing: 0.3,
  },

  // ── Divider ────────────────────────────────────────────────────
  divRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  divLine: { flex: 1, height: 1, backgroundColor: '#1F1F1F' },
  divText: { color: '#444', fontSize: FONTS.sizes.sm, marginHorizontal: SPACING.md, fontWeight: '500' },

  // ── Social buttons ─────────────────────────────────────────────
  altRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  altBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#161616',
    borderRadius: RADIUS.md,
    height: 50,
  },
  altBtnText: { color: '#aaa', fontWeight: '600', fontSize: FONTS.sizes.base },

  // ── Sign up link ───────────────────────────────────────────────
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { color: '#555', fontSize: FONTS.sizes.base },
  signupLink: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },

  // ── Bottom sheet modal ─────────────────────────────────────────
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#333', alignSelf: 'center', marginBottom: SPACING.xl,
  },
  sheetTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: '#fff', marginBottom: SPACING.lg },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  sheetAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  sheetAvatarText: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#fff' },
  sheetName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: '#fff', marginBottom: 2 },
  sheetSub: { fontSize: FONTS.sizes.sm, color: '#666' },
});

export default LoginScreen;
