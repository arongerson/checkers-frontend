import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { VIDEO_CHAT_SERVER, MAX_CALL_RETRIES } from '../util/constants';

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
    retries = 0;

    constructor() { }

    initVideo = (roomID, userVideo, partnerVideo, playerID, join) => {
        this.userVideo = userVideo;
        this.partnerVideo = partnerVideo;
        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(stream => {
            this.userVideo.muted = true;
            this.userVideo.srcObject = stream;
            this.userStream = stream;
            this.socketRef = io(VIDEO_CHAT_SERVER);
            if (join) {
                // at the lobby, we wait for the user to consent joining
                // after the game has started we check the consent before deciding to join
                // checking the consent yet to be implemented
                this.join(roomID, playerID);
            }

            this.socketRef.on('other user', userID => {
                console.log("Calling..." + userID)
                this.otherUser = userID;
                this.callUser(userID);
            });

            this.socketRef.on("user joined", userID => {
                this.otherUser = userID;
            });

            this.socketRef.on("offer", this.handleReceiveCall);
            this.socketRef.on("answer", this.handleAnswer);
            this.socketRef.on("ice-candidate", this.handleNewICECandidateMsg);
        });
    }

    join(roomID, playerID) {
        this.socketRef.emit("join room", `${roomID}:${playerID}`);
    }

    callUser = (userID) => {
        this.peerRef = this.createPeer(userID);
        this.userStream.getTracks().forEach(track => {
            console.log("track: ", track);
            this.peerRef.addTrack(track, this.userStream);
        });
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
        // Workaround for Chrome: skip nested negotiations
        peer.onsignalingstatechange = (e) => { 
        }

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
        console.log(this.peerRef)
        this.peerRef.setRemoteDescription(desc).catch(e => {
            console.log(e)
            if (this.retries <= MAX_CALL_RETRIES) {
                this.callUser(this.otherUser);
                this.retries++;
            }
        });
    }

    handleICECandidateEvent = (e) => {
        if (e.candidate) {
            console.log("candidate: ", e);
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
        // when the partner video connects 
        // place the partner video in a bigger div and the user video 
        // in the smaller div
        this.partnerVideo.srcObject = this.userStream;
        this.partnerVideo.muted = true;
        this.userVideo.srcObject = e.streams[0];
        this.userVideo.muted = false;
    }
  
}
