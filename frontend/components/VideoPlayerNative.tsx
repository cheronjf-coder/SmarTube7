import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, AppState } from 'react-native';
import { Video, ResizeMode, VideoFullscreenUpdate } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';

interface VideoPlayerProps {
  streamUrl: string;
  onPlaybackStatusUpdate?: (status: any) => void;
}

export default function VideoPlayerNative({ streamUrl, onPlaybackStatusUpdate }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Handle app state changes for PiP
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (Platform.OS === 'android' && nextAppState === 'background') {
        // Enable PiP when app goes to background
        if (videoRef.current) {
          videoRef.current.setStatusAsync({ shouldPlay: true });
        }
      }
    });

    return () => {
      subscription.remove();
    };
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
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: streamUrl }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onFullscreenUpdate={handleFullscreenUpdate}
        // Enable PiP on Android
        usePoster={false}
        posterSource={undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
