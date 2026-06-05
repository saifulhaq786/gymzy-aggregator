import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { trainerAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS } from '../../constants/theme';

const TrainerDetailScreen = ({ route, navigation }) => {
  const { trainerId } = route.params;
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTrainer = useCallback(async () => {
    try {
      const { data } = await trainerAPI.getById(trainerId);
      setTrainer(data.trainer);
    } catch (err) {
      Alert.alert('Error', 'Failed to load trainer details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    fetchTrainer();
  }, [fetchTrainer]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!trainer) return null;

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero Banner / Cover Photo */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: trainer.photo || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(8,9,12,0.95)']}
            style={styles.heroGradient}
          />
          {/* Top Header Controls */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Core Info Overlaid */}
          <View style={styles.heroInfo}>
            {trainer.isCertified && (
              <View style={styles.certifiedBadge}>
                <MaterialCommunityIcons name="shield-check" size={12} color="#000" />
                <Text style={styles.certifiedText}>VERIFIED COACH</Text>
              </View>
            )}
            <Text style={styles.name}>{trainer.name.toUpperCase()}</Text>
            <View style={styles.specializationsRow}>
              {trainer.specializations?.map((spec) => (
                <View key={spec} style={styles.specBadge}>
                  <Text style={styles.specBadgeText}>{spec.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="star" size={20} color={COLORS.star} />
            <Text style={styles.statVal}>{trainer.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLbl}>{trainer.totalReviews || 0} reviews</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxBorder]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
            <Text style={styles.statVal}>{trainer.experience || 0} Yrs</Text>
            <Text style={styles.statLbl}>Experience</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="dumbbell" size={20} color={COLORS.primary} />
            <Text style={styles.statVal}>{trainer.totalSessions || 0}+</Text>
            <Text style={styles.statLbl}>Sessions</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.body}>
          {/* Biography */}
          <Text style={styles.sectionTitle}>BIOGRAPHY</Text>
          <Text style={styles.bioText}>
            {trainer.bio || `Certified trainer specializing in building sustainable workout methodologies, performance improvement, and personalized nutritional plans.`}
          </Text>

          {/* Certifications */}
          {trainer.certifications?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ACCREDITATIONS</Text>
              {trainer.certifications.map((cert, i) => (
                <View key={i} style={styles.certRow}>
                  <MaterialCommunityIcons name="certificate-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.certText}>{cert.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Availability schedule */}
          <Text style={styles.sectionTitle}>WEEKLY AVAILABILITY</Text>
          <View style={styles.daysRow}>
            {DAYS.map((day) => {
              const isAvailable = trainer.availability?.includes(day);
              return (
                <View key={day} style={[styles.dayChip, isAvailable && styles.dayChipActive]}>
                  <Text style={[styles.dayChipText, isAvailable && styles.dayChipTextActive]}>
                    {day.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Time slots */}
          {trainer.timeSlots?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HOURS</Text>
              <View style={styles.slotsRow}>
                {trainer.timeSlots.map((slot, i) => (
                  <View key={i} style={styles.slotBadge}>
                    <Text style={styles.slotBadgeText}>{slot}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerLabel}>RATES STARTING AT</Text>
          <Text style={styles.footerPrice}>₹{trainer.pricing?.perSession || 0} <Text style={styles.sessionUnit}>/ session</Text></Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => navigation.navigate('Booking', { gymId: trainer.gymId })}
        >
          <Text style={styles.bookBtnText}>BOOK COACH</Text>
          <MaterialCommunityIcons name="arrow-right" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 140 },

  heroContainer: { height: 350, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  backBtn: {
    position: 'absolute', top: 50, left: SPACING.base,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroInfo: {
    position: 'absolute', bottom: 10, left: SPACING.base, right: SPACING.base,
  },
  certifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: COLORS.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    marginBottom: SPACING.xs,
  },
  certifiedText: { color: '#000', fontSize: 9, fontWeight: '950', letterSpacing: 0.5 },
  name: { fontSize: 26, fontWeight: '950', color: '#fff', letterSpacing: -0.5, marginBottom: 8 },
  specializationsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  specBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  specBadgeText: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  statsGrid: {
    flexDirection: 'row', marginHorizontal: SPACING.base, marginTop: SPACING.base,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: SPACING.md,
  },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statBoxBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.06)', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' },
  statVal: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary, marginTop: 4 },
  statLbl: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, fontWeight: '700' },

  body: { padding: SPACING.base },
  section: { marginTop: SPACING.lg },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1, marginBottom: SPACING.sm, marginTop: SPACING.md },
  bioText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base, lineHeight: 22 },

  certRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs, paddingVertical: 4 },
  certText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '700' },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xs, marginBottom: SPACING.md },
  dayChip: {
    width: 42, height: 42, borderRadius: 6, backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '800' },
  dayChipTextActive: { color: '#000' },

  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.xs },
  slotBadge: { backgroundColor: COLORS.bgCard, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  slotBadgeText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, fontWeight: '750' },

  footerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bgCard, padding: SPACING.base, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.base,
  },
  footerLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  footerPrice: { color: COLORS.textPrimary, fontWeight: '950', fontSize: 20 },
  sessionUnit: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '500' },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 14,
    ...SHADOWS.glow,
  },
  bookBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.base, letterSpacing: 1 },
});

export default TrainerDetailScreen;
