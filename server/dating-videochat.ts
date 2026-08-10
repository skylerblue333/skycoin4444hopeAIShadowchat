import crypto from 'crypto';
import { db } from './db';
import { datingMatches } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface VideoCallSession {
  id: string;
  matchId: string;
  initiatorId: string;
  recipientId: string;
  status: 'pending' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  recordingUrl?: string;
}

export interface ICECandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}

export interface SDPOffer {
  type: 'offer' | 'answer';
  sdp: string;
}

const activeSessions = new Map<string, VideoCallSession>();
const pendingOffers = new Map<string, SDPOffer>();
const iceCandidates = new Map<string, ICECandidate[]>();

export function generateCallId(): string {
  return `call_${Date.now()}_${(crypto.getRandomValues(new Uint8Array(1))[0] / 256).toString(36).substr(2, 9)}`;
}

export async function initiateVideoCall(
  matchId: string,
  initiatorId: string,
  recipientId: string
): Promise<VideoCallSession> {
  const callId = generateCallId();

  const session: VideoCallSession = {
    id: callId,
    matchId,
    initiatorId,
    recipientId,
    status: 'pending',
  };

  activeSessions.set(callId, session);
  return session;
}

export function getCallSession(callId: string): VideoCallSession | undefined {
  return activeSessions.get(callId);
}

export function acceptVideoCall(callId: string): VideoCallSession | null {
  const session = activeSessions.get(callId);
  if (!session) return null;

  session.status = 'active';
  session.startedAt = new Date();

  
  return session;
}

export function rejectVideoCall(callId: string): boolean {
  const session = activeSessions.get(callId);
  if (!session) return false;

  activeSessions.delete(callId);
  pendingOffers.delete(callId);
  iceCandidates.delete(callId);

  
  return true;
}

export function endVideoCall(callId: string): VideoCallSession | null {
  const session = activeSessions.get(callId);
  if (!session) return null;

  session.status = 'ended';
  session.endedAt = new Date();

  if (session.startedAt) {
    session.duration = Math.floor(
      (session.endedAt.getTime() - session.startedAt.getTime()) / 1000
    );
  }

  // Cleanup
  setTimeout(() => {
    activeSessions.delete(callId);
    pendingOffers.delete(callId);
    iceCandidates.delete(callId);
  }, 5000);


  return session;
}

export function storeSDPOffer(callId: string, offer: SDPOffer): void {
  pendingOffers.set(callId, offer);
}

export function getSDPOffer(callId: string): SDPOffer | undefined {
  return pendingOffers.get(callId);
}

export function addICECandidate(callId: string, candidate: ICECandidate): void {
  if (!iceCandidates.has(callId)) {
    iceCandidates.set(callId, []);
  }
  iceCandidates.get(callId)!.push(candidate);
}

export function getICECandidates(callId: string): ICECandidate[] {
  return iceCandidates.get(callId) || [];
}

export function clearICECandidates(callId: string): void {
  iceCandidates.delete(callId);
}

export async function recordCallMetrics(
  callId: string,
  metrics: {
    audioQuality: number;
    videoQuality: number;
    latency: number;
    packetLoss: number;
  }): Promise<void> {
  const session = activeSessions.get(callId);
  if (!session) return;
}

export function getActiveCallCount(): number {
  return Array.from(activeSessions.values()).filter(
    (s) => s.status === 'active'
  ).length;
}

export function getCallStats(): {
  totalCalls: number;
  activeCalls: number;
  pendingCalls: number;
  averageDuration: number;
} {
  const sessions = Array.from(activeSessions.values());
  const activeCalls = sessions.filter((s) => s.status === 'active').length;
  const pendingCalls = sessions.filter((s) => s.status === 'pending').length;
  const endedCalls = sessions.filter((s) => s.status === 'ended');

  const averageDuration =
    endedCalls.length > 0
      ? endedCalls.reduce((sum, s) => sum + (s.duration || 0), 0) /
        endedCalls.length
      : 0;

  return {
    totalCalls: sessions.length,
    activeCalls,
    pendingCalls,
    averageDuration: Math.round(averageDuration),
  };
}

export async function saveCallRecording(
  callId: string,
  recordingUrl: string
): Promise<void> {
  const session = activeSessions.get(callId);
  if (session) {
    session.recordingUrl = recordingUrl;
  }
}
