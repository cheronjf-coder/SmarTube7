import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface VideoPlayerProps {
  videoId: string;
  playing?: boolean;
  onChangeState?: (state: string) => void;
}

export default function VideoPlayer({ videoId, playing, onChangeState }: VideoPlayerProps) {
  if (Platform.OS === 'web') {
    // Use iframe for web
    return (
      <View style={styles.container}>
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${playing ? 1 : 0}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: 8 }}
        />
      </View>
    );
  }

  // Use react-native-youtube-iframe for mobile
  try {
    const YoutubePlayer = require('react-native-youtube-iframe').default;
    return (
      <YoutubePlayer
        height={220}
        videoId={videoId}
        play={playing}
        onChangeState={onChangeState}
      />
    );
  } catch (error) {
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#000',
  },
});
