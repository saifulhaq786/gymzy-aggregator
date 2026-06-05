import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  RefreshControl, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { gymAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import useAuthStore from '../../store/authStore';
import GymCard from '../../components/gym/GymCard';

const FILTERS = ['All', 'Open Now', 'Top Rated', 'Budget', 'Premium', 'Yoga', '24/7'];

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
      const { data } = await gymAPI.getNearby({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        radius: 10000,
      });
      setGyms(data.gyms);
      setFeatured(data.gyms.filter((g) => g.isFeatured));
    } catch (err) {
      console.error('Error fetching gyms:', err.message);
    }
  }, []);

  const getLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
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

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding gyms near you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGyms}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListHeaderComponent={() => (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>GOOD {getTimeOfDay().toUpperCase()},</Text>
                <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'ATHLETE'}</Text>
              </View>
              <TouchableOpacity style={styles.notifBtn}>
                <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => navigation.navigate('Search')}
            >
              <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
              <Text style={styles.searchPlaceholder}>Search clubs, workouts, trainers...</Text>
              <MaterialCommunityIcons name="tune-vertical" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Featured Gyms */}
            {featured.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>FEATURED CLUBS</Text>
                  <TouchableOpacity><Text style={styles.seeAll}>SEE ALL</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {featured.map((gym) => (
                    <TouchableOpacity
                      key={gym._id}
                      style={styles.featuredCard}
                      onPress={() => navigation.navigate('GymDetail', { gymId: gym._id })}
                    >
                      <Image
                        source={{ uri: gym.coverImage || 'https://via.placeholder.com/300x150' }}
                        style={styles.featuredImage}
                      />
                      <View style={styles.featuredOverlay}>
                        <View style={styles.featuredBadge}>
                          <Text style={styles.featuredBadgeText}>FEATURED</Text>
                        </View>
                        <Text style={styles.featuredName}>{gym.name}</Text>
                        <View style={styles.featuredRow}>
                          <MaterialCommunityIcons name="star" size={14} color={COLORS.star} />
                          <Text style={styles.featuredRating}>{gym.rating}</Text>
                          <Text style={styles.featuredDistance}>• {(gym.distance / 1000).toFixed(1)} km</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                  onPress={() => setActiveFilter(f)}
                >
                  <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Nearby Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>NEARBY CLUBS</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
                <Text style={styles.seeAll}>MAP VIEW</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <GymCard
            gym={item}
            onPress={() => navigation.navigate('GymDetail', { gymId: item._id })}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons name="dumbbell" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No clubs found</Text>
            <Text style={styles.emptySubtitle}>Try changing the filter or expanding the search radius</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md, fontSize: FONTS.sizes.base, fontWeight: '700' },
  list: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingTop: 60, paddingBottom: SPACING.md,
  },
  greeting: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '800', letterSpacing: 1 },
  userName: { fontSize: FONTS.sizes['2xl'], fontWeight: '950', color: COLORS.textPrimary, letterSpacing: -0.5 },
  notifBtn: {
    width: 46, height: 46, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, marginHorizontal: SPACING.base,
    paddingHorizontal: SPACING.md, height: 52, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: SPACING.lg,
  },
  searchPlaceholder: { flex: 1, color: COLORS.textMuted, fontSize: FONTS.sizes.base },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base, marginBottom: SPACING.md, marginTop: SPACING.xs,
  },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1 },
  seeAll: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  featuredCard: {
    width: 280, height: 160, borderRadius: RADIUS.lg, overflow: 'hidden',
    marginLeft: SPACING.base, marginBottom: SPACING.xl, ...SHADOWS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  featuredImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.md, justifyContent: 'flex-end',
  },
  featuredBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.primary, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4, marginBottom: SPACING.xs,
  },
  featuredBadgeText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  featuredName: { color: '#fff', fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: -0.2 },
  featuredRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  featuredRating: { color: '#fff', fontSize: FONTS.sizes.sm, fontWeight: '700' },
  featuredDistance: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '500' },

  filtersRow: { paddingLeft: SPACING.base, marginBottom: SPACING.xl, maxHeight: 40 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: COLORS.bgCard, borderRadius: 4, marginRight: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  filterChipTextActive: { color: '#000' },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xl },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.textPrimary, marginBottom: SPACING.xs, letterSpacing: -0.5 },
  emptySubtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default HomeScreen;
