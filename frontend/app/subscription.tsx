import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$2',
    period: '/month',
    features: [
      'Unlimited video access',
      'Ad-free experience',
      'Bookmark videos',
      'Share with friends',
    ],
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$14',
    period: '/year',
    savings: 'Save $10',
    features: [
      'Unlimited video access',
      'Ad-free experience',
      'Bookmark videos',
      'Share with friends',
      'Best value!',
    ],
    highlight: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$29',
    period: 'one-time',
    savings: 'Best Deal',
    features: [
      'Unlimited video access',
      'Ad-free experience',
      'Bookmark videos',
      'Share with friends',
      'Lifetime updates',
      'Priority support',
    ],
    highlight: false,
  },
];

export default function Subscription() {
  const { refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [processing, setProcessing] = useState(false);

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      await axios.post(
        `${BACKEND_URL}/api/subscription/purchase`,
        { plan_type: selectedPlan },
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
        }
      );

      await refreshUser();

      Alert.alert(
        'Success! 🎉',
        'Your subscription is now active. Enjoy SmarTube!',
        [
          {
            text: 'Start Watching',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.hero}>
          <Ionicons name="play-circle" size={64} color="#FF0000" />
          <Text style={styles.heroTitle}>Unlock SmarTube</Text>
          <Text style={styles.heroSubtitle}>
            Watch quality documentaries, news, and educational content
          </Text>
        </View>

        <View style={styles.plans}>
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.highlight && styles.planCardHighlight,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.highlight && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>🔥 POPULAR</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.savings && (
                    <Text style={styles.savings}>{plan.savings}</Text>
                  )}
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.period}>{plan.period}</Text>
                </View>
              </View>

              <View style={styles.features}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.feature}>
                    <Ionicons name="checkmark-circle" size={20} color="#00FF00" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {selectedPlan === plan.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color="#FF0000" />
                  <Text style={styles.selectedText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={20} color="#999" />
          <Text style={styles.noticeText}>
            This is a demo. No actual payment will be processed.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseButton, processing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={processing}
        >
          {processing ? (
            <Text style={styles.purchaseButtonText}>Processing...</Text>
          ) : (
            <>
              <Ionicons name="rocket" size={24} color="#FFF" />
              <Text style={styles.purchaseButtonText}>
                Subscribe Now - {PLANS.find((p) => p.id === selectedPlan)?.price}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Cancel anytime. No hidden fees.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    padding: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  plans: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  planCardSelected: {
    borderColor: '#FF0000',
  },
  planCardHighlight: {
    backgroundColor: '#2A2A2A',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  savings: {
    fontSize: 12,
    color: '#00FF00',
    marginTop: 4,
    fontWeight: '600',
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  period: {
    fontSize: 14,
    color: '#999',
  },
  features: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#CCC',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 8,
  },
  selectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
});
