// WebRTC helper — manages peer connection + media

let localStream = null;
let peerConnection = null;
window.peerConnection = null;

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
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

  // receive remote stream
  peerConnection.ontrack = (event) => {
    const remoteStream = event.streams[0];
    if (remoteStream) onTrack(remoteStream);
  };

  // ICE exchange
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) onIceCandidate(event.candidate);
  };

  // VERY IMPORTANT — ensures media flows
  peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === "connected") {
      console.log("WebRTC connected");
    }
  };

  // add tracks AFTER handlers attached
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

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