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
  selector: 'app-vccs',
  templateUrl: './vccs-vhf.component.html',
  styleUrls: ['./vccs-vhf.component.scss']
})
export class VccsVhfComponent implements OnInit, OnDestroy {
  private unsub$: any = new Subject();
  private readonly myId = GuidUtil.generateGUID().substring(0, 8);
  private peerConnections: any = {};
  private localStream!: MediaStream;

  public height = 0;
  public peers: IPeer[] = [];
  public peersToAudio: IPeer[] = [];

  public peersTF: IPeer[] = [];

  public myConnectionId: string = '';
  public isMute: boolean = false;
  public isConnected = false;
  public myChannelConnected = '';

  public frequencies: Frequency[] = [
    new Frequency(this.myId, '118.150'),
    new Frequency(this.myId, '121.900'),
    new Frequency(this.myId, '119.300'),
    new Frequency(this.myId, '119.950'),
    new Frequency(this.myId, '120.650'),
    new Frequency(this.myId, '129.550'),
    new Frequency(this.myId, '127.800'),
    new Frequency(this.myId, '121.500'),
    new Frequency(this.myId, '120.95 CT'),
    new Frequency(this.myId, '133.15 CT')
  ];

  public frequenciesTF: Frequency[] = [];

  public audios: IAudioDeviceInfo[] = [];
  public microfones: IAudioDeviceInfo[] = [];
  public showConfigDevices: boolean = false;

  public saveDevicesButtonOptions!: Record<string, unknown>;
  public closeButtonOptions!: Record<string, unknown>;

  public selectedAudio!: IAudioDeviceInfo;
  public selectedMicrofone!: IAudioDeviceInfo;
  public typeAudio = AudioDeviceType;

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

  // MÉTODO QUE CONECTA OU DESCONECTA O USUÁRIO EM UMA FREQUÊNCIA (Canal) SELECIONADA
  public async connectFrequency(frequency: Frequency) {
    this.peers = [];
    var selectedFrequency = Object.assign({}, this.frequencies.find(f => f.id === frequency.id)!);
    if (selectedFrequency) {
      this.frequencies.filter(f => f.isSelected).forEach(f => f.isSelected = false);

      if (selectedFrequency.isSelected) {
        const channel = selectedFrequency.channel;
        this._signalRService.leave(channel);
      } else {
        if (this.myChannelConnected) {
          this._signalRService.leave(this.myChannelConnected);
          this.peers = [];
        }

        this.myChannelConnected = frequency.channel;
        await this.connectPeer(frequency);
        this.frequencies.find(f => f.id === frequency.id)!.isSelected = !selectedFrequency.isSelected;
      }
    }
  }

  public async callPeerToTalk(frequency: Frequency) {
    this.peers = [];
    var selectedFrequency = Object.assign({}, this.frequenciesTF.find(f => f.id === frequency.id)!);
    if (selectedFrequency) {
      this.frequenciesTF.filter(f => f.isSelected).forEach(f => f.isSelected = false);

      if (selectedFrequency.isSelected) {
        const channel = selectedFrequency.channel;
        // this._signalRService.leave(channel);
        // STOP CALL
      } else {
        this._signalRService.callPeerToTalk(frequency.id);
        //this.frequenciesTF.find(f => f.id === frequency.id)!.isSelected = !selectedFrequency.isSelected;
      }
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

  // ADICIONA PARCEIRO CONECTADO NA FREQUÊNCIA NO QUAL ESTOU CONECTADO, NA LISTAGEM PARA SER EXIBIDO NO GRID
  private async addPeer(peer: IPeer): Promise<void> {
    this.removePeer(peer);
    this.peers.push(peer);
    if (peer.connectionId !== this.myConnectionId) {
      this.peersToAudio.push(peer);
    }
    await this.setAudioToUse();
  }

  // REMOVE PARCEIRO CONECTADO NA FREQUÊNCIA NO QUAL ESTOU CONECTADO, NA LISTAGEM PARA SER EXIBIDO NO GRID
  private removePeer(peer: IPeer): void {
    var peerExist = this.peers.find(p => p.connectionId === peer.connectionId);
    if (peerExist) {
      this.peers.splice(this.peers.indexOf(peerExist), 1);
      if (peer.connectionId !== this.myConnectionId) {
        var peerAudioExist = this.peersToAudio.find(p => p.connectionId === peer.connectionId);
        if (peerAudioExist) {
          this.peersToAudio.splice(this.peersToAudio.indexOf(peerAudioExist), 1);
        }
      }
    }
  }

  // EVENTOS DO SIGNALR
  private subscribeEvents(): void {

    // Adiciona parceiro que acabou de entrar na frequência no qual estou conectado e inicia uma conexão com o parceiro.
    this._signalRService.onPeerJoined.pipe(takeUntil(this.unsub$)).subscribe(async (peer: IPeer) => {
      await this.addPeer(peer);
      this.initiateOffer(peer.connectionId);
      this._toastr.success(`Parceiro ${peer.identification} se conectou.`);
    });

    // Remove parceiro que acabou de sair na frequência no qual estou conectado e fecha a conexão do parceiro comigo.
    this._signalRService.onPeerLeaved.pipe(takeUntil(this.unsub$)).subscribe((peer: IPeer) => {
      this.closeConnection(peer.connectionId);
      this.removePeer(peer);
      this._toastr.warning(`Parceiro ${peer.identification} se desconectou.`);
    });

    // Exibe erro não tratado no VCCS HUB.
    this._signalRService.onError.pipe(takeUntil(this.unsub$)).subscribe((error: string) => {
      this._toastr.warning(error);
    });

    // Recebe as configurações de conexão do parceiro e envia um sinal com as minhas configurações, estabelecendo conexões entre os dois.
    this._signalRService.onReceiveSignal.pipe(takeUntil(this.unsub$)).subscribe((signalPeer: ISignalPeer) => {
      this.onReceiveSignal(signalPeer.peer.connectionId, signalPeer.signal);
    });

    // Atualiza lsitagem dos parceiros conectados na mesma frequência.
    this._signalRService.onPeerList.pipe(takeUntil(this.unsub$)).subscribe((peerList: IPeer[]) => {
      peerList.forEach(async peer => {
        await this.addPeer(peer);
      });
    });

    // Atualiza status do microfone para o usuário quando o parceiro muda o status do seu microfone.
    this._signalRService.onPeerPTTState.pipe(takeUntil(this.unsub$)).subscribe((peerState: IPeerState) => {
      if (peerState) {
        if (peerState.state) {
          this.peers.find(x => x.connectionId === peerState.connectionId)!.isMicActive = true;
        } else {
          this.peers.find(x => x.connectionId === peerState.connectionId)!.isMicActive = false;
        }
      }
    });

    // Atualiza listagem de parceiros conectados no modulo TF.
    this._signalRService.onConnectedInTF.pipe(takeUntil(this.unsub$)).subscribe((peer: IPeer) => {
      if (peer) {
        this.frequenciesTF.push(new Frequency(peer.identification, peer.channel));
      }
    });

    // Remove parceiro que acabou de se desconectar no modulo TF.
    this._signalRService.onPeerLeavedInTF.pipe(takeUntil(this.unsub$)).subscribe((peer: IPeer) => {
      //this.closeConnection(peer.connectionId);
      this.frequenciesTF.splice(this.frequenciesTF.indexOf(this.frequenciesTF.find(f => f.id === peer.identification)!), 1);

      var frequencyExist = this.frequenciesTF.find(p => p.id === peer.identification);
      if (frequencyExist) {
        this.frequenciesTF.splice(this.frequenciesTF.indexOf(frequencyExist), 1);
        // if (peer.connectionId !== this.myConnectionId) {
        //   var peerAudioExist = this.peersToAudio.find(p => p.connectionId === peer.connectionId);
        //   if (peerAudioExist) {
        //     this.peersToAudio.splice(this.peersToAudio.indexOf(peerAudioExist), 1);
        //   }
        // }
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
          console.log(dialogResult);
      });
    });
  }

  // <----------------------- DAQUI PRA BAIXO É O CÓDIGO DO VCCS (WEBRTC) ----------------------------->
  // ENVIA SINAL MOSTRANDO QUE EU ME CONECTEI EM UMA FREQUÊNCIA SELECIONADA
  public async connectPeer(frequency: Frequency) {
    if (this._signalRService.serviceConnected) {
      try {
        const connectedPeer = await this._signalRService.join(frequency.id, frequency.channel, false);
        if (connectedPeer) {
          await this.addPeer(connectedPeer);
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
    const keys = Object.keys(this.peerConnections);

      if (keys.length > 0 && this.isConnected) {
        keys.forEach(key => {
          const conn: RTCPeerConnection = this.peerConnections[key];

          // Obter os envios de mídia (senders) da conexão
          const senders = conn.getSenders();

          // Encontrar o sender de áudio (ou vídeo) que você deseja alterar
          if (senders) {
            const audioSender = senders.find(sender => sender.track!.kind === 'audio');
            if (audioSender) {
              this.localStream.getTracks().forEach(async track => {
                await audioSender.replaceTrack(track);
              });
            }
          }
        });
      }
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
    if (this.peerConnections[partnerClientId]) {
        return this.peerConnections[partnerClientId];
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

    this.localStream.getTracks().forEach(track => connection.addTrack(track, this.localStream));

    this.peerConnections[partnerClientId] = connection; // Store away the connection based on username

    return connection;
  }

  // MÉTODO QUE ENVIA UM SINAL PARA O PARCEIRO
  private sendHubSignal(candidate: string, partnerClientId: string) {
    this._signalRService.sendSignal(candidate, partnerClientId);
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

  // MÉTODO QUE ENCERRA UMA CONEXÃO COM UM PARCEIRO APÓS O PARCEIRO TER SAIDO DA FREQUÊNCIA (Canal)
  private closeConnection(peerConnectionId: string) {
    const connection = this.peerConnections[peerConnectionId];
    if (connection) {
        this.internalCloseConnection(peerConnectionId);
    }
    // Retornar o número de conexões remanecentes.
    return Object.keys(this.peerConnections).length;
  }

  // MÉTODO QUE ENCERRA UMA CONEXÃO COM UM PARCEIRO
  private internalCloseConnection(id: string) {
    const connection = this.peerConnections[id];

    if (connection) {
        connection.close();
        var otherAudio: any = document.querySelector('[data-connection="' + id + '"]');
        if (otherAudio && otherAudio.src) {
          otherAudio.src = '';
        }
        delete this.peerConnections[id]; // Remove the property
    }
  };

  // DETECTA ÁUDIO DE UM PARCEIRO CONECTADO E EXIBE PARA O USUÁRIO QUE ESSE PARCEIRO ESTÁ FALANDO
  private detectAudio(): void {
    if (window.RTCRtpReceiver && ('getSynchronizationSources' in window.RTCRtpReceiver.prototype)) {
      const getAudioLevel = (timestamp: any) => {
        window.requestAnimationFrame(getAudioLevel);

        const keys = Object.keys(this.peerConnections);

        if (keys.length > 0 && this.isConnected) {
          keys.forEach(key => {
            const conn = this.peerConnections[key];
            const receiver = conn.getReceivers().find((r: any) => r.track.kind === 'audio');
            if (!receiver) {
              console.warn(`[WebRTC] Receiver não foi encontrado para a conexão: ${conn}`);
              return;
            }

            const sources = receiver.getSynchronizationSources();
            if (!sources) {
              console.warn(`[WebRTC] getSynchronizationSources não retornou nada para a conexão: ${conn}`);
              return;
            }

            sources.forEach((source: any) => {
              if (source.audioLevel >= 0.02) {

                var element = document.getElementById(this.myChannelConnected);
                if (element) {
                  this.renderer.addClass(element, 'blinking-border');

                  setTimeout(() => {
                    this.renderer.removeClass(element, 'blinking-border');
                  }, 2000);
                }

                var voiceElement = document.getElementById('voice-' + key);
                if (voiceElement) {
                  this.renderer.setStyle(voiceElement, 'visibility', 'visible');

                  setTimeout(() => {
                    this.renderer.setStyle(voiceElement, 'visibility', 'hidden');
                  }, 2000);
                }
              }
            });
          });
        }
      };
      window.requestAnimationFrame(getAudioLevel);
    }
  }

  // MÉTODO QUE ENCERRA TODAS AS CONEXÕES
  private closeAllConnections() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    for (var connectionId in this.peerConnections) {
        this.internalCloseConnection(connectionId);
    }
  }

  @HostListener('window:resize', ['$event.target.innerHeight'])
  onResize(height: number) {
    this.height = height - 75;
  }

  ngOnDestroy(): void {
    if (this.myChannelConnected) {
      this._signalRService.leave(this.myChannelConnected);
    }
    this._signalRService.leave();
    this.closeAllConnections();


  }
}




