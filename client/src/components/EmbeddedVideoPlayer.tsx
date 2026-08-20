import React, { useState, useMemo } from "react";
import { Play, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type VideoProvider = "youtube" | "facebook" | "vimeo" | "custom";

export interface VideoSource {
  id: string;
  url: string;
  title: string;
  description?: string;
  provider: VideoProvider;
  thumbnailUrl?: string;
  duration?: number;
  uploadedAt?: string;
}

export interface EmbeddedVideoPlayerProps {
  videos: VideoSource[];
  title?: string;
  description?: string;
  columns?: 2 | 3 | 4;
  autoplay?: boolean;
  onVideoClick?: (video: VideoSource) => void;
  loading?: boolean;
  error?: string;
}

interface VideoPlayerState {
  selectedVideo: VideoSource | null;
  isPlaying: boolean;
}

export const EmbeddedVideoPlayer: React.FC<EmbeddedVideoPlayerProps> = ({
  videos,
  title,
  description,
  columns = 3,
  autoplay = false,
  onVideoClick,
  loading = false,
  error,
}) => {
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    selectedVideo: null,
    isPlaying: false,
  });

  const selectVideo = (video: VideoSource) => {
    setPlayerState({ selectedVideo: video, isPlaying: true });
    onVideoClick?.(video);
  };

  const closePlayer = () => {
    setPlayerState({ selectedVideo: null, isPlaying: false });
  };

  const gridColsClass = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns];

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="text-red-700 font-medium">Error loading videos</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-600 mt-2">{description}</p>
            )}
          </div>
        )}

        {loading ? (
          <div className={cn("grid gap-4", gridColsClass)}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-video bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No videos to display</p>
          </div>
        ) : (
          <div className={cn("grid gap-4", gridColsClass)}>
            {videos.map((video) => (
              <VideoThumbnail
                key={video.id}
                video={video}
                onSelect={() => selectVideo(video)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {playerState.selectedVideo && (
        <VideoPlayerModal
          video={playerState.selectedVideo}
          isPlaying={playerState.isPlaying}
          onClose={closePlayer}
          autoplay={autoplay}
        />
      )}
    </>
  );
};

interface VideoThumbnailProps {
  video: VideoSource;
  onSelect: () => void;
}

const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ video, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const thumbnail = video.thumbnailUrl || getVideoThumbnail(video);

  return (
    <div
      className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <img
        src={thumbnail}
        alt={video.title}
        className={cn(
          "w-full h-full object-cover transition-transform duration-300 group-hover:scale-105",
          !thumbnailLoaded && "opacity-0"
        )}
        onLoad={() => setThumbnailLoaded(true)}
      />

      {/* Loading skeleton */}
      {!thumbnailLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-300",
          isHovered ? "bg-opacity-40" : "bg-opacity-20"
        )}
      />

      {/* Play button */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-transform duration-300",
          isHovered ? "scale-100" : "scale-75"
        )}
      >
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Play className="w-8 h-8 text-red-600 ml-1" fill="currentColor" />
        </div>
      </div>

      {/* Provider badge */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-70 rounded text-white text-xs font-medium">
        {video.provider.toUpperCase()}
      </div>

      {/* Duration badge */}
      {video.duration && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-70 rounded text-white text-xs font-medium">
          {formatDuration(video.duration)}
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
        <p className="text-white text-sm font-medium truncate">
          {video.title}
        </p>
      </div>
    </div>
  );
};

interface VideoPlayerModalProps {
  video: VideoSource;
  isPlaying: boolean;
  onClose: () => void;
  autoplay?: boolean;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  isPlaying,
  onClose,
  autoplay = false,
}) => {
  const embedUrl = useMemo(
    () => getEmbedUrl(video),
    [video]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video container */}
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          <div className="aspect-video">
            {embedUrl ? (
              <iframe
                src={`${embedUrl}${autoplay ? "?autoplay=1" : ""}`}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                  <p className="text-white">Unable to load video</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {video.url}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video info */}
        <div className="mt-4 text-white">
          <h3 className="text-xl font-semibold">{video.title}</h3>
          {video.description && (
            <p className="text-gray-300 mt-2">{video.description}</p>
          )}
          <div className="flex gap-4 mt-3 text-sm text-gray-400">
            <span>Provider: {video.provider.toUpperCase()}</span>
            {video.uploadedAt && <span>Date: {video.uploadedAt}</span>}
            {video.duration && <span>Duration: {formatDuration(video.duration)}</span>}
          </div>
          <p className="text-gray-500 text-xs mt-2 break-all">{video.url}</p>
        </div>

        {/* Close button hint */}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Extract video ID from various URL formats
 */
function extractVideoId(url: string, provider: VideoProvider): string | null {
  try {
    if (provider === "youtube") {
      // Handle various YouTube URL formats
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
    } else if (provider === "facebook") {
      // Facebook video URLs typically contain the video ID
      const match = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
      if (match) return match[1];
    } else if (provider === "vimeo") {
      // Handle Vimeo URLs
      const match = url.match(/vimeo\.com\/(\d+)/);
      if (match) return match[1];
    }
  } catch (error) {
    console.error("Error extracting video ID:", error);
  }
  return null;
}

/**
 * Get embed URL for the video provider
 */
function getEmbedUrl(video: VideoSource): string | null {
  const videoId = extractVideoId(video.url, video.provider);

  if (!videoId) {
    // If we can't extract ID, try to use the URL directly if it's already an embed URL
    if (video.url.includes("embed")) {
      return video.url;
    }
    return null;
  }

  switch (video.provider) {
    case "youtube":
      return `https://www.youtube.com/embed/${videoId}`;
    case "facebook":
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(video.url)}&show_text=false`;
    case "vimeo":
      return `https://player.vimeo.com/video/${videoId}`;
    default:
      return null;
  }
}

/**
 * Get thumbnail URL for the video
 */
function getVideoThumbnail(video: VideoSource): string {
  const videoId = extractVideoId(video.url, video.provider);

  switch (video.provider) {
    case "youtube":
      return videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : "https://via.placeholder.com/320x180?text=YouTube+Video";
    case "facebook":
      return "https://via.placeholder.com/320x180?text=Facebook+Video";
    case "vimeo":
      return "https://via.placeholder.com/320x180?text=Vimeo+Video";
    default:
      return "https://via.placeholder.com/320x180?text=Video";
  }
}

/**
 * Format duration in seconds to MM:SS format
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
