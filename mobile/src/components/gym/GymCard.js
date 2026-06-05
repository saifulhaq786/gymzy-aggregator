import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const GymCard = ({ gym, onPress, horizontal = false }) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleValue, { toValue: 0.97, useNativeDriver: true, tension: 150, friction: 8 }).start();

  const handlePressOut = () =>
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, tension: 150, friction: 8 }).start();

  const formatPrice = (pricing) => {
    if (pricing?.hourly) return `₹${pricing.hourly}`;
    if (pricing?.daily) return `₹${pricing.daily}`;
    return null;
  };

  const price = formatPrice(gym.pricing);
  const priceUnit = gym.pricing?.hourly ? '/hr' : '/day';

  let statusColor = COLORS.success;
  let statusLabel = 'Open';
  if (!gym.isOpenNow) { statusColor = COLORS.textMuted; statusLabel = 'Closed'; }
  else if (gym.occupancyPercent >= 100) { statusColor = COLORS.error; statusLabel = 'Full'; }
  else if (gym.occupancyPercent >= 80) { statusColor = COLORS.warning; statusLabel = 'Busy'; }

  const imageUri = gym.coverImage || gym.images?.[0];

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Image Block */}
        <View style={styles.imageBlock}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="dumbbell" size={32} color={COLORS.textMuted} />
            </View>
          )}

          {/* Gradient overlay for text legibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />

          {/* Top-left: Featured badge */}
          {gym.isFeatured && (
            <View style={styles.featuredBadge}>
              <MaterialCommunityIcons name="lightning-bolt" size={11} color="#000" />
              <Text style={styles.featuredText}>TOP PICK</Text>
            </View>
          )}

          {/* Top-right: Status indicator */}
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

          {/* Bottom-left overlay: price */}
          {price && (
            <View style={styles.priceOverlay}>
              <Text style={styles.priceValue}>{price}</Text>
              <Text style={styles.priceUnit}>{priceUnit}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{gym.name}</Text>
            {gym.rating > 0 && (
              <View style={styles.ratingPill}>
                <MaterialCommunityIcons name="star" size={11} color={COLORS.star} />
                <Text style={styles.ratingText}>{gym.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {gym.location?.address || gym.location?.city || 'Location unavailable'}
            </Text>
            {gym.distance != null && (
              <>
                <Text style={styles.dotSep}>·</Text>
                <Text style={styles.distanceText}>{(gym.distance / 1000).toFixed(1)} km</Text>
              </>
            )}
          </View>

          {/* Facility pills */}
          {gym.facilities?.length > 0 && (
            <View style={styles.pillsRow}>
              {gym.facilities.slice(0, 3).map((f) => (
                <View key={f} style={styles.pill}>
                  <Text style={styles.pillText}>{f}</Text>
                </View>
              ))}
              {gym.facilities.length > 3 && (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>+{gym.facilities.length - 3}</Text>
                </View>
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
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },

  imageBlock: { height: 188, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  imageGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
  },

  featuredBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xs,
    paddingHorizontal: 7, paddingVertical: 4,
  },
  featuredText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },

  statusDot: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.5)',
  },

  priceOverlay: {
    position: 'absolute', bottom: SPACING.sm, left: SPACING.sm,
    flexDirection: 'row', alignItems: 'baseline', gap: 1,
  },
  priceValue: { color: '#fff', fontSize: FONTS.sizes.xl, fontWeight: '900' },
  priceUnit: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.xs, fontWeight: '600', marginLeft: 1 },

  content: { padding: SPACING.base, paddingTop: SPACING.md },

  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { flex: 1, fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3, marginRight: SPACING.sm },

  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: RADIUS.xs, paddingHorizontal: 7, paddingVertical: 3,
  },
  ratingText: { color: COLORS.star, fontSize: FONTS.sizes.sm, fontWeight: '800' },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  locationText: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  dotSep: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  distanceText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '700' },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  pill: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.sm, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: COLORS.borderSubtle,
  },
  pillText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, fontWeight: '600' },
});

export default GymCard;
