"use client";

import { useAudioPlayer, useQueue } from "@/contexts/AudioPlayerContext";
import { getTrackTitle, getTrackArtists } from "@/lib/api/utils";
import { X, Music } from "lucide-react";

interface QueueProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Queue({ isOpen, onClose }: QueueProps) {
  const { queue, currentQueueIndex } = useQueue();
  const { removeFromQueue, clearQueue } = useAudioPlayer();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 z-50 flex items-end justify-end">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close queue"
      />

      <div className="relative bg-background border-l border-foreground w-full max-w-md h-full md:h-[600px] shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="border-b border-foreground p-4 bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-mono font-bold text-foreground tracking-tight">
                QUEUE
              </h2>
              <p className="text-xs font-mono text-foreground/50 mt-1">
                {queue.length} {queue.length === 1 ? "track" : "tracks"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-foreground/5
                         transition-colors duration-150"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="mt-3 px-4 py-1.5 text-xs font-mono tracking-wide
                         bg-foreground text-background hover:opacity-80
                         transition-opacity duration-200"
            >
              CLEAR QUEUE
            </button>
          )}
        </div>

        {/* Queue List */}
        <div className="overflow-y-auto h-[calc(100%-120px)]">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Music className="w-12 h-12 text-foreground/20 mb-3" />
              <p className="text-sm font-mono text-foreground/50">Queue is empty</p>
              <p className="text-xs font-mono text-foreground/40 mt-1">
                Add tracks to start playing
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {queue.map((track, index) => {
                const isCurrentTrack = index === currentQueueIndex;

                return (
                  <div
                    key={`${track.id}-${index}`}
                    className={`group relative p-3 bg-background border transition-all duration-150
                                ${
                                  isCurrentTrack
                                    ? "border-foreground border-2"
                                    : "border-foreground hover:bg-foreground/5"
                                }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Track Number / Playing Indicator */}
                      <div className="flex-shrink-0 w-6 text-xs font-mono text-foreground/40 pt-0.5">
                        {isCurrentTrack ? (
                          <div className="w-3 h-3 bg-foreground animate-pulse" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-mono truncate ${
                            isCurrentTrack
                              ? "text-foreground font-bold"
                              : "text-foreground"
                          }`}
                        >
                          {getTrackTitle(track)}
                        </div>
                        <div className="text-xs text-foreground/60 truncate font-mono mt-0.5">
                          {getTrackArtists(track)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      {!isCurrentTrack && (
                        <button
                          onClick={() => removeFromQueue(index)}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center
                                     opacity-0 group-hover:opacity-100 hover:bg-foreground/10
                                     transition-all duration-150"
                          aria-label="Remove from queue"
                        >
                          <X className="w-4 h-4 text-foreground/50 hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
