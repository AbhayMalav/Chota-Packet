import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import { IncognitoProvider } from './context/IncognitoContext'
import UserProvider from './context/UserContext'
import ThemeProvider from './context/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <IncognitoProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </BrowserRouter>
        </IncognitoProvider>
      </UserProvider>
    </ThemeProvider>
  )
}
