import React from 'react';
import YoutubePlayer from 'react-native-youtube-iframe';

interface VideoPlayerProps {
  videoId: string;
  playing?: boolean;
  onChangeState?: (state: string) => void;
}

export default function VideoPlayer({ videoId, playing, onChangeState }: VideoPlayerProps) {
  return (
    <YoutubePlayer
      height={220}
      videoId={videoId}
      play={playing}
      onChangeState={onChangeState}
    />
  );
}
