import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Video {
  video_id: string;
  title: string;
  thumbnail: string;
  channel_name: string;
  duration_minutes: number;
  view_count: string;
}

export default function Home() {
  const { user, refreshUser } = useAuth();
  const [popularVideos, setPopularVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadSubscriptionStatus(),
      loadPopularVideos(),
    ]);
    setLoading(false);
  };

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

  const loadPopularVideos = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await axios.post(
        `${BACKEND_URL}/api/videos/search`,
        {
          query: 'documentary',
          category: 'documentary',
          max_results: 10,
        },
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
        }
      );
      setPopularVideos(response.data.videos);
    } catch (error: any) {
      if (error.response?.status === 503) {
        Alert.alert('Setup Required', 'YouTube API key not configured. Please add it in the backend.');
      } else if (error.response?.status === 402) {
        router.push('/subscription');
      } else {
        console.error('Error loading videos:', error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const playVideo = (videoId: string) => {
    router.push({
      pathname: '/player',
      params: { videoId },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />
      }
    >
      {subscriptionStatus && (
        <View style={styles.subscriptionBanner}>
          {subscriptionStatus.subscription_type === 'trial' && (
            <View style={styles.trialBanner}>
              <Ionicons name="gift-outline" size={24} color="#FFD700" />
              <Text style={styles.trialText}>
                {subscriptionStatus.trial_days_remaining} days left in your free trial
              </Text>
            </View>
          )}
          {subscriptionStatus.subscription_type === 'expired' && (
            <TouchableOpacity
              style={styles.expiredBanner}
              onPress={() => router.push('/subscription')}
            >
              <Ionicons name="alert-circle-outline" size={24} color="#FF0000" />
              <Text style={styles.expiredText}>Subscription expired - Tap to renew</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user?.name?.split(' ')[0]}!</Text>
        <Text style={styles.subtitle}>Discover quality content</Text>
      </View>

      <View style={styles.categories}>
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'documentary' } })}
        >
          <Ionicons name="film-outline" size={32} color="#FF0000" />
          <Text style={styles.categoryText}>Documentaries</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'news' } })}
        >
          <Ionicons name="newspaper-outline" size={32} color="#FF0000" />
          <Text style={styles.categoryText}>News</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'actuality' } })}
        >
          <Ionicons name="globe-outline" size={32} color="#FF0000" />
          <Text style={styles.categoryText}>Actuality</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: 'training' } })}
        >
          <Ionicons name="school-outline" size={32} color="#FF0000" />
          <Text style={styles.categoryText}>Training</Text>
        </TouchableOpacity>
      </View>

      {popularVideos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Documentaries</Text>
          {popularVideos.map((video) => (
            <TouchableOpacity
              key={video.video_id}
              style={styles.videoCard}
              onPress={() => playVideo(video.video_id)}
            >
              <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} />
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.channelName}>{video.channel_name}</Text>
                <View style={styles.videoMeta}>
                  <Ionicons name="time-outline" size={14} color="#999" />
                  <Text style={styles.metaText}>{video.duration_minutes} min</Text>
                  <Ionicons name="eye-outline" size={14} color="#999" style={{ marginLeft: 12 }} />
                  <Text style={styles.metaText}>{formatViews(video.view_count)} views</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatViews(views: string): string {
  const num = parseInt(views);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return views;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionBanner: {
    margin: 16,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  trialText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  expiredText: {
    color: '#FF0000',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  header: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 4,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  videoCard: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    lineHeight: 20,
  },
  channelName: {
    fontSize: 12,
    color: '#999',
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
});
