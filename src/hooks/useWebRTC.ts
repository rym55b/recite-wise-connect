import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface UseWebRTCOptions {
  sessionId: string;
  localUserId: string;
  remoteUserId: string;
  enabled: boolean;
}

export function useWebRTC({ sessionId, localUserId, remoteUserId, enabled }: UseWebRTCOptions) {
  const [connected, setConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [remoteIsSpeaking, setRemoteIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const isInitiator = localUserId < remoteUserId;

  const cleanup = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setConnected(false);
  }, []);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId || !localUserId || !remoteUserId) return;

    let cancelled = false;

    const start = async () => {
      // Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      localStreamRef.current = stream;

      // Audio analysis for speaking indicator
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Remote track handling
      pc.ontrack = (e) => {
        const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
        if (remoteAudio && e.streams[0]) {
          remoteAudio.srcObject = e.streams[0];
          // Remote speaking analysis
          const remoteCtx = new AudioContext();
          const remoteSrc = remoteCtx.createMediaStreamSource(e.streams[0]);
          const remoteAn = remoteCtx.createAnalyser();
          remoteAn.fftSize = 256;
          remoteSrc.connect(remoteAn);
          remoteAnalyserRef.current = remoteAn;
        }
        setConnected(true);
      };

      // Signaling channel via Supabase Realtime broadcast
      const channel = supabase.channel(`webrtc-${sessionId}`, {
        config: { broadcast: { self: false } },
      });
      channelRef.current = channel;

      // Listen for signaling messages
      channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (!pcRef.current || payload.from === localUserId) return;

        if (payload.type === 'offer') {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { from: localUserId, type: 'answer', sdp: answer },
          });
        } else if (payload.type === 'answer') {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } else if (payload.type === 'ice-candidate') {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.warn('ICE candidate error:', e);
          }
        }
      });

      // ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: { from: localUserId, type: 'ice-candidate', candidate: e.candidate },
          });
        }
      };

      pc.onconnectionstatechange = () => {
        setConnected(pc.connectionState === 'connected');
      };

      // Subscribe and then initiate if we're the initiator
      await channel.subscribe();

      // Small delay to ensure both sides are subscribed
      await new Promise(r => setTimeout(r, 1000));

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { from: localUserId, type: 'offer', sdp: offer },
        });
      }

      // Speaking detection loop
      const detectSpeaking = () => {
        if (analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setIsSpeaking(avg > 15);
        }
        if (remoteAnalyserRef.current) {
          const data = new Uint8Array(remoteAnalyserRef.current.frequencyBinCount);
          remoteAnalyserRef.current.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setRemoteIsSpeaking(avg > 15);
        }
        animFrameRef.current = requestAnimationFrame(detectSpeaking);
      };
      detectSpeaking();
    };

    start().catch(err => console.error('WebRTC error:', err));

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, sessionId, localUserId, remoteUserId, isInitiator, cleanup]);

  return { connected, isSpeaking, remoteIsSpeaking, muted, toggleMute, cleanup };
}
