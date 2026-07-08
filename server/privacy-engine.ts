/**
 * SHADOWCHAT PRIVACY ENGINE v1.0
 * Digital Sovereignty & Anti-Surveillance Toolkit
 * Legal privacy tools — Tor/I2P awareness, identity masking, relay routing
 * "I'm not a slave to robots — I have robots as slaves." — Skyler Blue Spillers
 */

import crypto from "crypto";

export type PrivacyLevel = "standard" | "enhanced" | "ghost" | "sovereign";
export type RelayProtocol = "tor" | "i2p" | "shadowrelay" | "vpn" | "direct";

export interface GhostIdentity {
  ghostId: string;
  displayName: string;
  avatarSeed: string;
  createdAt: number;
  expiresAt: number | null;
  linkedUserId: string;
  privacyLevel: PrivacyLevel;
  relayProtocol: RelayProtocol;
  fingerprintMask: FingerprintMask;
}

export interface FingerprintMask {
  userAgentOverride: string;
  timezoneSpoof: string;
  languageSpoof: string;
  screenResolutionSpoof: string;
  canvasNoise: boolean;
  webRTCBlocked: boolean;
  fontsLimited: boolean;
  hardwareConcurrencySpoof: number;
  deviceMemorySpoof: number;
}

export interface RelayNode {
  nodeId: string;
  label: string;
  protocol: RelayProtocol;
  region: string;
  latencyMs: number;
  trustScore: number;
  isOnline: boolean;
  entryPoint: string;
  capabilities: string[];
}

export interface PrivacyAudit {
  userId: string;
  timestamp: number;
  ipLeakRisk: "low" | "medium" | "high";
  fingerprintUniqueness: number;
  dataExposurePoints: string[];
  recommendations: string[];
  overallScore: number;
}

export interface SurveillanceVector {
  name: string;
  category: "browser" | "network" | "device" | "behavioral" | "social" | "metadata";
  riskLevel: "low" | "medium" | "high" | "critical";
  description: string;
  mitigation: string;
  toolsToCounter: string[];
}

export interface PrivacyTool {
  id: string;
  name: string;
  category: "browser" | "os" | "network" | "communication" | "storage" | "hardware";
  description: string;
  openSource: boolean;
  freeToUse: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  platforms: string[];
  url: string;
  trustLevel: "community" | "audited" | "gold-standard";
  notes: string;
}

export interface ConnectionGuide {
  protocol: RelayProtocol;
  title: string;
  description: string;
  steps: Array<{ step: number; title: string; detail: string; command?: string }>;
  onionAddress?: string;
  i2pAddress?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  privacyLevel: number;
  speedImpact: string;
  useCases: string[];
}

// Ghost adjectives/nouns for identity generation
const GHOST_ADJ = ["Shadow","Phantom","Silent","Cipher","Ghost","Void","Dark","Stealth","Covert","Hidden","Masked","Veiled","Anon","Null","Zero","Echo","Wraith","Specter","Mirage","Nexus","Flux","Static","Binary","Quantum"];
const GHOST_NOUN = ["Node","Signal","Relay","Pulse","Vector","Byte","Packet","Frame","Layer","Stack","Route","Bridge","Gate","Vault","Key","Hash","Chain","Block","Shard","Mesh","Grid","Core","Root","Seed"];

export function generateGhostIdentity(userId: string, privacyLevel: PrivacyLevel = "ghost", durationHours?: number): GhostIdentity {
  const ghostId = crypto.randomUUID();
  const seed = crypto.createHash("sha256").update(ghostId + Date.now()).digest("hex");
  const adjIdx = parseInt(seed.slice(0, 4), 16) % GHOST_ADJ.length;
  const nounIdx = parseInt(seed.slice(4, 8), 16) % GHOST_NOUN.length;
  const suffix = seed.slice(8, 12).toUpperCase();
  const displayName = `${GHOST_ADJ[adjIdx]}${GHOST_NOUN[nounIdx]}_${suffix}`;
  const now = Date.now();
  return {
    ghostId, displayName, avatarSeed: seed.slice(0, 16), createdAt: now,
    expiresAt: durationHours ? now + durationHours * 3600000 : null,
    linkedUserId: userId, privacyLevel,
    relayProtocol: privacyLevel === "sovereign" ? "shadowrelay" : privacyLevel === "ghost" ? "tor" : "direct",
    fingerprintMask: generateFingerprintMask(privacyLevel),
  };
}

function generateFingerprintMask(level: PrivacyLevel): FingerprintMask {
  if (level === "standard") return { userAgentOverride: "", timezoneSpoof: "", languageSpoof: "", screenResolutionSpoof: "", canvasNoise: false, webRTCBlocked: false, fontsLimited: false, hardwareConcurrencySpoof: 0, deviceMemorySpoof: 0 };
  const isGhost = level === "ghost" || level === "sovereign";
  return {
    userAgentOverride: "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0",
    timezoneSpoof: "UTC", languageSpoof: "en-US", screenResolutionSpoof: "1366x768",
    canvasNoise: true, webRTCBlocked: true, fontsLimited: isGhost,
    hardwareConcurrencySpoof: isGhost ? 2 : 4, deviceMemorySpoof: isGhost ? 4 : 8,
  };
}

export const SHADOW_RELAY_NODES: RelayNode[] = [
  { nodeId: "sr-001", label: "ShadowRelay Alpha", protocol: "shadowrelay", region: "US-East", latencyMs: 45, trustScore: 98, isOnline: true, entryPoint: "shadowrelay://alpha.shadowchat.internal", capabilities: ["onion-routing","message-relay","file-relay","voice-relay"] },
  { nodeId: "sr-002", label: "ShadowRelay Beta", protocol: "shadowrelay", region: "EU-West", latencyMs: 78, trustScore: 95, isOnline: true, entryPoint: "shadowrelay://beta.shadowchat.internal", capabilities: ["onion-routing","message-relay","file-relay"] },
  { nodeId: "sr-003", label: "ShadowRelay Gamma", protocol: "shadowrelay", region: "APAC", latencyMs: 120, trustScore: 92, isOnline: true, entryPoint: "shadowrelay://gamma.shadowchat.internal", capabilities: ["onion-routing","message-relay"] },
  { nodeId: "tor-001", label: "Tor Bridge (Obfs4)", protocol: "tor", region: "Global", latencyMs: 200, trustScore: 90, isOnline: true, entryPoint: "tor://obfs4-bridge", capabilities: ["onion-routing","censorship-bypass","identity-masking"] },
  { nodeId: "i2p-001", label: "I2P Eepsite Node", protocol: "i2p", region: "Global", latencyMs: 350, trustScore: 88, isOnline: true, entryPoint: "i2p://shadowchat.i2p", capabilities: ["garlic-routing","anonymous-torrents","eepsite-hosting"] },
];

export function selectOptimalRelayPath(protocol: RelayProtocol, hops = 3): RelayNode[] {
  const available = SHADOW_RELAY_NODES.filter(n => n.isOnline && n.protocol === protocol);
  return available.sort((a, b) => (b.trustScore / Math.log(b.latencyMs + 1)) - (a.trustScore / Math.log(a.latencyMs + 1))).slice(0, hops);
}

export const SURVEILLANCE_VECTORS: SurveillanceVector[] = [
  { name: "Browser Fingerprinting", category: "browser", riskLevel: "high", description: "Websites collect 50+ browser attributes to create a unique fingerprint that tracks you across sites even without cookies.", mitigation: "Use Firefox with arkenfox user.js or Tor Browser. Enable canvas noise injection.", toolsToCounter: ["Tor Browser","Firefox + arkenfox","LibreWolf","Brave"] },
  { name: "IP Address Exposure", category: "network", riskLevel: "critical", description: "Your IP reveals your approximate location, ISP, and can correlate activity across sessions.", mitigation: "Route through Tor, I2P, or a trusted no-log VPN. Use ShadowRelay for platform comms.", toolsToCounter: ["Tor Browser","Mullvad VPN","ProtonVPN","I2P","ShadowRelay"] },
  { name: "WebRTC IP Leak", category: "browser", riskLevel: "critical", description: "WebRTC exposes your real IP even through a VPN via STUN/TURN servers.", mitigation: "Disable WebRTC or use an extension. ShadowChat blocks WebRTC in Ghost Mode.", toolsToCounter: ["uBlock Origin","WebRTC Leak Prevent","Firefox: media.peerconnection.enabled=false"] },
  { name: "DNS Leaks", category: "network", riskLevel: "high", description: "DNS queries can bypass your VPN, revealing every domain you visit to your ISP.", mitigation: "Use DNS-over-HTTPS or DNS-over-TLS. Configure VPN with DNS leak protection.", toolsToCounter: ["NextDNS","Cloudflare 1.1.1.1 DoH","dnscrypt-proxy","Mullvad DNS"] },
  { name: "Metadata Collection", category: "metadata", riskLevel: "high", description: "Even encrypted messages leak metadata: who, when, how often. Metadata can be more revealing than content.", mitigation: "Use sealed sender protocols. ShadowChat Ghost Mode strips metadata from all messages.", toolsToCounter: ["Signal (sealed sender)","ShadowChat Ghost Mode","Session Messenger"] },
  { name: "Behavioral Profiling", category: "behavioral", riskLevel: "medium", description: "Typing patterns, mouse movements, and scroll behavior create a unique behavioral fingerprint.", mitigation: "Enable behavioral noise injection in Ghost Mode. Randomize interaction timing.", toolsToCounter: ["ShadowChat Ghost Mode","Keyboard timing randomizers"] },
  { name: "Social Graph Analysis", category: "social", riskLevel: "medium", description: "Who you follow and interact with reveals identity even if your name is hidden.", mitigation: "Use separate ghost identities for different social contexts.", toolsToCounter: ["ShadowChat Ghost Identities","Separate accounts per context"] },
  { name: "Device Fingerprinting", category: "device", riskLevel: "high", description: "Hardware identifiers, GPU fingerprints, and sensor data uniquely identify your device.", mitigation: "Spoof hardware concurrency, device memory, GPU renderer. Use a dedicated privacy device.", toolsToCounter: ["Tor Browser","Whonix OS","Tails OS","ShadowChat Ghost Mode"] },
  { name: "Time Correlation Attacks", category: "network", riskLevel: "medium", description: "Timing analysis can de-anonymize you even on Tor by correlating entry/exit traffic.", mitigation: "Add random delays. Use I2P for higher latency but better timing resistance.", toolsToCounter: ["I2P (garlic routing)","Mixnets","ShadowRelay (delay injection)"] },
  { name: "Mobile Advertising ID", category: "device", riskLevel: "high", description: "IDFA (iOS) and GAID (Android) are persistent identifiers shared with every app.", mitigation: "Reset advertising ID regularly. Use GrapheneOS for maximum control.", toolsToCounter: ["GrapheneOS","CalyxOS","Reset IDFA/GAID regularly"] },
];

export const CONNECTION_GUIDES: ConnectionGuide[] = [
  {
    protocol: "tor", title: "Connect via Tor Network",
    description: "Tor routes your traffic through 3 volunteer relays, encrypting each layer. Your IP is hidden from ShadowChat servers.",
    steps: [
      { step: 1, title: "Download Tor Browser", detail: "Get the official Tor Browser from torproject.org.", command: "https://www.torproject.org/download/" },
      { step: 2, title: "Launch and Connect", detail: "Open Tor Browser and click Connect. It establishes a circuit through 3 relays automatically." },
      { step: 3, title: "Navigate to ShadowChat", detail: "Visit ShadowChat through Tor Browser. Your connection is anonymized." },
      { step: 4, title: "Enable Ghost Mode", detail: "Activate Ghost Mode to pair Tor anonymity with platform-level identity masking." },
      { step: 5, title: "Optional: Use Bridges", detail: "If Tor is blocked, configure obfs4 bridges in Tor Browser settings.", command: "bridges.torproject.org" },
    ],
    onionAddress: "shadowchat.onion (coming soon — ShadowRelay v2)",
    difficulty: "beginner", privacyLevel: 9, speedImpact: "Slower (200-500ms added latency)",
    useCases: ["Anonymous posting","Whistleblowing","Censorship bypass","IP masking","Journalist protection"],
  },
  {
    protocol: "i2p", title: "Connect via I2P (Invisible Internet Project)",
    description: "I2P uses garlic routing — bundling multiple encrypted messages — making traffic analysis harder than Tor.",
    steps: [
      { step: 1, title: "Install I2P", detail: "Download from geti2p.net. Java-based or i2pd (C++) for lower resources.", command: "https://geti2p.net/en/download" },
      { step: 2, title: "Start the Router", detail: "Launch I2P and wait 5-10 minutes for it to integrate into the network." },
      { step: 3, title: "Configure Browser Proxy", detail: "Set HTTP proxy to 127.0.0.1:4444 and HTTPS to 127.0.0.1:4445." },
      { step: 4, title: "Access ShadowChat Eepsite", detail: "Navigate to shadowchat.i2p in your I2P-configured browser." },
      { step: 5, title: "Run a Node", detail: "Keep I2P running to contribute bandwidth and strengthen the network." },
    ],
    i2pAddress: "shadowchat.i2p (coming soon — ShadowRelay v2)",
    difficulty: "intermediate", privacyLevel: 10, speedImpact: "Slower (350-800ms) — optimized for anonymity",
    useCases: ["Maximum anonymity","Decentralized hosting","Anonymous file sharing","Anti-censorship"],
  },
  {
    protocol: "shadowrelay", title: "ShadowRelay — Native Onion Network",
    description: "ShadowRelay is ShadowChat's built-in multi-hop relay. Messages are encrypted in layers and routed through volunteer nodes.",
    steps: [
      { step: 1, title: "Activate Ghost Mode", detail: "Enable Ghost Mode in settings. This automatically routes messages through ShadowRelay." },
      { step: 2, title: "Select Relay Path", detail: "Choose: 1-hop (fast), 2-hop (balanced), or 3-hop (maximum privacy)." },
      { step: 3, title: "Choose Entry Node", detail: "Select preferred entry node by region: US-East, EU-West, or APAC." },
      { step: 4, title: "Verify Circuit", detail: "Check the relay status indicator in your Ghost Mode panel." },
      { step: 5, title: "Become a Node", detail: "Run a full ShadowChat node to contribute to the relay network and earn SKY444 relay rewards." },
    ],
    difficulty: "beginner", privacyLevel: 8, speedImpact: "Minimal (45-120ms) — optimized for ShadowChat",
    useCases: ["Private messaging","Anonymous posting","Ghost identity routing"],
  },
  {
    protocol: "vpn", title: "VPN + ShadowChat",
    description: "A VPN hides your IP from ShadowChat servers and your ISP. Faster than Tor. Best combined with Ghost Mode.",
    steps: [
      { step: 1, title: "Choose a No-Log VPN", detail: "Mullvad (accepts cash/crypto, no account) or ProtonVPN (open source, audited).", command: "mullvad.net | protonvpn.com" },
      { step: 2, title: "Enable Kill Switch", detail: "Turn on kill switch to prevent IP leaks if VPN connection drops." },
      { step: 3, title: "Block DNS Leaks", detail: "Enable DNS leak protection. Test at dnsleaktest.com before using ShadowChat." },
      { step: 4, title: "Connect and Verify", detail: "Connect to VPN, verify IP changed at whatismyip.com, then open ShadowChat." },
      { step: 5, title: "Layer with Ghost Mode", detail: "Enable Ghost Mode on top of VPN for identity masking beyond IP hiding." },
    ],
    difficulty: "beginner", privacyLevel: 6, speedImpact: "Minimal (10-50ms) — fastest privacy option",
    useCases: ["IP masking","ISP bypass","Geo-restriction bypass","Basic privacy"],
  },
];

export const PRIVACY_TOOLS: PrivacyTool[] = [
  { id: "tor-browser", name: "Tor Browser", category: "browser", description: "Pre-configured Firefox with Tor routing, canvas blocking, fingerprint normalization.", openSource: true, freeToUse: true, difficulty: "beginner", platforms: ["Windows","macOS","Linux","Android"], url: "https://torproject.org", trustLevel: "gold-standard", notes: "Gold standard for anonymous browsing." },
  { id: "librewolf", name: "LibreWolf", category: "browser", description: "Firefox fork with privacy hardening, no telemetry, uBlock Origin pre-installed.", openSource: true, freeToUse: true, difficulty: "beginner", platforms: ["Windows","macOS","Linux"], url: "https://librewolf.net", trustLevel: "audited", notes: "Best daily driver for privacy without Tor speed penalty." },
  { id: "mullvad-vpn", name: "Mullvad VPN", category: "network", description: "No-account VPN. Pay with cash or crypto. Audited. No logs. Sweden-based.", openSource: true, freeToUse: false, difficulty: "beginner", platforms: ["Windows","macOS","Linux","iOS","Android"], url: "https://mullvad.net", trustLevel: "gold-standard", notes: "Accepts Monero. No email required. Independently audited." },
  { id: "protonvpn", name: "ProtonVPN", category: "network", description: "Swiss-based VPN with free tier. Open source, audited, no logs.", openSource: true, freeToUse: true, difficulty: "beginner", platforms: ["Windows","macOS","Linux","iOS","Android"], url: "https://protonvpn.com", trustLevel: "audited", notes: "Free tier available. Swiss privacy laws." },
  { id: "signal", name: "Signal", category: "communication", description: "E2E encrypted messaging with sealed sender and disappearing messages.", openSource: true, freeToUse: true, difficulty: "beginner", platforms: ["iOS","Android","Windows","macOS","Linux"], url: "https://signal.org", trustLevel: "gold-standard", notes: "Benchmark for secure messaging." },
  { id: "grapheneos", name: "GrapheneOS", category: "os", description: "Privacy-focused Android OS with hardened security, no Google services.", openSource: true, freeToUse: true, difficulty: "advanced", platforms: ["Android (Pixel)"], url: "https://grapheneos.org", trustLevel: "gold-standard", notes: "Maximum mobile privacy. Requires Pixel device." },
  { id: "tails-os", name: "Tails OS", category: "os", description: "Amnesic OS from USB, leaves no trace, routes all traffic through Tor.", openSource: true, freeToUse: true, difficulty: "intermediate", platforms: ["Any computer (USB boot)"], url: "https://tails.boum.org", trustLevel: "gold-standard", notes: "Used by Snowden. Forgets everything on shutdown." },
  { id: "whonix", name: "Whonix", category: "os", description: "VM-based OS routing all traffic through Tor. Workstation + Gateway isolation.", openSource: true, freeToUse: true, difficulty: "advanced", platforms: ["Windows","macOS","Linux (VM)"], url: "https://whonix.org", trustLevel: "audited", notes: "Even malware can't leak your real IP." },
  { id: "protonmail", name: "ProtonMail", category: "communication", description: "E2E encrypted email. Zero-access encryption. Swiss-based.", openSource: true, freeToUse: true, difficulty: "beginner", platforms: ["Web","iOS","Android"], url: "https://proton.me", trustLevel: "audited", notes: "Use via .onion for maximum privacy." },
  { id: "simplelogin", name: "SimpleLogin", category: "communication", description: "Email alias service. Create unlimited aliases to hide your real email.", openSource: true, freeToUse: true, difficulty: "beginner", platforms: ["Web","iOS","Android","Browser Extension"], url: "https://simplelogin.io", trustLevel: "audited", notes: "Acquired by Proton. Essential for email privacy." },
  { id: "nextdns", name: "NextDNS", category: "network", description: "DNS-over-HTTPS with ad/tracker blocking. Configurable privacy settings.", openSource: false, freeToUse: true, difficulty: "beginner", platforms: ["All platforms"], url: "https://nextdns.io", trustLevel: "community", notes: "Free tier: 300k queries/month." },
  { id: "ublock-origin", name: "uBlock Origin", category: "browser", description: "Most effective content blocker. Blocks ads, trackers, malware domains.", openSource: true, freeToUse: true, difficulty: "beginner", platforms: ["Firefox","Chrome","Edge"], url: "https://ublockorigin.com", trustLevel: "gold-standard", notes: "Essential for any privacy setup." },
  { id: "veracrypt", name: "VeraCrypt", category: "storage", description: "Full disk encryption and encrypted containers. Successor to TrueCrypt.", openSource: true, freeToUse: true, difficulty: "intermediate", platforms: ["Windows","macOS","Linux"], url: "https://veracrypt.fr", trustLevel: "audited", notes: "Plausible deniability with hidden volumes." },
  { id: "i2p", name: "I2P", category: "network", description: "Garlic routing network for anonymous communication and hidden services.", openSource: true, freeToUse: true, difficulty: "intermediate", platforms: ["Windows","macOS","Linux","Android"], url: "https://geti2p.net", trustLevel: "community", notes: "Better than Tor for persistent hidden services." },
  { id: "monero", name: "Monero (XMR)", category: "network", description: "Privacy-by-default cryptocurrency. Untraceable transactions by design.", openSource: true, freeToUse: true, difficulty: "intermediate", platforms: ["All platforms"], url: "https://getmonero.org", trustLevel: "gold-standard", notes: "Only major crypto with mandatory privacy." },
];

export function runPrivacyAudit(userId: string, signals: { hasGhostMode?: boolean; usingTor?: boolean; usingVPN?: boolean; webRTCBlocked?: boolean; canvasNoiseEnabled?: boolean; dnsOverHttps?: boolean; fingerprintMaskActive?: boolean; ghostIdentityActive?: boolean; relayProtocol?: RelayProtocol }): PrivacyAudit {
  const exposures: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  if (!signals.usingTor && !signals.usingVPN) { exposures.push("Real IP address exposed"); recommendations.push("Enable Ghost Mode or connect through Tor/VPN"); score -= 25; }
  if (!signals.webRTCBlocked) { exposures.push("WebRTC may leak real IP"); recommendations.push("Block WebRTC in browser settings or enable Ghost Mode"); score -= 15; }
  if (!signals.canvasNoiseEnabled) { exposures.push("Canvas fingerprinting active"); recommendations.push("Enable canvas noise injection in Ghost Mode"); score -= 10; }
  if (!signals.dnsOverHttps) { exposures.push("DNS queries unencrypted"); recommendations.push("Enable DNS-over-HTTPS"); score -= 10; }
  if (!signals.ghostIdentityActive) { exposures.push("Real identity visible to other users"); recommendations.push("Activate a Ghost Identity"); score -= 15; }
  if (!signals.fingerprintMaskActive) { exposures.push("Browser fingerprint trackable"); recommendations.push("Enable fingerprint masking in Ghost Mode"); score -= 10; }
  const ipLeakRisk = (!signals.usingTor && !signals.usingVPN) ? "high" : !signals.webRTCBlocked ? "medium" : "low";
  return { userId, timestamp: Date.now(), ipLeakRisk, fingerprintUniqueness: signals.fingerprintMaskActive ? 15 : 85, dataExposurePoints: exposures, recommendations, overallScore: Math.max(0, score) };
}

const ghostSessions = new Map<string, GhostIdentity>();

export function activateGhostMode(userId: string, level: PrivacyLevel = "ghost", durationHours?: number): GhostIdentity {
  const identity = generateGhostIdentity(userId, level, durationHours);
  ghostSessions.set(userId, identity);
  return identity;
}

export function deactivateGhostMode(userId: string): void { ghostSessions.delete(userId); }

export function getGhostSession(userId: string): GhostIdentity | null {
  const session = ghostSessions.get(userId);
  if (!session) return null;
  if (session.expiresAt && Date.now() > session.expiresAt) { ghostSessions.delete(userId); return null; }
  return session;
}

export function isGhostModeActive(userId: string): boolean { return getGhostSession(userId) !== null; }

export function getBehavioralNoiseConfig(level: PrivacyLevel): Record<string, unknown> {
  if (level === "standard") return { enabled: false };
  const isGhost = level === "ghost" || level === "sovereign";
  return { enabled: true, mouseJitterPx: isGhost ? 5 : 2, keystrokeDelayMs: isGhost ? [10, 80] : [0, 30], scrollNoisePercent: isGhost ? 15 : 5, clickDelayMs: isGhost ? [20, 100] : [0, 50], randomIdleInserts: isGhost, timingQuantization: isGhost ? 100 : 0 };
}

export function buildPrivacyStack(threatLevel: "low" | "medium" | "high" | "extreme"): PrivacyTool[] {
  const stacks: Record<string, string[]> = {
    low: ["ublock-origin","nextdns","protonvpn","signal"],
    medium: ["librewolf","mullvad-vpn","signal","protonmail","simplelogin","ublock-origin","veracrypt"],
    high: ["tor-browser","mullvad-vpn","signal","protonmail","simplelogin","veracrypt","nextdns","monero"],
    extreme: ["tails-os","whonix","tor-browser","signal","protonmail","veracrypt","monero","i2p"],
  };
  return PRIVACY_TOOLS.filter(t => (stacks[threatLevel] || stacks.medium).includes(t.id));
}

export function calculatePrivacyScore(tools: string[]): { score: number; grade: "F"|"D"|"C"|"B"|"A"|"S"; breakdown: Record<string, number> } {
  const weights: Record<string, number> = { browser: 25, network: 30, os: 20, communication: 15, storage: 5, hardware: 5 };
  const breakdown: Record<string, number> = {};
  let total = 0;
  for (const [cat, w] of Object.entries(weights)) {
    const ct = PRIVACY_TOOLS.filter(t => t.category === cat && tools.includes(t.id));
    const cs = Math.min(100, ct.length * 35);
    breakdown[cat] = cs;
    total += (cs * w) / 100;
  }
  const score = Math.round(total);
  const grade = score >= 90 ? "S" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";
  return { score, grade, breakdown };
}

export const PRIVACY_ENGINE_VERSION = "1.0.0";
