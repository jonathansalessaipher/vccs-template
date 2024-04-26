import { Injectable } from '@angular/core';
import { AudioDeviceType, IAudioDeviceInfo } from '../interfaces';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class AudioDeviceUtil {

  constructor(private _toastr: ToastrService) {
  }

  public async getAudioDevices(): Promise<IAudioDeviceInfo[]> {
    return await this.getDevicesDyType('audiooutput');
  }

  public async getMicrofoneDevices(): Promise<IAudioDeviceInfo[]> {
    return await this.getDevicesDyType('audioinput');
  }

  public async setAudio(device: IAudioDeviceInfo, showMessageError: boolean = true): Promise<boolean> {
    let errorMessage: string = '';
    try {

      var audioElements: any = document.getElementsByTagName('audio');
      if (audioElements) {
        for (var i = 0; i < audioElements.length; i++) {
          var element = audioElements[i];
          if (typeof element.sinkId !== 'undefined') {
            try {
              await element.setSinkId(device.mediaDevice.deviceId);
              break;
            }
            catch (error) {
              errorMessage = `Erro ao configurar dispositivo de saída de áudio: ${error}`;
              break;
            }
          } else {
            errorMessage = `Browser does not support output device selection.`;
            break;
          }
        }
      }
    } catch (error) {
      errorMessage = `Erro ao configurar dispositivo de saída de áudio: ${error}`;
    }

    if (errorMessage && showMessageError) {
      this._toastr.error(errorMessage);
      return false;
    }
    return true;
  }

  public async setMicrofone(device: IAudioDeviceInfo): Promise<MediaStream | null>{
    try {
      const constraints = {
        audio: {
          deviceId: { exact: device.mediaDevice.deviceId },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stream) {
        return stream;
      }
      return null;
    } catch (error) {
      console.error('Erro ao configurar dispositivo de entrada de áudio:', error);
      return null;
    }
  }

  private async getDevicesDyType(type: string): Promise<IAudioDeviceInfo[]> {
    const deviceInfo: IAudioDeviceInfo[] = [];
    let devices: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();
    var defaultDevice = devices.find(device => device.kind === type && device.deviceId === 'default');
    devices = devices.filter(device => device.kind === type && device.deviceId !== 'communications' && device.deviceId !== 'default');
    devices.forEach(device => {
      var isDefault = false;
      if (defaultDevice && defaultDevice.label.includes(device.label)) {
        isDefault = true;
      }

      deviceInfo.push({
        id: device.deviceId,
        groupId: device.groupId,
        type: AudioDeviceType.AUDIO,
        name: device.label,//!isDefault ? `${device.label}` : `${device.label} (Padrão)`,
        isDefault: isDefault,
        isUsed: isDefault,
        mediaDevice: device
      });
    });
    deviceInfo.sort((a, b) => (a.isDefault === b.isDefault) ? 0 : a.isDefault ? -1 : 1);
    return deviceInfo;
  }
}
