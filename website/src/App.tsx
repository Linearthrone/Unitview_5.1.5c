import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { HouseVictoriaPage } from './pages/HouseVictoriaPage'
import { LlmodPage } from './pages/LlmodPage'
import { UnitViewPage } from './pages/UnitViewPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="site-shell">
        <SiteHeader />
        <main className="site-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/unitview" element={<UnitViewPage />} />
            <Route path="/llmod" element={<LlmodPage />} />
            <Route path="/house-victoria" element={<HouseVictoriaPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </BrowserRouter>
  )
}
