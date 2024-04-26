export interface IPeer {
  _isMicActive: boolean;
  identification: string;
  connectionId: string;
  isPilot: string;
  channel: string;
  isMicActive: boolean;
}

export interface ISignalPeer {
  signal: string;
  peer: IPeer;
}

export interface IPeerState {
  connectionId: string;
  state: boolean;
}
