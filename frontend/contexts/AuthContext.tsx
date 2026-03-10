import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { firebaseConfig } from '../config/firebase';

// Complete auth session for web
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY";

// Google OAuth Client IDs from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID = '63652025463-k4l03astv51coo60olrgqfn6ft8ufbuk.apps.googleusercontent.com';

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
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://smartube2.onrender.com';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // Handle deep link for OAuth callback
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      if (event.url.includes('access_token=')) {
        await handleOAuthCallback(event.url);
      }
    };

    // Subscribe to deep link events
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL (if app was opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('access_token=')) {
        handleOAuthCallback(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleOAuthCallback = async (url: string) => {
    try {
      // Parse the access token from the URL
      const hashPart = url.split('#')[1];
      if (hashPart) {
        const params = new URLSearchParams(hashPart);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
          // Fetch user info from Google
          const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const userInfo = await userInfoResponse.json();
          
          const userData: User = {
            uid: userInfo.id,
            email: userInfo.email,
            displayName: userInfo.name,
            photoURL: userInfo.picture,
          };
          
          setUser(userData);
          
          // Sync with backend
          const token = await syncWithBackend(userData);
          if (token) {
            setSessionToken(token);
            await AsyncStorage.setItem('session_token', token);
          }
        }
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
    }
  };

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
      // For standalone APK: use custom scheme
      // For Expo Go: use auth.expo.io proxy
      let redirectUri: string;
      
      if (isExpoGo) {
        // Expo Go: use auth proxy with your username
        redirectUri = 'https://auth.expo.io/@jfcheron76/smartube';
      } else {
        // Standalone APK: use custom scheme
        redirectUri = 'smartube://auth';
      }
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_WEB_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent('email profile')}`;

      console.log('Opening auth URL:', authUrl);
      console.log('Redirect URI:', redirectUri);
      console.log('Is Expo Go:', isExpoGo);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      console.log('Auth result:', result);

      if (result.type === 'success' && result.url) {
        await handleOAuthCallback(result.url);
      } else if (result.type === 'cancel') {
        console.log('User cancelled login');
      }
    } catch (error: any) {
      console.error('Mobile login error:', error);
      Alert.alert('Login Error', error.message || 'Failed to login with Google');
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
