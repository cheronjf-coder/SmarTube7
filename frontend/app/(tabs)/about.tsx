import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function About() {
  const openWebsite = () => {
    Linking.openURL('https://optimotcle.ca');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/smartube-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>About SmarTube</Text>
          <Text style={styles.description}>
            SmarTube is your gateway to quality YouTube content. Watch documentaries, news reports, educational videos, and more - all 20+ minutes long and ad-free.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Created By</Text>
          <View style={styles.creatorCard}>
            <Ionicons name="business" size={48} color="#FF0000" />
            <Text style={styles.creatorName}>Optimotclé</Text>
            <TouchableOpacity style={styles.linkButton} onPress={openWebsite}>
              <Ionicons name="globe-outline" size={20} color="#FFF" />
              <Text style={styles.linkText}>optimotcle.ca</Text>
              <Ionicons name="open-outline" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#00FF00" />
              <Text style={styles.featureText}>Ad-free video streaming</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#00FF00" />
              <Text style={styles.featureText}>Background audio playback</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#00FF00" />
              <Text style={styles.featureText}>20+ minute videos only</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#00FF00" />
              <Text style={styles.featureText}>Bookmark your favorites</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#00FF00" />
              <Text style={styles.featureText}>Share videos with friends</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color="#00FF00" />
              <Text style={styles.featureText}>Multiple categories</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Version</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Optimotclé. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ for quality content lovers
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logo: {
    width: 200,
    height: 100,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#CCC',
    lineHeight: 24,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  creatorCard: {
    backgroundColor: '#1A1A1A',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  creatorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#FFF',
  },
  versionText: {
    fontSize: 16,
    color: '#999',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666',
  },
});
