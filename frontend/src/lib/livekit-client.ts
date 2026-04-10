/**
 * LiveKit Client Wrapper for Video Calls
 * Integrates with Team@Once backend video conferencing via database
 */

import {
  Room,
  RoomEvent,
  LocalParticipant,
  RemoteParticipant,
  LocalTrack,
  LocalVideoTrack,
  LocalAudioTrack,
  VideoPresets,
  RemoteTrack,
  RemoteTrackPublication,
  LocalTrackPublication,
  TrackPublication,
  Participant,
  DisconnectReason,
  ConnectionQuality,
} from 'livekit-client';

export class LiveKitClient {
  private room: Room | null = null;
  private localVideoTrack: LocalVideoTrack | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private eventHandlers = new Map<string, Set<Function>>();

  /**
   * Connect to a LiveKit room
   */
  async connect(url: string, token: string, options?: any): Promise<Room> {
    if (this.room?.state === 'connected') {
      return this.room;
    }

    // Create room instance
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
      ...options,
    });

    // Setup event listeners
    this.setupRoomEvents();

    // Connect to room
    await this.room.connect(url, token);

    return this.room;
  }

  /**
   * Setup room event handlers
   */
  private setupRoomEvents(): void {
    if (!this.room) return;

    this.room
      .on(RoomEvent.Connected, () => {
        this.emit('connected');
      })
      .on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
        this.emit('disconnected', reason);
      })
      .on(RoomEvent.Reconnecting, () => {
        this.emit('reconnecting');
      })
      .on(RoomEvent.Reconnected, () => {
        this.emit('reconnected');
      })
      .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        this.emit('participantConnected', participant);
      })
      .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        this.emit('participantDisconnected', participant);
      })
      .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        this.emit('trackSubscribed', { track, publication, participant });
      })
      .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        this.emit('trackUnsubscribed', { track, publication, participant });
      })
      .on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
        this.emit('localTrackPublished', publication);
      })
      .on(RoomEvent.LocalTrackUnpublished, (publication: LocalTrackPublication) => {
        this.emit('localTrackUnpublished', publication);
      })
      .on(RoomEvent.TrackMuted, (publication: TrackPublication, participant: Participant) => {
        this.emit('trackMuted', { publication, participant });
      })
      .on(RoomEvent.TrackUnmuted, (publication: TrackPublication, participant: Participant) => {
        this.emit('trackUnmuted', { publication, participant });
      })
      .on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        this.emit('activeSpeakersChanged', speakers);
      })
      .on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant: Participant) => {
        this.emit('connectionQualityChanged', { quality, participant });
      })
      .on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: Participant) => {
        this.emit('dataReceived', { payload, participant });
      });
  }

  /**
   * Disconnect from room
   */
  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }

    // Stop local tracks
    await this.stopLocalTracks();
  }

  /**
   * Enable camera
   */
  async enableCamera(enabled: boolean = true): Promise<LocalVideoTrack | null> {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    if (enabled) {
      if (!this.localVideoTrack) {
        const publication = await this.room.localParticipant.setCameraEnabled(true);
        this.localVideoTrack = publication ? (publication.track as LocalVideoTrack) : null;
      }
      return this.localVideoTrack;
    } else {
      await this.room.localParticipant.setCameraEnabled(false);
      this.localVideoTrack = null;
      return null;
    }
  }

  /**
   * Enable microphone
   */
  async enableMicrophone(enabled: boolean = true): Promise<LocalAudioTrack | null> {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    if (enabled) {
      if (!this.localAudioTrack) {
        const publication = await this.room.localParticipant.setMicrophoneEnabled(true);
        this.localAudioTrack = publication ? (publication.track as LocalAudioTrack) : null;
      }
      return this.localAudioTrack;
    } else {
      await this.room.localParticipant.setMicrophoneEnabled(false);
      this.localAudioTrack = null;
      return null;
    }
  }

  /**
   * Toggle camera
   */
  async toggleCamera(): Promise<boolean> {
    if (!this.room) return false;
    const enabled = this.room.localParticipant.isCameraEnabled;
    await this.enableCamera(!enabled);
    return !enabled;
  }

  /**
   * Toggle microphone
   */
  async toggleMicrophone(): Promise<boolean> {
    if (!this.room) return false;
    const enabled = this.room.localParticipant.isMicrophoneEnabled;
    await this.enableMicrophone(!enabled);
    return !enabled;
  }

  /**
   * Start screen share
   */
  async startScreenShare(): Promise<LocalTrack | null> {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    const publication = await this.room.localParticipant.setScreenShareEnabled(true);
    const track = publication ? (publication.track as LocalTrack) : null;
    return track;
  }

  /**
   * Stop screen share
   */
  async stopScreenShare(): Promise<void> {
    if (!this.room) return;
    await this.room.localParticipant.setScreenShareEnabled(false);
  }

  /**
   * Send data message to participants
   */
  async sendDataMessage(data: string | Uint8Array, options?: { reliable?: boolean }): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    const encoder = new TextEncoder();
    const payload = typeof data === 'string' ? encoder.encode(data) : data;

    await this.room.localParticipant.publishData(payload, { reliable: options?.reliable ?? true });
  }

  /**
   * Get local participant
   */
  getLocalParticipant(): LocalParticipant | null {
    return this.room?.localParticipant ?? null;
  }

  /**
   * Get remote participants
   */
  getRemoteParticipants(): Map<string, RemoteParticipant> {
    return this.room?.remoteParticipants ?? new Map();
  }

  /**
   * Get room
   */
  getRoom(): Room | null {
    return this.room;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.room?.state ?? 'disconnected';
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.room?.state === 'connected';
  }

  /**
   * Stop all local tracks
   */
  private async stopLocalTracks(): Promise<void> {
    if (this.localVideoTrack) {
      this.localVideoTrack.stop();
      this.localVideoTrack = null;
    }
    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack = null;
    }
  }

  // ============================================
  // Event Emitter
  // ============================================

  on(event: string, callback: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.eventHandlers.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((callback) => callback(data));
    }
  }
}

// Export singleton instance
export const liveKitClient = new LiveKitClient();
export default liveKitClient;
