import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, ScrollView, Image, StatusBar, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { gymAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import useAuthStore from '../../store/authStore';
import GymCard from '../../components/gym/GymCard';

const FILTERS = [
  { key: 'All', label: 'All', icon: 'view-grid' },
  { key: 'Open Now', label: 'Open', icon: 'clock-check-outline' },
  { key: 'Top Rated', label: 'Top Rated', icon: 'star-outline' },
  { key: 'Budget', label: 'Budget', icon: 'tag-outline' },
  { key: 'Premium', label: 'Premium', icon: 'diamond-outline' },
  { key: 'Yoga', label: 'Yoga', icon: 'yoga' },
  { key: '24/7', label: '24 / 7', icon: 'hours-24' },
];

const HomeScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [gyms, setGyms] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNearbyGyms = useCallback(async (loc) => {
    if (!loc) return;
    try {
      const { data } = await gymAPI.getNearby({ lat: loc.coords.latitude, lng: loc.coords.longitude, radius: 10000 });
      setGyms(data.gyms);
      setFeatured(data.gyms.filter((g) => g.isFeatured));
    } catch (err) {
      console.error('Error fetching gyms:', err.message);
    }
  }, []);

  const getLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation(loc);
    return loc;
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const loc = await getLocation();
      await fetchNearbyGyms(loc);
      setLoading(false);
    };
    init();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const loc = await getLocation();
    await fetchNearbyGyms(loc);
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  const filteredGyms = gyms.filter((g) => {
    if (searchQuery) {
      return g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (activeFilter === 'Open Now') return g.isOpenNow;
    if (activeFilter === 'Top Rated') return g.rating >= 4.5;
    if (activeFilter === 'Budget') return g.tags?.includes('budget');
    if (activeFilter === 'Premium') return g.tags?.includes('premium');
    if (activeFilter === 'Yoga') return g.facilities?.includes('Yoga Studio');
    if (activeFilter === '24/7') return g.tags?.includes('24/7');
    return true;
  });

  const firstName = user?.name?.split(' ')[0] || 'Athlete';

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding gyms near you...</Text>
      </View>
    );
  }

  const ListHeader = () => (
    <>
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <StatusBar barStyle="light-content" />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good {getGreeting()},</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Explore')}>
              <MaterialCommunityIcons name="map-outline" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.textPrimary} />
              {/* Notification dot */}
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
          <Text style={styles.searchPlaceholder}>Gyms, trainers, workouts...</Text>
          <View style={styles.filterIconWrap}>
            <MaterialCommunityIcons name="tune-variant" size={16} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Featured Carousel */}
      {featured.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Featured</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: SPACING.base }}>
            {featured.map((gym) => (
              <TouchableOpacity
                key={gym._id}
                style={styles.featuredCard}
                onPress={() => navigation.navigate('GymDetail', { gymId: gym._id })}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: gym.coverImage || gym.images?.[0] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600' }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.featuredGradient} />
                <View style={styles.featuredBadge}>
                  <MaterialCommunityIcons name="lightning-bolt" size={10} color="#000" />
                  <Text style={styles.featuredBadgeText}>FEATURED</Text>
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredName} numberOfLines={1}>{gym.name}</Text>
                  <View style={styles.featuredMeta}>
                    <MaterialCommunityIcons name="star" size={12} color={COLORS.star} />
                    <Text style={styles.featuredRating}>{gym.rating?.toFixed(1) || '—'}</Text>
                    {gym.distance && <Text style={styles.featuredDist}>· {(gym.distance / 1000).toFixed(1)} km</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
        {FILTERS.map((f) => {
          const active = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={f.icon} size={14}
                color={active ? '#000' : COLORS.textSecondary}
              />
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Nearby Header */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Nearby Clubs</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
          <Text style={styles.seeAll}>Map view</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGyms}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <GymCard gym={item} onPress={() => navigation.navigate('GymDetail', { gymId: item._id })} />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={36} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No clubs found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting filters or expanding the search range</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 110 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingScreen: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md, fontSize: FONTS.sizes.base, fontWeight: '600' },

  heroHeader: {
    backgroundColor: COLORS.bgCard,
    paddingBottom: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
    paddingBottom: SPACING.md,
  },
  greeting: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '500', marginBottom: 2 },
  userName: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },

  headerActions: { flexDirection: 'row', gap: SPACING.xs, marginTop: 6 },
  iconBtn: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border, position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.bgElevated,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md,
    marginHorizontal: SPACING.base, paddingHorizontal: SPACING.md, height: 50,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchPlaceholder: { flex: 1, color: COLORS.textMuted, fontSize: FONTS.sizes.base, fontWeight: '500' },
  filterIconWrap: {
    width: 32, height: 32, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },

  section: { marginBottom: SPACING.md },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
  },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  seeAll: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '700' },

  featuredCard: {
    width: 260, height: 158, borderRadius: RADIUS.xl, overflow: 'hidden',
    marginRight: SPACING.md, position: 'relative',
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  featuredBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xs,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  featuredBadgeText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  featuredInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md },
  featuredName: { color: '#fff', fontSize: FONTS.sizes.base, fontWeight: '800', letterSpacing: -0.2, marginBottom: 3 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredRating: { color: COLORS.star, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  featuredDist: { color: 'rgba(255,255,255,0.65)', fontSize: FONTS.sizes.sm },

  filtersContent: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.xs },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  filterTextActive: { color: '#000' },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl },
  emptyIcon: {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  emptySubtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});

export default HomeScreen;
