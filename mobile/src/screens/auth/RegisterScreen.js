import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const ROLES = [
  {
    key: 'user',
    label: 'Gym Member',
    desc: 'Find and book gyms near you',
    icon: 'run-fast',
  },
  {
    key: 'gym_owner',
    label: 'Gym Partner',
    desc: 'List and manage your facility',
    icon: 'store-outline',
  },
];

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { register } = useAuthStore();

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Missing Fields', 'All fields are required.');
    if (form.password.length < 6) return Alert.alert('Weak Password', 'Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { key: 'name', label: 'FULL NAME', icon: 'account-outline', placeholder: 'Your full name', type: 'default', caps: 'words' },
    { key: 'email', label: 'EMAIL', icon: 'email-outline', placeholder: 'you@example.com', type: 'email-address', caps: 'none' },
  ];

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.subheading}>Join thousands training smarter with Gymzy</Text>

        {/* Role Toggle */}
        <View style={styles.roleSection}>
          <Text style={styles.sectionLabel}>I AM A...</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => {
              const active = form.role === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                  onPress={() => update('role', r.key)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={r.icon}
                    size={22}
                    color={active ? '#000' : COLORS.textMuted}
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>{r.label}</Text>
                  <Text style={[styles.roleDesc, active && styles.roleDescActive]}>{r.desc}</Text>
                  {active && (
                    <View style={styles.roleCheck}>
                      <MaterialCommunityIcons name="check" size={12} color="#000" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Text Inputs */}
        <View style={styles.formSection}>
          {FIELDS.map(({ key, label, icon, placeholder, type, caps }) => (
            <View key={key} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <View style={[styles.inputRow, focusedField === key && styles.inputRowFocused]}>
                <MaterialCommunityIcons
                  name={icon} size={18}
                  color={focusedField === key ? COLORS.primary : COLORS.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={form[key]}
                  onChangeText={(v) => update(key, v)}
                  keyboardType={type}
                  autoCapitalize={caps}
                  onFocus={() => setFocusedField(key)}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          ))}

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={[styles.inputRow, focusedField === 'password' && styles.inputRowFocused]}>
              <MaterialCommunityIcons
                name="lock-outline" size={18}
                color={focusedField === 'password' ? COLORS.primary : COLORS.textMuted}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.textMuted}
                value={form.password}
                onChangeText={(v) => update('password', v)}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18} color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.8 }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termsNote}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40, maxWidth: 480, width: '100%', alignSelf: 'center' },

  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl,
  },

  heading: { fontSize: FONTS.sizes['3xl'], fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  subheading: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginBottom: SPACING['2xl'], lineHeight: 22 },

  roleSection: { marginBottom: SPACING.xl },
  sectionLabel: { fontSize: FONTS.sizes.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: SPACING.sm },
  roleRow: { flexDirection: 'row', gap: SPACING.sm },
  roleCard: {
    flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard, borderWidth: 1.5, borderColor: COLORS.border,
    position: 'relative',
  },
  roleCardActive: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
    ...SHADOWS.glow,
  },
  roleLabel: { fontSize: FONTS.sizes.base, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 3 },
  roleLabelActive: { color: '#000' },
  roleDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, lineHeight: 16 },
  roleDescActive: { color: 'rgba(0,0,0,0.65)' },
  roleCheck: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center',
  },

  formSection: { marginBottom: SPACING.lg },
  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: FONTS.sizes.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, height: 52,
  },
  inputRowFocused: { borderColor: COLORS.primary, backgroundColor: 'rgba(200,255,0,0.03)' },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '500' },

  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 56, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.glow, marginBottom: SPACING.xl,
  },
  primaryBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.base, letterSpacing: 1.5 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  footerText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
  footerLink: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },

  termsNote: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONTS.sizes.xs, lineHeight: 16 },
});

export default RegisterScreen;
