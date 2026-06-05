import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { gymAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import GymCard from '../../components/gym/GymCard';

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const getLoc = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocation(loc);
        }
      } catch (err) {
        console.warn('Location request failed:', err.message);
      }
    };
    getLoc();
  }, []);

  const handleSearch = useCallback(async (text) => {
    setQuery(text);
    if (!text.trim()) {
      setGyms([]);
      return;
    }
    setLoading(true);
    try {
      const coords = location?.coords || { latitude: 12.9716, longitude: 77.5946 }; // Default Bangalore
      const { data } = await gymAPI.getNearby({
        search: text,
        lat: coords.latitude,
        lng: coords.longitude,
        radius: 1000000, // Large radius for search fallback
      });
      setGyms(data.gyms);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [location]);

  return (
    <View style={styles.container}>
      {/* Top Header & Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search gyms, facilities, city..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={gyms}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <GymCard
              gym={item}
              onPress={() => navigation.navigate('GymDetail', { gymId: item._id })}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons 
                  name={query ? 'magnify-close' : 'compass-outline'} 
                  size={40} 
                  color={COLORS.textMuted} 
                />
              </View>
              <Text style={styles.emptyTitle}>
                {query ? 'NO RESULTS FOUND' : 'FIND YOUR CLUB'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {query
                  ? `We couldn't find anything matching "${query}"`
                  : 'Start typing to search clubs by name, description, or facilities'}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: 60,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchIcon: { marginRight: SPACING.xs },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.base, height: '100%' },

  list: { paddingTop: SPACING.md, paddingBottom: 100 },

  emptyState: { alignItems: 'center', paddingTop: 100, paddingHorizontal: SPACING.xl },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '900', color: COLORS.textPrimary, marginBottom: SPACING.xs, letterSpacing: 0.5 },
  emptySubtitle: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default SearchScreen;
