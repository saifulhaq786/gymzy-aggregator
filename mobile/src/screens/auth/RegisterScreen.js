import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const InputField = ({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightElement, focused, onFocus, onBlur }) => (
  <View style={[s.inputWrap, focused && s.inputFocused]}>
    <MaterialCommunityIcons name={icon} size={18} color={focused ? COLORS.primary : '#555'} />
    <TextInput
      style={s.input}
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

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const { register } = useAuthStore();

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('', 'All fields are required.');
    if (form.password.length < 6) return Alert.alert('', 'Password must be at least 6 characters.');
    setLoading(true);
    try { await register(form); }
    catch (err) { Alert.alert('Error', err.response?.data?.message || 'Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Back nav */}
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
      </TouchableOpacity>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header — no card wrapper */}
          <Text style={s.heading}>Create{'\n'}account</Text>
          <Text style={s.sub}>Join thousands training smarter</Text>

          {/* Role selector — two full-width option rows, not small cards */}
          <View style={s.roleSection}>
            {[
              { key: 'user', label: 'I want to find gyms', sub: 'Book clubs, track workouts', icon: 'run' },
              { key: 'gym_owner', label: 'I own a gym', sub: 'List and manage my facility', icon: 'store-outline' },
            ].map((r) => {
              const active = form.role === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[s.roleRow, active && s.roleRowActive]}
                  onPress={() => update('role', r.key)}
                  activeOpacity={0.85}
                >
                  <View style={[s.roleIcon, active && s.roleIconActive]}>
                    <MaterialCommunityIcons name={r.icon} size={20} color={active ? '#000' : '#666'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.roleLabel, active && s.roleLabelActive]}>{r.label}</Text>
                    <Text style={s.roleSub}>{r.sub}</Text>
                  </View>
                  <View style={[s.radioOuter, active && s.radioOuterActive]}>
                    {active && <View style={s.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Fields — no wrapper card */}
          <InputField
            icon="account-outline" placeholder="Full name"
            value={form.name} onChangeText={v => update('name', v)}
            autoCapitalize="words"
            focused={focused === 'name'}
            onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
          />
          <InputField
            icon="email-outline" placeholder="Email address"
            value={form.email} onChangeText={v => update('email', v)}
            keyboardType="email-address"
            focused={focused === 'email'}
            onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
          />
          <InputField
            icon="lock-outline" placeholder="Password (min 6 chars)"
            value={form.password} onChangeText={v => update('password', v)}
            secureTextEntry={!showPassword}
            focused={focused === 'pass'}
            onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#555" />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity style={[s.cta, loading && { opacity: 0.8 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.88}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={s.ctaText}>Get started</Text>}
          </TouchableOpacity>

          <View style={s.signRow}>
            <Text style={s.signText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.signLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.terms}>By continuing you agree to our Terms & Privacy Policy</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  backBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : 34, left: SPACING.xl,
    zIndex: 10, width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 110 : 90,
    paddingBottom: 50,
    maxWidth: 480, width: '100%', alignSelf: 'center',
  },

  heading: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 46,
    marginBottom: SPACING.sm,
  },
  sub: { fontSize: FONTS.sizes.base, color: '#555', marginBottom: SPACING['2xl'], fontWeight: '400' },

  // Role rows — full width option items like Swiggy address type selector
  roleSection: { marginBottom: SPACING.xl, gap: SPACING.xs },
  roleRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: '#111', borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  roleRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#0F1400',
  },
  roleIcon: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
  },
  roleIconActive: { backgroundColor: COLORS.primary },
  roleLabel: { fontSize: FONTS.sizes.base, fontWeight: '700', color: '#888', marginBottom: 2 },
  roleLabelActive: { color: '#fff' },
  roleSub: { fontSize: FONTS.sizes.sm, color: '#444' },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: COLORS.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

  // Inputs
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: '#111', borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 54,
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'transparent',
  },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: '#0A0A0A' },
  input: { flex: 1, color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '400' },

  cta: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 56, alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.sm, marginBottom: SPACING.xl,
  },
  ctaText: { color: '#000', fontWeight: '800', fontSize: FONTS.sizes.md, letterSpacing: 0.3 },

  signRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: SPACING.xl },
  signText: { color: '#555', fontSize: FONTS.sizes.base },
  signLink: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },

  terms: { textAlign: 'center', color: '#333', fontSize: FONTS.sizes.xs, lineHeight: 16 },
});

export default RegisterScreen;
