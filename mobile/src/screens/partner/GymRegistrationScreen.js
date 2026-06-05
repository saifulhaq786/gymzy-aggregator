import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { gymAPI } from '../../api';
import { COLORS, SPACING, RADIUS, FONTS, SHADOWS, FACILITIES_LIST } from '../../constants/theme';

const STEPS = ['Basic Info', 'Location', 'Facilities & Pricing', 'Documents'];

const GymRegistrationScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    lat: null,
    lng: null,
    capacity: '30',
    facilities: [],
    pricing: { hourly: '', daily: '', weekly: '', monthly: '' },
  });
  const [docs, setDocs] = useState({ businessLicense: null, gstCertificate: null, ownerIdProof: null });
  const [images, setImages] = useState([]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const updatePricing = (key, value) => setForm((p) => ({ ...p, pricing: { ...p.pricing, [key]: value } }));

  const toggleFacility = (f) => {
    setForm((p) => ({
      ...p,
      facilities: p.facilities.includes(f) ? p.facilities.filter((x) => x !== f) : [...p.facilities, f],
    }));
  };

  const detectLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    setLoading(true);
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [place] = await Location.reverseGeocodeAsync(loc.coords);
    update('lat', loc.coords.latitude);
    update('lng', loc.coords.longitude);
    if (place) {
      update('address', `${place.streetNumber || ''} ${place.street || ''}`.trim());
      update('city', place.city || '');
      update('state', place.region || '');
      update('pincode', place.postalCode || '');
    }
    setLoading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) {
      setImages((p) => [...p, ...result.assets.slice(0, 10 - p.length)]);
    }
  };

  const pickDocument = async (docKey) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (!result.canceled) {
      setDocs((p) => ({ ...p, [docKey]: result.assets[0] }));
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.city || !form.lat || !form.lng) {
      return Alert.alert('Error', 'Please complete all required fields including location.');
    }
    if (!docs.businessLicense || !docs.ownerIdProof) {
      return Alert.alert('Error', 'Business license and Owner ID proof are required.');
    }

    setLoading(true);
    try {
      const formData = new FormData();

      // Text fields
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'facilities' || key === 'pricing') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Gym images
      images.forEach((img, i) => {
        formData.append('images', { uri: img.uri, name: `gym_${i}.jpg`, type: 'image/jpeg' });
      });

      // Documents
      Object.entries(docs).forEach(([key, doc]) => {
        if (doc) {
          formData.append(key, { uri: doc.uri, name: doc.name, type: doc.mimeType });
        }
      });

      await gymAPI.registerGym(formData);
      Alert.alert(
        '✅ Registration Submitted!',
        'Your gym registration is under review. You\'ll be notified once approved (usually within 24-48 hours).',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return form.name.length > 0;
    if (step === 1) return form.address && form.city && form.lat && form.lng;
    if (step === 2) return form.facilities.length > 0;
    return true;
  };

  return (
    <View style={styles.container}>
      {/* Progress Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <TouchableOpacity style={styles.stepItem} onPress={() => i < step && setStep(i)}>
              <View style={[styles.stepCircle, i <= step && styles.stepCircleActive]}>
                {i < step ? (
                  <MaterialCommunityIcons name="check" size={14} color="#000" />
                ) : (
                  <Text style={[styles.stepNum, i === step && { color: '#000' }]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s.toUpperCase()}</Text>
            </TouchableOpacity>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>BASIC INFORMATION</Text>

            {[
              { field: 'name', label: 'GYM NAME *', placeholder: 'e.g. PowerHouse Fitness', multiline: false },
              { field: 'description', label: 'DESCRIPTION', placeholder: 'Tell people about your gym...', multiline: true },
              { field: 'phone', label: 'PHONE NUMBER', placeholder: '+91 9876543210', multiline: false },
              { field: 'email', label: 'EMAIL', placeholder: 'gym@example.com', multiline: false },
              { field: 'website', label: 'WEBSITE (OPTIONAL)', placeholder: 'https://yourgym.com', multiline: false },
            ].map(({ field, label, placeholder, multiline }) => (
              <View style={styles.inputGroup} key={field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={[styles.input, multiline && { height: 90, textAlignVertical: 'top', paddingTop: SPACING.sm }]}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={form[field]}
                  onChangeText={(v) => update(field, v)}
                  multiline={multiline}
                />
              </View>
            ))}

            {/* Gym Images */}
            <Text style={styles.label}>GYM PHOTOS (MAX 10)</Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
              <MaterialCommunityIcons name="camera-plus" size={24} color={COLORS.primary} />
              <Text style={styles.imagePickerText}>ADD PHOTOS</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((img, i) => (
                <View key={i} style={styles.imagePreview}>
                  <Image source={{ uri: img.uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImage} onPress={() => setImages((p) => p.filter((_, j) => j !== i))}>
                    <MaterialCommunityIcons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>LOCATION</Text>
            <TouchableOpacity style={styles.detectBtn} onPress={detectLocation} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.primary} />}
              <Text style={styles.detectBtnText}>AUTO-DETECT LOCATION</Text>
            </TouchableOpacity>

            {form.lat && (
              <View style={styles.coordsBox}>
                <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                <Text style={styles.coordsText}>Location set: {form.lat?.toFixed(4)}, {form.lng?.toFixed(4)}</Text>
              </View>
            )}

            {[
              { field: 'address', label: 'STREET ADDRESS *', placeholder: 'e.g. 123 MG Road' },
              { field: 'city', label: 'CITY *', placeholder: 'Bangalore' },
              { field: 'state', label: 'STATE', placeholder: 'Karnataka' },
              { field: 'pincode', label: 'PINCODE', placeholder: '560001' },
              { field: 'capacity', label: 'MAX CAPACITY', placeholder: '30' },
            ].map(({ field, label, placeholder }) => (
              <View style={styles.inputGroup} key={field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={form[field]}
                  onChangeText={(v) => update(field, v)}
                  keyboardType={['pincode', 'capacity'].includes(field) ? 'number-pad' : 'default'}
                />
              </View>
            ))}
          </View>
        )}

        {/* Step 2: Facilities & Pricing */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>FACILITIES & PRICING</Text>

            <Text style={styles.label}>FACILITIES *</Text>
            <View style={styles.facilitiesGrid}>
              {FACILITIES_LIST.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.facilityChip, form.facilities.includes(f) && styles.facilityChipActive]}
                  onPress={() => toggleFacility(f)}
                >
                  <Text style={[styles.facilityChipText, form.facilities.includes(f) && styles.facilityChipTextActive]}>{f.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: SPACING.lg }]}>PRICING (₹)</Text>
            {[
              { key: 'hourly', label: 'Per Hour' },
              { key: 'daily', label: 'Day Pass' },
              { key: 'weekly', label: 'Weekly' },
              { key: 'monthly', label: 'Monthly' },
            ].map(({ key, label }) => (
              <View style={styles.pricingRow} key={key}>
                <Text style={styles.pricingLabel}>{label.toUpperCase()}</Text>
                <TextInput
                  style={styles.pricingInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.pricing[key]}
                  onChangeText={(v) => updatePricing(key, v)}
                  keyboardType="number-pad"
                />
              </View>
            ))}
          </View>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>VERIFICATION DOCUMENTS</Text>
            <Text style={styles.docNote}>
              All documents are securely encrypted and only visible to our verification team.
            </Text>

            {[
              { key: 'businessLicense', label: 'BUSINESS LICENSE *', required: true },
              { key: 'gstCertificate', label: 'GST CERTIFICATE', required: false },
              { key: 'ownerIdProof', label: 'OWNER ID PROOF *', required: true },
            ].map(({ key, label, required }) => (
              <View style={styles.docRow} key={key}>
                <View style={styles.docInfo}>
                  <Text style={styles.docLabel}>{label}</Text>
                  {docs[key] && <Text style={styles.docName} numberOfLines={1}>{docs[key].name}</Text>}
                </View>
                <TouchableOpacity
                  style={[styles.uploadBtn, docs[key] && styles.uploadBtnDone]}
                  onPress={() => pickDocument(key)}
                >
                  <MaterialCommunityIcons name={docs[key] ? 'check' : 'upload'} size={18} color={docs[key] ? '#000' : COLORS.primary} />
                  <Text style={[styles.uploadBtnText, docs[key] && { color: '#000' }]}>
                    {docs[key] ? 'UPLOADED' : 'UPLOAD'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={() => setStep((s) => s - 1)}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.textPrimary} />
            <Text style={styles.prevBtnText}>BACK</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={step < 3 ? () => setStep((s) => s + 1) : handleSubmit}
          disabled={!canProceed() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>{step < 3 ? 'CONTINUE' : 'SUBMIT FOR REVIEW'}</Text>
              <MaterialCommunityIcons name={step < 3 ? 'arrow-right' : 'send'} size={18} color="#000" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  stepper: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base,
    paddingTop: 60, paddingBottom: SPACING.md, backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.bgElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.06)',
  },
  stepCircleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '800' },
  stepLabel: { color: COLORS.textMuted, fontSize: 8, fontWeight: '800', textAlign: 'center', width: 55, letterSpacing: 0.3 },
  stepLabelActive: { color: COLORS.primary },
  stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 14 },
  stepLineActive: { backgroundColor: COLORS.primary },

  scroll: { padding: SPACING.base, paddingBottom: 120 },
  stepTitle: { fontSize: FONTS.sizes.xl, fontWeight: '950', color: COLORS.textPrimary, marginBottom: SPACING.lg, letterSpacing: 0.5 },

  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: SPACING.md, height: 50,
    color: COLORS.textPrimary, fontSize: FONTS.sizes.md,
  },

  imagePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: `${COLORS.primary}10`, borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: `${COLORS.primary}30`, borderStyle: 'dashed', marginBottom: SPACING.sm,
  },
  imagePickerText: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.sm, letterSpacing: 0.5 },
  imagePreview: { width: 80, height: 80, borderRadius: RADIUS.md, marginRight: SPACING.sm, position: 'relative' },
  previewImage: { width: '100%', height: '100%', borderRadius: RADIUS.md },
  removeImage: {
    position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10, padding: 2,
  },

  detectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: `${COLORS.primary}10`, borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: `${COLORS.primary}30`, marginBottom: SPACING.md,
  },
  detectBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: FONTS.sizes.sm, letterSpacing: 0.5 },
  coordsBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md },
  coordsText: { color: COLORS.success, fontSize: FONTS.sizes.sm, fontWeight: '600' },

  facilitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  facilityChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  facilityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  facilityChipText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  facilityChipTextActive: { color: '#000' },

  pricingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  pricingLabel: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.sm, letterSpacing: 0.5 },
  pricingInput: {
    width: 100, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.sm, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: SPACING.sm, height: 40,
    color: COLORS.textPrimary, fontSize: FONTS.sizes.md, textAlign: 'right',
  },

  docNote: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginBottom: SPACING.lg, lineHeight: 20 },
  docRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  docInfo: { flex: 1, marginRight: SPACING.sm },
  docLabel: { color: COLORS.textPrimary, fontWeight: '800', fontSize: FONTS.sizes.sm, letterSpacing: 0.5 },
  docName: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 8,
    backgroundColor: `${COLORS.primary}10`, borderWidth: 1, borderColor: `${COLORS.primary}30`,
  },
  uploadBtnDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  uploadBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 10, letterSpacing: 0.5 },

  navBar: {
    flexDirection: 'row', gap: SPACING.sm, padding: SPACING.base,
    backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  prevBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  prevBtnText: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.md, ...SHADOWS.glow,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: '#000', fontWeight: '900', fontSize: FONTS.sizes.md, letterSpacing: 0.5 },
});

export default GymRegistrationScreen;
