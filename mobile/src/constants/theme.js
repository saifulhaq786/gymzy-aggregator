// App Color Palette
export const COLORS = {
  // Primary brand
  primary: '#CAFC07',       // Premium Electric Volt
  primaryDark: '#94C300',
  primaryLight: '#DBFF45',

  // Accent
  accent: '#00E5FF',        // Electric Cyan/Teal

  // Background
  bg: '#08090C',            // Deep Obsidian Dark
  bgCard: '#11141A',        // Slate Card background
  bgElevated: '#171B26',
  bgModal: '#1A1E29',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8', // Cool grey
  textMuted: '#64748B',

  // Status
  success: '#10B981',       // Clean Emerald
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Availability
  available: '#10B981',
  almostFull: '#F59E0B',
  full: '#EF4444',

  // Borders
  border: '#1E293B',
  borderLight: '#334155',

  // Rating
  star: '#FFD700',

  // Overlay
  overlay: 'rgba(0,0,0,0.7)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: '#CAFC07',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
};

// Facility icons mapping (from @expo/vector-icons MaterialCommunityIcons)
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
