import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  Text, 
  Modal, 
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
  Alert
} from 'react-native';
import { Video, ResizeMode, VideoFullscreenUpdate, AVPlaybackStatus, Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

interface Subtitle {
  language: string;
  label: string;
  url: string;
}

interface VideoPlayerProps {
  streamUrl: string;
  videoTitle?: string;
  videoId?: string;
  subtitles?: Subtitle[];
  onPlaybackStatusUpdate?: (status: any) => void;
  onClose?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function VideoPlayerNative({ 
  streamUrl, 
  videoTitle = '',
  videoId = '',
  subtitles = [],
  onPlaybackStatusUpdate,
  onClose
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [isFloating, setIsFloating] = useState(false);
  const [downloadingSubtitles, setDownloadingSubtitles] = useState(false);
  useEffect(() => {
    // Enable background audio
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.log('Error setting up audio:', error);
      }
    };

    setupAudio();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Floating window position
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 180, y: 100 })).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

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
  };

  const downloadAllSubtitles = async () => {
    if (subtitles.length === 0) {
      Alert.alert('No Subtitles', 'This video has no subtitles available.');
      return;
    }

    setDownloadingSubtitles(true);
    
    try {
      const downloadPromises = subtitles.map(async (subtitle) => {
        try {
          // Download subtitle file
          const fileName = `${videoTitle}_${subtitle.language}.${subtitle.url.includes('.vtt') ? 'vtt' : 'srt'}`;
          const fileUri = FileSystem.documentDirectory + fileName;
          
          const downloadResult = await FileSystem.downloadAsync(
            subtitle.url,
            fileUri
          );

          return { success: true, language: subtitle.label, uri: downloadResult.uri };
        } catch (error) {
          return { success: false, language: subtitle.label, error };
        }
      });

      const results = await Promise.all(downloadPromises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        Alert.alert(
          'Subtitles Downloaded! ✅',
          `${successCount} subtitle file(s) downloaded successfully.\n\nThey are saved to your device.`,
          [
            {
              text: 'Share Files',
              onPress: async () => {
                // Share the first subtitle file
                const firstSuccess = results.find(r => r.success);
                if (firstSuccess && firstSuccess.uri) {
                  const canShare = await Sharing.isAvailableAsync();
                  if (canShare) {
                    await Sharing.shareAsync(firstSuccess.uri);
                  }
                }
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Download Failed', 'Failed to download subtitles. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download subtitles.');
      console.error('Subtitle download error:', error);
    } finally {
      setDownloadingSubtitles(false);
    }
  };

  const toggleFloating = () => {
    setIsFloating(!isFloating);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(status);
    }
  };

  if (isFloating) {
    // Floating window mode
    return (
      <Animated.View
        style={[
          styles.floatingContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y }
            ]
          }
        ]}
        {...panResponder.panHandlers}
      >
        <Video
          ref={videoRef}
          source={{ uri: streamUrl }}
          style={styles.floatingVideo}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        <View style={styles.floatingControls}>
          <TouchableOpacity 
            style={styles.floatingButton}
            onPress={toggleFloating}
          >
            <Ionicons name="expand" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.floatingButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // Normal player mode
  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onFullscreenUpdate={handleFullscreenUpdate}
        usePoster={false}
        posterSource={undefined}
      />

      {/* Visible Control Bar - Always show with strong background */}
      <View style={styles.controlBar}>
        {/* Floating Window Button */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={toggleFloating}
        >
          <Ionicons name="contract-outline" size={28} color="#FFF" />
          <Text style={styles.controlButtonText}>Float</Text>
        </TouchableOpacity>

        {/* Subtitle Download Button */}
        {subtitles.length > 0 && (
          <TouchableOpacity 
            style={[styles.controlButton, downloadingSubtitles && styles.controlButtonDisabled]}
            onPress={downloadAllSubtitles}
            disabled={downloadingSubtitles}
          >
            <Ionicons 
              name={downloadingSubtitles ? "hourglass-outline" : "download-outline"} 
              size={28} 
              color="#FFF" 
            />
            <Text style={styles.controlButtonText}>
              {downloadingSubtitles ? 'Wait...' : 'DL Subs'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Subtitle Selection Button */}
        {subtitles.length > 0 && (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowSubtitleMenu(true)}
          >
            <Ionicons name="text-outline" size={28} color="#FFF" />
            <Text style={styles.controlButtonText}>CC</Text>
          </TouchableOpacity>
        )}

        {/* Fullscreen Button */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={async () => {
            if (videoRef.current) {
              await videoRef.current.presentFullscreenPlayer();
            }
          }}
        >
          <Ionicons name="expand" size={28} color="#FFF" />
          <Text style={styles.controlButtonText}>Full</Text>
        </TouchableOpacity>
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

            <TouchableOpacity 
              style={styles.downloadAllButton}
              onPress={() => {
                setShowSubtitleMenu(false);
                downloadAllSubtitles();
              }}
            >
              <Ionicons name="download" size={20} color="#FFF" />
              <Text style={styles.downloadAllText}>Download All Subtitles</Text>
            </TouchableOpacity>
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
    bottom: 12,
    right: 12,
    left: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 12,
    borderRadius: 12,
  },
  controlButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 70,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  controlButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  floatingContainer: {
    position: 'absolute',
    width: 160,
    height: 90,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    zIndex: 9999,
  },
  floatingVideo: {
    width: '100%',
    height: '100%',
  },
  floatingControls: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
  floatingButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 6,
    borderRadius: 6,
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
    maxHeight: '60%',
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
  downloadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadAllText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
