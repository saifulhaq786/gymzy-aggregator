import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, ScrollView,
  Image, StatusBar, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { gymAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/theme';
import useAuthStore from '../../store/authStore';
import GymCard from '../../components/gym/GymCard';

// Category tiles — like Swiggy cuisine categories
const CATEGORIES = [
  { key: 'All', emoji: '🏋️', label: 'All' },
  { key: 'Open Now', emoji: '🟢', label: 'Open Now' },
  { key: 'Top Rated', emoji: '⭐', label: 'Top Rated' },
  { key: 'Budget', emoji: '💸', label: 'Budget' },
  { key: 'Premium', emoji: '💎', label: 'Premium' },
  { key: 'Yoga', emoji: '🧘', label: 'Yoga' },
  { key: '24/7', emoji: '🌙', label: '24 / 7' },
];

const HomeScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [gyms, setGyms] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchNearbyGyms = useCallback(async (loc) => {
    if (!loc) return;
    try {
      const { data } = await gymAPI.getNearby({ lat: loc.coords.latitude, lng: loc.coords.longitude, radius: 10000 });
      setGyms(data.gyms || []);
      setFeatured((data.gyms || []).filter(g => g.isFeatured));
    } catch (err) {
      console.error('Gyms fetch error:', err.message);
    }
  }, []);

  const getLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const loc = await getLocation();
      await fetchNearbyGyms(loc);
      setLoading(false);
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const loc = await getLocation();
    await fetchNearbyGyms(loc);
    setRefreshing(false);
  }, []);

  const filtered = gyms.filter(g => {
    if (activeFilter === 'Open Now') return g.isOpenNow;
    if (activeFilter === 'Top Rated') return g.rating >= 4.5;
    if (activeFilter === 'Budget') return g.tags?.includes('budget');
    if (activeFilter === 'Premium') return g.tags?.includes('premium');
    if (activeFilter === 'Yoga') return g.facilities?.includes('Yoga Studio');
    if (activeFilter === '24/7') return g.tags?.includes('24/7');
    return true;
  });

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'Athlete';

  if (loading) return (
    <View style={s.loadScreen}>
      <StatusBar barStyle="light-content" />
      <ActivityIndicator color={COLORS.primary} size="large" />
      <Text style={s.loadText}>Finding gyms near you...</Text>
    </View>
  );

  const Header = () => (
    <View>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.primary} />
          <Text style={s.locationCity}>Your area</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#aaa" />
        </View>
        <TouchableOpacity style={s.iconBtn}>
          <MaterialCommunityIcons name="bell-outline" size={21} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Hero greeting — large, editorial */}
      <View style={s.hero}>
        <Text style={s.heroGreeting}>Good {getHour()},</Text>
        <Text style={s.heroName}>{firstName}</Text>
      </View>

      {/* Search — tappable fake input like Swiggy */}
      <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.9}>
        <MaterialCommunityIcons name="magnify" size={20} color="#666" />
        <Text style={s.searchText}>Search gyms, trainers, classes...</Text>
      </TouchableOpacity>

      {/* Offer strip — like Zomato's gold/free delivery banner */}
      <View style={s.offerStrip}>
        <LinearGradient colors={['#1A2400', '#0F1800']} style={s.offerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={s.offerEmoji}>⚡</Text>
          <Text style={s.offerText}>First booking 20% off · Use code </Text>
          <Text style={s.offerCode}>GYMZY20</Text>
        </LinearGradient>
      </View>

      {/* Featured row */}
      {featured.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Featured clubs</Text>
            <TouchableOpacity><Text style={s.seeAll}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: SPACING.base }}>
            {featured.map((gym) => (
              <TouchableOpacity
                key={gym._id}
                style={s.featCard}
                onPress={() => navigation.navigate('GymDetail', { gymId: gym._id })}
                activeOpacity={0.92}
              >
                <Image
                  source={{ uri: gym.coverImage || gym.images?.[0] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80' }}
                  style={s.featImg}
                  resizeMode="cover"
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={s.featScrim} />
                {gym.isFeatured && (
                  <View style={s.featTag}>
                    <Text style={s.featTagText}>⚡ TOP PICK</Text>
                  </View>
                )}
                <View style={s.featInfo}>
                  <Text style={s.featName} numberOfLines={1}>{gym.name}</Text>
                  <Text style={s.featMeta}>
                    {gym.rating ? `★ ${gym.rating.toFixed(1)}` : ''}
                    {gym.distance ? `  ·  ${(gym.distance / 1000).toFixed(1)} km` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category filter — emoji tiles like Swiggy */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>What are you looking for?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {CATEGORIES.map((c) => {
            const active = activeFilter === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[s.catTile, active && s.catTileActive]}
                onPress={() => setActiveFilter(c.key)}
                activeOpacity={0.8}
              >
                <Text style={s.catEmoji}>{c.emoji}</Text>
                <Text style={[s.catLabel, active && s.catLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Section header for list */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>
          {activeFilter === 'All' ? 'Clubs near you' : activeFilter}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
          <Text style={s.seeAll}>Map view</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListHeaderComponent={Header}
        renderItem={({ item, index }) => (
          <GymCard
            gym={item}
            index={index}
            onPress={() => navigation.navigate('GymDetail', { gymId: item._id })}
          />
        )}
        ListEmptyComponent={() => (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🏋️</Text>
            <Text style={s.emptyTitle}>No gyms found</Text>
            <Text style={s.emptySub}>Try a different filter or check back later</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  loadScreen: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  loadText: { color: '#555', marginTop: SPACING.md, fontSize: FONTS.sizes.base },

  // Top bar — like Zomato's delivery location selector
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: SPACING.sm,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationCity: { color: '#fff', fontSize: FONTS.sizes.base, fontWeight: '700' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  // Hero — editorial, not boxed
  hero: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.lg },
  heroGreeting: { fontSize: FONTS.sizes.base, color: '#666', fontWeight: '400', marginBottom: 2 },
  heroName: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: '#111', borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.base, marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md, height: 50,
  },
  searchText: { color: '#555', fontSize: FONTS.sizes.base },

  // Offer strip
  offerStrip: { marginHorizontal: SPACING.base, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.lg },
  offerGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 10 },
  offerEmoji: { fontSize: 16, marginRight: 6 },
  offerText: { color: '#aaa', fontSize: FONTS.sizes.sm, fontWeight: '500' },
  offerCode: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '800' },

  // Section
  section: { marginBottom: SPACING.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.base, marginBottom: SPACING.sm },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  seeAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '700' },

  // Featured cards
  featCard: {
    width: 240, height: 150, borderRadius: RADIUS.xl,
    overflow: 'hidden', marginRight: SPACING.md, position: 'relative',
  },
  featImg: { width: '100%', height: '100%' },
  featScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 },
  featTag: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xs,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  featTagText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  featInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.sm },
  featName: { color: '#fff', fontSize: FONTS.sizes.base, fontWeight: '800', marginBottom: 2 },
  featMeta: { color: 'rgba(255,255,255,0.6)', fontSize: FONTS.sizes.xs, fontWeight: '500' },

  // Category tiles
  catRow: { paddingHorizontal: SPACING.base, gap: SPACING.sm },
  catTile: {
    alignItems: 'center',
    backgroundColor: '#111', borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    minWidth: 68,
  },
  catTileActive: { backgroundColor: '#1A2400' },
  catEmoji: { fontSize: 22, marginBottom: 4 },
  catLabel: { color: '#666', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  catLabelActive: { color: COLORS.primary },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: '#fff', marginBottom: SPACING.xs },
  emptySub: { fontSize: FONTS.sizes.base, color: '#555', textAlign: 'center' },
});

export default HomeScreen;
