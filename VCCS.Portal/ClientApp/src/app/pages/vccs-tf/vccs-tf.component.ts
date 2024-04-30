import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { AudioDeviceType, IAudioDeviceInfo, IPeer, IPeerState, ISignalPeer } from 'src/app/shared/interfaces';
import { Frequency } from 'src/app/shared/models';
import { SignalRService } from 'src/app/shared/services/signal-r/signal-r.service';
import { AudioDeviceUtil, GuidUtil } from 'src/app/shared/utils';
import { ICE_SERVERS, OFFER_OPTIONS } from 'src/app/shared/utils/web-rtc-keys.utils';
import { custom } from 'devextreme/ui/dialog';

@Component({
  selector: 'app-vccs-tf',
  templateUrl: './vccs-tf.component.html',
  styleUrls: ['./vccs-tf.component.css']
})
export class VccsTfComponent implements OnInit, OnDestroy {
  private unsub$: any = new Subject();
  private readonly myId = GuidUtil.generateGUID().substring(0, 3);
  public remoteStream: MediaStream = new MediaStream();

  public height = 0;

  public peerConnection!: RTCPeerConnection;
  private localStream!: MediaStream;
  public peer!: IPeer;

  public myConnectionId: string = '';
  public isMute: boolean = false;
  public isConnected = false;

  public frequencies: Frequency[] = [];

  public audios: IAudioDeviceInfo[] = [];
  public microfones: IAudioDeviceInfo[] = [];
  public showConfigDevices: boolean = false;

  public saveDevicesButtonOptions!: Record<string, unknown>;
  public closeButtonOptions!: Record<string, unknown>;

  public selectedAudio!: IAudioDeviceInfo;
  public selectedMicrofone!: IAudioDeviceInfo;

  constructor(private _signalRService: SignalRService,
    private _toastr: ToastrService,
    private renderer: Renderer2,
    private _audioDeviceUtil: AudioDeviceUtil) {
      this.onResize(window.innerHeight);
      this.saveDevicesButtonOptions = {
        icon: 'check',
        stylingMode: 'contained',
        text: 'Salvar',
        onClick: () => this.saveDevice()
      };
      this.closeButtonOptions = {
        text: 'Cancelar',
        stylingMode: 'outlined',
        type: 'normal',
        onClick: () => this.cancelChangeDevices()
      };
  }

  async ngOnInit(): Promise<void> {
    await this.getDevices();

    if (this._signalRService.serviceConnected) {
      this.subscribeEvents();
      if (this._signalRService.connectionId) {
        this.myConnectionId = this._signalRService.connectionId;
        this._toastr.success(`Conexão com o servidor estabelecida com sucesso!`);
        this.isConnected = true;
        this.connectPeer();
      }
    }

    this._signalRService.onConnected
    .pipe(takeUntil(this.unsub$))
    .subscribe(connected => {
      if (connected) {
        this.subscribeEvents();
        if (this._signalRService.connectionId) {
          this.myConnectionId = this._signalRService.connectionId;
          console.log('connectionId', this.myConnectionId);
          this._toastr.success(`Conexão com o servidor estabelecida com sucesso!`);
          this.isConnected = true;
          this.connectPeer();
        }
      } else {
        this.isConnected = false;
      }
    });
  }

  // MÉTODO QUE SALVA AS CONFIGURAÇÕES DE DISPOSITIVOS DE ÁUDIO E MICROFONE SELECFIONADOS PELO USUÁRIO E FECHA POPUP DO USUÁRIO
  public async saveDevice(): Promise<void> {
    this.audios.find(x => x.isUsed)!.isUsed = false;
    this.microfones.find(x => x.isUsed)!.isUsed = false;

    this.audios.find(x => x.id === this.selectedAudio.id)!.isUsed = true;
    this.microfones.find(x => x.id === this.selectedMicrofone.id)!.isUsed = true;

    await this.setMicrofoneToUse();
    await this.setAudioToUse();

    this.showConfigDevices = false;
    this._toastr.success('Dispositivos de áudio configurados com sucesso!');
  }

  // MÉTODO QUE CANCELA A MUDANÇA DE DISPOSITIVOS DE ÁUDIO E MICROFONE E FECHA POPUP DO USUÁRIO
  public cancelChangeDevices(): void {
    const usedAudio = this.audios.find(x => x.isUsed);
    if (usedAudio) {
      this.selectedAudio = usedAudio;
    }

    const usedMicrofone = this.microfones.find(x => x.isUsed);
    if (usedMicrofone) {
      this.selectedMicrofone = usedMicrofone;
    }
    this.showConfigDevices = false;
  }

  public selectFrequency(frequency: Frequency) {
    if (this.peerConnection) {
      let myDialog = custom({
        title: 'Iniciar chamada',
        messageHtml: `Você já está em uma chamada, deseja cancelar e começar outra?`,
        buttons: [{
            text: "Sim",
            onClick: (e) => true
          }, {
            text: "Não",
            onClick: (e) => false
          },
        ]
      });

      myDialog.show().then((dialogResult: boolean) => {
        if (dialogResult) {
          this.peerConnection.close();
          this.peerConnection = {} as RTCPeerConnection;
          this.peer = {} as IPeer;
          this.callPeerToTalk(frequency);
        }
      });
  } else {
    this.callPeerToTalk(frequency);
  }
  }

  private async callPeerToTalk(frequency: Frequency) {
    var selectedFrequency = Object.assign({}, this.frequencies.find(f => f.id === frequency.id)!);
    if (selectedFrequency) {
      this.frequencies.filter(f => f.isSelected).forEach(f => f.isSelected = false);

      this._signalRService.callPeerToTalk(frequency.id);
    }
  }

  // MÉTODO QUE MUDA O ESTADO DO ÁUDIO (MUTE/UNMUTE) E ENVIA PARA O STATUS PARA O PARCEIRO
  public mutateOrUnmute()
  {
    if (this.isMute)
    {
        this.isMute = false;
    } else {
        this.isMute = true;
    }
    this.muteState(this.isMute);
    this._signalRService.setPeerPTTState(this.isMute);
  }

  // VERIFICA DISPOSITIVOS DE ÁUDIO DISPONÍVEIS NO SISTEMA E CONFIGURA SAÍDA DE SOM E MICROFONE NOS DISPOSITIVOS PADRÕES DO SISTEMA
  private async getDevices(): Promise<void> {
    this.audios = await this._audioDeviceUtil.getAudioDevices();
    this.microfones = await this._audioDeviceUtil.getMicrofoneDevices();

    var audioDefault = await this.audios.find(x => x.isDefault);
    if (audioDefault) {
      this.selectedAudio = audioDefault;
    }

    var microfoneDefault = await this.microfones.find(x => x.isDefault);
    if (microfoneDefault) {
      this.selectedMicrofone = microfoneDefault;
    }

    await this.setMicrofoneToUse();
    await this.setAudioToUse();
    this.detectAudio();
  }

  // <----------------------- DAQUI PRA BAIXO É O CÓDIGO DO VCCS (WEBRTC) ----------------------------->
  // ENVIA SINAL MOSTRANDO QUE EU ME CONECTEI EM UMA FREQUÊNCIA SELECIONADA
  public async connectPeer() {
    if (this._signalRService.serviceConnected) {
      try {
        var connectedPeers = await this._signalRService.connect(this.myId);
        if (connectedPeers) {
          this.frequencies = [];
          connectedPeers.forEach((peer: IPeer) => this.frequencies.push(new Frequency(peer.identification, peer.channel, peer.connectionId)));
        }
      } catch (error) {
        console.log(error);
        this.errorHandler(error);
      }
    }
  }

  // MÉTODO QUE CONFIGURA O MICROFONE PARA USO NO SISTEMA
  private setMicrofoneToUse() {
    let deviceInUse = this.microfones.find(x => x.isUsed);
    if (deviceInUse) {
      this._audioDeviceUtil.setMicrofone(deviceInUse)
      .then(async (stream: MediaStream | null) => {
        if (stream) {
          await this.callbackUserMediaSuccess(stream);
        }
      }).catch((error) => {
        this.errorHandler(error);
      });
    } else {

    }
  }

  // MÉTODO QUE CONFIGURA O ÁUDIO (SAÍDA DE SOM) PARA USO NO SISTEMA
  private async setAudioToUse() {
    let deviceInUse = this.audios.find(x => x.isUsed);
    if (deviceInUse) {
      await this._audioDeviceUtil.setAudio(deviceInUse);
    } else {

    }
  }

  // MÉTODO QUE INICIA O USO DO ÁUDIO, CASO O USUÁRIO PERMITA
  // TENDO ACESSO AO ÁUDIO, O MÉTODO GUARDA LOCAMENTE AS CONFIGURAÇÕES DO ÁUDIO
  private async callbackUserMediaSuccess(stream: MediaStream) {
    this.localStream = stream;
    const audioTracks = this.localStream.getAudioTracks();

    if (audioTracks.length > 0) {
      const track = this.localStream.getAudioTracks()[0];

      if (track) {
        track.enabled = this.isMute;
      }

      await this.replaceMicrofonesInPeerConnections();
    }
  }

  // MÉTODO QUE SUBSTITUI OS MICROFONES NAS CONEXÕES (RTC) EXISTENTES
  private async replaceMicrofonesInPeerConnections() {

    if (this.peerConnection) {
      // Obter os envios de mídia (senders) da conexão
      const senders = this.peerConnection.getSenders();

      // Encontrar o sender de áudio (ou vídeo) que você deseja alterar
      if (senders) {
        const audioSender = senders.find(sender => sender.track!.kind === 'audio');
        if (audioSender) {
          this.localStream.getTracks().forEach(async track => {
            await audioSender.replaceTrack(track);
          });
        }
      }
    }
  }

  // MÉTODO QUE TRATA OS ERROS DE CONEXÃO
  private errorHandler(error: any) {
    if (error.message)
      this._toastr.error('<h4>Ocorreu um erro</h4></br>Info: ' + JSON.stringify(error.message));
    else
      this._toastr.error('<h4>Ocorreu um erro</h4></br>Info: ' + JSON.stringify(error));
  }

  // MÉTODO QUE MUDA O ESTADO DO ÁUDIO (MUTE/UNMUTE)
  private muteState(state: boolean) {
    if (this.localStream) {
      const track = this.localStream.getAudioTracks()[0];
      if (track) {
          track.enabled = state;
      }
      else {
        this._toastr.warning('Função indisponível');
      }
    }
  }

  // MÉTODO QUE ENCERRA UMA CONEXÃO COM UM PARCEIRO
  private internalCloseConnection(id: string) {

    if (this.peerConnection) {
      this.peerConnection.close();
        var otherAudio: any = document.querySelector('[data-connection="' + id + '"]');
        if (otherAudio && otherAudio.src) {
          otherAudio.src = '';
        }
        this.peerConnection = {} as RTCPeerConnection;
    }
  };

  // DETECTA ÁUDIO DE UM PARCEIRO CONECTADO E EXIBE PARA O USUÁRIO QUE ESSE PARCEIRO ESTÁ FALANDO
  private detectAudio(): void {
    if (window.RTCRtpReceiver && ('getSynchronizationSources' in window.RTCRtpReceiver.prototype)) {
      const getAudioLevel = (timestamp: any) => {
        window.requestAnimationFrame(getAudioLevel);

        if (!this.peerConnection) {
          return;
        }

        const receiver = this.peerConnection.getReceivers().find((r: any) => r.track.kind === 'audio');
            if (!receiver) {
              console.warn(`[WebRTC] Receiver não foi encontrado para a conexão: ${this.peer.connectionId}`);
              return;
            }

            const sources = receiver.getSynchronizationSources();
            if (!sources) {
              console.warn(`[WebRTC] getSynchronizationSources não retornou nada para a conexão: ${this.peer.connectionId}`);
              return;
            }

            sources.forEach((source: any) => {
              if (source.audioLevel >= 0.02) {

                if (this.peer) {
                  var element = document.getElementById(this.peer.connectionId);
                  if (element) {
                    this.renderer.addClass(element, 'blinking-border');

                    setTimeout(() => {
                      this.renderer.removeClass(element, 'blinking-border');
                    }, 2000);
                  }
                }

                var voiceElement = document.getElementById('voice-' + this.peer.connectionId);
                if (voiceElement) {
                  this.renderer.setStyle(voiceElement, 'visibility', 'visible');

                  setTimeout(() => {
                    this.renderer.setStyle(voiceElement, 'visibility', 'hidden');
                  }, 2000);
                }
              }
            });
      };
      window.requestAnimationFrame(getAudioLevel);
    }
  }

  // MÉTODO QUE ENCERRA TODAS AS CONEXÕES
  private closeAllConnections() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    //this.internalCloseConnection(this.peer.connectionId);
  }

  @HostListener('window:resize', ['$event.target.innerHeight'])
  onResize(height: number) {
    this.height = height - 75;
  }

  ngOnDestroy(): void {
    this._signalRService.leave();
    this.closeAllConnections();
  }

   // EVENTOS DO SIGNALR
   private subscribeEvents(): void {
    // Exibe erro não tratado no VCCS HUB.
    this._signalRService.onError.pipe(takeUntil(this.unsub$)).subscribe((error: string) => {
      this._toastr.warning(error);
    });

    // Atualiza status do microfone para o usuário quando o parceiro muda o status do seu microfone.
    this._signalRService.onPeerPTTState.pipe(takeUntil(this.unsub$)).subscribe((peerState: IPeerState) => {
      if (peerState) {
        if (peerState.state) {
          this.peer.isMicActive = true;
        } else {
          this.peer.isMicActive = false;
        }
      }
    });

    // Atualiza listagem de parceiros conectados no modulo TF.
    this._signalRService.onConnectedInTF.pipe(takeUntil(this.unsub$)).subscribe((peer: IPeer) => {
      if (peer) {
        this.frequencies.push(new Frequency(peer.identification, peer.channel, peer.connectionId));
      }
    });

    // Remove parceiro que acabou de se desconectar no modulo TF.
    this._signalRService.onPeerLeavedInTF.pipe(takeUntil(this.unsub$)).subscribe((peer: IPeer) => {
      //this.closeConnection(peer.connectionId);
      this.frequencies.splice(this.frequencies.indexOf(this.frequencies.find(f => f.id === peer.identification)!), 1);

      var frequencyExist = this.frequencies.find(p => p.id === peer.identification);
      if (frequencyExist) {
        this.frequencies.splice(this.frequencies.indexOf(frequencyExist), 1);
      }

      this._toastr.warning(`Parceiro ${peer.identification} se desconectou.`);
    });

    // Informa para o usuário que um parceiro está chamando para se conectarem em uma mesma frequência.
    this._signalRService.onCallingToTalk.pipe(takeUntil(this.unsub$)).subscribe((peer: IPeer) => {

      let myDialog = custom({
        title: 'Chamando...',
        messageHtml: `O usuário ${peer.identification} está te chamando. Deseja aceitar?`,
        buttons: [{
            text: "Sim",
            onClick: (e) => true
          }, {
            text: "Não",
            onClick: (e) => false
          },
        ]
    });

      myDialog.show().then((dialogResult: boolean) => {
        if (dialogResult) {
          this.peer = Object.assign({}, peer);
          this.startCall();
        }
      });
    });

    this._signalRService.offerReceived$.subscribe((signalPeer: ISignalPeer) => {
      this.peer = Object.assign({}, signalPeer.peer);
      var offer: RTCSessionDescriptionInit = JSON.parse(signalPeer.signal);
      this.handleOffer(offer);
      this.frequencies.find(f => f.id === this.peer.identification)!.isSelected = true;
    });

    this._signalRService.answerReceived$.subscribe((signalPeer: ISignalPeer) => {
      var answer: RTCSessionDescriptionInit = JSON.parse(signalPeer.signal);
      this.handleAnswer(answer);
      this.frequencies.find(f => f.id === this.peer.identification)!.isSelected = true;
    });

    this._signalRService.iceCandidateReceived$.subscribe((candidate: string) => {
      if (this.peerConnection) {
        var data: RTCIceCandidate = JSON.parse(candidate);
        this.peerConnection.addIceCandidate(data).then(() => {});
        console.log('ICE Candidate received: ', candidate);
      }
    });
  }

  public async startCall(): Promise<void> {
    try {
      //this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      var configuration = { iceServers: ICE_SERVERS };
      this.peerConnection = new RTCPeerConnection(configuration);

      // Adicione tracks de áudio e vídeo ao peer connection
      this.localStream.getTracks().forEach(track => this.peerConnection.addTrack(track, this.localStream));

      // Adicione os handlers para eventos de negociação de peer
      this.peerConnection.onicecandidate = event => this.handleICECandidateEvent(event);
      this.peerConnection.ontrack = event => this.handleTrackEvent(event);

      // Crie uma oferta SDP para iniciar a comunicação
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this._signalRService.sendOffer(offer, this.peer.connectionId);
    } catch (err) {
      console.error('Error starting WebRTC call: ', err);
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        var peerConnectionConfig = { iceServers: ICE_SERVERS };
        this.peerConnection = new RTCPeerConnection(peerConnectionConfig);
        this.peerConnection.onicecandidate = event => this.handleICECandidateEvent(event);
        this.peerConnection.ontrack = event => this.handleTrackEvent(event);
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this._signalRService.sendAnswer(answer, this.peer.connectionId);
    } catch (err) {
      console.error('Error handling offer: ', err);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('Error handling answer: ', err);
    }
  }

  private async handleICECandidateEvent(event: RTCPeerConnectionIceEvent): Promise<void> {
    if (event.candidate) {
      this._signalRService.sendICECandidate(event.candidate, this.peer.connectionId);
    }
  }

  private async handleTrackEvent(event: RTCTrackEvent): Promise<void> {
    // Reproduza a faixa de áudio no elemento de áudio no HTML
    const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
    if (audioElement) {
      audioElement.srcObject = event.streams[0];
      audioElement.play().catch(err => console.error('Error playing remote audio: ', err));
    }
  }
}
