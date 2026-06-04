import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/theme';

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
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
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
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>Book a gym session to get started!</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.exploreBtnText}>Find Gyms</Text>
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
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '900', color: COLORS.textPrimary },

  tabsRow: { flexDirection: 'row', paddingHorizontal: SPACING.base, marginBottom: SPACING.md, gap: SPACING.xs },
  tab: { paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  list: { paddingHorizontal: SPACING.base, paddingBottom: 100 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  gymImage: { width: 60, height: 60, borderRadius: RADIUS.md, backgroundColor: COLORS.bgElevated },
  cardContent: { flex: 1 },
  gymName: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.md },
  gymAddress: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  detailText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  detailDot: { color: COLORS.textMuted },
  planType: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600', textTransform: 'capitalize' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  amount: { color: COLORS.textPrimary, fontWeight: '900', fontSize: FONTS.sizes.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: '700', textTransform: 'capitalize' },
  qrBtn: { padding: SPACING.xs },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, marginBottom: SPACING.xl },
  exploreBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md },
  exploreBtnText: { color: '#fff', fontWeight: '800', fontSize: FONTS.sizes.md },
});

export default MyBookingsScreen;
