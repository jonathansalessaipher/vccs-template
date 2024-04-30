using System.Threading.Tasks;
using VCCS.Domain.Models.VCCS;

namespace VCCS.Api.Hubs.VCCSHub
{
    public interface IConnectionVCCSHub
    {
        /// <summary>Informa que um peer se conectou no mesmo canal (frequência) ao qual o usuário está conectado.</summary>
        Task PeerJoined(Peer peer);

        /// <summary>Informa que um peer se desconectou do mesmo canal (frequência) ao qual o usuário está conectado.</summary>
        Task PeerLeaved(Peer peer);

        /// <summary>Função apenas para informar as partes os peers que já estão conectado ao fazer <see cref="PeerJoined(Peer)"/> em um canal..</summary>
        Task PeerList(Peer[] peers);

        /// <summary>Informa que o peer de destino não está disponível para receber a chamada.</summary>
        Task Error(string message);

        Task ReceiveSignal(SignalPeer signalPeer);

        /// <summary>Informa os outros usuários do canal que o peer está com o PTT ativado.</summary>
        Task PeerPTTState(PeerState state);

        Task Desconnect(string connectionId);


        //CHAMADAS DO TIPO TF

        Task ConnectedTF(Peer peer);
        /// <summary>Informa que um peer se desconectou do mesmo canal (frequência) ao qual o usuário está conectado.</summary>
        Task PeerLeavedTF(Peer peer);
        Task CallingToTalk(Peer peer);
        Task ReceiveOffer(SignalPeer signalPeer);
        Task ReceiveAnswer(SignalPeer signalPeer);
        Task ReceiveICECandidate(string candidate);
    }
}
