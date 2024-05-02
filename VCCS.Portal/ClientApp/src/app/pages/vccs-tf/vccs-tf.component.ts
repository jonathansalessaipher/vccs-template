import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { IAudioDeviceInfo, IPeer, IPeerCallStatus, IPeerState, ISignalPeer } from 'src/app/shared/interfaces';
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
  public readonly myId = GuidUtil.generateGUID().substring(0, 3);
  public remoteStream: MediaStream = new MediaStream();

  public height = 0;

  public peerConnection!: RTCPeerConnection | undefined;
  private localStream!: MediaStream;
  public peer!: IPeer | undefined;

  public myConnectionId: string = '';
  public isMute: boolean = false;
  public onAudio: boolean = true;
  public isConnected = false;
  public onCall = false;

  public frequencies: Frequency[] = [];

  public audios: IAudioDeviceInfo[] = [];
  public microfones: IAudioDeviceInfo[] = [];
  public showConfigDevices: boolean = false;

  public saveDevicesButtonOptions!: Record<string, unknown>;
  public closeButtonOptions!: Record<string, unknown>;

  public selectedAudio!: IAudioDeviceInfo;
  public selectedMicrofone!: IAudioDeviceInfo;

  private _heliFilter: BiquadFilterNode;
  private _audioContext: AudioContext

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

      // Inicialize o contexto de áudio e o filtro do helicóptero
    this._audioContext = new AudioContext();
    this._heliFilter = this._audioContext.createBiquadFilter();
    this._heliFilter.type = 'highpass'; // Filtro passa-alta
    this._heliFilter.frequency.value = 1000; // Frequência de corte
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
    if (!this.peer && !this.peerConnection) {
      if (!frequency.onCall) {
        this.callPeerToTalk(frequency);
      }
    } else if (this.peer && this.peerConnection && frequency.connectionId !== this.peer.connectionId) {
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
          if (this.peerConnection !== undefined && this.peer) {
            this._signalRService.stopCall(this.peer.connectionId);
            this.internalCloseConnection();
            this.callPeerToTalk(frequency);
          }
        }
      });
    }
  }

  private async callPeerToTalk(frequency: Frequency) {
    var selectedFrequency = Object.assign({}, this.frequencies.find(f => f.id === frequency.id)!);
    if (selectedFrequency) {
      // this.frequencies.filter(f => f.isSelected).forEach(f => f.isSelected = false);

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
    this.sendAudioStatus();
  }

  public setAudio() {
    this.onAudio = !this.onAudio;
    if (this.peer) {
      var audioElement: any = document.querySelector('[data-connection="' + this.peer.connectionId + '"]');
      // var audioElements: any = document.getElementsByTagName('audio');
      if (audioElement) {
        audioElement.muted = !this.onAudio;
      }
      this.sendAudioStatus();
    }
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

    if (this.peerConnection !== undefined) {
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
  private internalCloseConnection() {

    if (this.peerConnection && this.peer) {
      var frequency = this.frequencies.find(x => x.connectionId === this.peer!.connectionId);
      if (frequency) {
        frequency.onCall = false;
      }
      var otherAudio: any = document.querySelector('[data-connection="' + this.peer.connectionId + '"]');
      if (otherAudio && otherAudio.src) {
        otherAudio.src = '';
      }
      this.onCall = false;
      this.peerConnection.close();
      this.peerConnection = undefined;
      this.peer = undefined;
    }
  };

  // DETECTA ÁUDIO DE UM PARCEIRO CONECTADO E EXIBE PARA O USUÁRIO QUE ESSE PARCEIRO ESTÁ FALANDO
  private detectAudio(): void {
    if (window.RTCRtpReceiver && ('getSynchronizationSources' in window.RTCRtpReceiver.prototype)) {
      const getAudioLevel = (timestamp: any) => {
        window.requestAnimationFrame(getAudioLevel);

        if (this.peerConnection === undefined || this.peer === undefined) {
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
                  var element = document.getElementById('frequency-' + this.peer.connectionId);
                  if (element) {
                    this.renderer.addClass(element, 'blinking-border');

                    setTimeout(() => {
                      this.renderer.removeClass(element, 'blinking-border');
                    }, 2000);
                  }

                  var voiceElement = document.getElementById('voice-' + this.peer.connectionId);
                  if (voiceElement) {
                    this.renderer.setStyle(voiceElement, 'visibility', 'visible');

                    setTimeout(() => {
                      this.renderer.setStyle(voiceElement, 'visibility', 'hidden');
                    }, 2000);
                  }
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
    this.internalCloseConnection();
  }

  @HostListener('window:resize', ['$event.target.innerHeight'])
  onResize(height: number) {
    this.height = height - 75;
  }

  ngOnDestroy(): void {
    this._signalRService.leave();
    this.closeAllConnections();
  }

  setClass(frequency: Frequency): string {
    if (this.peer) {
      if (this.peer.connectionId === frequency.connectionId) {
        return 'channel-selected';
      }
    } else if (frequency.onCall) {
        return 'on-call';
    }

    return 'channel';
  }
  // MÉTODO QUE INICIA UMA NOVA CONEXÃO E OFERECE AO PARCEIRO, APÓS TER RECEBIDO UM SINAL (signalR) DE QUE UM PARCEIRO SE CONECTOU NA MESMA FREQUÊNCIA (Canal)
  // APÓS REALIZAR ESSA NOVA CONEXÃO, O MÉTODO ENVIA UMA SINAL (signalR) COM AS CONFIGURAÇÕES DE CONEXÃO PARA O PARCEIRO
  private initiateOffer(connectionId: string) {
    var connection = this.getConnection(connectionId); // // get a connection for the given partner

    connection.createOffer(OFFER_OPTIONS).then((offer: any) => {

        connection.setLocalDescription(offer).then(() => {

            this.sendHubSignal(JSON.stringify({ "sdp": connection.localDescription }), connectionId);
        }).catch((err: any) => {
          console.error('WebRTC: Error while setting local description', err);
          this.errorHandler(err);
        });
    }).catch((err: any) => {
      console.error('WebRTC: Error while creating offer', err);
      this.errorHandler(err);
    });
  }

  // CRIA UMA NOVA CONEXÃO (RTC) CASO NÃO EXISTA OU RETORNA UMA CONEXÃO JÁ EXISTENTE ATRAVÉS DO ID DO PARCEIRO
  private getConnection(partnerClientId: string): RTCPeerConnection {
    if (this.peerConnection !== undefined) {
        return this.peerConnection;
    }
    else {
        return this.initializeConnection(partnerClientId)
    }
  }

  // CONFIGURA UMA NOVA CONEXÃO (RTC) COM O PARCEIRO
  private initializeConnection(partnerClientId: string): RTCPeerConnection {
    var peerConnectionConfig = { iceServers: ICE_SERVERS };

    var connection = new RTCPeerConnection(peerConnectionConfig);

    var sendHubSignalEvent: EventEmitter<string> = new EventEmitter<string>();
    sendHubSignalEvent.subscribe((data) => {
      this.sendHubSignal(data, partnerClientId);
    });

    connection.onicecandidate = function (e) {

        if (e.candidate) {// Found a new candidate
            sendHubSignalEvent.emit(JSON.stringify({ "candidate": e.candidate }));
        } else {
            // Null candidate means we are done collecting candidates.
            sendHubSignalEvent.emit(JSON.stringify({ "candidate": null }));
        }
    }

    connection.ontrack = function (e) {
        var peerAudio: any = document.querySelector('[data-connection="' + partnerClientId + '"]');

        // Bind the remote stream to the partner window
        if (peerAudio != null && peerAudio.srcObject !== e.streams[0]) {
            peerAudio.srcObject = e.streams[0];
        }
    }

    connection.removeTrack = function (e) {
      // Clear out the partner window
      var otherAudio: any = document.querySelector('[data-connection="' + partnerClientId + '"]');
      if (otherAudio && otherAudio.src) {
        otherAudio.src = '';
      }
    }

    connection.removeEventListener = function (e: any) {
        // Clear out the partner window
        var otherAudio: any = document.querySelector('[data-connection="' + partnerClientId + '"]');
        if (otherAudio && otherAudio.src) {
          otherAudio.src = '';
        }
    }

    const audioSource = this._audioContext.createMediaStreamSource(this.localStream);
    audioSource.connect(this._heliFilter);
    this._heliFilter.connect(this._audioContext.destination);

    this.localStream.getTracks().forEach(track => connection.addTrack(track, this.localStream));

    this.peerConnection = connection; // Store away the connection based on username

    return connection;
  }

  // MÉTODO QUE ENVIA UM SINAL PARA O PARCEIRO
  private sendHubSignal(candidate: string, partnerClientId: string) {
    this._signalRService.sendSignalTF(candidate, partnerClientId);
  }

  // MÉTODO QUE RECEBE UM SINAL (SDP) DO PARCEIRO E ENVIA UMA RESPOSTA (SDP) DE VOLTA PARA O PARCEIRO APÓS UMA NOVA CONEXÃO TER SIDO CONFIGURADO
  private async onReceiveSignal(partnerClientId: string, data: string) {
    var signal = JSON.parse(data);
    var connection = this.getConnection(partnerClientId);

    // Route signal based on type
    if (signal.sdp) {
        await this.receivedSdpSignal(connection, partnerClientId, signal.sdp);
    } else if (signal.candidate) {
        connection.addIceCandidate(new RTCIceCandidate(signal.candidate))
        .then()
        .catch((err) => {
          console.error("WebRTC: cannot add candidate: " + err);
          this.errorHandler(err);
        });
    } else {
        connection
            .addIceCandidate(undefined) // TODO: Check if this is correct
            .then()
            .catch((err) => {
                console.error('WebRTC: cannot add null candidate: ' + err);
                this.errorHandler(err);
            });
    }
  }

  // MÉTODO QUE ENVIA AS COFNIGURAÇÕES DE CONEXÃO PARA O PARCEIRO APÓS A CONEXÃO TER SIDO ESTABELECIDA
  private async receivedSdpSignal(connection: RTCPeerConnection, partnerClientId: string, sdp: any) {
    try {
        await connection.setRemoteDescription(new RTCSessionDescription(sdp));

        if (connection && connection.remoteDescription && connection.remoteDescription.type == "offer") {
          const desc = await connection.createAnswer();
          await connection.setLocalDescription(desc);
          this.sendHubSignal(JSON.stringify({ "sdp": connection.localDescription }), partnerClientId);
        } else if (connection && connection.remoteDescription && connection.remoteDescription.type == "answer") {
            console.log('WebRTC: remote Description type answer');
        } else {
          if (connection && connection.remoteDescription) {
            console.error(`ERROR: ${connection.remoteDescription.type}`);
          }
        }
    } catch (e) {
        this.errorHandler(e);
    }
  }

  public stopCall() {
    if (this.peer !== undefined) {
      this._signalRService.stopCall(this.peer.connectionId);
      this.internalCloseConnection();
      this._toastr.warning(`Chamada finalizada!`);
    }
  }

  private sendAudioStatus() {
    if (this.peer) {
      this._signalRService.setStatusAudioToPeer(this.peer.connectionId, this.isMute, this.onAudio);
    }
  }

  // EVENTOS DO SIGNALR
  private subscribeEvents(): void {
    // Exibe erro não tratado no VCCS HUB.
    this._signalRService.onError.pipe(takeUntil(this.unsub$)).subscribe((error: string) => {
      this._toastr.warning(error);
    });

    // Atualiza status do microfone para o usuário quando o parceiro muda o status do seu microfone.
    this._signalRService.onPeerPTTState.pipe(takeUntil(this.unsub$)).subscribe((peerState: IPeerState) => {
      if (peerState && this.peer) {
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

      if (this.peer && this.peer.connectionId === peer.connectionId) {
        this.internalCloseConnection();
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
          this.initiateOffer(peer.connectionId);
          this._signalRService.acceptCall(peer.connectionId, true);
          this.onCall = true;
          this.sendAudioStatus();
        } else {
          this.onCall = false;
          this._signalRService.acceptCall(peer.connectionId, false);
        }
      });
    });

    // Recebe as configurações de conexão do parceiro e envia um sinal com as minhas configurações, estabelecendo conexões entre os dois.
    this._signalRService.onReceiveSignal.pipe(takeUntil(this.unsub$)).subscribe((signalPeer: ISignalPeer) => {
      this.peer = Object.assign({}, signalPeer.peer);
      this.onReceiveSignal(signalPeer.peer.connectionId, signalPeer.signal);
      this.sendAudioStatus();
    });

    // Recebe as configurações de conexão do parceiro e envia um sinal com as minhas configurações, estabelecendo conexões entre os dois.
    this._signalRService.onCallAccepted.pipe(takeUntil(this.unsub$)).subscribe((status: IPeerCallStatus) => {
      var frequency = this.frequencies.find(x => x.connectionId === status.connectionId);
      if (frequency) {
        frequency.onCall = status.onCallAccept;
      }

      if (status.onCallAccept) {
        this.onCall = true;
        this.sendAudioStatus();
        this._toastr.success(`Chamada aceita com sucesso!`);
      } else {
        this.onCall = false;
        this._toastr.warning(`Chamada não foi aceita pelo parceiro!`);
      }
    });

    this._signalRService.onStopCall.pipe(takeUntil(this.unsub$)).subscribe(() => {
      if (this.peer) {
        this._toastr.warning(`Chamada finalizada!`);
        var frequency = this.frequencies.find(x => x.connectionId === this.peer!.connectionId);
        if (frequency) {
          frequency.onCall = false;
        }
        this.internalCloseConnection();
      }
    });

    this._signalRService.onPeerStatus.pipe(takeUntil(this.unsub$)).subscribe((peers: IPeer[]) => {
      peers.forEach(peer => {
        var frequency = this.frequencies.find(x => x.connectionId === peer.connectionId);
        if (frequency) {
          frequency.onCall = peer.onCall;
        }
      });
    });

    this._signalRService.onPeerAudioStatus.pipe(takeUntil(this.unsub$)).subscribe((peer: IPeer) => {
      if (this.peer) {
        this.peer.isAudioActive = peer.isAudioActive;
        this.peer.isMicActive = peer.isMicActive;
      }
    });
  }
}
