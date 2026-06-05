import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, FONTS } from '../../constants/theme';

// Placeholder gym images when no image is available
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80',
];

const GymCard = ({ gym, onPress, index = 0 }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const onIn = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

  const imageUri = gym.coverImage || gym.images?.[0] || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];

  const priceText = gym.pricing?.hourly
    ? `₹${gym.pricing.hourly}/hr`
    : gym.pricing?.daily
    ? `₹${gym.pricing.daily}/day`
    : null;

  const isOpen = gym.isOpenNow !== false;
  const isFull = gym.occupancyPercent >= 100;
  const isBusy = gym.occupancyPercent >= 80;

  let statusColor = '#22C55E';
  let statusLabel = 'Open';
  if (!isOpen) { statusColor = '#555'; statusLabel = 'Closed'; }
  else if (isFull) { statusColor = '#EF4444'; statusLabel = 'Full'; }
  else if (isBusy) { statusColor = '#F59E0B'; statusLabel = 'Busy'; }

  const rating = gym.rating?.toFixed(1);
  const reviews = gym.totalReviews;
  const distance = gym.distance != null ? `${(gym.distance / 1000).toFixed(1)} km` : null;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
        style={s.card}
      >
        {/* Full-bleed image */}
        <View style={s.imgBox}>
          <Image source={{ uri: imageUri }} style={s.img} resizeMode="cover" />

          {/* Subtle scrim at bottom for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)']}
            style={s.scrim}
          />

          {/* Featured badge — top left */}
          {gym.isFeatured && (
            <View style={s.featuredBadge}>
              <Text style={s.featuredText}>⚡ Top Pick</Text>
            </View>
          )}

          {/* Rating — top right, floating green pill like Swiggy */}
          {rating && (
            <View style={[s.ratingBadge, { backgroundColor: statusColor }]}>
              <Text style={s.ratingText}>★ {rating}</Text>
            </View>
          )}

          {/* Price bottom-right on image */}
          {priceText && (
            <Text style={s.priceOnImage}>{priceText}</Text>
          )}
        </View>

        {/* Info below image — NO wrapper card, just plain layout */}
        <View style={s.info}>
          {/* Row 1: Name + distance */}
          <View style={s.row1}>
            <Text style={s.name} numberOfLines={1}>{gym.name}</Text>
            {distance && (
              <Text style={s.dist}>{distance}</Text>
            )}
          </View>

          {/* Row 2: location + status */}
          <View style={s.row2}>
            <Text style={s.address} numberOfLines={1}>
              {gym.location?.address || gym.location?.city || 'Location not available'}
            </Text>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          {/* Row 3: Facilities */}
          {gym.facilities?.length > 0 && (
            <View style={s.pills}>
              {gym.facilities.slice(0, 3).map(f => (
                <Text key={f} style={s.pill}>{f}</Text>
              ))}
              {gym.facilities.length > 3 && (
                <Text style={s.pillMore}>+{gym.facilities.length - 3}</Text>
              )}
            </View>
          )}
        </View>

        {/* Hairline separator */}
        <View style={s.sep} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const s = StyleSheet.create({
  // No border, no bgCard — the card IS the content
  card: {
    backgroundColor: '#000',
    marginBottom: 4,
  },

  imgBox: { height: 210, position: 'relative', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  scrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },

  featuredBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  featuredText: { color: '#000', fontSize: 11, fontWeight: '800' },

  ratingBadge: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  ratingText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  priceOnImage: {
    position: 'absolute', bottom: SPACING.sm, right: SPACING.sm,
    color: '#fff', fontSize: 15, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  info: { paddingHorizontal: SPACING.base, paddingTop: SPACING.md, paddingBottom: SPACING.sm },

  row1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  dist: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '700', marginLeft: SPACING.sm },

  row2: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  address: { flex: 1, color: '#666', fontSize: FONTS.sizes.sm, fontWeight: '400' },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },

  pills: { flexDirection: 'row', gap: 6 },
  pill: {
    color: '#555', fontSize: 11, fontWeight: '500',
    backgroundColor: '#111',
    borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3,
  },
  pillMore: { color: '#444', fontSize: 11, fontWeight: '500', alignSelf: 'center' },

  sep: { height: 1, backgroundColor: '#111', marginTop: SPACING.xs },
});

export default GymCard;
