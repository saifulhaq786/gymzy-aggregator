import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
let RazorpayCheckout;
try {
  RazorpayCheckout = require('react-native-razorpay').default || require('react-native-razorpay');
} catch (e) {
  RazorpayCheckout = {
    open: async (options) => {
      return new Promise((resolve, reject) => {
        Alert.alert(
          '🔒 Mock Payment Mode',
          'Razorpay payment checkout is simulated for Expo Go. Click Pay Mock to confirm booking.',
          [
            {
              text: 'Cancel Payment',
              onPress: () => {
                const err = new Error('Payment Cancelled');
                err.code = 2;
                reject(err);
              },
              style: 'cancel'
            },
            {
              text: 'Pay Mock',
              onPress: () => {
                resolve({
                  razorpay_order_id: options.order_id || 'order_mock_' + Math.random().toString(36).substring(7),
                  razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substring(7),
                  razorpay_signature: 'sig_mock_' + Math.random().toString(36).substring(7),
                });
              }
            }
          ]
        );
      });
    }
  };
}
import { bookingAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, BOOKING_TYPES } from '../../constants/theme';
import useAuthStore from '../../store/authStore';

const TIME_SLOTS = [
  { label: '06:00 AM - 07:00 AM', start: '06:00', end: '07:00' },
  { label: '07:00 AM - 08:00 AM', start: '07:00', end: '08:00' },
  { label: '08:00 AM - 09:00 AM', start: '08:00', end: '09:00' },
  { label: '09:00 AM - 10:00 AM', start: '09:00', end: '10:00' },
  { label: '10:00 AM - 11:00 AM', start: '10:00', end: '11:00' },
  { label: '04:00 PM - 05:00 PM', start: '16:00', end: '17:00' },
  { label: '05:00 PM - 06:00 PM', start: '17:00', end: '18:00' },
  { label: '06:00 PM - 07:00 PM', start: '18:00', end: '19:00' },
  { label: '07:00 PM - 08:00 PM', start: '19:00', end: '20:00' },
  { label: '08:00 PM - 09:00 PM', start: '20:00', end: '21:00' },
];

const BookingScreen = ({ route, navigation }) => {
  const { gym } = route.params;
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState('daily');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  // Generate next 7 days for the date picker carousel
  const getDatesList = () => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  };

  const getEndDate = () => {
    const d = new Date(selectedDate);
    if (selectedType === 'hourly') d.setHours(d.getHours() + 1);
    else if (selectedType === 'daily') d.setDate(d.getDate() + 1);
    else if (selectedType === 'weekly') d.setDate(d.getDate() + 7);
    else if (selectedType === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (selectedType === 'session_with_trainer') d.setHours(d.getHours() + 1);
    return d;
  };

  const getPrice = () => {
    if (selectedType === 'session_with_trainer' && selectedTrainer) {
      return selectedTrainer.pricing?.perSession || 0;
    }
    return gym.pricing?.[selectedType] || 0;
  };

  const handleBooking = async () => {
    const amount = getPrice();
    if (!amount || amount <= 0) {
      return Alert.alert('Pricing Not Set', "This gym hasn't set a price for this option.");
    }

    const needsSlot = selectedType === 'hourly' || selectedType === 'session_with_trainer';
    if (needsSlot && !selectedSlot) {
      return Alert.alert('Select Time Slot', 'Please schedule your session by selecting a time slot.');
    }

    setLoading(true);
    try {
      // Create booking + Razorpay order
      const { data } = await bookingAPI.create({
        gymId: gym._id,
        trainerId: selectedTrainer?._id || null,
        type: selectedType,
        startDate: selectedDate.toISOString(),
        endDate: getEndDate().toISOString(),
        startTime: needsSlot ? selectedSlot.start : undefined,
        endTime: needsSlot ? selectedSlot.end : undefined,
      });

      // Open Razorpay checkout
      const options = {
        description: `${gym.name} - ${selectedType} booking`,
        image: gym.coverImage,
        currency: 'INR',
        key: data.payment.key,
        amount: data.payment.amount,
        order_id: data.payment.orderId,
        name: 'Gymzy',
        prefill: {
          email: user.email || '',
          contact: user.phone || '',
          name: user.name,
        },
        theme: { color: COLORS.primary },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // Verify payment
      await bookingAPI.verifyPayment({
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
        bookingId: data.booking._id,
      });

      Alert.alert(
        '🎉 Booking Confirmed!',
        `Your ${selectedType} session at ${gym.name} is confirmed. Check your bookings for the QR code.`,
        [{ text: 'View Bookings', onPress: () => navigation.navigate('Bookings') }]
      );
    } catch (err) {
      if (err.code === 2) {
        Alert.alert('Payment Cancelled', 'Payment was cancelled.');
      } else {
        Alert.alert('Booking Failed', err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const availableTypes = BOOKING_TYPES.filter(
    (t) => gym.pricing?.[t.key] > 0 || (t.key === 'session_with_trainer' && gym.trainers?.length > 0)
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Gym Summary */}
        <View style={styles.gymSummary}>
          <Text style={styles.gymName}>{gym.name}</Text>
          <Text style={styles.gymAddress}>{gym.location?.address}</Text>
        </View>

        {/* Plan Selection */}
        <Text style={styles.sectionTitle}>SELECT PLAN</Text>
        <View style={styles.plansGrid}>
          {availableTypes.map((type) => {
            const price = type.key === 'session_with_trainer'
              ? gym.trainers?.[0]?.pricing?.perSession
              : gym.pricing?.[type.key];
            const isActive = selectedType === type.key;

            return (
              <TouchableOpacity
                key={type.key}
                style={[styles.planCard, isActive && styles.planCardActive]}
                onPress={() => {
                  setSelectedType(type.key);
                  if (type.key !== 'session_with_trainer') setSelectedTrainer(null);
                }}
              >
                <MaterialCommunityIcons
                  name={type.icon}
                  size={24}
                  color={isActive ? '#000' : COLORS.primary}
                />
                <Text style={[styles.planLabel, isActive && styles.planLabelActive]}>{type.label.toUpperCase()}</Text>
                <Text style={[styles.planPrice, isActive && styles.planPriceActive]}>₹{price || '—'}</Text>
                <Text style={[styles.planDesc, isActive ? { color: 'rgba(0,0,0,0.6)' } : { color: COLORS.textMuted }]}>{type.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Trainer Selection (if session_with_trainer) */}
        {selectedType === 'session_with_trainer' && gym.trainers?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SELECT TRAINER</Text>
            {gym.trainers.map((trainer) => {
              const isSelected = selectedTrainer?._id === trainer._id;
              return (
                <TouchableOpacity
                  key={trainer._id}
                  style={[styles.trainerOption, isSelected && styles.trainerOptionActive]}
                  onPress={() => setSelectedTrainer(trainer)}
                >
                  <Text style={[styles.trainerOptionName, isSelected && styles.trainerActiveText]}>{trainer.name}</Text>
                  <Text style={[styles.trainerOptionSpec, isSelected && styles.trainerActiveTextSecondary]}>{trainer.specializations?.slice(0, 2).join(', ')}</Text>
                  <Text style={[styles.trainerOptionPrice, isSelected && styles.trainerActiveText]}>₹{trainer.pricing?.perSession}/session</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Scheduling Section */}
        <Text style={styles.sectionTitle}>CHOOSE DATE & TIME</Text>
        
        {/* Date Selector Carousel */}
        <Text style={styles.subLabel}>Date Selection</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateCarousel}>
          {getDatesList().map((date, idx) => {
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dateChip, isSelected && styles.dateChipActive]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{dayName}</Text>
                <Text style={[styles.dateNumber, isSelected && styles.dateTextActive]}>{dayNum}</Text>
                <Text style={[styles.dateMonth, isSelected && styles.dateTextActive]}>{monthName}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time Slot Grid (for hourly/trainer passes) */}
        {(selectedType === 'hourly' || selectedType === 'session_with_trainer') && (
          <View style={styles.section}>
            <Text style={styles.subLabel}>Time Slot Selection</Text>
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlot?.start === slot.start;
                return (
                  <TouchableOpacity
                    key={slot.start}
                    style={[styles.slotChip, isSelected && styles.slotChipActive]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>{slot.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          {[
            { label: 'Plan', value: BOOKING_TYPES.find((t) => t.key === selectedType)?.label },
            { label: 'Date', value: selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ...(selectedSlot ? [{ label: 'Time Slot', value: selectedSlot.label }] : []),
            { label: 'Duration', value: selectedType === 'monthly' ? '30 days' : selectedType === 'weekly' ? '7 days' : selectedType === 'daily' ? '1 day' : '1 hour' },
            ...(selectedTrainer ? [{ label: 'Trainer', value: selectedTrainer.name }] : []),
          ].map(({ label, value }) => (
            <View key={label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{getPrice()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.payBar}>
        <TouchableOpacity style={styles.payBtn} onPress={handleBooking} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <MaterialCommunityIcons name="shield-check" size={20} color="#000" />
              <Text style={styles.payBtnText}>PAY ₹{getPrice()} SECURELY</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.razorpayNote}>Powered by Razorpay 🔒</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.base, paddingBottom: 140 },
  section: { marginTop: SPACING.base },

  gymSummary: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.md,
    marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.border,
  },
  gymName: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.textPrimary },
  gymAddress: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 4 },

  sectionTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.md },
  subLabel: { fontSize: FONTS.sizes.base, color: COLORS.textSecondary, marginBottom: SPACING.sm, fontWeight: '600' },

  plansGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  planCard: {
    width: '47%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    padding: SPACING.md, alignItems: 'center', borderWidth: 2, borderColor: COLORS.border,
  },
  planCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOWS.glow },
  planLabel: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.base, marginTop: SPACING.xs },
  planLabelActive: { color: '#000' },
  planPrice: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.xl, marginTop: 4 },
  planPriceActive: { color: '#000' },
  planDesc: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2, textAlign: 'center' },

  trainerOption: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 2, borderColor: COLORS.border,
  },
  trainerOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  trainerOptionName: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.md },
  trainerOptionSpec: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  trainerOptionPrice: { color: COLORS.primary, fontWeight: '700', fontSize: FONTS.sizes.base, marginTop: 4 },
  trainerActiveText: { color: '#000' },
  trainerActiveTextSecondary: { color: 'rgba(0,0,0,0.6)' },

  // Scheduling Styles
  dateCarousel: { gap: SPACING.xs, paddingBottom: SPACING.md, marginBottom: SPACING.md },
  dateChip: {
    width: 60, height: 85, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  dateChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOWS.glow },
  dateDay: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  dateNumber: { fontSize: FONTS.sizes.xl, color: COLORS.textPrimary, fontWeight: '900', marginVertical: 2 },
  dateMonth: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, fontWeight: '700' },
  dateTextActive: { color: '#000' },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.lg },
  slotChip: {
    width: '48%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    paddingVertical: SPACING.md, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
  },
  slotChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONTS.sizes.sm },
  slotTextActive: { color: '#000' },

  summaryCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.md,
  },
  summaryTitle: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.lg, marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.base },
  summaryValue: { color: COLORS.textPrimary, fontWeight: '600', fontSize: FONTS.sizes.base },
  summaryTotal: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm, marginTop: SPACING.xs },
  totalLabel: { color: COLORS.textPrimary, fontWeight: '900', fontSize: FONTS.sizes.lg },
  totalValue: { color: COLORS.primary, fontWeight: '900', fontSize: FONTS.sizes.xl },

  payBar: { padding: SPACING.base, backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderTopColor: COLORS.border },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, height: 56, ...SHADOWS.glow,
  },
  payBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.lg },
  razorpayNote: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: SPACING.xs },
});

export default BookingScreen;
