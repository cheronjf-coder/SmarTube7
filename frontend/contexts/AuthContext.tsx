import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../config/firebase';

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY";

let app: any = null;
let auth: any = null;
let googleProvider: any = null;

// Only initialize Firebase if configured
if (isFirebaseConfigured) {
  try {
    const { initializeApp } = require('firebase/app');
    const { getAuth, GoogleAuthProvider } = require('firebase/auth');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sessionToken: string | null;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get backend URL from environment
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // If Firebase is not configured, just set loading to false
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // Listen to auth state changes
    const { onAuthStateChanged } = require('firebase/auth');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        // Set user immediately for UI
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || undefined,
        };
        setUser(userData);
        
        // Sync with backend and get session token
        const token = await syncWithBackend(userData);
        if (token) {
          setSessionToken(token);
          await AsyncStorage.setItem('session_token', token);
        }
      } else {
        setUser(null);
        setSessionToken(null);
        await AsyncStorage.removeItem('session_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncWithBackend = async (userData: User): Promise<string | null> => {
    try {
      // Send Firebase user data to backend to create/update user
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/firebase`,
        {
          uid: userData.uid,
          email: userData.email,
          name: userData.displayName,
          picture: userData.photoURL,
        }
      );
      
      // Return the session token from backend
      return response.data.session_token;
    } catch (error) {
      console.error('Error syncing with backend:', error);
      return null;
    }
  };

  const login = async () => {
    if (!isFirebaseConfigured || !auth) {
      Alert.alert(
        'Setup Required',
        'Firebase is not configured yet. Please follow the setup guide to add your Firebase credentials.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // Web: Use popup
        const { signInWithPopup } = require('firebase/auth');
        await signInWithPopup(auth, googleProvider);
      } else {
        // Mobile: Will need expo-auth-session or similar
        Alert.alert(
          'Mobile Login',
          'Please use web version for login. Mobile Google Sign-In requires additional setup.'
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message);
    }
  };

  const logout = async () => {
    try {
      if (auth) {
        const { signOut } = require('firebase/auth');
        await signOut(auth);
      }
      await AsyncStorage.removeItem('session_token');
      setUser(null);
      setSessionToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    if (user) {
      const token = await syncWithBackend(user);
      if (token) {
        setSessionToken(token);
        await AsyncStorage.setItem('session_token', token);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      refreshUser, 
      sessionToken,
      isConfigured: isFirebaseConfigured 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Axios interceptor to add session token to all requests
axios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
