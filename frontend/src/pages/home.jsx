import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import { IconButton, Button, TextField } from '@mui/material';
import { Restore } from '@mui/icons-material';
import "../App.css"
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("")

    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    }

    return (
        <>
            <div className={"navBar"}>
                <div style={{display: "flex", alignItems: "center"}}>
                    <h1>MeetSync</h1>
                </div>

                <div style={{display: "flex", alignItems: "center"}}>
                    <IconButton onClick={() => {
                        navigate("/history");
                    }}>
                        <Restore />
                        <p>History</p>
                    </IconButton>
                    <Button style={{display: "flex", alignItems: "center"}} onClick={() => {
                        localStorage.removeItem("token");
                        navigate("/auth");
                    }}>
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>
                            We Provide Quality <br />
                            Join Now!
                        </h2>

                        <div style={{display: "flex", gap: "1rem"}}>
                            <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant='outlined'></TextField>
                            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>
                        </div>
                    </div>
                </div>

                <div className="rightPanel">
                    <img src="/logo3.png" alt="" />
                </div>
            </div>
        </>
    )
}

export default withAuth(HomeComponent);
