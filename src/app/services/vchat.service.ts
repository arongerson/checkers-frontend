import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { VIDEO_CHAT_SERVER } from '../util/constants';

@Injectable({
  providedIn: 'root'
})
export class VchatService {

    socketRef: any;
    userStream: any;
    userVideo: any;
    partnerVideo: any;
    otherUser: any;
    peerRef: any;

    constructor() { }

    initVideo = (roomID, userVideo, partnerVideo, playerID) => {
        this.userVideo = userVideo;
        this.partnerVideo = partnerVideo;
        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
            this.userVideo.muted = true;
            this.userVideo.srcObject = stream;
            this.userStream = stream;
            this.socketRef = io(VIDEO_CHAT_SERVER);
            this.socketRef.emit("join room", `${roomID}:${playerID}`);

            this.socketRef.on('other user', userID => {
                this.callUser(userID);
                this.otherUser = userID;
            });

            this.socketRef.on("user joined", userID => {
                this.otherUser = userID;
            });

            this.socketRef.on("offer", this.handleReceiveCall);

            this.socketRef.on("answer", this.handleAnswer);

            this.socketRef.on("ice-candidate", this.handleNewICECandidateMsg);
        });
    }

    callUser = (userID) => {
        this.peerRef = this.createPeer(userID);
        this.userStream.getTracks().forEach(track => this.peerRef.addTrack(track, this.userStream));
    }

    createPeer = (userID) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                },
                {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
            ]
        });

        peer.onicecandidate = this.handleICECandidateEvent;
        peer.ontrack = this.handleTrackEvent;
        peer.onnegotiationneeded = () => this.handleNegotiationNeededEvent(userID);

        return peer;
    }

    handleNegotiationNeededEvent = (userID) => {
        this.peerRef.createOffer().then(offer => {
            return this.peerRef.setLocalDescription(offer);
        }).then(() => {
            const payload = {
                target: userID,
                caller: this.socketRef.id,
                sdp: this.peerRef.localDescription
            };
            this.socketRef.emit("offer", payload);
        }).catch(e => console.log(e));
    }

    handleReceiveCall = (incoming) => {
        this.peerRef = this.createPeer(incoming.caller);
        const desc = new RTCSessionDescription(incoming.sdp);
        this.peerRef.setRemoteDescription(desc).then(() => {
            this.userStream.getTracks().forEach(track => this.peerRef.addTrack(track, this.userStream));
        }).then(() => {
            return this.peerRef.createAnswer();
        }).then(answer => {
            return this.peerRef.setLocalDescription(answer);
        }).then(() => {
            const payload = {
                target: incoming.caller,
                caller: this.socketRef.id,
                sdp: this.peerRef.localDescription
            }
            this.socketRef.emit("answer", payload);
        })
    }

    handleAnswer = (message) => {
        const desc = new RTCSessionDescription(message.sdp);
        this.peerRef.setRemoteDescription(desc).catch(e => console.log(e));
    }

    handleICECandidateEvent = (e) => {
        if (e.candidate) {
            const payload = {
                target: this.otherUser,
                candidate: e.candidate,
            }
            this.socketRef.emit("ice-candidate", payload);
        }
    }

    handleNewICECandidateMsg = (incoming) => {
        const candidate = new RTCIceCandidate(incoming);

        this.peerRef.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    handleTrackEvent = (e) => {
        this.partnerVideo.srcObject = e.streams[0];
    }
  
}
