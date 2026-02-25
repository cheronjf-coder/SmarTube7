import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

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
  firebaseToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get backend URL from environment
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get Firebase ID token
        const token = await firebaseUser.getIdToken();
        setFirebaseToken(token);
        
        // Store token
        await AsyncStorage.setItem('firebase_token', token);
        
        // Set user
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || undefined,
        };
        setUser(userData);
        
        // Sync with backend
        await syncWithBackend(token, userData);
      } else {
        setUser(null);
        setFirebaseToken(null);
        await AsyncStorage.removeItem('firebase_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncWithBackend = async (token: string, userData: User) => {
    try {
      // Send Firebase token to backend to create/update user
      await axios.post(
        `${BACKEND_URL}/api/auth/firebase`,
        {
          uid: userData.uid,
          email: userData.email,
          name: userData.displayName,
          picture: userData.photoURL,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  };

  const login = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: Use popup
        await signInWithPopup(auth, googleProvider);
      } else {
        // Mobile: Will need expo-auth-session or similar
        // For now, show alert
        alert('Please use web version for login. Mobile Google Sign-In requires additional setup.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('firebase_token');
      setUser(null);
      setFirebaseToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      setFirebaseToken(token);
      await AsyncStorage.setItem('firebase_token', token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, firebaseToken }}>
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

// Axios interceptor to add Firebase token to all requests
axios.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('firebase_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
