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

const FILTERS = [
  { key: 'All',       label: 'All',        icon: 'view-grid-outline' },
  { key: 'Open Now',  label: 'Open now',   icon: 'clock-outline' },
  { key: 'Top Rated', label: 'Top rated',  icon: 'star-outline' },
  { key: 'Budget',    label: 'Budget',     icon: 'tag-outline' },
  { key: 'Premium',   label: 'Premium',    icon: 'diamond-outline' },
  { key: 'Yoga',      label: 'Yoga',       icon: 'yoga' },
  { key: '24/7',      label: '24 / 7',     icon: 'hours-24' },
];

const HomeScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const [gyms, setGyms]         = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchGyms = useCallback(async (loc) => {
    if (!loc) return;
    try {
      const { data } = await gymAPI.getNearby({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        radius: 10000,
      });
      const list = data.gyms || [];
      setGyms(list);
      setFeatured(list.filter(g => g.isFeatured));
    } catch (e) {
      console.error('Gyms:', e.message);
    }
  }, []);

  const getLoc = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const loc = await getLoc();
      await fetchGyms(loc);
      setLoading(false);
    })();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGyms(await getLoc());
    setRefreshing(false);
  }, []);

  const filtered = gyms.filter(g => {
    if (activeFilter === 'Open Now')  return g.isOpenNow;
    if (activeFilter === 'Top Rated') return g.rating >= 4.5;
    if (activeFilter === 'Budget')    return g.tags?.includes('budget');
    if (activeFilter === 'Premium')   return g.tags?.includes('premium');
    if (activeFilter === 'Yoga')      return g.facilities?.includes('Yoga Studio');
    if (activeFilter === '24/7')      return g.tags?.includes('24/7');
    return true;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  if (loading) return (
    <View style={s.loader}>
      <StatusBar barStyle="light-content" />
      <ActivityIndicator color={COLORS.primary} size="large" />
      <Text style={s.loaderText}>Finding gyms near you</Text>
    </View>
  );

  const Header = () => (
    <View>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Top bar ─────────────────────────────────────── */}
      <View style={s.topBar}>
        <View>
          <Text style={s.greetingText}>{greeting}</Text>
          <Text style={s.nameText}>{firstName}</Text>
        </View>
        <View style={s.topActions}>
          <TouchableOpacity style={s.topBtn} onPress={() => navigation.navigate('Search')}>
            <MaterialCommunityIcons name="magnify" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.topBtn}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Location bar ────────────────────────────────── */}
      <TouchableOpacity style={s.locationBar} activeOpacity={0.8}>
        <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.primary} />
        <Text style={s.locationText}>Showing gyms near your location</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color="#444" />
      </TouchableOpacity>

      {/* ── Featured carousel ───────────────────────────── */}
      {featured.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Featured clubs</Text>
            <TouchableOpacity><Text style={s.sectionLink}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: SPACING.base, gap: SPACING.sm }}
          >
            {featured.map((gym) => (
              <TouchableOpacity
                key={gym._id}
                style={s.featCard}
                onPress={() => navigation.navigate('GymDetail', { gymId: gym._id })}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: gym.coverImage || gym.images?.[0] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80' }}
                  style={s.featImg}
                  resizeMode="cover"
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={s.featScrim} />
                {gym.isFeatured && (
                  <View style={s.featBadge}>
                    <Text style={s.featBadgeText}>TOP PICK</Text>
                  </View>
                )}
                <View style={s.featBottom}>
                  <Text style={s.featName} numberOfLines={1}>{gym.name}</Text>
                  <Text style={s.featSub}>
                    {gym.rating ? `★ ${gym.rating.toFixed(1)}` : ''}
                    {gym.distance ? `  ·  ${(gym.distance / 1000).toFixed(1)} km` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Filter chips ────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        {FILTERS.map(f => {
          const active = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={f.icon}
                size={14}
                color={active ? '#000' : '#666'}
              />
              <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Section heading ──────────────────────────────── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>
          {activeFilter === 'All' ? 'Clubs near you' : activeFilter}
          <Text style={s.countText}>  {filtered.length} results</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Explore')}>
          <Text style={s.sectionLink}>Map view</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
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
            <MaterialCommunityIcons name="map-search-outline" size={48} color="#333" />
            <Text style={s.emptyTitle}>No clubs found</Text>
            <Text style={s.emptySub}>Try a different filter</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 110 }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#000' },
  loader:     { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  loaderText: { color: '#555', marginTop: SPACING.md, fontSize: FONTS.sizes.base, fontWeight: '500' },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.base,
    paddingTop: Platform.OS === 'ios' ? 58 : 36,
    paddingBottom: SPACING.md,
    backgroundColor: '#000',
  },
  greetingText: { fontSize: FONTS.sizes.sm,  color: '#555', fontWeight: '400', marginBottom: 2 },
  nameText:     { fontSize: FONTS.sizes['2xl'], color: '#fff', fontWeight: '800', letterSpacing: -0.5 },
  topActions:   { flexDirection: 'row', gap: SPACING.xs },
  topBtn: {
    width: 40, height: 40,
    backgroundColor: '#111',
    borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Location bar */
  locationBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  locationText: { flex: 1, color: '#555', fontSize: FONTS.sizes.sm, fontWeight: '400' },

  /* Section */
  section:       { marginBottom: SPACING.md },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  countText:    { fontSize: FONTS.sizes.sm, color: '#444', fontWeight: '400' },
  sectionLink:  { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },

  /* Featured */
  featCard: {
    width: 230, height: 145,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  featImg:   { width: '100%', height: '100%' },
  featScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  featBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xs,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  featBadgeText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  featBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.sm },
  featName:   { color: '#fff', fontSize: FONTS.sizes.base, fontWeight: '700', marginBottom: 2 },
  featSub:    { color: 'rgba(255,255,255,0.55)', fontSize: FONTS.sizes.xs },

  /* Filter chips */
  filterRow: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.xs },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderRadius: RADIUS.full,
  },
  chipActive:     { backgroundColor: COLORS.primary },
  chipText:       { color: '#666', fontSize: FONTS.sizes.sm, fontWeight: '600' },
  chipTextActive: { color: '#000', fontWeight: '700' },

  /* Empty */
  empty:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: '#fff', marginTop: SPACING.md },
  emptySub:   { fontSize: FONTS.sizes.base, color: '#555', marginTop: SPACING.xs },
});

export default HomeScreen;
