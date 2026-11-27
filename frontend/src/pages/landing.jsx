import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
    return (
        <>
            <div className="landingPageContainer">
                <nav className="navbar">
                    <div className="nav-header">
                        <h1>MeetSync</h1>
                    </div>
                    <div className="nav-list">
                        <p>Join As Guest</p>
                        <p onClick={() => window.location.href = "/auth"}>Register</p>
                        <div role="button" onClick={() => window.location.href = "/auth"}><p>Login</p></div>
                    </div>
                </nav>
                <div className="landingMainContainer">
                    <div>
                        <h1><span style={{color: "#FF9839"}}>Connect</span> with your loved ones</h1>
                        <p>Cover a distance by MeetSync</p>
                        <div role='button'>
                            <Link to={'/auth'}>Get Started</Link>
                        </div>
                    </div>
                    <div>
                        <img src='/mobile.png' alt="" />
                    </div>
                </div>
            </div>
        </>
    )
}
