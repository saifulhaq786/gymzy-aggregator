import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      return Alert.alert('Error', 'All fields are required');
    }
    if (form.password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the elite fitness network</Text>

        {/* Role Selector */}
        <View style={styles.roleContainer}>
          <Text style={styles.label}>I AM A...</Text>
          <View style={styles.roleRow}>
            {[
              { key: 'user', label: 'Gym-Goer', desc: 'Find & book clubs' },
              { key: 'gym_owner', label: 'Club Owner', desc: 'List my facility' },
            ].map((r) => {
              const isActive = form.role === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.roleCard, isActive && styles.roleCardActive]}
                  onPress={() => update('role', r.key)}
                >
                  <Text style={[styles.roleLabel, isActive && styles.roleTextActive]}>{r.label.toUpperCase()}</Text>
                  <Text style={[styles.roleDesc, isActive && styles.roleDescActive]}>{r.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Inputs */}
        {[
          { field: 'name', label: 'FULL NAME', icon: 'account-outline', placeholder: 'John Doe', type: 'default' },
          { field: 'email', label: 'EMAIL ADDRESS', icon: 'email-outline', placeholder: 'you@example.com', type: 'email-address' },
        ].map(({ field, label, icon, placeholder, type }) => (
          <View style={styles.inputGroup} key={field}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name={icon} size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textMuted}
                value={form[field]}
                onChangeText={(v) => update(field, v)}
                keyboardType={type}
                autoCapitalize={field === 'name' ? 'words' : 'none'}
              />
            </View>
          </View>
        ))}

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={COLORS.textMuted}
              value={form.password}
              onChangeText={(v) => update('password', v)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, width: '100%', maxWidth: 480, paddingHorizontal: SPACING.base, paddingTop: 60, paddingBottom: 40 },

  backBtn: { marginBottom: SPACING.lg, width: 40 },
  title: { fontSize: FONTS.sizes['3xl'], fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.xl },

  roleContainer: { marginBottom: SPACING.lg },
  roleRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  roleCard: {
    flex: 1, padding: SPACING.base, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  roleCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  roleLabel: { fontSize: 13, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 4, letterSpacing: 0.5 },
  roleTextActive: { color: '#000' },
  roleDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  roleDescActive: { color: 'rgba(0,0,0,0.7)', fontWeight: '500' },

  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: SPACING.md, height: 54,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.md },

  registerBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg,
    ...SHADOWS.glow,
  },
  registerBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
  footerLink: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },
});

export default RegisterScreen;
