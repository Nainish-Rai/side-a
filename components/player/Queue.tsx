"use client";

import { useQueue } from "@/contexts/QueueContext";
import { getTrackTitle, getTrackArtists } from "@/lib/api/utils";
import { X, Music } from "lucide-react";

interface QueueProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Queue({ isOpen, onClose }: QueueProps) {
  const { queue, currentQueueIndex, removeFromQueue, clearQueue } =
    useQueue();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-end">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close queue"
      />

      <div className="relative bg-bone border-l border-carbon w-full max-w-md h-full md:h-[600px] shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="border-b border-carbon p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-mono font-bold text-carbon tracking-tight">
                QUEUE
              </h2>
              <p className="text-xs font-mono text-gray-500 mt-1">
                {queue.length} {queue.length === 1 ? "track" : "tracks"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-bone
                         rounded transition-colors duration-150"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-carbon" />
            </button>
          </div>

          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="mt-3 px-4 py-1.5 text-xs font-mono tracking-wide
                         bg-carbon text-white hover:bg-walkman-orange
                         transition-colors duration-200"
            >
              CLEAR QUEUE
            </button>
          )}
        </div>

        {/* Queue List */}
        <div className="overflow-y-auto h-[calc(100%-120px)]">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Music className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm font-mono text-gray-500">Queue is empty</p>
              <p className="text-xs font-mono text-gray-400 mt-1">
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
                    className={`group relative p-3 bg-white border transition-all duration-150
                                ${
                                  isCurrentTrack
                                    ? "border-walkman-orange border-2"
                                    : "border-carbon hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Track Number / Playing Indicator */}
                      <div className="flex-shrink-0 w-6 text-xs font-mono text-gray-400 pt-0.5">
                        {isCurrentTrack ? (
                          <div className="w-3 h-3 bg-walkman-orange rounded-full animate-pulse" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-mono truncate ${
                            isCurrentTrack
                              ? "text-walkman-orange font-bold"
                              : "text-carbon"
                          }`}
                        >
                          {getTrackTitle(track)}
                        </div>
                        <div className="text-xs text-gray-600 truncate font-mono mt-0.5">
                          {getTrackArtists(track)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      {!isCurrentTrack && (
                        <button
                          onClick={() => removeFromQueue(index)}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center
                                     opacity-0 group-hover:opacity-100 hover:bg-bone
                                     rounded transition-all duration-150"
                          aria-label="Remove from queue"
                        >
                          <X className="w-4 h-4 text-gray-500 hover:text-carbon" />
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
