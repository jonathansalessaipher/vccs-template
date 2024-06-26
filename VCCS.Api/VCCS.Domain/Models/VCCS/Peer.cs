﻿using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace VCCS.Domain.Models.VCCS
{
    public sealed class Peer : INotifyPropertyChanged
    {

        public event PropertyChangedEventHandler? PropertyChanged;

        private void OnPropertyChanged([CallerMemberName] string propertyName = "")
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        /// <summary>Identificação do Peer.</summary>
        public required string Identification { get; init; }

        /// <summary>Identificação da conexão no SignalR.</summary>
        public required string ConnectionId { get; init; }

        /// <summary>Identifica se o Peer é um piloto.</summary>
        public bool IsPilot { get; init; }

        /// <summary>Quando for diferente de nulo, indica o canal ao qual o peer está conectado.</summary>
        public string Channel { get; set; }
        public bool OnCall { get; set; }
        public bool isMicActive { get; set; }
        public bool isAudioActive { get; set; }
    }
    public sealed class SignalPeer
    {
        public string Signal { get; set; }
        public Peer Peer { get; set; }

        public SignalPeer(string signal, Peer peer)
        {
            Signal = signal;
            Peer = peer;
        }
    }
    public sealed class PeerState
    {
        public string ConnectionId { get; set; }
        public bool State { get; set; }

        public PeerState(string connectionId, bool state)
        {
            ConnectionId = connectionId;
            State = state;
        }
    }
    public sealed class PeerCallStatus
    {
        public string ConnectionId { get; set; }
        public bool OnCallAccept { get; set; }
        public Peer Peer { get; set; }

        public PeerCallStatus(string connectionId, bool onCallAccept, Peer peer)
        {
            ConnectionId = connectionId;
            OnCallAccept = onCallAccept;
            Peer = peer;
        }
    }
}
