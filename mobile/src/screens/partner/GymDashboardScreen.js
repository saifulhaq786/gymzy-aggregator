import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';

const GymDashboardScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Gym Dashboard</Text>
    <Text style={styles.subtitle}>Manage bookings, availability, and revenue — Phase 2</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.base, paddingTop: SPACING['2xl'] },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '900', color: COLORS.textPrimary },
  subtitle: { color: COLORS.textSecondary, marginTop: SPACING.xs },
});

export default GymDashboardScreen;
