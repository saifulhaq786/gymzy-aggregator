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
                <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
                <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Athlete'} 💪</Text>
              </View>
              <TouchableOpacity style={styles.notifBtn}>
                <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => navigation.navigate('Search')}
            >
              <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
              <Text style={styles.searchPlaceholder}>Search gyms, locations...</Text>
              <MaterialCommunityIcons name="tune-vertical" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Featured Gyms */}
            {featured.length > 0 && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>⭐ Featured</Text>
                  <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
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
                          <Text style={styles.featuredBadgeText}>Featured</Text>
                        </View>
                        <Text style={styles.featuredName}>{gym.name}</Text>
                        <View style={styles.featuredRow}>
                          <MaterialCommunityIcons name="star" size={14} color={COLORS.star} />
                          <Text style={styles.featuredRating}>{gym.rating}</Text>
                          <Text style={styles.featuredDistance}>• {(gym.distance / 1000).toFixed(1)}km</Text>
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
                  <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Nearby Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📍 Nearby Gyms</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
                <Text style={styles.seeAll}>Map view</Text>
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
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No gyms found</Text>
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
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md, fontSize: FONTS.sizes.base },
  list: { paddingBottom: 100 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingTop: 60, paddingBottom: SPACING.md,
  },
  greeting: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary },
  userName: { fontSize: FONTS.sizes['2xl'], fontWeight: '900', color: COLORS.textPrimary },
  notifBtn: {
    width: 44, height: 44, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, marginHorizontal: SPACING.base,
    paddingHorizontal: SPACING.md, height: 50, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  searchPlaceholder: { flex: 1, color: COLORS.textMuted, fontSize: FONTS.sizes.base },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base, marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary },
  seeAll: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },

  featuredCard: {
    width: 260, height: 150, borderRadius: RADIUS.xl, overflow: 'hidden',
    marginLeft: SPACING.base, marginBottom: SPACING.lg, ...SHADOWS.md,
  },
  featuredImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)',
    padding: SPACING.md, justifyContent: 'flex-end',
  },
  featuredBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 2, marginBottom: SPACING.xs,
  },
  featuredBadgeText: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  featuredName: { color: '#fff', fontWeight: '800', fontSize: FONTS.sizes.md },
  featuredRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  featuredRating: { color: '#fff', fontSize: FONTS.sizes.sm, fontWeight: '600' },
  featuredDistance: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.sm },

  filtersRow: { paddingLeft: SPACING.base, marginBottom: SPACING.lg },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.full, marginRight: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  emptySubtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center' },
});

export default HomeScreen;
