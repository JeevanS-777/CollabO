// WebRTC helper — manages peer connection + media

let localStream = null;
let peerConnection = null;
window.peerConnection = null;

  const ICE_SERVERS = {
    iceServers: [
      // STUN (Google)
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },

      // FREE TURN servers
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
  };

export async function createLocalStream(facingMode = "user") {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
    audio: true,
  });
  return localStream;
}

export function getLocalStream() {
  return localStream;
}

export function createPeerConnection(onTrack, onIceCandidate) {
  peerConnection = new RTCPeerConnection(ICE_SERVERS);
  window.peerConnection = peerConnection;

  // 🔥 CRITICAL FIX — explicitly declare transceivers
  peerConnection.addTransceiver("video", { direction: "sendrecv" });
  peerConnection.addTransceiver("audio", { direction: "sendrecv" });

  peerConnection.ontrack = (event) => {
    console.log("TRACK EVENT FIRED", event.streams);
    const remoteStream = event.streams[0];
    if (remoteStream) {
      onTrack(remoteStream);
    }
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  peerConnection.onconnectionstatechange = () => {
    console.log("Connection state:", peerConnection.connectionState);
  };

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
  }

  return peerConnection;
}

export async function createOffer() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(offer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  // force negotiation
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  return answer;
}

export async function setRemoteAnswer(answer) {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

export function addIceCandidate(candidate) {
  if (peerConnection) peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

export function closeConnection() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
}