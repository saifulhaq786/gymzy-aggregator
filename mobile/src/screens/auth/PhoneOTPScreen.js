import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const PhoneOTPScreen = ({ navigation }) => {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const { verifyOTP } = useAuthStore();

  const handleSendOTP = async () => {
    const fullPhone = `+91${phone.trim()}`;
    if (phone.length !== 10) return Alert.alert('Error', 'Enter a valid 10-digit phone number');
    setLoading(true);
    try {
      const { data } = await authAPI.sendOTP(fullPhone);
      setStep('otp');
      startResendTimer();
      if (data?.otp) {
        setOtp(data.otp.split(''));
        Alert.alert('Dev OTP Simulation', `Simulated SMS sent. Code: ${data.otp}`);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleOTPChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return Alert.alert('Error', 'Enter the complete 6-digit OTP');
    setLoading(true);
    try {
      await verifyOTP(`+91${phone.trim()}`, otpString);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.responsiveWrapper}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 'otp' ? setStep('phone') : navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={step === 'phone' ? 'cellphone' : 'shield-key-outline'} 
              size={48} 
              color={COLORS.primary} 
            />
          </View>
          <Text style={styles.title}>{step === 'phone' ? 'PHONE SIGN IN' : 'VERIFY CODE'}</Text>
          <Text style={styles.subtitle}>
            {step === 'phone'
              ? 'Enter your phone number to receive a secure access code'
              : `Enter the code sent to +91 ${phone}`}
          </Text>

          {step === 'phone' ? (
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="10-digit number"
                placeholderTextColor={COLORS.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          ) : (
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => (otpRefs.current[i] = ref)}
                  style={[styles.otpBox, digit && styles.otpBoxFilled]}
                  value={digit}
                  onChangeText={(v) => handleOTPChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={step === 'phone' ? handleSendOTP : handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.actionBtnText}>{step === 'phone' ? 'SEND CODE' : 'VERIFY & LOGIN'}</Text>
            )}
          </TouchableOpacity>

          {step === 'otp' && (
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleSendOTP}
              disabled={resendTimer > 0}
            >
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  responsiveWrapper: { flex: 1, width: '100%', maxWidth: 480, paddingHorizontal: SPACING.base },
  backBtn: { marginTop: 60, marginBottom: SPACING.lg, width: 40 },
  content: { flex: 1, paddingTop: SPACING['xl'] },

  iconContainer: { marginBottom: SPACING.md },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginBottom: SPACING['2xl'], lineHeight: 22 },

  phoneRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  countryCode: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: SPACING.md, justifyContent: 'center',
  },
  countryCodeText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '700' },
  phoneInput: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: SPACING.md, height: 54,
    color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: '800',
  },

  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xl },
  otpBox: {
    width: 48, height: 58, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)',
    color: COLORS.textPrimary, fontSize: FONTS.sizes['2xl'], fontWeight: '850',
  },
  otpBoxFilled: { borderColor: COLORS.primary },

  actionBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 54,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow,
  },
  actionBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 1 },

  resendBtn: { alignItems: 'center', marginTop: SPACING.lg },
  resendText: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },
  resendTextDisabled: { color: COLORS.textMuted },
});

export default PhoneOTPScreen;
