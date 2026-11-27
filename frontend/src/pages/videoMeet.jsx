import React, { useState, useRef, useEffect } from 'react';
import styles from "../styles/videoComponent.module.css";
import { TextField, Button, IconButton, Badge } from '@mui/material';
import { VideocamOff, Videocam, CallEnd, Mic, MicOff, ScreenShare, StopScreenShare, Chat, Send } from '@mui/icons-material';

import io from 'socket.io-client';

const server_url = "http://localhost:8000";

let connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeet() {

    let socketRef = useRef();
    let socketIdRef = useRef();

    let localVidoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState([]);

    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState();

    let [message, setMessage] = useState("");

    let [messages, setMessages] = useState([]);

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);

    // TO DO
    // if(isChrome == false) {

    // }

    useEffect(() => {
        getPermissions();
    }, []);

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                // console.log(userMediaStream);

                if (userMediaStream) {
                    window.localStream = userMediaStream;

                    if (localVidoRef.current) {
                        localVidoRef.current.srcObject = userMediaStream;
                    }
                }
            }

        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (video != undefined && audio != undefined) {
            getUserMedia();
        }
    }, [audio, video]);
    let getMedia = () => {
        setAudio(audioAvailable);
        setVideo(videoAvailable);

        connectToSocketServer();
    }

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (error) { console.log(error) };

        window.localStream = stream;
        localVidoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ "sdp": connections[id].localDescription }))
                })
                    .catch(e => console.log(e));
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVidoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blacksilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blacksilence();
            localVidoRef.current.srcObject = window.localStream;

            for (let id in connections) {
                connections[id].addStream(window.localStream);
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description).then(() => {
                        socketIdRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                    }).catch(e => console.log(e));
                })
            }
        })
    }


    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ audio: audio, video: video })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch(error => console.log(error));
        } else {
            try {
                let tracks = localVidoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (error) {
                console.log(error);
            }
        }
    }


    // TODO
    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }))
                            }).catch(error => console.log(error))
                        }).catch(error => console.log(error))
                    }
                })
                    .catch(error => console.log(error))
            }
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(error => console.log(error));
            }
        }
    }

    // TO DO
    let addMessage = (data, sender, socketIdSender) => {

        setMessages((prevMessages) => [
            ...prevMessages, 
            {sender: sender, data: data}
        ]);

        if(socketIdSender != socketIdRef.current) {
            setNewMessages((prevMessages) => ++prevMessages);
        }

    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href)

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("chat-message", addMessage)

            socketRef.current.on("user-left", (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on("user-joined", (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }));
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            }

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        // todo blacksilence
                        let blacksilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blacksilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                })

                if (id == socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 == socketIdRef.current) continue;

                        try {
                            connections[id2].addStream(window.localStream);
                        } catch (e) {
                            console.log(e);
                        }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }))
                            }).catch(e => { throw new Error(e) }
                            );
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext
        let oscillator = ctx.createOscillator();

        let dst = oscillator.connect(ctx.createMediaStreamDestination());

        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    }

    let black = ({ height = 480, width = 640 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });

        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    }


    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    let handleVideo = () => {
        setVideo(!video);
    }

    let handleAudio = () => {
        setAudio(!audio);
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen]);

    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleEndCall = () => {
        try{
            let tracks = localVidoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch(error) { }
        window.location.href = "/";
    }

    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (error) {
            console.log(error);
        }

        window.localStream = stream;
        localVidoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                }).catch((error) => console.log(error));
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localVidoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blacksilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blacksilence();
            localVidoRef.current.srcObject = window.localStream;

            getUserMedia();
        })
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    }

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e));
            }
        }
    }

    return (
        <div>
            {askForUsername === true ?
                <div>
                    <h2>Enter into lobby</h2>
                    <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                    <Button variant="contained" onClick={connect}>Connect</Button>

                    <div>
                        <video ref={localVidoRef} autoPlay muted></video>
                    </div>

                </div> :
                <div className={styles.meetVideoContainer}>

                    {
                        showModal ?
                            <div className={styles.chatRoom}>
                                <div className={styles.chatContainer}>
                                    <h1>Chat</h1>
                                    <div className={styles.chattingDisplay}>
                                        {
                                            messages.length > 0 ?
                                            messages.map((item, idx) => {
                                                return(
                                                    <div style={{paddingBlock: "0.35rem", cursor: "pointer"}} key={idx}>
                                                        <p style={{fontWeight: "bolder"}}>
                                                            {item.sender}
                                                        </p>
                                                        <p style={{fontSize: "1.25rem", fontWeight: "lighter", marginLeft: "0.5rem"}}>
                                                            {item.data}
                                                        </p>
                                                    </div>
                                                )
                                            }) : <p style={{fontSize: "2rem", fontWeight: "lighter", marginTop: "auto"}}>Start Conversation</p>
                                        }
                                    </div>
                                    <div className={styles.chattingArea}>
                                        <TextField value={message} onChange={e => setMessage(e.target.value)} id="outlined-basic" label="Enter Your Message" variant="outlined" />
                                        <IconButton onClick={sendMessage} style={{color: "rgb(43, 114, 245)"}}>
                                            <Send />
                                        </IconButton>
                                    </div>
                                </div>
                            </div> :
                            <></>
                    }
                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {(video == true) ? <Videocam /> : <VideocamOff />}
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {(audio == true) ? <Mic /> : <MicOff />}
                        </IconButton>
                        {
                            screenAvailable == true ?
                                <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                    {screen == true ? <ScreenShare /> : <StopScreenShare />}
                                </IconButton> : <></>
                        }

                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEnd />
                        </IconButton>

                        <Badge badgeContent={newMessages} max={999} color='primary'>
                            <IconButton onClick={() => { setModal(!showModal) }} style={{ color: "white" }}>
                                <Chat />
                            </IconButton>
                        </Badge>
                    </div>
                    <video ref={localVidoRef} className={styles.meetUserContainer} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {
                            videos.map((video) => (
                                <div key={video.socketId}>
                                    <video data-socket={video.socketId}
                                        ref={ref => {
                                            if (ref && video.stream) {
                                                ref.srcObject = video.stream;
                                            }
                                        }}
                                        autoPlay muted></video>
                                </div>
                            ))
                        }
                    </div>
                </div>}
        </div>
    )
}
