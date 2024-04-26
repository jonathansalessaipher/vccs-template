using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using VCCS.Domain.Models.VCCS;
using System.Linq;

namespace VCCS.Api.Hubs.VCCSHub
{
    [AllowAnonymous]
    //[Authorize]
    public class VCCSHub : Hub<IConnectionVCCSHub>
    {
        private static readonly Dictionary<string, Peer> _peers = new();

        // Terminologias:
        // - CHANNEL: é a frequência de comunicação a qual o usuário está conectado.
        // - PEER: é o usuário que está se conectando ao servidor.

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

        public async Task Leave(string channelName)
        {
            if (_peers.TryGetValue(Context.ConnectionId, out var peer))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, channelName);
                await Clients.OthersInGroup(channelName).PeerLeaved(peer);

                _peers.Remove(Context.ConnectionId);
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

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await LeaveAll();
            await base.OnDisconnectedAsync(exception);
        }

        public string GetConnectionId()
        {
            return Context.ConnectionId;
        }
    }
}
