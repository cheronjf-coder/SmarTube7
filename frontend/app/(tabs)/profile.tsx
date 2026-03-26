import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Profile() {
  const { user, logout } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${BACKEND_URL}/api/subscription/status`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      setSubscriptionStatus(response.data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const getSubscriptionBadge = () => {
    if (!subscriptionStatus) return null;

    switch (subscriptionStatus.subscription_type) {
      case 'trial':
        return (
          <View style={[styles.badge, styles.trialBadge]}>
            <Text style={styles.badgeText}>
              🎁 {subscriptionStatus.trial_days_remaining} Days Trial Left
            </Text>
          </View>
        );
      case 'monthly':
        return (
          <View style={[styles.badge, styles.monthlyBadge]}>
            <Text style={styles.badgeText}>
              💳 Monthly ({subscriptionStatus.subscription_days_remaining} days left)
            </Text>
          </View>
        );
      case 'yearly':
        return (
          <View style={[styles.badge, styles.yearlyBadge]}>
            <Text style={styles.badgeText}>
              🌟 Yearly ({subscriptionStatus.subscription_days_remaining} days left)
            </Text>
          </View>
        );
      case 'lifetime':
        return (
          <View style={[styles.badge, styles.lifetimeBadge]}>
            <Text style={styles.badgeText}>♾️ Lifetime Member</Text>
          </View>
        );
      case 'expired':
        return (
          <View style={[styles.badge, styles.expiredBadge]}>
            <Text style={styles.badgeText}>❌ Expired</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {user?.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={40} color="#999" />
          </View>
        )}
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {getSubscriptionBadge()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        {subscriptionStatus?.subscription_type === 'expired' || 
         subscriptionStatus?.subscription_type === 'trial' ? (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/subscription')}
          >
            <Ionicons name="rocket-outline" size={24} color="#FFF" />
            <Text style={styles.upgradeButtonText}>
              {subscriptionStatus?.subscription_type === 'expired'
                ? 'Renew Subscription'
                : 'Upgrade Now'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.subscriptionInfo}>
            <Ionicons name="checkmark-circle" size={24} color="#00FF00" />
            <Text style={styles.subscriptionInfoText}>Active Subscription</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color="#999" />
            <Text style={styles.infoText}>Version 1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={20} color="#999" />
            <Text style={styles.infoText}>Terms of Service</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#999" />
            <Text style={styles.infoText}>Privacy Policy</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF0000" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ by SmarTube</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  trialBadge: {
    backgroundColor: '#FFD700',
  },
  monthlyBadge: {
    backgroundColor: '#4A90E2',
  },
  yearlyBadge: {
    backgroundColor: '#9B59B6',
  },
  lifetimeBadge: {
    backgroundColor: '#00FF00',
  },
  expiredBadge: {
    backgroundColor: '#FF0000',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  subscriptionInfoText: {
    color: '#00FF00',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    color: '#999',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF0000',
    gap: 8,
  },
  logoutButtonText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});
