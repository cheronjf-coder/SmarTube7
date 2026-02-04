import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  Text, 
  Modal, 
  ScrollView,
  Alert,
  AppState
} from 'react-native';
import Video from 'react-native-video';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

interface VideoPlayerProps {
  streamUrl: string;
  videoTitle?: string;
  videoId?: string;
  onClose?: () => void;
}

export default function VideoPlayerNative({ 
  streamUrl, 
  videoTitle = '',
  videoId = '',
  onClose
}: VideoPlayerProps) {
  const videoRef = useRef<any>(null);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [textTracks, setTextTracks] = useState<any[]>([]);
  const [selectedTextTrack, setSelectedTextTrack] = useState<any>({ type: 'disabled' });
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [downloadingSubtitles, setDownloadingSubtitles] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

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

    // Keep playing in background
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Continue playing audio in background
        setPaused(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const onLoad = (data: any) => {
    console.log('Video loaded:', data);
    // Get available text tracks (subtitles/CC)
    if (data.textTracks && data.textTracks.length > 0) {
      setTextTracks(data.textTracks);
      console.log('Available text tracks:', data.textTracks);
    }
  };

  const selectSubtitle = (track: any) => {
    setSelectedTextTrack(track);
    setShowSubtitleMenu(false);
  };

  const downloadAllSubtitles = async () => {
    if (textTracks.length === 0) {
      Alert.alert(
        'No Subtitles Available',
        'This video does not have embedded subtitles available for download.',
        [
          {
            text: 'Use Native CC',
            onPress: () => {
              Alert.alert(
                'How to Enable CC',
                'Tap the video player to show controls, then look for the CC (closed captions) button in the player controls.'
              );
            }
          },
          { text: 'OK' }
        ]
      );
      return;
    }

    Alert.alert(
      'Subtitles Available!',
      `Found ${textTracks.length} subtitle track(s). Tap "CC" button to select and enable subtitles.`,
      [{ text: 'OK' }]
    );
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (fullscreen) {
        videoRef.current.dismissFullscreenPlayer();
      } else {
        videoRef.current.presentFullscreenPlayer();
      }
      setFullscreen(!fullscreen);
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        paused={paused}
        controls={true}
        resizeMode="contain"
        onLoad={onLoad}
        onError={(error) => console.log('Video error:', error)}
        textTracks={textTracks}
        selectedTextTrack={selectedTextTrack}
        // Enable subtitle support
        ignoreSilentSwitch="ignore"
        playInBackground={true}
        playWhenInactive={true}
        // Android specific
        poster={undefined}
        posterResizeMode="contain"
      />

      {/* Control Bar - ALWAYS VISIBLE */}
      <View style={styles.controlBar}>
        {/* Subtitle Download Info Button */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={downloadAllSubtitles}
        >
          <Ionicons name="information-circle-outline" size={28} color="#FFF" />
          <Text style={styles.controlButtonText}>CC Info</Text>
        </TouchableOpacity>

        {/* Subtitle Selection Button */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setShowSubtitleMenu(true)}
        >
          <Ionicons name="text-outline" size={28} color="#FFF" />
          <Text style={styles.controlButtonText}>CC</Text>
        </TouchableOpacity>

        {/* Fullscreen Button */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={toggleFullscreen}
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
              <Text style={styles.modalTitle}>Subtitles / Closed Captions</Text>
              <TouchableOpacity onPress={() => setShowSubtitleMenu(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.subtitleList}>
              {textTracks.length === 0 ? (
                <View style={styles.noSubtitles}>
                  <Ionicons name="alert-circle-outline" size={48} color="#666" />
                  <Text style={styles.noSubtitlesText}>No Embedded Subtitles</Text>
                  <Text style={styles.noSubtitlesSubtext}>
                    This video doesn't have embedded subtitle tracks. Try using the native player CC button if available.
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.subtitleOption,
                      selectedTextTrack.type === 'disabled' && styles.subtitleOptionActive
                    ]}
                    onPress={() => selectSubtitle({ type: 'disabled' })}
                  >
                    <Text style={styles.subtitleOptionText}>Off</Text>
                    {selectedTextTrack.type === 'disabled' && (
                      <Ionicons name="checkmark" size={20} color="#FF0000" />
                    )}
                  </TouchableOpacity>

                  {textTracks.map((track, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.subtitleOption,
                        selectedTextTrack.type === 'index' && 
                        selectedTextTrack.value === index && 
                        styles.subtitleOptionActive
                      ]}
                      onPress={() => selectSubtitle({ type: 'index', value: index })}
                    >
                      <View>
                        <Text style={styles.subtitleOptionText}>
                          {track.title || track.language || `Track ${index + 1}`}
                        </Text>
                        <Text style={styles.subtitleOptionSubtext}>
                          {track.language} • {track.type}
                        </Text>
                      </View>
                      {selectedTextTrack.type === 'index' && 
                       selectedTextTrack.value === index && (
                        <Ionicons name="checkmark" size={20} color="#FF0000" />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                💡 Tip: Look for CC button in the video player controls for more options
              </Text>
            </View>
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
    minWidth: 90,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  controlButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
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
    maxHeight: '70%',
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
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  subtitleOptionText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  subtitleOptionSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noSubtitles: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  noSubtitlesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  noSubtitlesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#0A0A0A',
  },
  modalFooterText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
