import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../constants/theme';

const TrainerDetailScreen = ({ route }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Trainer Profile</Text>
    <Text style={styles.subtitle}>Trainer ID: {route.params?.trainerId}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: SPACING.base, paddingTop: SPACING['2xl'] },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '900', color: COLORS.textPrimary },
  subtitle: { color: COLORS.textSecondary, marginTop: SPACING.xs },
});

export default TrainerDetailScreen;
