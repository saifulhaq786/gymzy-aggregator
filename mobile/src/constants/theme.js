// ═══════════════════════════════════════════════════════════════
// GYMZY DESIGN SYSTEM — Professional UI Token Library
// Inspired by: Nike Training Club · Cult.fit · Zomato · Swiggy
// ═══════════════════════════════════════════════════════════════

export const COLORS = {
  // ── Brand ─────────────────────────────────────────────────────
  primary: '#C8FF00',          // Electric Volt (action, CTA, highlights)
  primaryDark: '#9DCC00',      // Pressed state
  primaryLight: '#DEFF4D',     // Lighter tint
  primaryMuted: 'rgba(200,255,0,0.12)', // Subtle tint bg

  // ── Surface / Background ───────────────────────────────────────
  bg: '#0A0A0A',               // True deep black
  bgCard: '#111111',           // Slightly lifted card surface
  bgElevated: '#181818',       // Modals, dropdowns
  bgModal: '#1C1C1E',          // Bottom sheets (iOS-style dark)
  bgInput: '#141414',          // Input fields

  // ── Typography ────────────────────────────────────────────────
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',    // Zinc-400 equivalent — clear hierarchy
  textMuted: '#52525B',        // Zinc-600 — de-emphasized
  textInverse: '#000000',      // On bright backgrounds

  // ── Status ────────────────────────────────────────────────────
  success: '#22C55E',          // Green-500
  successMuted: 'rgba(34,197,94,0.12)',
  warning: '#F59E0B',          // Amber-500
  warningMuted: 'rgba(245,158,11,0.12)',
  error: '#EF4444',            // Red-500
  errorMuted: 'rgba(239,68,68,0.12)',
  info: '#3B82F6',             // Blue-500
  infoMuted: 'rgba(59,130,246,0.12)',

  // ── Functional ────────────────────────────────────────────────
  available: '#22C55E',
  almostFull: '#F59E0B',
  full: '#EF4444',
  star: '#FBBF24',             // Amber-400

  // ── Borders ───────────────────────────────────────────────────
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  borderSubtle: 'rgba(255,255,255,0.04)',

  // ── Overlays ──────────────────────────────────────────────────
  overlay: 'rgba(0,0,0,0.6)',
  overlayStrong: 'rgba(0,0,0,0.85)',
  scrim: 'rgba(10,10,10,0.9)',

  // ── Accent ────────────────────────────────────────────────────
  accent: '#7C3AED',           // Violet — used sparingly
};

export const FONTS = {
  sizes: {
    '2xs': 9,
    xs: 10,
    sm: 12,
    base: 14,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
    '5xl': 42,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

export const SPACING = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const SHADOWS = {
  none: {},
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 18,
  },
  glow: {
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  glowStrong: {
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
};

// ── Facility Icons ─────────────────────────────────────────────
export const FACILITY_ICONS = {
  'AC': 'air-conditioner',
  'Parking': 'parking',
  'Locker Room': 'locker',
  'Shower': 'shower',
  'WiFi': 'wifi',
  'Steam Room': 'steam',
  'Sauna': 'hot-tub',
  'Swimming Pool': 'pool',
  'Cafe/Juice Bar': 'coffee',
  'Cardio Zone': 'run',
  'Free Weights': 'dumbbell',
  'Group Classes': 'account-group',
  'Personal Training': 'account-heart',
  'Yoga Studio': 'yoga',
  'Boxing Ring': 'boxing-glove',
  'CrossFit Area': 'gymnastics',
  'Cycling': 'bike',
};

export const BOOKING_TYPES = [
  { key: 'hourly', label: 'Hourly', icon: 'clock-outline', desc: 'Pay per hour' },
  { key: 'daily', label: 'Day Pass', icon: 'calendar-today', desc: 'Full day access' },
  { key: 'weekly', label: 'Weekly', icon: 'calendar-week', desc: '7 days access' },
  { key: 'monthly', label: 'Monthly', icon: 'calendar-month', desc: '30 days access' },
  { key: 'session_with_trainer', label: 'With Trainer', icon: 'account-heart', desc: 'Trainer session' },
];

export const SPECIALIZATIONS = [
  'Weight Loss', 'Muscle Building', 'Bodybuilding', 'CrossFit',
  'Yoga', 'Pilates', 'HIIT', 'Cardio', 'Zumba', 'Kickboxing',
  'Functional Training', 'Rehabilitation', 'Nutrition', 'Calisthenics',
];

export const FACILITIES_LIST = [
  'AC', 'Parking', 'Locker Room', 'Shower', 'WiFi',
  'Steam Room', 'Sauna', 'Swimming Pool', 'Cafe/Juice Bar',
  'Cardio Zone', 'Free Weights', 'Group Classes', 'Personal Training',
  'Yoga Studio', 'Boxing Ring', 'CrossFit Area', 'Cycling',
];
