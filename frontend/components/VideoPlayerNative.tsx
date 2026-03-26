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
            Alert.alert('Video Error', 'Impossible de lire cette vidéo: ' + error);
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
});
