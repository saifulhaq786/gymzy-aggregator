import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuthStore();

  // Modal States
  const [editVisible, setEditVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  // Edit Profile States
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to update your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedPhoto(result.assets[0]);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      return Alert.alert('Invalid Name', 'Name cannot be empty.');
    }

    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', editName.trim());
      formData.append('phone', editPhone.trim());
      
      if (selectedPhoto) {
        formData.append('profilePhoto', {
          uri: selectedPhoto.uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
      }

      const { data } = await authAPI.updateProfile(formData);
      
      // Update local store state
      updateUser({
        name: data.user.name,
        phone: data.user.phone,
        profilePhoto: data.user.profilePhoto,
      });

      setEditVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const MENU_ITEMS = [
    ...(user?.role === 'gym_owner' || user?.role === 'admin'
      ? [{ icon: 'plus-circle', label: 'Register a Gym', onPress: () => navigation.navigate('GymRegistration'), color: COLORS.primary }]
      : []),
    ...(user?.role === 'gym_owner' ? [{ icon: 'view-dashboard', label: 'Gym Dashboard', onPress: () => navigation.navigate('GymDashboard'), color: COLORS.accent }] : []),
    { icon: 'calendar-check', label: 'My Bookings', onPress: () => navigation.navigate('Bookings'), color: COLORS.info },
    { icon: 'account-edit', label: 'Edit Profile', onPress: () => { setEditName(user?.name || ''); setEditPhone(user?.phone || ''); setSelectedPhoto(null); setEditVisible(true); }, color: COLORS.textSecondary },
    { icon: 'shield-check', label: 'Privacy & Security', onPress: () => setPrivacyVisible(true), color: COLORS.textSecondary },
    { icon: 'help-circle', label: 'Help & Support', onPress: () => setHelpVisible(true), color: COLORS.textSecondary },
    { icon: 'information', label: 'About Gymzy', onPress: () => setAboutVisible(true), color: COLORS.textSecondary },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user?.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{user?.name?.toUpperCase()}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>
              {user?.role === 'gym_owner' ? 'PARTNER' : user?.role === 'admin' ? 'ADMIN' : 'ATHLETE'}
            </Text>
          </View>
          {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
          {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'SESSIONS', value: '0', icon: 'dumbbell' },
            { label: 'VISITED', value: '0', icon: 'map-marker-multiple' },
            { label: 'REVIEWS', value: '0', icon: 'star' },
          ].map(({ label, value, icon }) => (
            <View key={label} style={styles.statItem}>
              <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map(({ icon, label, onPress, color }, i) => (
            <TouchableOpacity key={label} style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]} onPress={onPress}>
              <View style={[styles.menuIcon, { backgroundColor: `${color}20` }]}>
                <MaterialCommunityIcons name={icon} size={20} color={color} />
              </View>
              <Text style={styles.menuLabel}>{label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>GYMZY v1.0.0</Text>
      </ScrollView>

      {/* ── EDIT PROFILE MODAL ─────────────────────────────────────────────────── */}
      <Modal animationType="slide" transparent={true} visible={editVisible} onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>EDIT PROFILE</Text>

            <TouchableOpacity style={styles.modalAvatarEdit} onPress={handlePickImage}>
              {selectedPhoto ? (
                <Image source={{ uri: selectedPhoto.uri }} style={styles.editAvatar} />
              ) : user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={styles.editAvatar} />
              ) : (
                <View style={styles.editAvatarPlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={32} color="#000" />
                </View>
              )}
              <Text style={styles.avatarEditLabel}>CHANGE PHOTO</Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                placeholderTextColor={COLORS.textMuted}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.textMuted}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setEditVisible(false)} disabled={savingProfile}>
                <Text style={styles.modalBtnTextCancel}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color="#000" /> : <Text style={styles.modalBtnTextSave}>SAVE</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── PRIVACY MODAL ────────────────────────────────────────────────────── */}
      <Modal animationType="fade" transparent={true} visible={privacyVisible} onRequestClose={() => setPrivacyVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PRIVACY & SECURITY</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={styles.modalSectionTitle}>1. DATA PROTECTION</Text>
              <Text style={styles.modalText}>Your account information, check-in histories, and payment logs are completely encrypted end-to-end to protect against unauthorized access.</Text>

              <Text style={styles.modalSectionTitle}>2. LOCATION SERVICES</Text>
              <Text style={styles.modalText}>We access your location data only when the app is active, specifically to find nearby gyms and calculate dynamic distances.</Text>

              <Text style={styles.modalSectionTitle}>3. SECURE CHECK-IN</Text>
              <Text style={styles.modalText}>Verification codes and QR structures expire instantly after use to safeguard check-in fraud or spoofing.</Text>

              <Text style={styles.modalSectionTitle}>4. PAYMENTS SECURITY</Text>
              <Text style={styles.modalText}>Payment operations are routed entirely through SSL-encrypted gateways provided by Razorpay. No credit card credentials are stored locally.</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPrivacyVisible(false)}>
              <Text style={styles.modalCloseBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ABOUT MODAL ──────────────────────────────────────────────────────── */}
      <Modal animationType="fade" transparent={true} visible={aboutVisible} onRequestClose={() => setAboutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ABOUT GYMZY</Text>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutVersion}>Version 1.0.0 (Development Build)</Text>
              <Text style={styles.aboutDesc}>Gymzy is a location-based gym aggregator designed to democratize fitness. Users can search nearby gyms, pay dynamically per session or booking, and gain instant check-in access via simple QR scanning.</Text>
              <Text style={styles.aboutDesc}>Built using React Native, Expo, Node.js, Express, MongoDB, and Razorpay.</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAboutVisible(false)}>
              <Text style={styles.modalCloseBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── HELP & SUPPORT MODAL ────────────────────────────────────────────────── */}
      <Modal animationType="slide" transparent={true} visible={helpVisible} onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>HELP & FAQs</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {[
                { q: 'How do I check in?', a: 'Go to your bookings, tap the active pass, and let the gym staff scan your dynamic QR check-in code at the front desk.' },
                { q: 'Can I cancel a booking?', a: 'Yes! Cancellations are fully allowed up to 1 hour prior to your scheduled start slot. Refund amounts will be added directly to your payment source.' },
                { q: 'What is hourly pricing?', a: 'Some partner gyms offer hourly passes. You pay a small hourly fee, and your pass is verified dynamically based on the check-in and checkout times.' },
                { q: 'How do I contact support?', a: 'For further billing queries, account actions, or partner requests, reach us at support@gymzy.com.' }
              ].map(({ q, a }, idx) => (
                <View key={idx} style={styles.faqBlock}>
                  <Text style={styles.faqQ}>Q. {q.toUpperCase()}</Text>
                  <Text style={styles.faqA}>{a}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setHelpVisible(false)}>
              <Text style={styles.modalCloseBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 100 },

  header: { alignItems: 'center', paddingTop: 70, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.base },
  avatarContainer: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.primary },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow,
  },
  avatarInitial: { fontSize: 36, fontWeight: '900', color: '#fff' },
  roleContainer: { backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, marginTop: SPACING.xs },
  roleText: { color: '#000', fontSize: 10, fontWeight: '950', letterSpacing: 0.5 },

  userName: { fontSize: FONTS.sizes['2xl'], fontWeight: '900', color: COLORS.textPrimary },
  userEmail: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 4 },
  userPhone: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 1 },

  statsRow: {
    flexDirection: 'row', marginHorizontal: SPACING.base, marginBottom: SPACING.lg,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.textPrimary, marginTop: 4 },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '800', marginTop: 2 },

  menuCard: { marginHorizontal: SPACING.base, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: SPACING.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  menuIcon: { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, color: COLORS.textPrimary, fontWeight: '600', fontSize: FONTS.sizes.base },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.base, padding: SPACING.md, backgroundColor: `${COLORS.error}15`,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: `${COLORS.error}30`, marginBottom: SPACING.xl,
  },
  logoutText: { color: COLORS.error, fontWeight: '800', fontSize: FONTS.sizes.md, letterSpacing: 0.5 },

  version: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xl },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', alignItems: 'center', padding: SPACING.base
  },
  modalContent: {
    width: '100%', maxHeight: '80%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', ...SHADOWS.glow,
  },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: '950', color: COLORS.textPrimary, marginBottom: SPACING.md, textAlign: 'center', letterSpacing: 0.5 },
  modalScroll: { marginVertical: SPACING.sm },
  modalSectionTitle: { fontSize: 11, fontWeight: '900', color: COLORS.primary, marginTop: SPACING.md, marginBottom: 4, letterSpacing: 0.5 },
  modalText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 20 },
  modalCloseBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.base, alignItems: 'center', ...SHADOWS.glow,
  },
  modalCloseBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.base, letterSpacing: 1 },

  // Edit Avatar Styles
  modalAvatarEdit: { alignItems: 'center', marginBottom: SPACING.lg },
  editAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORS.primary },
  editAvatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarEditLabel: { color: COLORS.primary, fontWeight: '800', fontSize: 11, marginTop: SPACING.xs, letterSpacing: 0.5 },

  inputGroup: { width: '100%', marginBottom: SPACING.md },
  inputLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: SPACING.md, height: 50,
    color: COLORS.textPrimary, fontSize: FONTS.sizes.md,
  },

  modalBtns: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  modalBtn: { flex: 1, height: 50, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  modalBtnCancel: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  modalBtnSave: { backgroundColor: COLORS.primary, ...SHADOWS.glow },
  modalBtnTextCancel: { color: COLORS.textPrimary, fontWeight: '850', letterSpacing: 0.5 },
  modalBtnTextSave: { color: '#000', fontWeight: '900', letterSpacing: 0.5 },

  // About Styles
  aboutCard: { marginVertical: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  aboutVersion: { color: COLORS.primary, fontWeight: '850', fontSize: FONTS.sizes.base, marginBottom: SPACING.xs },
  aboutDesc: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 20, marginBottom: SPACING.sm },

  // FAQ Styles
  faqBlock: { marginBottom: SPACING.md },
  faqQ: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 13, letterSpacing: 0.3 },
  faqA: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 18, marginTop: 2 },
});

export default ProfileScreen;
