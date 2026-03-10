import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getIceServers } from '@/lib/iceServers';

interface UseWebRTCOptions {
  sessionId: string;
  localUserId: string;
  remoteUserId: string;
  enabled: boolean;
  onRemoteEnd?: () => void;
}

export function useWebRTC({ sessionId, localUserId, remoteUserId, enabled, onRemoteEnd }: UseWebRTCOptions) {
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
  const makingOfferRef = useRef(false);
  const isSettingRemoteRef = useRef(false);

  const isPolite = localUserId > remoteUserId;

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

  const sendEndSignal = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'session-end',
      payload: { from: localUserId },
    });
  }, [localUserId]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      localStreamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const iceConfig = await getIceServers();
      const pc = new RTCPeerConnection(iceConfig);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        const remoteAudio = document.getElementById('remote-audio') as HTMLAudioElement;
        if (remoteAudio && e.streams[0]) {
          remoteAudio.srcObject = e.streams[0];
          try {
            const remoteCtx = new AudioContext();
            const remoteSrc = remoteCtx.createMediaStreamSource(e.streams[0]);
            const remoteAn = remoteCtx.createAnalyser();
            remoteAn.fftSize = 256;
            remoteSrc.connect(remoteAn);
            remoteAnalyserRef.current = remoteAn;
          } catch (err) {
            console.warn('Remote analyser error:', err);
          }
        }
        setConnected(true);
      };

      // Signaling channel
      const channel = supabase.channel(`webrtc-${sessionId}`, {
        config: { broadcast: { self: false } },
      });
      channelRef.current = channel;

      // Listen for session end from remote
      channel.on('broadcast', { event: 'session-end' }, ({ payload }) => {
        if (payload.from !== localUserId) {
          console.log('Remote peer ended session');
          cleanup();
          onRemoteEnd?.();
        }
      });

      // Perfect negotiation signals
      channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (!pcRef.current || payload.from === localUserId) return;
        const pc = pcRef.current;

        try {
          if (payload.type === 'offer' || payload.type === 'answer') {
            const description = new RTCSessionDescription(payload.sdp);
            const offerCollision = payload.type === 'offer' &&
              (makingOfferRef.current || pc.signalingState !== 'stable');

            if (offerCollision && !isPolite) {
              return;
            }

            isSettingRemoteRef.current = true;
            await pc.setRemoteDescription(description);
            isSettingRemoteRef.current = false;

            if (payload.type === 'offer') {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { from: localUserId, type: 'answer', sdp: pc.localDescription },
              });
            }
          } else if (payload.type === 'ice-candidate' && payload.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              if (!isSettingRemoteRef.current) {
                console.warn('ICE candidate error:', e);
              }
            }
          }
        } catch (err) {
          console.error('Signal handling error:', err);
        }
      });

      pc.onicecandidate = (e) => {
        if (e.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: { from: localUserId, type: 'ice-candidate', candidate: e.candidate },
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          makingOfferRef.current = true;
          await pc.setLocalDescription();
          channelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload: { from: localUserId, type: 'offer', sdp: pc.localDescription },
          });
        } catch (err) {
          console.error('Negotiation error:', err);
        } finally {
          makingOfferRef.current = false;
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log('WebRTC connection state:', state);
        setConnected(state === 'connected');
        if (state === 'failed') pc.restartIce();
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') pc.restartIce();
      };

      // Use Presence to detect when both peers are online
      await channel.subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        console.log('Subscribed to signaling channel');

        // Track presence
        await channel.track({ user_id: localUserId });
      });

      // When presence syncs, check if remote peer is already there
      channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        const remoteJoined = newPresences.some((p: any) => p.user_id === remoteUserId);
        if (remoteJoined && pc.signalingState === 'stable' && !makingOfferRef.current) {
          // Deterministic initiator: lower ID creates the offer
          if (localUserId < remoteUserId) {
            console.log('Remote peer joined, initiating offer');
            triggerOffer(pc, channel);
          }
        }
      });

      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const remotePresent = Object.values(state).flat().some((p: any) => p.user_id === remoteUserId);
        if (remotePresent && pc.signalingState === 'stable' && !makingOfferRef.current) {
          if (localUserId < remoteUserId) {
            console.log('Presence sync: remote peer present, initiating offer');
            triggerOffer(pc, channel);
          }
        }
      });

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

    const triggerOffer = async (pc: RTCPeerConnection, channel: ReturnType<typeof supabase.channel>) => {
      try {
        makingOfferRef.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { from: localUserId, type: 'offer', sdp: pc.localDescription },
        });
      } catch (err) {
        console.error('Manual offer error:', err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    start().catch(err => console.error('WebRTC error:', err));

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, sessionId, localUserId, remoteUserId, isPolite, cleanup, onRemoteEnd]);

  return { connected, isSpeaking, remoteIsSpeaking, muted, toggleMute, cleanup, sendEndSignal };
}
