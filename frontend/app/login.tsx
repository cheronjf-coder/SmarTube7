import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const { login } = useAuth();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="play-circle" size={80} color="#FF0000" />
            <Text style={styles.title}>SmarTube</Text>
            <Text style={styles.subtitle}>Quality YouTube Videos</Text>
            <Text style={styles.description}>
              Watch documentaries, news, and educational content{' \n'}20+ minutes long, ad-free
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="time-outline" size={24} color="#FF0000" />
              <Text style={styles.featureText}>20+ min videos only</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="close-circle-outline" size={24} color="#FF0000" />
              <Text style={styles.featureText}>No ads</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="bookmark-outline" size={24} color="#FF0000" />
              <Text style={styles.featureText}>Save bookmarks</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="share-social-outline" size={24} color="#FF0000" />
              <Text style={styles.featureText}>Share videos</Text>
            </View>
          </View>

          <View style={styles.pricing}>
            <Text style={styles.pricingTitle}>🎉 14-Day Free Trial</Text>
            <Text style={styles.pricingText}>Then choose your plan:</Text>
            <View style={styles.plans}>
              <Text style={styles.plan}>💰 $2/month</Text>
              <Text style={styles.plan}>📅 $14/year</Text>
              <Text style={styles.plan}>♾️ $29 lifetime</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={login}>
            <Ionicons name="logo-google" size={24} color="#FFF" />
            <Text style={styles.loginButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our Terms of Service{' \n'}and Privacy Policy
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF0000',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#999',
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  features: {
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#FFF',
  },
  pricing: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 16,
  },
  pricingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  pricingText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
  },
  plans: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  plan: {
    fontSize: 14,
    color: '#FFF',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
