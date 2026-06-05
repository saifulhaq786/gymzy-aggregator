import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, RefreshControl, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { gymAPI, bookingAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const GymDashboardScreen = ({ navigation }) => {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'settings'

  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, checkIns: 0 });

  const fetchMyGyms = useCallback(async () => {
    try {
      const { data } = await gymAPI.getMyGyms();
      const userGyms = data.gyms || [];
      setGyms(userGyms);
      
      if (userGyms.length > 0) {
        // Fetch real bookings for the first gym
        const bookingsData = await bookingAPI.getGymBookings(userGyms[0]._id);
        const fetchedBookings = bookingsData.data.bookings || [];
        
        // Format them for the UI
        const formatted = fetchedBookings.map(b => ({
          id: b._id,
          name: b.userId?.name || 'Unknown User',
          time: `${b.startTime || ''} - ${b.endTime || ''}`,
          status: b.status,
          checkedIn: b.status === 'checked_in',
          plan: b.type.replace('_', ' ').toUpperCase(),
          amount: b.amount || 0,
        }));
        
        setBookings(formatted);
        
        // Calculate basic stats
        const checkedInCount = formatted.filter(b => b.checkedIn).length;
        const totalRevenue = formatted.reduce((sum, b) => sum + b.amount, 0);
        setStats({ revenue: totalRevenue, checkIns: checkedInCount });
      }
    } catch (err) {
      console.error('Error fetching partner gym data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyGyms();
  }, [fetchMyGyms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyGyms();
  };

  const handleCheckIn = (bookingId, name) => {
    Alert.alert(
      'Verify Check-In',
      `Confirm manual check-in request for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Note: Usually checkin requires a QR code, but manual bypass for partners
              // We'll update the UI state optimistically
              setBookings(prev =>
                prev.map(b => b.id === bookingId ? { ...b, checkedIn: true, status: 'checked_in' } : b)
              );
              setStats(s => ({ ...s, checkIns: s.checkIns + 1 }));
              Alert.alert('Success', `${name} successfully checked in.`);
              // TODO: If you have a specific manual checkin endpoint, call it here
            } catch (err) {
              Alert.alert('Error', 'Failed to check in manually.');
            }
          }
        }
      ]
    );
  };

  const triggerQRScanner = () => {
    Alert.alert(
      'QR Scanner Simulated',
      'Scan client check-in card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Scan Priya Patel',
          onPress: () => {
            setBookings(prev =>
              prev.map(b => b.id === 'b2' ? { ...b, checkedIn: true } : b)
            );
            Alert.alert('Check-In Verified', 'Priya Patel is now checked in.');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // State 1: No Gyms Registered
  if (gyms.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="store-outline" size={72} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>PARTNER PORTAL</Text>
            <Text style={styles.emptySubtitle}>
              Register your gym to start hosting members, managing trainers, and tracking real-time booking revenues.
            </Text>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('GymRegistration')}
            >
              <Text style={styles.registerBtnText}>REGISTER YOUR GYM</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const currentGym = gyms[0];

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View>
            <Text style={styles.gymTitle}>{currentGym.name.toUpperCase()}</Text>
            <View style={styles.partnerBadge}>
              <MaterialCommunityIcons name="shield-check" size={12} color="#000" />
              <Text style={styles.partnerBadgeText}>VERIFIED PARTNER</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={triggerQRScanner}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#000" />
            <Text style={styles.scanBtnText}>SCAN QR</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
            onPress={() => setActiveTab('bookings')}
          >
            <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>TODAY'S ACTIVITY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>GYM PROFILE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {activeTab === 'bookings' ? (
          <View>
            {/* Dashboard Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="currency-inr" size={22} color={COLORS.primary} />
                <Text style={styles.metricVal}>₹{stats.revenue.toLocaleString()}</Text>
                <Text style={styles.metricLbl}>TOTAL REVENUE</Text>
              </View>
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="account-group" size={22} color={COLORS.primary} />
                <Text style={styles.metricVal}>
                  {stats.checkIns}/{bookings.length}
                </Text>
                <Text style={styles.metricLbl}>CHECKED IN</Text>
              </View>
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="dumbbell" size={22} color={COLORS.primary} />
                <Text style={styles.metricVal}>{currentGym.capacity || 30}</Text>
                <Text style={styles.metricLbl}>CAPACITY LIMIT</Text>
              </View>
            </View>

            {/* Bookings Section */}
            <Text style={styles.sectionTitle}>TODAY'S SCHEDULE ({bookings.length})</Text>
            {bookings.length === 0 ? (
              <Text style={{ color: COLORS.textMuted, fontSize: 13, padding: 20, textAlign: 'center' }}>
                No bookings found for this gym yet.
              </Text>
            ) : (
              bookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View>
                    <Text style={styles.userName}>{booking.name.toUpperCase()}</Text>
                    <Text style={styles.userPlan}>{booking.plan.toUpperCase()}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    booking.checkedIn ? styles.statusCheckedIn : styles.statusPending
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.checkedIn ? styles.statusTextCheckedIn : styles.statusTextPending
                    ]}>
                      {booking.checkedIn ? 'CHECKED IN' : 'WAITING'}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{booking.time}</Text>
                  </View>
                </View>

                {!booking.checkedIn && (
                  <TouchableOpacity
                    style={styles.checkInActionBtn}
                    onPress={() => handleCheckIn(booking.id, booking.name)}
                  >
                    <MaterialCommunityIcons name="check-bold" size={14} color="#000" />
                    <Text style={styles.checkInActionText}>MANUAL CHECK IN</Text>
                  </TouchableOpacity>
                )}
              </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.settingsSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>GYM PROFILE DETAILS</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ADDRESS:</Text>
                <Text style={styles.infoValue}>{currentGym.address}, {currentGym.city}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>PHONE:</Text>
                <Text style={styles.infoValue}>{currentGym.phone || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>MEMBERS CAP:</Text>
                <Text style={styles.infoValue}>{currentGym.capacity || '30'} active members</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => Alert.alert('Onboarding', 'Trainer management is available in partner profile manager.')}
            >
              <MaterialCommunityIcons name="account-multiple-plus" size={18} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>MANAGE COACHES / TRAINERS</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },

  emptyContainer: { flex: 1, backgroundColor: COLORS.bg },
  emptyScroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.base },
  emptyCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.xl,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    ...SHADOWS.md,
  },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '950', color: COLORS.textPrimary, marginTop: SPACING.md, letterSpacing: 1 },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20, marginBottom: SPACING.xl },
  registerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: 14,
    ...SHADOWS.glow,
  },
  registerBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.sm, letterSpacing: 0.5 },

  header: {
    paddingTop: 60, paddingHorizontal: SPACING.base, paddingBottom: 0,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: SPACING.md },
  gymTitle: { fontSize: 20, fontWeight: '950', color: COLORS.textPrimary, letterSpacing: -0.5 },
  partnerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4,
  },
  partnerBadgeText: { color: '#000', fontSize: 9, fontWeight: '950', letterSpacing: 0.5 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10,
    ...SHADOWS.glow,
  },
  scanBtnText: { color: '#000', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

  tabRow: { flexDirection: 'row', gap: SPACING.md },
  tab: { paddingVertical: SPACING.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  tabTextActive: { color: COLORS.primary },

  scroll: { padding: SPACING.base, paddingBottom: 100 },

  metricsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  metricCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center',
  },
  metricVal: { fontSize: 18, fontWeight: '950', color: COLORS.textPrimary, marginVertical: 4 },
  metricLbl: { fontSize: 8, color: COLORS.textMuted, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },

  sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1, marginBottom: SPACING.md },

  bookingCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  userName: { fontSize: FONTS.sizes.base, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 0.5 },
  userPlan: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '700', marginTop: 2 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusCheckedIn: { backgroundColor: 'rgba(0,255,102,0.1)' },
  statusPending: { backgroundColor: 'rgba(212,255,0,0.1)' },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  statusTextCheckedIn: { color: COLORS.success },
  statusTextPending: { color: COLORS.primary },

  bookingDetails: { gap: SPACING.xs, marginVertical: SPACING.xs },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  detailText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '500' },

  checkInActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 8, marginTop: SPACING.sm,
  },
  checkInActionText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.xs, letterSpacing: 0.5 },

  settingsSection: { gap: SPACING.md },
  infoCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.base,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  infoTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 0.5, marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  infoLabel: { width: 110, color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '800' },
  infoValue: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, fontWeight: '600' },

  secondaryActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(212,255,0,0.05)', borderRadius: RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: 'rgba(212,255,0,0.2)',
  },
  secondaryActionText: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.sm, letterSpacing: 0.5 },
});

export default GymDashboardScreen;
