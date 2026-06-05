import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, FlatList, Linking, Alert, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { gymAPI, reviewAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, FACILITY_ICONS } from '../../constants/theme';

const GymDetailScreen = ({ route, navigation }) => {
  const { gymId } = route.params;
  const [gym, setGym] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [activeTab, setActiveTab] = useState('about'); // about | equipment | trainers | reviews
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [gymRes, reviewRes, availRes] = await Promise.all([
        gymAPI.getById(gymId),
        reviewAPI.getGymReviews(gymId, { limit: 5 }),
        gymAPI.getAvailability(gymId),
      ]);
      setGym(gymRes.data.gym);
      setReviews(reviewRes.data.reviews);
      setAvailability(availRes.data.availability);
    } catch (err) {
      Alert.alert('Error', 'Failed to load gym details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!gym) return null;

  const images = [gym.coverImage, ...(gym.images || [])].filter(Boolean);

  const getAvailabilityColor = (status) => {
    if (status === 'full') return COLORS.error;
    if (status === 'almost_full') return COLORS.warning;
    return COLORS.success;
  };

  const TABS = ['about', 'equipment', 'trainers', 'reviews'];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.gallery}>
          <Image
            source={{ uri: images[imageIndex] || 'https://via.placeholder.com/400x250' }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageGradient}
          />
          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          {/* Image Dots */}
          {images.length > 1 && (
            <View style={styles.imageDots}>
              {images.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setImageIndex(i)}>
                  <View style={[styles.dot, i === imageIndex && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Header Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.gymName}>{gym.name}</Text>
            {gym.isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>FEATURED</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.textMuted} />
            <Text style={styles.address}>{gym.location?.address}, {gym.location?.city}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="star" size={16} color={COLORS.star} />
              <Text style={styles.statValue}>{gym.rating?.toFixed(1)}</Text>
              <Text style={styles.statLabel}>({gym.totalReviews} reviews)</Text>
            </View>

            {availability && (
              <View style={[styles.availBadge, { backgroundColor: `${getAvailabilityColor(availability.status)}20` }]}>
                <View style={[styles.availDot, { backgroundColor: getAvailabilityColor(availability.status) }]} />
                <Text style={[styles.availText, { color: getAvailabilityColor(availability.status) }]}>
                  {availability.availableSpots} spots free
                </Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {/* About Tab */}
          {activeTab === 'about' && (
            <View>
              <Text style={styles.sectionTitle}>ABOUT</Text>
              <Text style={styles.description}>{gym.description || 'No description available.'}</Text>

              <Text style={styles.sectionTitle}>FACILITIES</Text>
              <View style={styles.facilitiesGrid}>
                {gym.facilities?.map((f) => (
                  <View key={f} style={styles.facilityItem}>
                    <MaterialCommunityIcons
                      name={FACILITY_ICONS[f] || 'check-circle'}
                      size={22}
                      color={COLORS.primary}
                    />
                    <Text style={styles.facilityLabel}>{f.toUpperCase()}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>PRICING</Text>
              <View style={styles.pricingGrid}>
                {[
                  { key: 'hourly', label: 'Per Hour', icon: 'clock-outline' },
                  { key: 'daily', label: 'Day Pass', icon: 'calendar-today' },
                  { key: 'weekly', label: 'Weekly', icon: 'calendar-week' },
                  { key: 'monthly', label: 'Monthly', icon: 'calendar-month' },
                ].map(({ key, label, icon }) => gym.pricing?.[key] > 0 && (
                  <View key={key} style={styles.priceCard}>
                    <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
                    <Text style={styles.priceAmount}>₹{gym.pricing[key]}</Text>
                    <Text style={styles.priceLabel}>{label.toUpperCase()}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>CONTACT</Text>
              <View style={styles.contactRow}>
                {gym.contact?.phone && (
                  <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${gym.contact.phone}`)}>
                    <MaterialCommunityIcons name="phone" size={18} color={COLORS.primary} />
                    <Text style={styles.contactText}>{gym.contact.phone}</Text>
                  </TouchableOpacity>
                )}
                {gym.contact?.website && (
                  <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL(gym.contact.website)}>
                    <MaterialCommunityIcons name="web" size={18} color={COLORS.primary} />
                    <Text style={styles.contactText}>WEBSITE</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <View>
              <Text style={styles.sectionTitle}>EQUIPMENT ({gym.equipment?.length || 0} TYPES)</Text>
              {gym.equipment?.map((eq, i) => (
                <View key={i} style={styles.equipmentRow}>
                  <MaterialCommunityIcons name="dumbbell" size={20} color={COLORS.primary} />
                  <View style={styles.equipmentInfo}>
                    <Text style={styles.equipmentName}>{eq.name}</Text>
                    {eq.brand && <Text style={styles.equipmentMeta}>{eq.brand}</Text>}
                  </View>
                  <View style={styles.equipmentRight}>
                    <Text style={styles.equipmentCount}>x{eq.count}</Text>
                    <View style={[styles.conditionDot, { backgroundColor: eq.condition === 'excellent' ? COLORS.success : eq.condition === 'good' ? COLORS.warning : COLORS.error }]} />
                  </View>
                </View>
              ))}
              {(!gym.equipment || gym.equipment.length === 0) && (
                <Text style={styles.emptyText}>Equipment list not provided.</Text>
              )}
            </View>
          )}

          {/* Trainers Tab */}
          {activeTab === 'trainers' && (
            <View>
              <Text style={styles.sectionTitle}>TRAINERS ({gym.trainers?.length || 0})</Text>
              {gym.trainers?.map((trainer) => (
                <TouchableOpacity
                  key={trainer._id}
                  style={styles.trainerCard}
                  onPress={() => navigation.navigate('TrainerDetail', { trainerId: trainer._id })}
                >
                  <Image
                    source={{ uri: trainer.photo || 'https://via.placeholder.com/60' }}
                    style={styles.trainerPhoto}
                  />
                  <View style={styles.trainerInfo}>
                    <Text style={styles.trainerName}>{trainer.name}</Text>
                    <Text style={styles.trainerSpec}>{trainer.specializations?.slice(0, 2).join(', ')}</Text>
                    <View style={styles.trainerMeta}>
                      <MaterialCommunityIcons name="star" size={12} color={COLORS.star} />
                      <Text style={styles.trainerRating}>{trainer.rating?.toFixed(1)}</Text>
                      <Text style={styles.trainerExp}>• {trainer.experience}y exp</Text>
                    </View>
                  </View>
                  <Text style={styles.trainerPrice}>₹{trainer.pricing?.perSession}/session</Text>
                </TouchableOpacity>
              ))}
              {(!gym.trainers || gym.trainers.length === 0) && (
                <Text style={styles.emptyText}>No trainers listed.</Text>
              )}
            </View>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <View>
              <Text style={styles.sectionTitle}>REVIEWS ({gym.totalReviews})</Text>
              {reviews.map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.userId?.name || 'User'}</Text>
                    <View style={styles.reviewRating}>
                      {[1,2,3,4,5].map((s) => (
                        <MaterialCommunityIcons key={s} name="star" size={12} color={s <= review.rating ? COLORS.star : COLORS.border} />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  {review.ownerReply && (
                    <View style={styles.ownerReply}>
                      <Text style={styles.ownerReplyLabel}>PARTNER REPLY</Text>
                      <Text style={styles.ownerReplyText}>{review.ownerReply.comment}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Book Now Button */}
      <View style={styles.bookingBar}>
        <View>
          <Text style={styles.fromText}>Starting from</Text>
          <Text style={styles.startPrice}>₹{gym.pricing?.hourly || gym.pricing?.daily || '—'}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Booking', { gym })}
        >
          <Text style={styles.bookBtnText}>BOOK NOW</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },

  gallery: { height: 280, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  imageGradient: { ...StyleSheet.absoluteFillObject },
  backBtn: {
    position: 'absolute', top: 50, left: SPACING.base,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  imageDots: { position: 'absolute', bottom: SPACING.md, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: COLORS.primary, width: 18 },

  infoSection: { padding: SPACING.base, backgroundColor: COLORS.bg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  gymName: { flex: 1, fontSize: FONTS.sizes['2xl'], fontWeight: '900', color: COLORS.textPrimary },
  featuredBadge: { backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  featuredBadgeText: { color: '#000', fontSize: 9, fontWeight: '950', letterSpacing: 0.5 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm },
  address: { flex: 1, color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.md },
  statLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },

  tabsRow: { marginBottom: 2 },
  tab: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, marginRight: SPACING.xs, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontWeight: '600', fontSize: FONTS.sizes.base },
  tabTextActive: { color: COLORS.primary },

  tabContent: { padding: SPACING.base, paddingTop: SPACING.sm },
  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md, marginTop: SPACING.lg },

  description: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, lineHeight: 22 },

  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  facilityItem: { alignItems: 'center', width: '22%' },
  facilityLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, textAlign: 'center', marginTop: 4 },

  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  priceCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  priceAmount: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.textPrimary, marginTop: 6 },
  priceLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },

  contactRow: { flexDirection: 'row', gap: SPACING.sm },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  contactText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, fontWeight: '600' },

  equipmentRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xs,
  },
  equipmentInfo: { flex: 1 },
  equipmentName: { color: COLORS.textPrimary, fontWeight: '700', fontSize: FONTS.sizes.base },
  equipmentMeta: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  equipmentRight: { alignItems: 'center', gap: 4 },
  equipmentCount: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.md },
  conditionDot: { width: 8, height: 8, borderRadius: 4 },

  trainerCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  trainerPhoto: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.bgElevated },
  trainerInfo: { flex: 1 },
  trainerName: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.md },
  trainerSpec: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  trainerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trainerRating: { color: COLORS.textPrimary, fontWeight: '700', fontSize: FONTS.sizes.sm },
  trainerExp: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  trainerPrice: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.sm },

  reviewCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  reviewerName: { color: COLORS.textPrimary, fontWeight: '700', fontSize: FONTS.sizes.base },
  reviewRating: { flexDirection: 'row', gap: 2 },
  reviewComment: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, lineHeight: 20 },
  ownerReply: { backgroundColor: COLORS.bgElevated, borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.sm },
  ownerReplyLabel: { color: COLORS.primary, fontSize: FONTS.sizes.xs, fontWeight: '700', marginBottom: 4 },
  ownerReplyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },

  emptyText: { color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.xl, fontSize: FONTS.sizes.base },

  bookingBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bgCard, padding: SPACING.base, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.base,
  },
  fromText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  startPrice: { color: COLORS.textPrimary, fontWeight: '900', fontSize: FONTS.sizes.xl },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    ...SHADOWS.glow,
  },
  bookBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 0.5 },
});

export default GymDetailScreen;
