"use client";

import {
 useAudioPlayer,
 usePlaybackState,
 useQueue,
} from "@/contexts/AudioPlayerContext";
import { getTrackTitle, getTrackArtists, formatTime } from "@/lib/api/utils";
import {
 ChevronDown,
 ChevronLeft,
 MoreVertical,
 Play,
 Pause,
 SkipBack,
 SkipForward,
 Shuffle,
 Repeat,
 Repeat1,
 Music2,
 GripVertical,
 Volume2,
 VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLyrics } from "@/hooks/useLyrics";
import { LyricsPanel } from "./LyricsPanel";
import type { Track } from "@/lib/api/types";
import {
 DndContext,
 closestCenter,
 PointerSensor,
 KeyboardSensor,
 useSensor,
 useSensors,
 DragEndEvent,
} from "@dnd-kit/core";
import {
 arrayMove,
 SortableContext,
 sortableKeyboardCoordinates,
 useSortable,
 verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FullscreenPlayerProps {
 isOpen: boolean;
 onClose: () => void;
}

type Tab = "queue" | "lyrics" | null;

// Desktop sortable queue item
function DesktopSortableQueueItem({
 id,
 track,
 index,
 isCurrent,
 onPlay,
}: {
 id: string;
 track: Track;
 index: number;
 isCurrent: boolean;
 onPlay: () => void;
}) {
 const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
 } = useSortable({ id });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
 };

 return (
  <div
   ref={setNodeRef}
   style={style}
   className={`group flex items-center gap-3 p-3 border-b border-foreground/10 bg-background ${
    isCurrent
     ? "border-l-2 border-l-foreground pl-[10px] bg-foreground/[0.03]"
     : "hover:bg-foreground/[0.02] border-l-2 border-l-transparent"
   } ${isDragging ? "opacity-50 z-50" : ""}`}
  >
   <button
    {...attributes}
    {...listeners}
    className="touch-none p-1 text-foreground/30 hover:text-foreground/60 cursor-grab active:cursor-grabbing"
   >
    <GripVertical className="w-4 h-4" />
   </button>

   <div
    onClick={onPlay}
    className="relative w-10 h-10 shrink-0 bg-foreground/5 border border-foreground/10 overflow-hidden cursor-pointer"
   >
    {track.album?.cover ? (
     <Image
      src={`https://resources.tidal.com/images/${String(track.album.cover).replace(/-/g, "/")}/320x320.jpg`}
      alt=""
      fill
      sizes="40px"
      quality={75}
      className="object-cover"
      loading="lazy"
     />
    ) : (
     <Music2 className="w-4 h-4 text-foreground/20 m-auto" />
    )}
   </div>

   <div className="flex-1 min-w-0 cursor-pointer" onClick={onPlay}>
    <div
     className={`text-sm font-medium truncate ${
      isCurrent ? "text-foreground" : "text-foreground/90"
     }`}
    >
     {getTrackTitle(track)}
    </div>
    <div className="text-xs text-foreground/50 truncate">
     {getTrackArtists(track)}
    </div>
   </div>

   <div className="text-[11px] font-mono text-foreground/40 tabular-nums">
    {formatTime(track.duration || 0)}
   </div>
  </div>
 );
}

// Mobile sortable queue item
function MobileSortableQueueItem({
 id,
 track,
 index,
 isCurrent,
 onPlay,
}: {
 id: string;
 track: Track;
 index: number;
 isCurrent: boolean;
 onPlay: () => void;
}) {
 const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
 } = useSortable({ id });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
 };

 return (
  <div
   ref={setNodeRef}
   style={style}
   className={`flex items-center gap-3 py-3 px-4 ${
    isCurrent ? "bg-foreground/5" : ""
   } ${isDragging ? "opacity-50 z-50" : ""}`}
  >
   <button
    {...attributes}
    {...listeners}
    className="touch-none p-2 text-foreground/40 active:text-foreground"
   >
    <GripVertical className="w-5 h-5" />
   </button>

   <div
    className="relative w-12 h-12 bg-foreground/5 flex-shrink-0 rounded overflow-hidden cursor-pointer"
    onClick={onPlay}
   >
    {track.album?.cover ? (
     <Image
      src={`https://resources.tidal.com/images/${String(track.album.cover).replace(/-/g, "/")}/160x160.jpg`}
      alt=""
      fill
      sizes="48px"
      className="object-cover"
     />
    ) : (
     <Music2 className="w-6 h-6 text-foreground/20 m-auto" />
    )}
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity">
     <Play className="w-5 h-5 text-white fill-white" />
    </div>
   </div>

   <div className="flex-1 min-w-0" onClick={onPlay}>
    <div className="text-sm text-foreground truncate">
     {getTrackTitle(track)}
    </div>
    <div className="text-xs text-foreground/50 truncate">
     {getTrackArtists(track)}
    </div>
   </div>

   <div className="text-xs text-foreground/50 mr-2">
    {formatTime(track.duration || 0)}
   </div>

   <button className="w-8 h-8 flex items-center justify-center text-foreground/50">
    <MoreVertical className="w-4 h-4" />
   </button>
  </div>
 );
}

export function FullscreenPlayer({ isOpen, onClose }: FullscreenPlayerProps) {
 const { isPlaying, currentTime, duration, volume, isMuted } =
  usePlaybackState();
 const { currentTrack, queue, currentQueueIndex, shuffleActive, repeatMode } =
  useQueue();
 const {
  togglePlayPause,
  playNext,
  playPrev,
  seek,
  setVolume,
  toggleMute,
  setQueue,
  reorderQueue,
  toggleShuffle,
  toggleRepeat,
 } = useAudioPlayer();

 const [activeTab, setActiveTab] = useState<"queue" | "lyrics">("queue");
 const [expandedTab, setExpandedTab] = useState<Tab>(null); // Mobile only
 const [autoPlay, setAutoPlay] = useState(true);
 const seekBarRef = useRef<HTMLDivElement>(null);

 const {
  lyrics,
  currentLineIndex,
  isLoading: lyricsLoading,
  hasLyrics,
 } = useLyrics(currentTrack, currentTime, isPlaying);

 // DnD sensors
 const sensors = useSensors(
  useSensor(PointerSensor, {
   activationConstraint: {
    distance: 8,
   },
  }),
  useSensor(KeyboardSensor, {
   coordinateGetter: sortableKeyboardCoordinates,
  }),
 );

 // Lock body scroll when open
 useEffect(() => {
  if (isOpen) {
   document.body.style.overflow = "hidden";
  } else {
   document.body.style.overflow = "";
  }
  return () => {
   document.body.style.overflow = "";
  };
 }, [isOpen]);

 // Create sortable IDs
 const sortableIds = useMemo(
  () => queue.map((track, index) => `${track.id}-${index}`),
  [queue],
 );

 // Handle drag end
 const handleDragEnd = useCallback(
  (event: DragEndEvent) => {
   const { active, over } = event;

   if (over && active.id !== over.id) {
    const oldIndex = sortableIds.indexOf(active.id as string);
    const newIndex = sortableIds.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
     const newQueue = arrayMove([...queue], oldIndex, newIndex);

     let newCurrentIndex = currentQueueIndex;
     if (oldIndex === currentQueueIndex) {
      newCurrentIndex = newIndex;
     } else if (oldIndex < currentQueueIndex && newIndex >= currentQueueIndex) {
      newCurrentIndex = currentQueueIndex - 1;
     } else if (oldIndex > currentQueueIndex && newIndex <= currentQueueIndex) {
      newCurrentIndex = currentQueueIndex + 1;
     }

     reorderQueue(newQueue, newCurrentIndex);
    }
   }
  },
  [queue, sortableIds, currentQueueIndex, reorderQueue],
 );

 const getCoverUrl = () => {
  const coverId = currentTrack?.album?.cover || currentTrack?.album?.id;
  if (!coverId) return null;
  const formattedId = String(coverId).replace(/-/g, "/");
  return `https://resources.tidal.com/images/${formattedId}/640x640.jpg`;
 };

 const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

 const handleSeek = useCallback(
  (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
   if (!seekBarRef.current || duration === 0) return;
   const rect = seekBarRef.current.getBoundingClientRect();
   const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
   const x = clientX - rect.left;
   const percentage = Math.max(0, Math.min(1, x / rect.width));
   seek(percentage * duration);
  },
  [duration, seek],
 );

 const handleTrackPlay = (track: Track, index: number) => {
  if (index !== currentQueueIndex) {
   setQueue(queue, index);
  }
 };

 const handleTabClick = (tab: "queue" | "lyrics") => {
  setExpandedTab(expandedTab === tab ? null : tab);
 };

 if (!currentTrack) return null;

 const coverUrl = getCoverUrl();

 const content = (
  <AnimatePresence>
   {isOpen && (
    <motion.div
     initial={{ y: "100%" }}
     animate={{ y: 0 }}
     exit={{ y: "100%" }}
     transition={{ type: "spring", damping: 30, stiffness: 300 }}
     className="fixed inset-0 z-[100] bg-background text-foreground overflow-hidden flex flex-col"
     style={{ height: "100dvh" }}
    >
     {/* Header - Desktop */}
     <div className="hidden lg:block relative z-10 border-b border-foreground/10 px-6 py-4 md:px-8">
      <div className="flex items-center justify-between">
       <button
        onClick={onClose}
        className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors duration-200"
       >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-xs font-mono uppercase tracking-widest">
         Back
        </span>
       </button>

       {/* Desktop Tab Navigation */}
       <div className="flex gap-8">
        <button
         onClick={() => setActiveTab("queue")}
         className={`relative pb-2 text-xs font-mono uppercase tracking-widest transition-all ${
          activeTab === "queue"
           ? "text-foreground"
           : "text-foreground/40 hover:text-foreground/70"
         }`}
        >
         Queue
         {activeTab === "queue" && (
          <motion.div
           layoutId="desktopTabUnderline"
           className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
           transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
         )}
        </button>
        {hasLyrics && (
         <button
          onClick={() => setActiveTab("lyrics")}
          className={`relative pb-2 text-xs font-mono uppercase tracking-widest transition-all ${
           activeTab === "lyrics"
            ? "text-foreground"
            : "text-foreground/40 hover:text-foreground/70"
          }`}
         >
          Lyrics
          {activeTab === "lyrics" && (
           <motion.div
            layoutId="desktopTabUnderline"
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
           />
          )}
         </button>
        )}
       </div>
      </div>
     </div>

     {/* Header - Mobile */}
     <div className="lg:hidden flex items-center justify-between px-4 py-2 flex-shrink-0">
      <button
       onClick={() => {
        if (expandedTab) {
         setExpandedTab(null);
        } else {
         onClose();
        }
       }}
       className="w-10 h-10 flex items-center justify-center text-foreground"
       aria-label={expandedTab ? "Back" : "Close"}
      >
       <ChevronDown className="w-6 h-6" />
      </button>
      <button
       className="w-10 h-10 flex items-center justify-center text-foreground"
       aria-label="More options"
      >
       <MoreVertical className="w-5 h-5" />
      </button>
     </div>

     {/* Main Content - Desktop Two Column */}
     <div className="hidden lg:flex relative z-10 flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 lg:px-12 gap-8 lg:gap-16 overflow-y-auto">
      {/* Left: Player */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-[calc(100vh-12rem)]">
       <div className="flex flex-col items-center space-y-6 lg:space-y-8 w-full max-w-[400px]">
        {/* Album Art */}
        <div className="relative aspect-square w-full max-w-[280px] md:max-w-[360px] border border-foreground/10 overflow-hidden bg-foreground/5">
         {coverUrl ? (
          <Image
           src={coverUrl}
           alt={getTrackTitle(currentTrack)}
           fill
           sizes="(max-width: 768px) 80vw, 420px"
           quality={90}
           className="object-cover"
           priority
          />
         ) : (
          <div className="w-full h-full flex items-center justify-center">
           <Music2 className="w-24 h-24 text-foreground/20" />
          </div>
         )}
        </div>

        {/* Track Info & Progress */}
        <div className="space-y-4 lg:space-y-6 w-full">
         <div className="space-y-2">
          <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono">
           Now Playing
          </div>
          <h1 className="text-xl md:text-2xl font-medium text-foreground/90 leading-tight line-clamp-2">
           {getTrackTitle(currentTrack)}
          </h1>
          <p className="text-sm md:text-base text-foreground/50 line-clamp-1">
           {getTrackArtists(currentTrack)}
          </p>
         </div>

         {/* Progress Bar */}
         <div className="space-y-2">
          <div
           ref={seekBarRef}
           className="relative py-5 -my-4 cursor-pointer group"
           onClick={handleSeek}
          >
           <div className="h-2 bg-foreground/20 relative overflow-hidden">
            <div
             className="h-full bg-foreground"
             style={{ width: `${progressPercentage}%` }}
            />
           </div>
           <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercentage}% - 8px)` }}
           />
          </div>
          <div className="flex justify-between text-[11px] text-foreground/40 font-mono tabular-nums">
           <span>{formatTime(currentTime)}</span>
           <span>{formatTime(duration)}</span>
          </div>
         </div>

         {/* Controls */}
         <div className="flex items-center justify-center gap-3 md:gap-8 pt-4">
          <button
           onClick={toggleShuffle}
           className={`w-12 h-12 flex items-center justify-center transition-colors ${
            shuffleActive
             ? "text-foreground"
             : "text-foreground/40 hover:text-foreground/70"
           }`}
          >
           <Shuffle className="w-5 h-5" />
          </button>

          <button
           onClick={playPrev}
           className="w-12 h-12 flex items-center justify-center text-foreground/70 hover:text-foreground transition-all"
          >
           <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
           onClick={togglePlayPause}
           className="w-16 h-16 flex items-center justify-center border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all"
          >
           {isPlaying ? (
            <Pause className="w-7 h-7 fill-current" />
           ) : (
            <Play className="w-7 h-7 ml-0.5 fill-current" />
           )}
          </button>

          <button
           onClick={playNext}
           className="w-12 h-12 flex items-center justify-center text-foreground/70 hover:text-foreground transition-all"
          >
           <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
           onClick={toggleRepeat}
           className={`w-12 h-12 flex items-center justify-center transition-colors ${
            repeatMode !== "off"
             ? "text-foreground"
             : "text-foreground/40 hover:text-foreground/70"
           }`}
          >
           {repeatMode === "one" ? (
            <Repeat1 className="w-5 h-5" />
           ) : (
            <Repeat className="w-5 h-5" />
           )}
          </button>
         </div>

         {/* Volume */}
         <div className="flex items-center gap-3 pt-2 border-t border-foreground/10">
          <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono pt-3">
           Volume
          </div>
          <div className="flex-1 flex items-center gap-3 pt-3">
           <button
            onClick={toggleMute}
            className="text-foreground/40 hover:text-foreground/70 transition-colors"
           >
            {isMuted ? (
             <VolumeX className="w-4 h-4" />
            ) : (
             <Volume2 className="w-4 h-4" />
            )}
           </button>
           <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume * 100}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="flex-1 h-1 bg-foreground/20 appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none
                                 [&::-webkit-slider-thumb]:w-3
                                 [&::-webkit-slider-thumb]:h-3
                                 [&::-webkit-slider-thumb]:bg-foreground
                                 [&::-webkit-slider-thumb]:opacity-0
                                 [&::-webkit-slider-thumb]:hover:opacity-100"
           />
           <span className="text-xs font-mono tabular-nums text-foreground/40 w-8 text-right">
            {Math.round(isMuted ? 0 : volume * 100)}
           </span>
          </div>
         </div>
        </div>
       </div>
      </div>

      {/* Right: Queue or Lyrics */}
      <div className="flex flex-col w-full lg:w-1/2 max-h-[calc(100vh-12rem)] overflow-hidden border-l border-foreground/10 pl-8">
       {activeTab === "queue" && (
        <DndContext
         sensors={sensors}
         collisionDetection={closestCenter}
         onDragEnd={handleDragEnd}
        >
         <div className="h-full overflow-y-auto pr-4">
          <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono mb-4 sticky top-0 bg-background pt-2 pb-2 z-10 flex items-center justify-between">
           <span>Up Next ({queue.length - currentQueueIndex - 1})</span>
           <span className="text-foreground/30">Drag to reorder</span>
          </div>
          <SortableContext
           items={sortableIds}
           strategy={verticalListSortingStrategy}
          >
           {queue.map((track, index) => (
            <DesktopSortableQueueItem
             key={sortableIds[index]}
             id={sortableIds[index]}
             track={track}
             index={index}
             isCurrent={index === currentQueueIndex}
             onPlay={() => handleTrackPlay(track, index)}
            />
           ))}
          </SortableContext>
         </div>
        </DndContext>
       )}

       {activeTab === "lyrics" && (
        <LyricsPanel
         track={currentTrack}
         lyrics={lyrics}
         currentLineIndex={currentLineIndex}
         isLoading={lyricsLoading}
         onSeek={seek}
         className="h-full"
        />
       )}
      </div>
     </div>

     {/* Main Content - Mobile */}
     <div className="lg:hidden flex-1 overflow-hidden relative">
      <AnimatePresence mode="wait">
       {!expandedTab ? (
        /* Main Player View */
        <motion.div
         key="player"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -20 }}
         transition={{ duration: 0.2 }}
         className="h-full overflow-hidden flex flex-col"
        >
         {/* Album Art */}
         <div className="flex-1 flex items-center justify-center px-6 pt-4 pb-2 min-h-0">
          <div className="relative aspect-square w-full max-w-[85vw] max-h-full bg-foreground/5 overflow-hidden rounded-lg">
           {coverUrl ? (
            <Image
             src={coverUrl}
             alt={getTrackTitle(currentTrack)}
             fill
             sizes="(max-width: 768px) 90vw, 500px"
             className="object-cover"
             priority
            />
           ) : (
            <div className="w-full h-full flex items-center justify-center">
             <Music2 className="w-24 h-24 text-foreground/20" />
            </div>
           )}
          </div>
         </div>

         {/* Track Info */}
         <div className="px-6 py-3 flex-shrink-0">
          <h1 className="text-lg font-medium text-foreground truncate">
           {getTrackTitle(currentTrack)}
          </h1>
          <p className="text-sm text-foreground/60 truncate mt-0.5">
           {getTrackArtists(currentTrack)}
          </p>
         </div>

         {/* Progress Bar */}
         <div className="px-6 pb-2 flex-shrink-0">
          <div
           ref={seekBarRef}
           className="relative h-1 bg-foreground/20 rounded-full cursor-pointer"
           onTouchStart={handleSeek}
           onTouchMove={handleSeek}
          >
           <div
            className="absolute h-full bg-foreground rounded-full"
            style={{ width: `${progressPercentage}%` }}
           />
          </div>
          <div className="flex justify-between text-xs text-foreground/50 mt-2">
           <span>{formatTime(currentTime)}</span>
           <span>{formatTime(duration)}</span>
          </div>
         </div>

         {/* Controls */}
         <div className="flex items-center justify-center gap-4 px-6 py-4 flex-shrink-0">
          <button
           onClick={toggleShuffle}
           className={`w-10 h-10 flex items-center justify-center ${
            shuffleActive ? "text-foreground" : "text-foreground/40"
           }`}
          >
           <Shuffle className="w-5 h-5" />
          </button>

          <button
           onClick={playPrev}
           className="w-12 h-12 flex items-center justify-center text-foreground"
          >
           <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
           onClick={togglePlayPause}
           className="w-20 h-20 rounded-full bg-foreground text-background flex items-center justify-center"
          >
           {isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
           ) : (
            <Play className="w-8 h-8 ml-1 fill-current" />
           )}
          </button>

          <button
           onClick={playNext}
           className="w-12 h-12 flex items-center justify-center text-foreground"
          >
           <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
           onClick={toggleRepeat}
           className={`w-10 h-10 flex items-center justify-center ${
            repeatMode !== "off" ? "text-foreground" : "text-foreground/40"
           }`}
          >
           {repeatMode === "one" ? (
            <Repeat1 className="w-5 h-5" />
           ) : (
            <Repeat className="w-5 h-5" />
           )}
          </button>
         </div>

         {/* Tabs */}
         <div className="border-t border-foreground/10 flex-shrink-0">
          <div className="flex">
           <button
            onClick={() => handleTabClick("queue")}
            className="flex-1 px-4 py-3 text-sm font-medium text-foreground/80 active:bg-foreground/5"
           >
            Up next
           </button>
           <button
            onClick={() => handleTabClick("lyrics")}
            className="flex-1 px-4 py-3 text-sm font-medium text-foreground/80 active:bg-foreground/5"
           >
            Lyrics
           </button>
          </div>
         </div>
        </motion.div>
       ) : expandedTab === "queue" ? (
        /* Fullscreen Queue */
        <motion.div
         key="queue"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.2 }}
         className="h-full flex flex-col bg-background"
        >
         <div className="px-4 py-4 border-b border-foreground/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
           <h2 className="text-lg font-medium text-foreground">Up next</h2>
           <button
            onClick={playNext}
            className="w-10 h-10 flex items-center justify-center text-foreground"
           >
            <SkipForward className="w-5 h-5" />
           </button>
          </div>
          <div className="text-xs text-foreground/50 mb-2">Playing from</div>
          <div className="text-sm font-medium text-foreground">
           {currentTrack.album?.title || "Unknown Album"}
          </div>
         </div>

         <div className="px-4 py-3 border-b border-foreground/10 flex-shrink-0">
          <div className="flex items-center justify-between">
           <div>
            <div className="text-sm font-medium text-foreground">Auto-play</div>
            <div className="text-xs text-foreground/50">
             Add similar content to queue
            </div>
           </div>
           <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
             autoPlay ? "bg-blue-500" : "bg-foreground/30"
            }`}
           >
            <motion.div
             animate={{ x: autoPlay ? 24 : 2 }}
             transition={{ type: "spring", stiffness: 500, damping: 30 }}
             className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
            />
           </button>
          </div>
         </div>

         <div className="flex-1 overflow-y-auto">
          <DndContext
           sensors={sensors}
           collisionDetection={closestCenter}
           onDragEnd={handleDragEnd}
          >
           <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
           >
            {queue.map((track, index) => (
             <MobileSortableQueueItem
              key={sortableIds[index]}
              id={sortableIds[index]}
              track={track}
              index={index}
              isCurrent={index === currentQueueIndex}
              onPlay={() => handleTrackPlay(track, index)}
             />
            ))}
           </SortableContext>
          </DndContext>
         </div>
        </motion.div>
       ) : (
        /* Fullscreen Lyrics */
        <motion.div
         key="lyrics"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: 20 }}
         transition={{ duration: 0.2 }}
         className="h-full flex flex-col bg-background"
        >
         <div className="px-6 py-4 border-b border-foreground/10 flex-shrink-0">
          <h2 className="text-lg font-medium text-foreground">Lyrics</h2>
          <p className="text-sm text-foreground/50 mt-1">
           {getTrackTitle(currentTrack)}
          </p>
         </div>

         <div className="flex-1 overflow-y-auto px-6 py-8">
          {hasLyrics && lyrics?.parsed ? (
           <div className="space-y-6 max-w-2xl mx-auto">
            {lyrics.parsed.map((line, idx) => (
             <motion.p
              key={idx}
              animate={{
               opacity: idx === currentLineIndex ? 1 : 0.4,
               scale: idx === currentLineIndex ? 1.05 : 1,
              }}
              transition={{ duration: 0.3 }}
              className={`text-base leading-relaxed ${
               idx === currentLineIndex
                ? "text-foreground font-medium"
                : "text-foreground/60"
              }`}
             >
              {line.text}
             </motion.p>
            ))}
           </div>
          ) : (
           <div className="flex items-center justify-center h-full">
            <div className="text-center">
             <Music2 className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
             <div className="text-foreground/40">No lyrics available</div>
            </div>
           </div>
          )}
         </div>
        </motion.div>
       )}
      </AnimatePresence>
     </div>
    </motion.div>
   )}
  </AnimatePresence>
 );

 return typeof window !== "undefined"
  ? createPortal(content, document.body)
  : null;
}
