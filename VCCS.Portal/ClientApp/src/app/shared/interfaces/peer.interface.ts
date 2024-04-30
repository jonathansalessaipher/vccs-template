export interface IPeer {
  identification: string;
  connectionId: string;
  isPilot: string;
  channel: string;
  onCall: boolean;

  isMicActive: boolean;
  isAudioActive: boolean;
}

export interface ISignalPeer {
  signal: string;
  peer: IPeer;
}

export interface IPeerState {
  connectionId: string;
  state: boolean;
}

export interface IPeerCallStatus {
  connectionId: string;
  onCallAccept: boolean;
  peer: IPeer;
}
