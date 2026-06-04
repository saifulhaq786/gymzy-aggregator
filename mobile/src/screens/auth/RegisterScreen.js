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
        <Text style={styles.subtitle}>Join thousands of gym-goers on Gymzy</Text>

        {/* Role Selector */}
        <View style={styles.roleContainer}>
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleRow}>
            {[
              { key: 'user', label: '🏃 Gym-Goer', desc: 'Find & book gyms' },
              { key: 'gym_owner', label: '🏢 Gym Owner', desc: 'List my gym' },
            ].map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleCard, form.role === r.key && styles.roleCardActive]}
                onPress={() => update('role', r.key)}
              >
                <Text style={styles.roleLabel}>{r.label}</Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Inputs */}
        {[
          { field: 'name', label: 'Full Name', icon: 'account-outline', placeholder: 'John Doe', type: 'default' },
          { field: 'email', label: 'Email', icon: 'email-outline', placeholder: 'you@example.com', type: 'email-address' },
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
          <Text style={styles.label}>Password</Text>
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Create Account</Text>}
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
  title: { fontSize: FONTS.sizes['3xl'], fontWeight: '900', color: COLORS.textPrimary },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.xl },

  roleContainer: { marginBottom: SPACING.lg },
  roleRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  roleCard: {
    flex: 1, padding: SPACING.md, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard, borderWidth: 2, borderColor: COLORS.border,
  },
  roleCardActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}15` },
  roleLabel: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  roleDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },

  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 52,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.md },

  registerBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md,
    ...SHADOWS.glow,
  },
  registerBtnText: { color: '#fff', fontWeight: '800', fontSize: FONTS.sizes.md },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
  footerLink: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },
});

export default RegisterScreen;
