export interface IAudioDeviceInfo {
  id: string;
  groupId: string;
  type: AudioDeviceType,
  name: string;
  isDefault: boolean;
  isUsed: boolean;
  mediaDevice: MediaDeviceInfo;
}

export enum AudioDeviceType {
  AUDIO,
  MICROFONE
}
