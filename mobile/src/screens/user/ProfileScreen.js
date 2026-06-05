import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, Modal, TextInput, ActivityIndicator,
  StatusBar, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

/* ─── Reusable section list row ───────────────────────────── */
const MenuRow = ({ icon, iconColor = '#fff', label, value, onPress, danger, last }) => (
  <TouchableOpacity style={[ms.row, !last && ms.rowBorder]} onPress={onPress} activeOpacity={0.75}>
    <View style={[ms.rowIcon, { backgroundColor: danger ? '#1a0000' : '#111' }]}>
      <MaterialCommunityIcons name={icon} size={18} color={danger ? COLORS.error : iconColor} />
    </View>
    <Text style={[ms.rowLabel, danger && { color: COLORS.error }]}>{label}</Text>
    <View style={ms.rowRight}>
      {value ? <Text style={ms.rowValue}>{value}</Text> : null}
      <MaterialCommunityIcons name="chevron-right" size={18} color={danger ? COLORS.error : '#333'} />
    </View>
  </TouchableOpacity>
);

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuthStore();

  const [editVisible,    setEditVisible]    = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [helpVisible,    setHelpVisible]    = useState(false);
  const [aboutVisible,   setAboutVisible]   = useState(false);

  const [editName,       setEditName]       = useState(user?.name || '');
  const [editPhone,      setEditPhone]      = useState(user?.phone || '');
  const [selectedPhoto,  setSelectedPhoto]  = useState(null);
  const [saving,         setSaving]         = useState(false);

  const roleLabel =
    user?.role === 'gym_owner' ? 'Partner'
    : user?.role === 'admin'   ? 'Admin'
    : 'Member';

  const initial = user?.name?.[0]?.toUpperCase() || 'U';

  const handleLogout = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission required', 'Please allow access to your photos.');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) setSelectedPhoto(result.assets[0]);
  };

  const handleSave = async () => {
    if (!editName.trim()) return Alert.alert('', 'Name cannot be empty.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', editName.trim());
      fd.append('phone', editPhone.trim());
      if (selectedPhoto) fd.append('profilePhoto', { uri: selectedPhoto.uri, name: 'profile.jpg', type: 'image/jpeg' });
      const { data } = await authAPI.updateProfile(fd);
      updateUser({ name: data.user.name, phone: data.user.phone, profilePhoto: data.user.profilePhoto });
      setEditVisible(false);
    } catch (err) {
      Alert.alert('Update failed', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const SECTIONS = [
    {
      title: 'Activity',
      rows: [
        { icon: 'calendar-check-outline', iconColor: COLORS.primary, label: 'My Bookings', onPress: () => navigation.navigate('Bookings') },
        ...(user?.role === 'gym_owner' || user?.role === 'admin'
          ? [{ icon: 'plus-circle-outline', iconColor: COLORS.primary, label: 'Register a Gym', onPress: () => navigation.navigate('GymRegistration') }]
          : []),
        ...(user?.role === 'gym_owner'
          ? [{ icon: 'view-dashboard-outline', iconColor: '#7C3AED', label: 'Gym Dashboard', onPress: () => navigation.navigate('GymDashboard') }]
          : []),
      ],
    },
    {
      title: 'Account',
      rows: [
        { icon: 'account-edit-outline', label: 'Edit Profile', onPress: () => { setEditName(user?.name || ''); setEditPhone(user?.phone || ''); setSelectedPhoto(null); setEditVisible(true); } },
        { icon: 'shield-outline', label: 'Privacy & Security', onPress: () => setPrivacyVisible(true) },
        { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => setHelpVisible(true) },
        { icon: 'information-outline', label: 'About Gymzy', value: 'v1.0.0', onPress: () => setAboutVisible(true) },
      ],
    },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────── */}
        <View style={s.header}>
          {/* Avatar */}
          <TouchableOpacity
            style={s.avatarWrap}
            onPress={() => { setEditName(user?.name || ''); setSelectedPhoto(null); setEditVisible(true); }}
          >
            {user?.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={s.editDot}>
              <MaterialCommunityIcons name="pencil" size={11} color="#000" />
            </View>
          </TouchableOpacity>

          {/* Name + role */}
          <Text style={s.name}>{user?.name || 'Your Name'}</Text>
          <View style={s.rolePill}>
            <Text style={s.rolePillText}>{roleLabel}</Text>
          </View>
          {user?.email && <Text style={s.meta}>{user.email}</Text>}
          {user?.phone && <Text style={s.meta}>{user.phone}</Text>}
        </View>

        {/* ── Stats strip ─────────────────────────────────── */}
        <View style={s.statsStrip}>
          {[
            { icon: 'dumbbell', label: 'Sessions', value: '0' },
            { icon: 'map-marker-multiple-outline', label: 'Visited', value: '0' },
            { icon: 'star-outline', label: 'Reviews', value: '0' },
          ].map(({ icon, label, value }) => (
            <View key={label} style={s.stat}>
              <Text style={s.statVal}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Menu sections ────────────────────────────────── */}
        {SECTIONS.map(sec => (
          <View key={sec.title} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <View style={s.card}>
              {sec.rows.map((r, i) => (
                <MenuRow key={r.label} {...r} last={i === sec.rows.length - 1} />
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign out ─────────────────────────────────────── */}
        <TouchableOpacity style={s.signOut} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={18} color={COLORS.error} />
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Gymzy · v1.0.0</Text>
      </ScrollView>

      {/* ── Edit Profile Modal ──────────────────────────── */}
      <Modal animationType="slide" transparent visible={editVisible} onRequestClose={() => setEditVisible(false)}>
        <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={() => setEditVisible(false)}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Edit profile</Text>

            <TouchableOpacity style={m.avatarEdit} onPress={handlePickImage}>
              {selectedPhoto ? (
                <Image source={{ uri: selectedPhoto.uri }} style={m.avatar} />
              ) : user?.profilePhoto ? (
                <Image source={{ uri: user.profilePhoto }} style={m.avatar} />
              ) : (
                <View style={m.avatarFallback}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={26} color="#555" />
                </View>
              )}
              <Text style={m.avatarHint}>Tap to change</Text>
            </TouchableOpacity>

            <View style={m.field}>
              <Text style={m.label}>Full name</Text>
              <TextInput
                style={m.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#444"
              />
            </View>
            <View style={m.field}>
              <Text style={m.label}>Phone number</Text>
              <TextInput
                style={m.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+91 00000 00000"
                placeholderTextColor="#444"
                keyboardType="phone-pad"
              />
            </View>

            <View style={m.btnRow}>
              <TouchableOpacity style={m.cancelBtn} onPress={() => setEditVisible(false)} disabled={saving}>
                <Text style={m.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={m.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" size="small" /> : <Text style={m.saveText}>Save changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Privacy Modal ───────────────────────────────── */}
      <Modal animationType="slide" transparent visible={privacyVisible} onRequestClose={() => setPrivacyVisible(false)}>
        <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={() => setPrivacyVisible(false)}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Privacy & Security</Text>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {[
                { t: 'Data protection', b: 'Your account, check-in histories, and payment logs are encrypted end-to-end.' },
                { t: 'Location services', b: 'We access location only when the app is active, to find gyms nearby.' },
                { t: 'Secure check-in', b: 'QR codes expire instantly after use to prevent fraud.' },
                { t: 'Payments', b: 'All payments are routed through SSL-encrypted Razorpay gateways. No card data stored locally.' },
              ].map(({ t, b }) => (
                <View key={t} style={m.infoBlock}>
                  <Text style={m.infoTitle}>{t}</Text>
                  <Text style={m.infoBody}>{b}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={m.saveBtn} onPress={() => setPrivacyVisible(false)}>
              <Text style={m.saveText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Help Modal ──────────────────────────────────── */}
      <Modal animationType="slide" transparent visible={helpVisible} onRequestClose={() => setHelpVisible(false)}>
        <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={() => setHelpVisible(false)}>
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Help & FAQs</Text>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {[
                { q: 'How do I check in?', a: 'Go to My Bookings, tap your active booking, and show the QR code to the gym staff.' },
                { q: 'Can I cancel a booking?', a: 'Yes, cancellations are allowed up to 1 hour before your session. Refunds go back to your original payment method.' },
                { q: 'What is hourly pricing?', a: 'Some gyms offer pay-per-hour access. Your pass is verified at check-in and check-out.' },
                { q: 'Need more help?', a: 'Reach us at support@gymzy.com — we respond within 24 hours.' },
              ].map(({ q, a }) => (
                <View key={q} style={m.infoBlock}>
                  <Text style={m.infoTitle}>{q}</Text>
                  <Text style={m.infoBody}>{a}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={m.saveBtn} onPress={() => setHelpVisible(false)}>
              <Text style={m.saveText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── About Modal ─────────────────────────────────── */}
      <Modal animationType="fade" transparent visible={aboutVisible} onRequestClose={() => setAboutVisible(false)}>
        <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={() => setAboutVisible(false)}>
          <View style={[m.sheet, { paddingBottom: 32 }]}>
            <View style={m.handle} />
            <Text style={[m.title, { marginBottom: SPACING.xl }]}>About Gymzy</Text>
            <Text style={s.aboutVersion}>Version 1.0.0</Text>
            <Text style={s.aboutDesc}>
              Gymzy is a location-based gym aggregator that lets you find, book, and check in to gyms near you. Built with React Native, Node.js, MongoDB, and Razorpay.
            </Text>
            <TouchableOpacity style={[m.saveBtn, { marginTop: SPACING.xl }]} onPress={() => setAboutVisible(false)}>
              <Text style={m.saveText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

/* ── Main styles ───────────────────────────────────────────── */
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#000' },
  scroll: { paddingBottom: 110 },

  /* Header */
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  avatarWrap: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 86, height: 86, borderRadius: 43 },
  avatarFallback: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 34, fontWeight: '900', color: '#000' },
  editDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#000',
  },

  name:    { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: 6 },
  rolePill: {
    backgroundColor: '#111', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 4, marginBottom: 8,
  },
  rolePillText: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 0.8 },
  meta: { color: '#444', fontSize: FONTS.sizes.sm, marginTop: 2 },

  /* Stats */
  statsStrip: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  stat: {
    flex: 1, alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderRightWidth: 1, borderRightColor: '#111',
  },
  statVal:   { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#fff', marginBottom: 3 },
  statLabel: { fontSize: FONTS.sizes.xs, color: '#555', fontWeight: '500' },

  /* Sections */
  section: { marginTop: SPACING.xl, paddingHorizontal: SPACING.base },
  sectionTitle: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: '#444', letterSpacing: 1, marginBottom: SPACING.sm },
  card: { backgroundColor: '#0D0D0D', borderRadius: RADIUS.xl, overflow: 'hidden' },

  /* Sign out */
  signOut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.base, marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: '#0D0D0D', borderRadius: RADIUS.xl,
  },
  signOutText: { color: COLORS.error, fontSize: FONTS.sizes.base, fontWeight: '700' },

  version:   { textAlign: 'center', color: '#2A2A2A', fontSize: FONTS.sizes.xs, marginTop: SPACING.lg, fontWeight: '500' },
  aboutVersion: { color: COLORS.primary, fontSize: FONTS.sizes.base, fontWeight: '700', marginBottom: SPACING.sm },
  aboutDesc: { color: '#555', fontSize: FONTS.sizes.base, lineHeight: 22 },
});

/* ── Menu row styles ───────────────────────────────────────── */
const ms = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingHorizontal: SPACING.md, paddingVertical: 15,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#161616' },
  rowIcon: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, color: '#ddd', fontSize: FONTS.sizes.base, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { color: '#444', fontSize: FONTS.sizes.sm },
});

/* ── Modal / sheet styles ──────────────────────────────────── */
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#2A2A2A', alignSelf: 'center', marginBottom: SPACING.xl,
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#fff', marginBottom: SPACING.lg, letterSpacing: -0.3 },

  avatarEdit: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#161616', alignItems: 'center', justifyContent: 'center',
  },
  avatarHint: { color: '#444', fontSize: FONTS.sizes.sm, marginTop: 8 },

  field: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: '#444', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    backgroundColor: '#161616', borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, height: 50,
    color: '#fff', fontSize: FONTS.sizes.base,
  },

  btnRow:    { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  cancelBtn: { flex: 1, height: 52, backgroundColor: '#161616', borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  saveBtn:   { flex: 1, height: 52, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#666', fontWeight: '600', fontSize: FONTS.sizes.base },
  saveText:   { color: '#000', fontWeight: '800', fontSize: FONTS.sizes.base },

  infoBlock: { marginBottom: SPACING.lg },
  infoTitle: { color: '#fff', fontSize: FONTS.sizes.base, fontWeight: '700', marginBottom: 4 },
  infoBody:  { color: '#555', fontSize: FONTS.sizes.base, lineHeight: 22 },
});

export default ProfileScreen;
