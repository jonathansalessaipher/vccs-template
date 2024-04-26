export const WEBRTC_CONSTRAINTS = { audio: true, video: false };
export const ICE_SERVERS = [{ urls: 'stun:4.201.97.81' }, { // linux coturn
    urls: 'turn:4.201.97.81',
    username: 'saipher',
    credential: '1@equipe'
}];
export const OFFER_OPTIONS: any = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: false,
  voiceActivityDetection: true
};
export const WOWZA_APPLICATION_NAME = "webrtc";
export const WOWZA_SESSION_ID_EMPTY = "[empty]";

export const STATUS_OK = 200;
export const STATUS_APPLICATION_FAILURE = 500;
export const STATUS_ERROR_STARTING_APPLICATION = 501;
export const STATUS_ERROR_STREAM_NOT_RUNNING = 502;
export const STATUS_STREAMNAME_INUSE = 503;
export const STATUS_STREAM_NOT_READY = 504;
export const STATUS_ERROR_CREATE_SDP_OFFER = 505;
export const STATUS_ERROR_CREATING_RTP_STREAM = 506;
export const STATUS_WEBRTC_SESSION_NOT_FOUND = 507;
export const STATUS_ERROR_DECODING_SDP_DATA = 508;
export const STATUS_ERROR_SESSIONID_NOT_SPECIFIED = 509;

export const CODEC_AUDIO_UNKNOWN = -1;
export const CODEC_AUDIO_PCM_BE = 0x00;
export const CODEC_AUDIO_PCM_SWF = 0x01;
export const CODEC_AUDIO_AC3 = 0x01; //TODO steal this slot
export const CODEC_AUDIO_MP3 = 0x02;
export const CODEC_AUDIO_PCM_LE = 0x03;
export const CODEC_AUDIO_NELLYMOSER_16MONO = 0x04;
export const CODEC_AUDIO_NELLYMOSER_8MONO = 0x05;
export const CODEC_AUDIO_NELLYMOSER = 0x06;
export const CODEC_AUDIO_G711_ALAW = 0x07;
export const CODEC_AUDIO_G711_MULAW = 0x08;
export const CODEC_AUDIO_RESERVED = 0x09;
export const CODEC_AUDIO_VORBIS = 0x09; //TODO steal this slot
export const CODEC_AUDIO_AAC = 0x0a;
export const CODEC_AUDIO_SPEEX = 0x0b;
export const CODEC_AUDIO_OPUS = 0x0c;
export const CODEC_AUDIO_MP3_8 = 0x0f;

// window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
// window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
// window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
