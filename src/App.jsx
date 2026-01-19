
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Map as MapIcon, Plus } from 'lucide-react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import HomePage from './pages/HomePage'
import CharacterCreatePage from './pages/CharacterCreatePage'
import MapListPage from './pages/MapListPage'
import MapDetailPage from './pages/MapDetailPage'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black text-indigo-600 tracking-tight hover:scale-105 transition-transform">
            시뮬레이셔너
          </Link>
          <nav className="flex gap-2">
            <Link to="/characters/new" className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="캐릭터 만들기">
              <Users size={24} />
            </Link>
            <Link to="/maps" className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="내 지도">
              <MapIcon size={24} />
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/characters/new" element={<CharacterCreatePage />} />
            <Route path="/maps" element={<MapListPage />} />
            <Route path="/maps/:id" element={<MapDetailPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <SpeedInsights />
    </>
  )
}

export default App
