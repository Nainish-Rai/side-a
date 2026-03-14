# Crossfade Feature

## Overview

The crossfade feature enables smooth transitions between tracks by overlapping the end of the current track with the beginning of the next track. This creates a seamless listening experience without jarring silence between songs.

## Configuration

- **Duration**: 5 seconds (fixed)
- **Pre-buffer Time**: 10 seconds before track end
- **Toggle**: Enabled via `/settings` route

## How It Works

### Timeline

1. **Pre-buffering (T - 10s)**: At `duration - 10s`, the next track starts loading in a secondary audio element
2. **Crossfade Start (T - 5s)**: At `duration - 5s`, volume crossfade begins
3. **Transition**: Volumes ramp using easeInOutQuad easing- Primary track: 1.0 → 0.0
   - Secondary track: 0.0 → 1.0
4. **Completion (T)**: Primary and secondary elements swap roles

### Architecture

#### Components

1. **CrossfadeController** (`lib/crossfade.ts`)
   - Manages dual audio elements
   - Handles volume ramping with requestAnimationFrame
   - Provides easeInOutQuad easing function
   - Exposes start/stop/destroy methods

2. **Settings Layer** (`lib/settings.ts`)
   - Persists crossfade preferences in localStorage
   - Provides getSettings/updateCrossfadeSettings APIs
   - Defaults: enabled=false, duration=5s, prebufferTime=10s

3. **AudioPlayerContext** (`contexts/AudioPlayerContext.tsx`)
   - Maintains secondary audio element
   - Monitors playback position for crossfade triggers
   - Coordinates pre-buffering and crossfade timing
   - Preserves user volume across transitions

#### Flow

```
Track Playing → Monitor Position → Trigger Pre-buffer → Monitor Position → Trigger Crossfade → Complete Transition
     ↓              ↓                  ↓                    ↓                  ↓                    ↓
Primary Audio  Check if T-10s    Load Next Track    Check if T-5s      Ramp Volumes        Swap Audio Elements
                                    in Secondary                          5s duration
```

## Edge Cases

### Manual Skip During Crossfade
- **Behavior**: Crossfade is cancelled immediately
- **Implementation**: `playTrack()` calls `crossfadeController.cancelCrossfade()`
- **Result**: Next track starts at time 0, volume restored to user setting

### Empty Queue
- **Behavior**: No crossfade occurs
- **Implementation**: Crossfade check only runs if `nextIndex < queue.length`
- **Result**: Track ends normally, playback stops

### Repeat-One Mode
- **Behavior**: No crossfade (track repeats instead)
- **Implementation**: Repeat-one mode is handled before crossfade logic
- **Result**: Track restarts from beginning

### Network Failure During Pre-buffer
- **Behavior**: Falls back to instant track change
- **Implementation**: Try-catch in async pre-buffer IIFE
- **Result**: Error logged to console, next track loads when crossfade would start

### Volume Preservation
- **Behavior**: User's volume setting is preserved after crossfade
- **Implementation**: `volumeRef` tracks current volume, restored in `onCrossfadeEnd` callback
- **Result**: Track plays at user's chosen volume level

### Shuffle Mode
- **Behavior**: Crossfade respects shuffled queue order
- **Implementation**: Uses `shuffledQueue.current` when shuffle is active
- **Result**: Next track from shuffled queue, not original order

### Rapid Track Changes
- **Behavior**: No audio overlap or memory leaks
- **Implementation**: `cancelCrossfade()` cancels animation frames and restores state
- **Result**: Clean transitions even with rapid skipping

### Settings Toggle Mid-Track
- **Behavior**: No immediate effect, requires page refresh
- **Implementation**: CrossfadeController created on mount with current settings
- **Result**: New setting takes effect on next component mount

## Performance Considerations

- **Animation**: Uses `requestAnimationFrame` for smooth 60fps volume transitions
- **Memory**: Secondary audio element cleaned up on unmount
- **CPU**: Crossfade check interval only runs once per second
- **Network**: Pre-buffering reduces loading time for next track

## Future Enhancements

1. **Configurable Duration**: Allow users to adjust crossfade duration (3-15 seconds range)
2. **Per-Playlist Settings**: Different crossfade settings for different playlists
3. **Smart Crossfade**: Detect track BPM and adjust timing automatically
4. **Waveform Analysis**: Visualize crossfade overlap in player UI
5. **Gapless Playback**: True gapless playback for albums designed as continuous mixes
6. **Crossfade Types**: Support different transition curves (linear, exponential, S-curve)

## Related Files

- `lib/crossfade.ts` - Core crossfade logic
- `lib/settings.ts` - Settings persistence
- `contexts/AudioPlayerContext.tsx` - Audio playback management
- `app/settings/SettingsClient.tsx` - Settings UI