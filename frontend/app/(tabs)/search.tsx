import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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

const CATEGORIES = [
  { id: 'documentary', label: 'Documentary', icon: 'film-outline' },
  { id: 'news', label: 'News', icon: 'newspaper-outline' },
  { id: 'actuality', label: 'Actuality', icon: 'globe-outline' },
  { id: 'training', label: 'Training', icon: 'school-outline' },
];

export default function Search() {
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    (params.category as string) || 'documentary'
  );
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  const searchVideos = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Enter Search', 'Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await axios.post(
        `${BACKEND_URL}/api/videos/search`,
        {
          query: searchQuery,
          category: selectedCategory,
          max_results: 20,
        },
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
        }
      );
      setVideos(response.data.videos);
    } catch (error: any) {
      if (error.response?.status === 503) {
        Alert.alert('Setup Required', 'YouTube API key not configured');
      } else if (error.response?.status === 402) {
        router.push('/subscription');
      } else {
        Alert.alert('Search Failed', 'Unable to search videos. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const playVideo = (videoId: string) => {
    router.push({
      pathname: '/player',
      params: { videoId },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchVideos}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={18}
                color={selectedCategory === cat.id ? '#FFF' : '#999'}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.searchButton} onPress={searchVideos}>
          <Text style={styles.searchButtonText}>Search</Text>
          <Ionicons name="search" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF0000" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : videos.length > 0 ? (
          videos.map((video) => (
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
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>Search for videos</Text>
            <Text style={styles.emptySubtext}>
              Find documentaries, news, and educational content
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  searchContainer: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  categories: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#FF0000',
  },
  categoryChipText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  videoCard: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
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
