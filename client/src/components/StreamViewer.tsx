/**
 * StreamViewer — Real <video> element with HLS.js support
 * Falls back gracefully when no HLS URL is available (shows stream info).
 * Supports: native HLS (Safari), HLS.js (Chrome/Firefox), direct video URLs.
 */
import { useEffect, useRef, useState } from "react";
import { Radio, Eye, Volume2, VolumeX, Maximize2, Loader2, AlertCircle } from "lucide-react";

interface StreamViewerProps {
  hlsUrl?: string | null;
  videoUrl?: string | null;
  title: string;
  streamerName: string;
  viewerCount?: number;
  isLive?: boolean;
  thumbnailUrl?: string | null;
  onFullscreen?: () => void;
}

type PlayerState = "loading" | "playing" | "error" | "no-source";

export default function StreamViewer({
  hlsUrl,
  videoUrl,
  title,
  streamerName,
  viewerCount = 0,
  isLive = true,
  thumbnailUrl,
  onFullscreen,
}: StreamViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [playerState, setPlayerState] = useState<PlayerState>("loading");
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const sourceUrl = hlsUrl || videoUrl;

  useEffect(() => {
    if (!sourceUrl) {
      setPlayerState("no-source");
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setPlayerState("loading");

    // Check if native HLS is supported (Safari)
    if (hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.addEventListener("canplay", () => setPlayerState("playing"), { once: true });
      video.addEventListener("error", () => setPlayerState("error"), { once: true });
      video.play().catch(() => setPlayerState("error"));
      return;
    }

    // Try HLS.js for Chrome/Firefox
    if (hlsUrl) {
      import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          // Fallback to direct video URL if available
          if (videoUrl) {
            video.src = videoUrl;
            video.play().catch(() => setPlayerState("error"));
            setPlayerState("playing");
          } else {
            setPlayerState("error");
          }
          return;
        }
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setPlayerState("playing");
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) setPlayerState("error");
        });
      }).catch(() => {
        // HLS.js not available, try direct
        if (videoUrl) {
          video.src = videoUrl;
          video.play().catch(() => setPlayerState("error"));
          setPlayerState("playing");
        } else {
          setPlayerState("no-source");
        }
      });
      return;
    }

    // Direct video URL
    if (videoUrl) {
      video.src = videoUrl;
      video.addEventListener("canplay", () => setPlayerState("playing"), { once: true });
      video.addEventListener("error", () => setPlayerState("error"), { once: true });
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [hlsUrl, videoUrl, sourceUrl]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const requestFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    } else if (onFullscreen) {
      onFullscreen();
    }
  };

  return (
    <div className="relative w-full bg-black rounded-2xl overflow-hidden aspect-video">
      {/* Real video element — always rendered so ref is available */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-500 ${playerState === "playing" ? "opacity-100" : "opacity-0"}`}
        playsInline
        autoPlay
      />

      {/* Thumbnail background */}
      {thumbnailUrl && playerState !== "playing" && (
        <img
          src={thumbnailUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}

      {/* Loading state */}
      {playerState === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-slate-400 text-sm">Connecting to stream...</p>
        </div>
      )}

      {/* No source — stream not yet broadcasting */}
      {playerState === "no-source" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0614]/90">
          <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Radio className="w-10 h-10 text-purple-400 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{title}</p>
            <p className="text-slate-400 text-sm mt-1">
              {isLive ? "Stream is live — waiting for video feed" : "Stream has not started yet"}
            </p>
            <p className="text-slate-600 text-xs mt-2">{streamerName} · {viewerCount} watching</p>
          </div>
          {isLive && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
              </span>
              <span className="text-slate-500 text-xs">Broadcaster connecting via OBS/RTMP...</span>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {playerState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-red-400 text-sm font-medium">Stream unavailable</p>
          <p className="text-slate-600 text-xs">The stream may have ended or the connection was lost.</p>
        </div>
      )}

      {/* Top HUD */}
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
          </span>
          <span className="flex items-center gap-1.5 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
            <Eye className="w-3 h-3" /> {viewerCount.toLocaleString()}
          </span>
        </div>
      )}

      {/* Bottom controls — only when playing */}
      {playerState === "playing" && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 opacity-0 hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="text-white hover:text-purple-300 transition-colors">
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 accent-purple-500 cursor-pointer"
            />
            <div className="flex-1" />
            <button onClick={requestFullscreen} className="text-white hover:text-purple-300 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
