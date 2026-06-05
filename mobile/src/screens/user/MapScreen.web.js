import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { gymAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import GymCard from '../../components/gym/GymCard';

const MapScreenWeb = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5000);

  useEffect(() => {
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // In web browser, allow using default location coordinates if denied
          const defaultLoc = { coords: { latitude: 12.9716, longitude: 77.5946 } };
          setLocation(defaultLoc);
          await fetchGyms(defaultLoc);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(loc);
        await fetchGyms(loc);
      } catch (err) {
        // Fallback for browser testing
        const defaultLoc = { coords: { latitude: 12.9716, longitude: 77.5946 } };
        setLocation(defaultLoc);
        await fetchGyms(defaultLoc);
      }
    };
    init();
  }, []);

  const fetchGyms = async (loc) => {
    setLoading(true);
    try {
      const { data } = await gymAPI.getNearby({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        radius,
        limit: 20,
      });
      setGyms(data.gyms);
    } catch (err) {
      console.error('Web fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Locating nearby fitness centers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>NEARBY GYMS</Text>
        <Text style={styles.subtitle}>Showing gyms within {radius / 1000}km of your location</Text>
      </View>

      {/* Radius Selector */}
      <View style={styles.radiusRow}>
        {[2000, 5000, 10000].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
            onPress={() => { setRadius(r); if (location) fetchGyms(location); }}
          >
            <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>
              {r / 1000}KM RANGE
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid List */}
      {loading ? (
        <View style={styles.listCentered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {gyms.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="dumbbell" size={48} color={COLORS.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>NO GYMS FOUND</Text>
              <Text style={styles.emptySubtitle}>Try expanding the search range or registering a gym.</Text>
            </View>
          ) : (
            gyms.map((gym) => (
              <GymCard
                key={gym._id}
                gym={gym}
                onPress={() => navigation.navigate('GymDetail', { gymId: gym._id })}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  listCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md, fontSize: FONTS.sizes.base },

  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: FONTS.sizes.xl, fontWeight: '950', color: COLORS.textPrimary, letterSpacing: 0.5 },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4 },

  radiusRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
  },
  radiusChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...SHADOWS.sm,
  },
  radiusChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOWS.glow },
  radiusText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  radiusTextActive: { color: '#000' },

  list: { paddingBottom: 100 },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xl },
  emptyIcon: { marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '950', color: COLORS.textPrimary, marginBottom: SPACING.xs, letterSpacing: 0.5 },
  emptySubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center' },
});

export default MapScreenWeb;
