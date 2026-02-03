import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Conditional import for YouTube player (doesn't work on web)
let YoutubePlayer: any = null;
if (Platform.OS !== 'web') {
  YoutubePlayer = require('react-native-youtube-iframe').default;
}

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface VideoInfo {
  video_id: string;
  title: string;
  description: string;
  thumbnail: string;
  channel_name: string;
  duration: string;
  view_count: string;
}

export default function Player() {
  const params = useLocalSearchParams();
  const videoId = params.videoId as string;
  const category = (params.category as string) || 'documentary';

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (videoId) {
      loadVideoInfo();
      checkBookmark();
    }
  }, [videoId]);

  const loadVideoInfo = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await axios.get(
        `${BACKEND_URL}/api/videos/${videoId}/info`,
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
        }
      );
      setVideoInfo(response.data);
    } catch (error: any) {
      if (error.response?.status === 402) {
        Alert.alert('Subscription Required', 'Please subscribe to watch videos', [
          { text: 'Subscribe', onPress: () => router.push('/subscription') },
          { text: 'Cancel', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to load video');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkBookmark = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await axios.get(`${BACKEND_URL}/api/bookmarks`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const bookmarks = response.data.bookmarks;
      setIsBookmarked(bookmarks.some((b: any) => b.video_id === videoId));
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!videoInfo) return;

    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      
      if (isBookmarked) {
        await axios.delete(`${BACKEND_URL}/api/bookmarks/${videoId}`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        setIsBookmarked(false);
        Alert.alert('Removed', 'Bookmark removed');
      } else {
        await axios.post(
          `${BACKEND_URL}/api/bookmarks`,
          null,
          {
            params: {
              video_id: videoId,
              video_title: videoInfo.title,
              thumbnail: videoInfo.thumbnail,
              duration: videoInfo.duration,
              channel_name: videoInfo.channel_name,
              category: category,
            },
            headers: { Authorization: `Bearer ${sessionToken}` },
          }
        );
        setIsBookmarked(true);
        Alert.alert('Saved', 'Added to bookmarks');
      }
    } catch (error: any) {
      if (error.response?.status === 402) {
        Alert.alert('Subscription Required', 'Please subscribe to bookmark videos', [
          { text: 'Subscribe', onPress: () => router.push('/subscription') },
          { text: 'Cancel' },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update bookmark');
      }
    }
  };

  const shareVideo = async () => {
    try {
      const sessionToken = await AsyncStorage.getItem('session_token');
      const response = await axios.post(
        `${BACKEND_URL}/api/share/create`,
        null,
        {
          params: { video_id: videoId },
          headers: { Authorization: `Bearer ${sessionToken}` },
        }
      );

      const { web_link } = response.data;
      
      await Share.share({
        message: `Check out this video on SmarTube: ${videoInfo?.title}\n\nDownload SmarTube to watch: ${web_link}`,
        title: videoInfo?.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share video');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
      </SafeAreaView>
    );
  }

  if (!videoInfo) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF0000" />
        <Text style={styles.errorText}>Video not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {videoInfo.channel_name}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <YoutubePlayer
          height={220}
          videoId={videoId}
          play={playing}
          onChangeState={(state) => {
            setPlaying(state === 'playing');
          }}
        />

        <View style={styles.info}>
          <Text style={styles.title}>{videoInfo.title}</Text>
          
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={16} color="#999" />
              <Text style={styles.statText}>{formatViews(videoInfo.view_count)} views</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleBookmark}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isBookmarked ? '#FF0000' : '#FFF'}
              />
              <Text style={styles.actionText}>
                {isBookmarked ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={shareVideo}>
              <Ionicons name="share-social-outline" size={24} color="#FFF" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.channelName}>{videoInfo.channel_name}</Text>
            <Text style={styles.description} numberOfLines={3}>
              {videoInfo.description}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
  },
  backButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerButton: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  info: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#999',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 20,
  },
});
