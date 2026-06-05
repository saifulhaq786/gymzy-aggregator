import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const AvailabilityBadge = ({ occupancyPercent, isOpenNow }) => {
  let color = COLORS.available;
  let label = 'Available';
  let icon = 'check-circle';

  if (!isOpenNow) { color = COLORS.textMuted; label = 'Closed'; icon = 'clock-remove'; }
  else if (occupancyPercent >= 100) { color = COLORS.full; label = 'Full'; icon = 'close-circle'; }
  else if (occupancyPercent >= 80) { color = COLORS.warning; label = 'Almost Full'; icon = 'alert-circle'; }

  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
      <MaterialCommunityIcons name={icon} size={12} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

const GymCard = ({ gym, onPress }) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();
  };

  const formatPrice = (pricing) => {
    if (pricing?.hourly) return `₹${pricing.hourly}/hr`;
    if (pricing?.daily) return `₹${pricing.daily}/day`;
    return 'View pricing';
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[styles.card, gym.isFeatured && { borderColor: COLORS.primary, borderWidth: 1.5 }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: gym.coverImage || gym.images?.[0] || 'https://via.placeholder.com/400x180' }}
          style={styles.image}
          resizeMode="cover"
        />
        {gym.isFeatured && (
          <View style={styles.featuredTag}>
            <Text style={styles.featuredTagText}>FEATURED</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{gym.name}</Text>
          <AvailabilityBadge occupancyPercent={gym.occupancyPercent} isOpenNow={gym.isOpenNow} />
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {gym.location?.address || gym.location?.city}
          </Text>
          {gym.distance != null && (
            <Text style={styles.distance}>{(gym.distance / 1000).toFixed(1)} km</Text>
          )}
        </View>

        <View style={styles.bottomRow}>
          {/* Rating */}
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={14} color={COLORS.star} />
            <Text style={styles.rating}>{gym.rating?.toFixed(1) || '—'}</Text>
            <Text style={styles.reviews}>({gym.totalReviews})</Text>
          </View>

          {/* Price */}
          <Text style={styles.price}>{formatPrice(gym.pricing)}</Text>
        </View>

        {/* Facilities */}
        {gym.facilities?.length > 0 && (
          <View style={styles.facilities}>
            {gym.facilities.slice(0, 4).map((f) => (
              <View key={f} style={styles.facilityTag}>
                <Text style={styles.facilityText}>{f.toUpperCase()}</Text>
              </View>
            ))}
            {gym.facilities.length > 4 && (
              <Text style={styles.moreFacilities}>+{gym.facilities.length - 4}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...SHADOWS.sm,
  },
  imageContainer: { height: 180, position: 'relative' },
  image: { width: '100%', height: '100%' },
  featuredTag: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  featuredTagText: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  content: { padding: SPACING.base },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.textPrimary, marginRight: SPACING.sm },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  metaText: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  distance: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '700' },

  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { color: COLORS.textPrimary, fontWeight: '700', fontSize: FONTS.sizes.base },
  reviews: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  price: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.md },

  facilities: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  facilityTag: {
    backgroundColor: COLORS.bgElevated, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  facilityText: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  moreFacilities: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, alignSelf: 'center', fontWeight: '700', marginLeft: 2 },
});

export default GymCard;
