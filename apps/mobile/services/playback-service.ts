import TrackPlayer, { Event } from 'react-native-track-player';

let wasPaused = false;

export default async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => TrackPlayer.seekTo(e.position));

  TrackPlayer.addEventListener(Event.RemoteDuck, async (e) => {
    if (e.permanent) {
      await TrackPlayer.pause();
      return;
    }
    if (e.paused) {
      wasPaused = true;
      await TrackPlayer.pause();
    } else if (wasPaused) {
      wasPaused = false;
      await TrackPlayer.play();
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackError, (e) => {
    console.error(`Playback error [${e.code}]: ${e.message}`);
  });

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, () => {});
}
