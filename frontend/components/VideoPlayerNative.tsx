import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, AppState, TouchableOpacity, Text, Modal, ScrollView } from 'react-native';
import { Video, ResizeMode, VideoFullscreenUpdate, AVPlaybackStatus } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import GoogleCast, { CastButton } from 'react-native-google-cast';

interface Subtitle {
  language: string;
  label: string;
  url: string;
}

interface VideoPlayerProps {
  streamUrl: string;
  videoTitle?: string;
  subtitles?: Subtitle[];
  onPlaybackStatusUpdate?: (status: any) => void;
}

export default function VideoPlayerNative({ 
  streamUrl, 
  videoTitle = '',
  subtitles = [],
  onPlaybackStatusUpdate 
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [isPiPEnabled, setIsPiPEnabled] = useState(false);
  const [castConnected, setCastConnected] = useState(false);

  useEffect(() => {
    // Initialize Google Cast
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTED, () => {
        setCastConnected(true);
        castVideo();
      });

      GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDED, () => {
        setCastConnected(false);
      });
    }

    // Handle app state changes for PiP
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (Platform.OS === 'android' && nextAppState === 'background') {
        // Enable PiP when app goes to background
        try {
          if (videoRef.current) {
            const status = await videoRef.current.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
              // Continue playing in PiP mode
              await videoRef.current.presentFullscreenPlayer();
            }
          }
        } catch (error) {
          console.log('PiP not available:', error);
        }
      }
    });

    return () => {
      subscription.remove();
      GoogleCast.endSession();
    };
  }, []);

  const castVideo = () => {
    if (castConnected && streamUrl) {
      GoogleCast.castMedia({
        mediaUrl: streamUrl,
        title: videoTitle,
        imageUrl: '',
        contentType: 'video/mp4',
        streamDuration: 0,
      });
    }
  };

  const handleFullscreenUpdate = async (event: any) => {
    switch (event.fullscreenUpdate) {
      case VideoFullscreenUpdate.PLAYER_WILL_PRESENT:
        await ScreenOrientation.unlockAsync();
        setIsFullscreen(true);
        break;
      case VideoFullscreenUpdate.PLAYER_WILL_DISMISS:
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsFullscreen(false);
        break;
    }
  };

  const selectSubtitle = (subtitleUrl: string | null) => {
    setSelectedSubtitle(subtitleUrl);
    setShowSubtitleMenu(false);
    // Note: React Native Video doesn't support external subtitles easily
    // This would need a custom implementation or native module
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(status);
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true} // AUTO-PLAY enabled
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onFullscreenUpdate={handleFullscreenUpdate}
        usePoster={false}
        posterSource={undefined}
        // Enable PiP on Android
        androidImplementation="android_media_player"
      />

      {/* Control Bar */}
      <View style={styles.controlBar}>
        {/* Cast Button */}
        {(Platform.OS === 'android' || Platform.OS === 'ios') && (
          <View style={styles.castButtonContainer}>
            <CastButton style={styles.castButton} tintColor="#FFFFFF" />
            {castConnected && (
              <Text style={styles.castText}>Casting...</Text>
            )}
          </View>
        )}

        {/* Subtitle Button */}
        {subtitles.length > 0 && (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowSubtitleMenu(true)}
          >
            <Ionicons name="text-outline" size={24} color="#FFF" />
            <Text style={styles.controlButtonText}>CC</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Subtitle Menu Modal */}
      <Modal
        visible={showSubtitleMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubtitleMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subtitles</Text>
              <TouchableOpacity onPress={() => setShowSubtitleMenu(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.subtitleList}>
              <TouchableOpacity
                style={[
                  styles.subtitleOption,
                  selectedSubtitle === null && styles.subtitleOptionActive
                ]}
                onPress={() => selectSubtitle(null)}
              >
                <Text style={styles.subtitleOptionText}>Off</Text>
                {selectedSubtitle === null && (
                  <Ionicons name="checkmark" size={20} color="#FF0000" />
                )}
              </TouchableOpacity>

              {subtitles.map((subtitle, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.subtitleOption,
                    selectedSubtitle === subtitle.url && styles.subtitleOptionActive
                  ]}
                  onPress={() => selectSubtitle(subtitle.url)}
                >
                  <Text style={styles.subtitleOptionText}>{subtitle.label}</Text>
                  {selectedSubtitle === subtitle.url && (
                    <Ionicons name="checkmark" size={20} color="#FF0000" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controlBar: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  castButtonContainer: {
    alignItems: 'center',
  },
  castButton: {
    width: 30,
    height: 30,
  },
  castText: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 2,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitleList: {
    padding: 16,
  },
  subtitleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#2A2A2A',
  },
  subtitleOptionActive: {
    backgroundColor: '#3A3A3A',
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  subtitleOptionText: {
    fontSize: 16,
    color: '#FFF',
  },
});
