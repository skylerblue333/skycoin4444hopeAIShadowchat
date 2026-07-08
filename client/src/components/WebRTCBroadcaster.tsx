/**
 * WebRTCBroadcaster — Real camera/mic access via getUserMedia
 * Shows live preview, mic/cam toggles, and stream key for OBS/external tools.
 * In a production deployment with a media server (e.g. mediasoup, LiveKit),
 * this component would push the WebRTC track to the server. Here it provides
 * the full UI + real local preview, ready to wire to any signaling layer.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mic, MicOff, Video, VideoOff, Radio, Eye, Copy, Settings,
  AlertCircle, CheckCircle2, Loader2, Monitor, Camera, RefreshCw
} from "lucide-react";

interface WebRTCBroadcasterProps {
  streamKey?: string;
  rtmpUrl?: string;
  isLive?: boolean;
  viewerCount?: number;
  onGoLive?: () => void;
  onEndStream?: () => void;
  title?: string;
}

type MediaState = "idle" | "requesting" | "active" | "error";

export default function WebRTCBroadcaster({
  streamKey,
  rtmpUrl,
  isLive = false,
  viewerCount = 0,
  onGoLive,
  onEndStream,
  title,
}: WebRTCBroadcasterProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mediaState, setMediaState] = useState<MediaState>("idle");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [keyVisible, setKeyVisible] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [streamStats, setStreamStats] = useState({ fps: 0, bitrate: 0, resolution: "" });

  // Enumerate devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vids = devices.filter(d => d.kind === "videoinput");
      const auds = devices.filter(d => d.kind === "audioinput");
      setVideoDevices(vids);
      setAudioDevices(auds);
      if (vids.length > 0 && !selectedVideo) setSelectedVideo(vids[0].deviceId);
      if (auds.length > 0 && !selectedAudio) setSelectedAudio(auds[0].deviceId);
    } catch {
      // Devices not accessible until permission granted
    }
  }, [selectedVideo, selectedAudio]);

  // Request camera + mic
  const startPreview = useCallback(async () => {
    setMediaState("requesting");
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: selectedVideo ? { deviceId: { exact: selectedVideo }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: selectedAudio ? { deviceId: { exact: selectedAudio }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // prevent echo
        await videoRef.current.play();
      }
      setMediaState("active");
      // Get resolution
      const vTrack = stream.getVideoTracks()[0];
      if (vTrack) {
        const settings = vTrack.getSettings();
        setStreamStats(s => ({ ...s, resolution: `${settings.width}×${settings.height}`, fps: settings.frameRate || 30 }));
      }
      await enumerateDevices();
    } catch (err: any) {
      setMediaState("error");
      if (err.name === "NotAllowedError") {
        toast.error("Camera/mic permission denied. Please allow access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        toast.error("No camera or microphone found.");
      } else {
        toast.error(`Could not start preview: ${err.message}`);
      }
    }
  }, [selectedVideo, selectedAudio, enumerateDevices]);

  // Toggle mic
  const toggleMic = () => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach(t => { t.enabled = !t.enabled; });
    setMicOn(prev => !prev);
  };

  // Toggle camera
  const toggleCam = () => {
    if (!streamRef.current) return;
    const videoTracks = streamRef.current.getVideoTracks();
    videoTracks.forEach(t => { t.enabled = !t.enabled; });
    setCamOn(prev => !prev);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied!`))
      .catch(() => toast.error("Copy failed"));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Video Preview */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-white/10">
        {/* Real video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${mediaState === "active" && camOn ? "opacity-100" : "opacity-0"}`}
        />

        {/* Overlay states */}
        {mediaState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0614]">
            <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-slate-400 text-sm">Camera preview not started</p>
            <Button onClick={startPreview} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              <Camera className="w-4 h-4" /> Start Preview
            </Button>
          </div>
        )}

        {mediaState === "requesting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0614]">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-slate-400 text-sm">Requesting camera access...</p>
          </div>
        )}

        {mediaState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0614]">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-400 text-sm font-medium">Camera access denied</p>
            <Button onClick={startPreview} variant="outline" size="sm" className="border-white/20 text-white gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </Button>
          </div>
        )}

        {mediaState === "active" && !camOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0614]">
            <VideoOff className="w-10 h-10 text-slate-500" />
            <p className="text-slate-500 text-sm">Camera is off</p>
          </div>
        )}

        {/* Live badge + stats */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
            </span>
            <span className="flex items-center gap-1.5 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
              <Eye className="w-3 h-3" /> {viewerCount}
            </span>
          </div>
        )}

        {mediaState === "active" && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <Badge className="bg-black/60 text-green-400 border-green-500/30 text-xs font-mono">
              {streamStats.resolution}
            </Badge>
            <Badge className="bg-black/60 text-blue-400 border-blue-500/30 text-xs font-mono">
              {streamStats.fps}fps
            </Badge>
          </div>
        )}

        {/* Controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-center gap-3">
            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              disabled={mediaState !== "active"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                micOn ? "bg-white/20 hover:bg-white/30" : "bg-red-500/80 hover:bg-red-500"
              } disabled:opacity-40`}
            >
              {micOn ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
            </button>

            {/* Cam toggle */}
            <button
              onClick={toggleCam}
              disabled={mediaState !== "active"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                camOn ? "bg-white/20 hover:bg-white/30" : "bg-red-500/80 hover:bg-red-500"
              } disabled:opacity-40`}
            >
              {camOn ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-white" />}
            </button>

            {/* Device switcher */}
            <button
              onClick={() => { setShowDeviceMenu(s => !s); if (!showDeviceMenu) enumerateDevices(); }}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>

            {/* Go live / end */}
            {!isLive ? (
              <Button
                onClick={onGoLive}
                className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 h-10 rounded-full gap-2"
              >
                <Radio className="w-4 h-4" /> Go Live
              </Button>
            ) : (
              <Button
                onClick={onEndStream}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold px-5 h-10 rounded-full"
              >
                End Stream
              </Button>
            )}
          </div>
        </div>

        {/* Device menu */}
        {showDeviceMenu && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#0e0a1a]/95 border border-white/10 rounded-xl p-3 w-72 shadow-2xl">
            <p className="text-xs font-semibold text-slate-400 mb-2">Camera</p>
            {videoDevices.map(d => (
              <button
                key={d.deviceId}
                onClick={() => { setSelectedVideo(d.deviceId); setShowDeviceMenu(false); if (mediaState === "active") setTimeout(startPreview, 100); }}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg mb-1 transition-colors ${selectedVideo === d.deviceId ? "bg-purple-500/20 text-purple-300" : "text-slate-400 hover:bg-white/5"}`}
              >
                <Monitor className="w-3 h-3 inline mr-2" />{d.label || `Camera ${d.deviceId.slice(0, 8)}`}
              </button>
            ))}
            <p className="text-xs font-semibold text-slate-400 mb-2 mt-3">Microphone</p>
            {audioDevices.map(d => (
              <button
                key={d.deviceId}
                onClick={() => { setSelectedAudio(d.deviceId); setShowDeviceMenu(false); if (mediaState === "active") setTimeout(startPreview, 100); }}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg mb-1 transition-colors ${selectedAudio === d.deviceId ? "bg-purple-500/20 text-purple-300" : "text-slate-400 hover:bg-white/5"}`}
              >
                <Mic className="w-3 h-3 inline mr-2" />{d.label || `Mic ${d.deviceId.slice(0, 8)}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stream Key Panel */}
      {streamKey && (
        <div className="bg-[#0e0a1a]/80 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-white">Stream Key Generated</span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">RTMP URL</p>
              <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2">
                <code className="text-xs text-cyan-400 font-mono flex-1 truncate">{rtmpUrl}</code>
                <button onClick={() => copyToClipboard(rtmpUrl || "", "RTMP URL")} className="text-slate-500 hover:text-white transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Stream Key</p>
              <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2">
                <code className="text-xs text-purple-400 font-mono flex-1 truncate">
                  {keyVisible ? streamKey : "•".repeat(Math.min(streamKey.length, 32))}
                </code>
                <button onClick={() => setKeyVisible(v => !v)} className="text-slate-500 hover:text-white transition-colors text-xs">
                  {keyVisible ? "Hide" : "Show"}
                </button>
                <button onClick={() => copyToClipboard(streamKey, "Stream Key")} className="text-slate-500 hover:text-white transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-600">Use these in OBS Studio: Settings → Stream → Custom RTMP</p>
        </div>
      )}
    </div>
  );
}
