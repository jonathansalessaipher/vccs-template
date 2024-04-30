import { VCCSKeys } from './../../enums/vccs-signalr-keys.enum';
import { Injectable } from "@angular/core";
import * as signalR from "@microsoft/signalr";
import { Subject } from "rxjs";
import { environment } from "src/environments/environment";
import { IPeer, IPeerState, ISignalPeer } from "../../interfaces/peer.interface";

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private url: string;
  private hubConnection!: signalR.HubConnection;
  private _connectionId!: string | null;

  get connectionId() {
    return this._connectionId;
  }

  public serviceConnected = false;
  public onConnected: Subject<boolean> = new Subject<boolean>();

  /**
   * Este evento é acionado quando um parceiro acabou de entrar na frequência no qual o usuário está conectado.
   * @returns Retorna as informações do parceiro.
   */
  onPeerJoined: Subject<IPeer> = new Subject<IPeer>();
  /**
   * Este evento é acionado quando um parceiro acabou de sair na frequência no qual o usuário está conectado.
   * @returns Retorna as informações do parceiro.
   */
  onPeerLeaved: Subject<IPeer> = new Subject<IPeer>();
  /**
   * Este evento é acionado quando acontece algum erro não tratado no VCCS HUB.
   * @returns Retorna a mensagem do erro.
   */
  onError: Subject<string> = new Subject<string>();
  /**
   * Este evento é acionado quando o parceiro recebeu as minhas configurações de conexão após ele ter entrado na mesma frequência que eu.
   * @returns Retorna as configurações de conexão do parceiro.
   */
  onReceiveSignal: Subject<ISignalPeer> = new Subject<ISignalPeer>();
  /**
   * Este evento é acionado quando algum parceiro acaba de entrar na mesma frequência que a minha, retornando a lista de todos os parceiros conectados.
   * @returns Retorna listagem dos pareceiros conectados na mesma frequência.
   */
  onPeerList: Subject<IPeer[]> = new Subject<IPeer[]>();
  /**
   * Este evento é acionado quando o parceiro muda o status do seu microfone.
   * @returns Retorna o status do microfone do parceiro.
   */
  onPeerPTTState: Subject<IPeerState> = new Subject<IPeerState>();

  /**
   * Este evento é acionado quando o parceiro se conecta no modulo TF (Telefonia)
   * @returns Retorna as informações do parceiro.
   */
  onConnectedInTF: Subject<IPeer> = new Subject<IPeer>();

   /**
   * Este evento é acionado quando um parceiro acabou de se desconectar do modulo TF (Telefonia)
   * @returns Retorna as informações do parceiro.
   */
   onPeerLeavedInTF: Subject<IPeer> = new Subject<IPeer>();

   /**
   * Este evento é acionado quando um parceiro chama outro parceiro para se conectarem em uma mesma frequência.
   * @returns Retorna as informações do parceiro.
   */
   onCallingToTalk: Subject<IPeer> = new Subject<IPeer>();
   /**
   * Este evento é acionado quando o parceiro recebeu as minhas configurações de conexão após ele ter entrado na mesma frequência que eu.
   * @returns Retorna as configurações de conexão do parceiro.
   */
  public offerReceived$: Subject<ISignalPeer> = new Subject<ISignalPeer>();
  public answerReceived$: Subject<ISignalPeer> = new Subject<ISignalPeer>();
  public iceCandidateReceived$: Subject<string> = new Subject<string>();

  constructor() {
    this.url = `${environment.apiUrl}/vccsHub`;
  }

  public start(userToken: string): void {
    this.buildConnection(userToken);

    this.hubConnection
      .start()
      .then(async () => {
        console.debug(`[✔️][${(new Date()).toISOString()}][Authenticated VCCS hub] - ${this.hubConnection.state}`);
        this.serviceConnected = true;
        await this.getConnectionId();
        this.registerEvents();
        this.onConnected.next(true);
      })
      .catch(err => {
        this.serviceConnected = false;
        this.onConnected.next(false);

        // Tenta reestabelecer conexão novamente apos 3s
        setTimeout(() => this.start(userToken), 3000);
      });
  }

  public stop() {
    this.hubConnection.stop();
    this.serviceConnected = false;
    this.onConnected.next(false);
  }

  public hubConnectionOnClose() {
    this.hubConnection.onclose(() => {
        this.serviceConnected = false;
        this.onConnected.next(false);
    });
  }

  private buildConnection(userToken: string) {
    let hubBuilder: signalR.HubConnectionBuilder;

    hubBuilder = new signalR.HubConnectionBuilder()
    .withUrl(`${this.url}`, {
      withCredentials: false,
      // accessTokenFactory: () => userToken
    });

    this.hubConnection = hubBuilder.configureLogging(signalR.LogLevel.None)
     .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: _retryContext => {
          return 3000;
        }
      })
      .build();

    this.hubConnection.onreconnecting(error => {
      console.debug(`[⚠️][${(new Date()).toISOString()}][Authenticated VCCS hub] - ${this.hubConnection.state}`);
      this.serviceConnected = false;
      this.unregisterEvents();
      this.onConnected.next(false);
    });

    this.hubConnection.onreconnected(async connectionId => {
      console.debug(`[✔️][${(new Date()).toISOString()}][Authenticated VCCS hub] - ${this.hubConnection.state}`);
      this.serviceConnected = true;
      this.registerEvents();
      await this.getConnectionId();
      this.onConnected.next(true);
    });

    this.hubConnection.onclose(async (error) => {
      console.debug(`[❌][${(new Date()).toISOString()}][Authenticated VCCS hub] - ${this.hubConnection.state} - ${error}`);
      this.serviceConnected = false;
      this.unregisterEvents();
      this.onConnected.next(false);
    });
  }

  public registerEvents() {
    if(this.hubConnection) {
      this.hubConnection.on(VCCSKeys.PeerJoined, (data: IPeer) => {
          this.onPeerJoined.next(data);
      });

      this.hubConnection.on(VCCSKeys.PeerLeaved, (data: IPeer) => {
        this.onPeerLeaved.next(data);
      });

      this.hubConnection.on(VCCSKeys.Error, (data: string) => {
        this.onError.next(data);
      });

      this.hubConnection.on(VCCSKeys.ReceiveSignal, (data: ISignalPeer) => {
        this.onReceiveSignal.next(data);
      });

      this.hubConnection.on(VCCSKeys.PeerList, (data: IPeer[]) => {
        this.onPeerList.next(data);
      });

      this.hubConnection.on(VCCSKeys.PeerPTTState, (data: IPeerState) => {
        this.onPeerPTTState.next(data);
      });

      this.hubConnection.on(VCCSKeys.ConnectedTF, (data: IPeer) => {
        this.onConnectedInTF.next(data);
      });

      this.hubConnection.on(VCCSKeys.PeerLeavedTF, (data: IPeer) => {
        this.onPeerLeavedInTF.next(data);
      });

      this.hubConnection.on(VCCSKeys.CallingToTalk, (data: IPeer) => {
        this.onCallingToTalk.next(data);
      });

      this.hubConnection.on(VCCSKeys.ReceiveOffer, (offer: ISignalPeer) => {
        this.offerReceived$.next(offer);
      });

      this.hubConnection.on(VCCSKeys.ReceiveAnswer, (answer: ISignalPeer) => {
        this.answerReceived$.next(answer);
      });

      this.hubConnection.on(VCCSKeys.ReceiveICECandidate, (candidate: any) => {
        this.iceCandidateReceived$.next(candidate);
      });
    }
  }

  public unregisterEvents(): void {
    if(this.hubConnection) {
      this.hubConnection.off(VCCSKeys.PeerJoined);
      this.hubConnection.off(VCCSKeys.PeerLeaved);
      this.hubConnection.off(VCCSKeys.Error);
      this.hubConnection.off(VCCSKeys.ReceiveSignal);
      this.hubConnection.off(VCCSKeys.PeerList);
      this.hubConnection.off(VCCSKeys.PeerPTTState);
    }
  }

  async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  public async join(identification: string, channelName: string, isPilot: boolean): Promise<IPeer | null>{
    if(this.hubConnection) {
      try {
        var peer = await this.hubConnection.invoke<IPeer>("Join", identification, channelName, isPilot);
        console.debug(`[${(new Date()).toISOString()}][VCCS HUB] - Success join ${identification}`);
        return peer;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return null;
  }

  public leave(channelName: string | null = null): void {
    if(this.hubConnection) {
      if (channelName === null) {
        this.hubConnection.invoke("Leave", null)
        .then(() => console.debug(`[${(new Date()).toISOString()}][VCCS HUB] - Success to leave`))
        .catch(err => {
            console.error(err);
        });
      } else {
        this.hubConnection.invoke("Leave", channelName)
        .then(() => console.debug(`[${(new Date()).toISOString()}][VCCS HUB] - Success to leave ${channelName}`))
        .catch(err => {
            console.error(err);
        });
      }
    }
  }

  public setPeerPTTState(isMute: boolean): void {
    if(this.hubConnection) {
      this.hubConnection.invoke("SetPeerPTTState", isMute)
      .then(() => console.debug(`[${(new Date()).toISOString()}][VCCS HUB] - Success SetPeerPTTState ${isMute}`))
      .catch(err => {
          console.error(err);
      });
    }
  }

  public sendSignal(signal: string, partnerId: string) {
    this.hubConnection.invoke<IPeer>("SendSignal", signal, partnerId).then(() => {

    });
  }

  public async connect(identification: string): Promise<IPeer[] | null>{
    if(this.hubConnection) {
      try {
        var peers = await this.hubConnection.invoke<IPeer[]>("Connect", identification);
        console.debug(`[${(new Date()).toISOString()}][VCCS HUB] - Success connect ${identification}`);
        return peers;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return null;
  }

  public async callPeerToTalk(identification: string): Promise<IPeer[] | null>{
    if(this.hubConnection) {
      try {
        var peers = await this.hubConnection.invoke<IPeer[]>("CallPeerToTalk", identification);
        console.debug(`[${(new Date()).toISOString()}][VCCS HUB] - Success CallPeerToTalk ${identification}`);
        return peers;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return null;
  }

  private async getConnectionId(): Promise<void> {
    if(this.hubConnection && this.serviceConnected) {
      try {
        const connectionId = await this.hubConnection.invoke("GetConnectionId")
        console.debug(`[${(new Date()).toISOString()}][VCCS HUB] - ConnectionId: ${connectionId}`);
        this._connectionId = connectionId;
      } catch (error) {
        console.error(error);
      }
    }
  }

  public sendOffer(offer: RTCSessionDescriptionInit, peerConnectionId: string): void {
    const data = JSON.stringify(offer);
    this.hubConnection.invoke('SendOffer', data, peerConnectionId)
      .catch(err => console.error('Error while sending offer via SignalR: ', err));
  }

  public sendAnswer(answer: RTCSessionDescriptionInit, peerConnectionId: string): void {
    const data = JSON.stringify(answer);
    this.hubConnection.invoke('SendAnswer', data, peerConnectionId)
      .catch(err => console.error('Error while sending answer via SignalR: ', err));
  }

  public sendICECandidate(candidate: RTCIceCandidate, peerConnectionId: string): void {
    const data = JSON.stringify(candidate);
    this.hubConnection.invoke('SendICECandidate', data, peerConnectionId)
      .catch(err => console.error('Error while sending ICE candidate via SignalR: ', err));
  }
}
