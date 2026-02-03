import React, { createContext, useContext, useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  subscription_type: string;
  trial_start_date?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
    
    // Handle deep links (when app is already running)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleRedirect(url);
    });

    // Check for cold start deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleRedirect(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkExistingSession = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      if (sessionToken) {
        await fetchUser(sessionToken);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async (sessionToken: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      });
      setUser(response.data);
      await AsyncStorage.setItem('session_token', sessionToken);
    } catch (error) {
      console.error('Error fetching user:', error);
      await AsyncStorage.removeItem('session_token');
      setUser(null);
    }
  };

  const handleRedirect = async (url: string) => {
    try {
      const { queryParams, path } = Linking.parse(url);
      const sessionId = queryParams?.session_id as string || extractSessionIdFromHash(url);

      if (sessionId) {
        setLoading(true);
        // Exchange session_id for session_token
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/session`,
          {},
          {
            headers: {
              'X-Session-ID': sessionId
            }
          }
        );

        const { session_token } = response.data;
        await fetchUser(session_token);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error handling redirect:', error);
      setLoading(false);
    }
  };

  const extractSessionIdFromHash = (url: string): string | null => {
    const hashMatch = url.match(/#session_id=([^&]+)/);
    return hashMatch ? hashMatch[1] : null;
  };

  const login = async () => {
    try {
      const redirectUrl = Platform.OS === 'web'
        ? `${BACKEND_URL}/`
        : Linking.createURL('/');

      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          await handleRedirect(result.url);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      if (sessionToken) {
        await axios.post(
          `${BACKEND_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`
            }
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('session_token');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const sessionToken = await AsyncStorage.getItem('session_token');
    if (sessionToken) {
      await fetchUser(sessionToken);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
