import { Platform } from 'react-native';
import * as ExpoSecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

const SecureStore = {
  getItemAsync: async (key) => {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch (err) {
        console.error('LocalStorage read error:', err);
        return null;
      }
    }
    return ExpoSecureStore.getItemAsync(key);
  },

  setItemAsync: async (key, value) => {
    if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch (err) {
        console.error('LocalStorage write error:', err);
      }
      return;
    }
    return ExpoSecureStore.setItemAsync(key, value);
  },

  deleteItemAsync: async (key) => {
    if (isWeb) {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.error('LocalStorage remove error:', err);
      }
      return;
    }
    return ExpoSecureStore.deleteItemAsync(key);
  }
};

export default SecureStore;
