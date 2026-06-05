import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { gymAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';
import GymCard from '../../components/gym/GymCard';

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#08090c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a0a5b5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#08090c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#16171a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#08090c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c0d12' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const MapScreen = ({ navigation }) => {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5000);

  useEffect(() => {
    const init = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location to find nearby gyms.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc);
      await fetchGyms(loc);
    };
    init();
  }, []);

  const fetchGyms = async (loc) => {
    try {
      const { data } = await gymAPI.getNearby({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        radius,
        limit: 50,
      });
      setGyms(data.gyms);
    } catch (err) {
      console.error('Map fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  };

  if (loading || !location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding gyms near you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_STYLE}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* User radius */}
        <Circle
          center={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
          radius={radius}
          fillColor="rgba(212,255,0,0.02)"
          strokeColor="rgba(212,255,0,0.2)"
          strokeWidth={1}
        />

        {/* Gym Markers */}
        {gyms.map((gym) => (
          <Marker
            key={gym._id}
            coordinate={{
              latitude: gym.location.coordinates[1],
              longitude: gym.location.coordinates[0],
            }}
            onPress={() => setSelectedGym(gym)}
          >
            <View style={[styles.marker, selectedGym?._id === gym._id && styles.markerSelected]}>
              <MaterialCommunityIcons name="dumbbell" size={14} color="#000" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>GYMS NEARBY ({gyms.length})</Text>
        <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
          <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Radius Selector */}
      <View style={styles.radiusRow}>
        {[2000, 5000, 10000].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
            onPress={() => { setRadius(r); fetchGyms(location); }}
          >
            <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>
              {r / 1000}KM
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Gym Card */}
      {selectedGym && (
        <View style={styles.selectedCard}>
          <GymCard
            gym={selectedGym}
            onPress={() => navigation.navigate('GymDetail', { gymId: selectedGym._id })}
          />
          <TouchableOpacity style={styles.closeCard} onPress={() => setSelectedGym(null)}>
            <MaterialCommunityIcons name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md, fontSize: FONTS.sizes.base },
  map: { ...StyleSheet.absoluteFillObject },

  mapHeader: {
    position: 'absolute', top: 50, left: SPACING.base, right: SPACING.base,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(20,20,20,0.9)', borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', ...SHADOWS.md,
  },
  mapTitle: { color: COLORS.textPrimary, fontWeight: '950', fontSize: FONTS.sizes.base, letterSpacing: 0.5 },
  centerBtn: {
    width: 36, height: 36, backgroundColor: COLORS.bgElevated,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },

  radiusRow: {
    position: 'absolute', top: 110, left: SPACING.base,
    flexDirection: 'row', gap: SPACING.xs,
  },
  radiusChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    backgroundColor: 'rgba(20,20,20,0.9)', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  radiusChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOWS.glow },
  radiusText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '850', letterSpacing: 0.5 },
  radiusTextActive: { color: '#000' },

  marker: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#000', ...SHADOWS.sm,
  },
  markerSelected: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#fff' },

  selectedCard: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
  },
  closeCard: {
    position: 'absolute', top: 8, right: SPACING.xl,
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
});

export default MapScreen;
