import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import useAuthStore from '../store/authStore';
import { COLORS } from '../constants/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PhoneOTPScreen from '../screens/auth/PhoneOTPScreen';

// User Screens
import HomeScreen from '../screens/user/HomeScreen';
import MapScreen from '../screens/user/MapScreen';
import GymDetailScreen from '../screens/user/GymDetailScreen';
import BookingScreen from '../screens/user/BookingScreen';
import MyBookingsScreen from '../screens/user/MyBookingsScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import SearchScreen from '../screens/user/SearchScreen';
import TrainerDetailScreen from '../screens/user/TrainerDetailScreen';

// Partner Screens
import GymRegistrationScreen from '../screens/partner/GymRegistrationScreen';
import GymDashboardScreen from '../screens/partner/GymDashboardScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ── Auth Stack ─────────────────────────────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="PhoneOTP" component={PhoneOTPScreen} />
  </Stack.Navigator>
);

// ── User Bottom Tabs ───────────────────────────────────────────────────────
const UserTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.bgCard,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        height: 65,
        paddingBottom: 10,
        paddingTop: 8,
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ focused, color, size }) => {
        const icons = {
          Home: focused ? 'home' : 'home-outline',
          Explore: focused ? 'map' : 'map-outline',
          Bookings: focused ? 'calendar-check' : 'calendar-check-outline',
          Profile: focused ? 'account' : 'account-outline',
        };
        return <MaterialCommunityIcons name={icons[route.name]} size={24} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Explore" component={MapScreen} />
    <Tab.Screen name="Bookings" component={MyBookingsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ── Main App Stack ─────────────────────────────────────────────────────────
const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.bg },
      headerTintColor: COLORS.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <Stack.Screen name="Main" component={UserTabs} options={{ headerShown: false }} />
    <Stack.Screen name="GymDetail" component={GymDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book Session' }} />
    <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
    <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} options={{ title: 'Trainer Profile' }} />
    <Stack.Screen name="GymRegistration" component={GymRegistrationScreen} options={{ title: 'Register Your Gym' }} />
    <Stack.Screen name="GymDashboard" component={GymDashboardScreen} options={{ title: 'Gym Dashboard' }} />
  </Stack.Navigator>
);

// ── Root Navigator ─────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
