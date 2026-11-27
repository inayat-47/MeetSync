import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from '../src/pages/landing.jsx'
import AuthenticationPage from '../src/pages/authentication.jsx'
import VideoMeetPage from '../src/pages/videoMeet.jsx'
import HomePage from '../src/pages/home.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import HistoryPage from './pages/history.jsx'

function App() {

  return (
    <div className='App'>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path='/' element={<LandingPage />}></Route>
            <Route path='/auth' element={<AuthenticationPage />}></Route>
            <Route path='/home' element={<HomePage />}></Route>
            <Route path='/history' element={<HistoryPage />}></Route>
            <Route path='/:url' element={<VideoMeetPage />}></Route>
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  )
}

export default App
