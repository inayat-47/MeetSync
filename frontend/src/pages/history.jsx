import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import { Snackbar , Card, CardContent, Typography } from '@mui/material';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [msg, setMsg] = useState("");
    const routeTo = useNavigate();

    const [state, setState] = React.useState({
        open: false,
        vertical: 'top',
        horizontal: 'center',
    });
    const { vertical, horizontal } = state;
    const handleClose = () => {
        setState({ ...state, open: false });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history.meetings);
            } catch (error) {
                setMsg(error);
            }
        }

        fetchHistory();
    }, []);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    return (
        <div>
            <Snackbar
                anchorOrigin={{ vertical, horizontal }}
                autoHideDuration={4000}
                onClose={handleClose}
                message={msg}
                key={vertical + horizontal}
            />
            {
                (meetings.length !== 0) ? meetings.map((e) => {
                    return (
                        <Card key={e._id} variant="outlined">
                            <CardContent>
                                <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                                    Code: {e.meetingCode}
                                </Typography>

                                <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                                    Date: {formatDate(e.date)}
                                </Typography>
                            </CardContent>
                        </Card>
                    )
                }) : <div>No History Found</div>
            }
        </div>
    )
}
