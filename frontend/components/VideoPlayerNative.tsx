import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  Text, 
  Alert,
  AppState
} from 'react-native';
import { Video, ResizeMode, VideoFullscreenUpdate, Audio } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
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
  const videoRef = useRef<Video>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

    return () => {};
  }, []);

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

  const showCCInfo = () => {
    Alert.alert(
      'Closed Captions (CC) 📝',
      'To enable subtitles:\n\n1. Tap the video to show controls\n2. Look for CC or ⚙️ button in player\n3. Select "Subtitles/CC"\n4. Choose your language\n\n✓ Most documentaries have CC\n✓ Auto-generated English available\n✓ Multiple languages often included',
      [{ text: 'Got it!' }]
    );
  };

  const openCCMenu = () => {
    Alert.alert(
      'Enable Subtitles 📺',
      'Subtitle controls are in the video player:\n\n• Tap video → Player controls appear\n• Look for CC button (closed captions)\n• Or tap ⚙️ (settings) → Subtitles\n\nThe native player handles all subtitle formats automatically. YouTube videos usually have auto-generated English CC and often multiple language options!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={true}
        onFullscreenUpdate={handleFullscreenUpdate}
        usePoster={false}
        posterSource={undefined}
      />

      {/* Control Bar - ALWAYS VISIBLE */}
      <View style={styles.controlBar}>
        {/* CC Info Button */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={showCCInfo}
        >
          <Ionicons name="information-circle-outline" size={28} color="#FFF" />
          <Text style={styles.controlButtonText}>CC Help</Text>
        </TouchableOpacity>

        {/* CC Menu Button */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={openCCMenu}
        >
          <Ionicons name="text-outline" size={28} color="#FFF" />
          <Text style={styles.controlButtonText}>CC</Text>
        </TouchableOpacity>

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
});
