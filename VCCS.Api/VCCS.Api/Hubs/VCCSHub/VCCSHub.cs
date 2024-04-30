using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using VCCS.Domain.Models.VCCS;
using System.Linq;
using System.Threading.Channels;

namespace VCCS.Api.Hubs.VCCSHub
{
    [AllowAnonymous]
    //[Authorize]
    public class VCCSHub : Hub<IConnectionVCCSHub>
    {
        private static readonly Dictionary<string, Peer> _peers = new();
        private static readonly Dictionary<string, Peer> _peersConnectedsInTF = new();

        // Terminologias:
        // - CHANNEL: é a frequência de comunicação a qual o usuário está conectado.
        // - PEER: é o usuário que está se conectando ao servidor.
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await LeaveAll();
            await base.OnDisconnectedAsync(exception);
        }
        public string GetConnectionId()
        {
            return Context.ConnectionId;
        }
        public async Task<Peer> Join(string identification, string channelName, bool isPilot)
        {
            // Obter a lista de Peers que já estão no grupo para poder enviar para o Caller.
            var peersInGroup = _peers.Values.Where(x => x.Channel == channelName).ToList();

            Peer peer;

            if (_peers.Any(x => x.Key == Context.ConnectionId))
            {
                _peers.Remove(Context.ConnectionId);
            }

            peer = new()
            {
                Identification = identification,
                ConnectionId = Context.ConnectionId,
                IsPilot = isPilot,
                Channel = channelName
            };

            _peers.Add(Context.ConnectionId, peer);

            if (!string.IsNullOrEmpty(peer.Channel) && peer.Channel != channelName)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, peer.Channel);
                await Clients.OthersInGroup(peer.Channel).PeerLeaved(peer);

                peer.Channel = null;
            }

            peer.Channel = channelName;

            await Groups.AddToGroupAsync(Context.ConnectionId, channelName);

            // Avisar todos do grupo que um novo usuário entrou na frequência (CHANNEL).
            await Clients.OthersInGroup(channelName).PeerJoined(peer);

            await Clients.Caller.PeerList(peersInGroup.ToArray());

            return peer;
        }

        public async Task Leave(string channelName = null)
        {
            if (!string.IsNullOrEmpty(channelName))
            {
                if (_peers.TryGetValue(Context.ConnectionId, out var peer))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelName);
                    await Clients.OthersInGroup(channelName).PeerLeaved(peer);
                    _peers.Remove(Context.ConnectionId);
                }
            }
            else
            {
                if (_peersConnectedsInTF.TryGetValue(Context.ConnectionId, out var peerTF))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, peerTF.Channel);
                    await Clients.OthersInGroup(peerTF.Channel).PeerLeavedTF(peerTF);
                    _peersConnectedsInTF.Remove(Context.ConnectionId);
                }
            }
        }

        public async Task LeaveAll()
        {
            if (_peers.TryGetValue(Context.ConnectionId, out var peer))
            {
                if (!string.IsNullOrEmpty(peer.Channel))
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, peer.Channel);
                    await Clients.OthersInGroup(peer.Channel).PeerLeaved(peer);
                }

                _peers.Remove(Context.ConnectionId);
            }

            await Leave();
        }

        // WebRTC Signal Handler
        public async Task SendSignal(string signal, string targetConnectionId)
        {
            // Verificar se o target ainda está conectado.
            if (!_peers.TryGetValue(targetConnectionId, out Peer? peer))
            {
                await Clients.Caller.Error("Conexão de destino não está mais disponível!");
                return;
            }

            if (!_peers.TryGetValue(Context.ConnectionId, out Peer? signilingPeer))
            {
                await Clients.Caller.Error("Sua conexão é inválida. Recarregue a página e tente novamente!");
                return;
            }

            //await Clients.Client(peer.ConnectionId).ReceiveSignal(signilingPeer, signal);
            await Clients.Client(peer.ConnectionId).ReceiveSignal(new SignalPeer(signal, signilingPeer));
        }

        // CHAMADAS DO TIPO TF

        public async Task SendSignalTF(string signal, string targetConnectionId)
        {
            // Verificar se o target ainda está conectado.
            if (!_peersConnectedsInTF.TryGetValue(targetConnectionId, out Peer? peer))
            {
                await Clients.Caller.Error("Conexão de destino não está mais disponível!");
                return;
            }

            if (!_peersConnectedsInTF.TryGetValue(Context.ConnectionId, out Peer? signilingPeer))
            {
                await Clients.Caller.Error("Sua conexão é inválida. Recarregue a página e tente novamente!");
                return;
            }

            //await Clients.Client(peer.ConnectionId).ReceiveSignal(signilingPeer, signal);
            await Clients.Client(peer.ConnectionId).ReceiveSignal(new SignalPeer(signal, signilingPeer));
        }

        public async Task SetPeerPTTState(bool state)
        {
            if (!_peers.TryGetValue(Context.ConnectionId, out Peer? peer) || string.IsNullOrEmpty(peer.Channel))
            {
                return;
            }
            ;
            //await Clients.OthersInGroup(peer.Channel).PeerPTTState(Context.ConnectionId, state);
            await Clients.OthersInGroup(peer.Channel).PeerPTTState(new PeerState(Context.ConnectionId, state));
        }

        public async Task<IList<Peer>> Connect(string identification)
        {
            var channel = "TF";
            identification = channel + "-" + identification.ToUpper();

            Peer peer;

            if (_peersConnectedsInTF.Any(x => x.Key == Context.ConnectionId))
            {
                _peersConnectedsInTF.Remove(Context.ConnectionId);
            }

            peer = new()
            {
                Identification = identification,
                ConnectionId = Context.ConnectionId,
                IsPilot = false,
                Channel = channel
            };

            _peersConnectedsInTF.Add(Context.ConnectionId, peer);

            if (!string.IsNullOrEmpty(peer.Channel) && peer.Channel != channel)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, peer.Channel);
                await Clients.OthersInGroup(peer.Channel).PeerLeaved(peer);

                peer.Channel = null;
            }

            peer.Channel = channel;

            await Groups.AddToGroupAsync(Context.ConnectionId, channel);

            // Avisar todos do grupo que um novo usuário entrou na frequência (CHANNEL).
            await Clients.OthersInGroup(channel).ConnectedTF(peer);
            var peers = _peersConnectedsInTF.Values.Where(x => x.Identification != identification);

            return peers.Any() ? peers.ToArray() : new List<Peer>();
        }

        public async Task CallPeerToTalk(string identification)
        {
            var peerToReceiver = _peersConnectedsInTF.Values.FirstOrDefault(x => x.Identification == identification);
            var peerOwn = _peersConnectedsInTF.GetValueOrDefault(Context.ConnectionId);

            if (peerToReceiver != null && peerOwn != null)
            {
                await Clients.Client(peerToReceiver.ConnectionId).CallingToTalk(peerOwn);
            }
        }

        public async Task AcceptCall(string peerConnectionId, bool accept)
        {
            // Verificar se o target ainda está conectado.
            if (!_peersConnectedsInTF.TryGetValue(peerConnectionId, out Peer? peer))
            {
                await Clients.Caller.Error("Conexão de destino não está mais disponível!");
                return;
            }

            if (!_peersConnectedsInTF.TryGetValue(Context.ConnectionId, out Peer? myInfo))
            {
                await Clients.Caller.Error("Sua conexão é inválida. Recarregue a página e tente novamente!");
                return;
            }

            _peersConnectedsInTF.FirstOrDefault(x => x.Key == Context.ConnectionId).Value.OnCall = accept;
            _peersConnectedsInTF.FirstOrDefault(x => x.Key == peerConnectionId).Value.OnCall = accept;

            var peersInGroup = new List<Peer>();
            peersInGroup.Add(peer);
            peersInGroup.Add(myInfo);
            await Clients.OthersInGroup(peer.Channel).PeerStatus(peersInGroup.ToArray());

            await Clients.Client(peer.ConnectionId).CallAccepted(new PeerCallStatus(peerConnectionId, accept, peer));
        }

        public async Task StopCall(string peerConnectionId)
        {
            // Verificar se o target ainda está conectado.
            if (!_peersConnectedsInTF.TryGetValue(peerConnectionId, out Peer? peer))
            {
                await Clients.Caller.Error("Conexão de destino não está mais disponível!");
                return;
            }

            if (!_peersConnectedsInTF.TryGetValue(Context.ConnectionId, out Peer? myInfo))
            {
                await Clients.Caller.Error("Sua conexão é inválida. Recarregue a página e tente novamente!");
                return;
            }

            _peersConnectedsInTF.FirstOrDefault(x => x.Key == Context.ConnectionId).Value.OnCall = false;
            _peersConnectedsInTF.FirstOrDefault(x => x.Key == peerConnectionId).Value.OnCall = false;

            var peersInGroup = new List<Peer>();
            peersInGroup.Add(peer);
            peersInGroup.Add(myInfo);
            await Clients.OthersInGroup(peer.Channel).PeerStatus(peersInGroup.ToArray());

            await Clients.Client(peer.ConnectionId).StopCall();
        }

        public async Task SetAudioToPeer(string peerConnectionId, bool microfoneStatus, bool audioStatus)
        {
            if (!_peersConnectedsInTF.TryGetValue(peerConnectionId, out Peer? peer))
            {
                return;
            };

            if (!_peersConnectedsInTF.TryGetValue(Context.ConnectionId, out Peer? myInfo))
            {
                return;
            }

            _peersConnectedsInTF.FirstOrDefault(x => x.Key == Context.ConnectionId).Value.isMicActive = microfoneStatus;
            _peersConnectedsInTF.FirstOrDefault(x => x.Key == Context.ConnectionId).Value.isAudioActive = audioStatus;

            myInfo.isMicActive = microfoneStatus;
            myInfo.isAudioActive = audioStatus;

            await Clients.Client(peerConnectionId).PeerAudioStatus(myInfo);
        }
    }
}
