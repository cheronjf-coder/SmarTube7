import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { firebaseConfig } from '../config/firebase';


// Complete auth session for web
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY";

// Google OAuth Client IDs from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID = '567378036880-vajof3f87ce2u9f540na8mi4i7uuc3h6.apps.googleusercontent.com';

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

import Constants from 'expo-constants';

// Get backend URL from expoConfig extra (as defined in app.json)
const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'https://smartube2.onrender.com';

// For mobile apps, always use direct backend sync
const OAUTH_REDIRECT_URI = `${BACKEND_URL}/api/auth/google/callback`;

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // Handle deep link
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      // Logic for other deep links (like sharing) can be added here
    };

    // Subscribe to deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL (if app was opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);


  useEffect(() => {
    // Check for existing session on mount
    const checkExistingSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('session_token');
        if (savedToken) {
          // Verify session is still valid by making a request
          try {
            const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${savedToken}` }
            });
            
            if (response.data) {
              setUser({
                uid: response.data.user_id,
                email: response.data.email,
                displayName: response.data.name,
                photoURL: response.data.picture,
              });
              setSessionToken(savedToken);
            }
          } catch (e) {
            // Session invalid, clear it
            await AsyncStorage.removeItem('session_token');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
      setLoading(false);
    };

    // If Firebase is configured and on web, listen to Firebase auth changes
    if (isFirebaseConfigured && auth && Platform.OS === 'web') {
      const { onAuthStateChanged } = require('firebase/auth');
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
        if (firebaseUser) {
          const userData: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL || undefined,
          };
          setUser(userData);
          
          const token = await syncWithBackend(userData);
          if (token) {
            setSessionToken(token);
            await AsyncStorage.setItem('session_token', token);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      checkExistingSession();
    }
  }, []);

  const syncWithBackend = async (userData: User): Promise<string | null> => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/firebase`,
        {
          uid: userData.uid,
          email: userData.email,
          name: userData.displayName,
          picture: userData.photoURL,
        }
      );
      
      return response.data.session_token;
    } catch (error) {
      console.error('Error syncing with backend:', error);
      return null;
    }
  };

  const loginWithGoogleMobile = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      
      // Force sign out first to ensure the account picker always appears
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore sign out errors if not signed in
      }
      
      const response = await GoogleSignin.signIn();
      console.log('Native Google Sign-In response type:', response.type);
      
      if (response.type !== 'success') {
        setLoading(false);
        return;
      }
      
      const googleUser = response.data.user;
      if (!googleUser) {
        throw new Error('Les informations utilisateur Google sont manquantes.');
      }
      
      console.log('Login successful for:', googleUser.email);
      
      const userData: User = {
        uid: googleUser.id,
        email: googleUser.email,
        displayName: googleUser.name || 'User',
        photoURL: googleUser.photo || undefined,
      };
      
      // Sync with backend
      try {
        console.log('Syncing with backend at:', BACKEND_URL);
        const token = await syncWithBackend(userData);
        console.log('Backend sync successful, token received');
        
        if (token) {
          await AsyncStorage.setItem('session_token', token);
          setSessionToken(token);
          setUser(userData);
        } else {
          throw new Error('Le serveur n\'a pas renvoyé de jeton de session.');
        }
      } catch (syncError: any) {
        console.error('Backend sync error:', syncError);
        setUser(null);
        throw new Error(`Erreur de synchronisation serveur: ${syncError.message}`);
      }
      
    } catch (error: any) {
      console.error('Native Google login error:', error);
      setUser(null);
      Alert.alert('Erreur de Connexion', error.message || 'Échec de la connexion avec Google.');
    } finally {
      setLoading(false);
    }
  };


  const login = async () => {
    if (!isFirebaseConfigured) {
      Alert.alert(
        'Setup Required',
        'Firebase is not configured yet. Please follow the setup guide to add your Firebase credentials.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // Web: Use Firebase popup
        const { signInWithPopup } = require('firebase/auth');
        await signInWithPopup(auth, googleProvider);
      } else {
        // Mobile: Use WebBrowser OAuth
        await loginWithGoogleMobile();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message);
    }
  };

  const logout = async () => {
    try {
      // Sign out from Firebase (for web)
      if (auth && Platform.OS === 'web') {
        const { signOut } = require('firebase/auth');
        await signOut(auth);
      }
      
      // Clear local session
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
