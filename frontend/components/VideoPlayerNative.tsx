import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
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
  const [hasError, setHasError] = useState(false);

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
    setHasError(false); // Reset error on new stream
  }, [streamUrl]);

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

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={32} color="#FF0000" />
        <Text style={styles.errorText}>Native playback failed.</Text>
        <Text style={styles.errorSubtext}>Please use the YouTube player below.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.videoContainer}>
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
          onError={(error) => {
            console.error('Video error:', error);
            setHasError(true);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  errorSubtext: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  }
});
