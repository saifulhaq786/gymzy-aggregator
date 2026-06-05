import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const STATUS_COLORS = {
  pending: COLORS.warning,
  confirmed: COLORS.success,
  checked_in: COLORS.info,
  completed: COLORS.textMuted,
  cancelled: COLORS.error,
  refunded: COLORS.accent,
};

const STATUS_ICONS = {
  pending: 'clock-outline',
  confirmed: 'check-circle',
  checked_in: 'map-marker-check',
  completed: 'trophy',
  cancelled: 'close-circle',
  refunded: 'cash-refund',
};

const STATUS_TABS = ['All', 'Upcoming', 'Completed', 'Cancelled'];

const MyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const statusMap = {
        Upcoming: 'confirmed',
        Completed: 'completed',
        Cancelled: 'cancelled',
      };
      const params = activeTab !== 'All' ? { status: statusMap[activeTab] } : {};
      const { data } = await bookingAPI.getMyBookings(params);
      setBookings(data.bookings);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [activeTab]);

  const renderBooking = ({ item }) => {
    const color = STATUS_COLORS[item.status] || COLORS.textMuted;
    const icon = STATUS_ICONS[item.status] || 'calendar';

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: item.gymId?.coverImage || 'https://via.placeholder.com/60' }}
          style={styles.gymImage}
        />
        <View style={styles.cardContent}>
          <Text style={styles.gymName} numberOfLines={1}>{item.gymId?.name}</Text>
          <Text style={styles.gymAddress} numberOfLines={1}>{item.gymId?.location?.city}</Text>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={13} color={COLORS.textMuted} />
            <Text style={styles.detailText}>
              {new Date(item.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
            <Text style={styles.detailDot}>•</Text>
            <Text style={styles.planType}>{item.type?.replace('_', ' ')}</Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.amount}>₹{item.amount}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
              <MaterialCommunityIcons name={icon} size={12} color={color} />
              <Text style={[styles.statusText, { color }]}>
                {item.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </View>

        {/* QR Code button for confirmed bookings */}
        {item.status === 'confirmed' && (
          <TouchableOpacity style={styles.qrBtn}>
            <MaterialCommunityIcons name="qrcode" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>MY BOOKINGS</Text>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.toUpperCase()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBooking}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchBookings(); }}
          contentContainerStyle={styles.list}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="ticket-outline" size={48} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>NO BOOKINGS YET</Text>
              <Text style={styles.emptySubtitle}>Book an elite session to get started!</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.exploreBtnText}>FIND CLUBS</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: SPACING.base, paddingTop: 60, paddingBottom: SPACING.md },
  title: { fontSize: 20, fontWeight: '950', color: COLORS.textPrimary, letterSpacing: 1 },

  tabsRow: { flexDirection: 'row', paddingHorizontal: SPACING.base, marginBottom: SPACING.md, gap: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 4, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  tabTextActive: { color: '#000' },

  list: { paddingHorizontal: SPACING.base, paddingBottom: 100 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  gymImage: { width: 60, height: 60, borderRadius: 6, backgroundColor: COLORS.bgElevated },
  cardContent: { flex: 1 },
  gymName: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.md },
  gymAddress: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  detailText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  detailDot: { color: COLORS.textMuted },
  planType: { color: COLORS.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  amount: { color: COLORS.textPrimary, fontWeight: '900', fontSize: FONTS.sizes.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  qrBtn: { padding: SPACING.xs },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xl },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.textPrimary, marginBottom: SPACING.xs, letterSpacing: -0.5 },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, marginBottom: SPACING.xl, textAlign: 'center' },
  exploreBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: 14, ...SHADOWS.glow },
  exploreBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.base, letterSpacing: 1 },
});

export default MyBookingsScreen;
