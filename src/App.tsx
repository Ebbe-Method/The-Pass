import { BrowserRouter, Route, Routes } from 'react-router'
import { Kiosk } from '@/components/Kiosk'
import { demoTickets } from '@/fixtures/tickets'
import { DesignPage } from '@/pages/DesignSystem'
import { InstallPage } from '@/pages/InstallPage'
import { RepoBoardPage } from '@/pages/RepoBoardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Kiosk
              tickets={demoTickets}
              owner="fuseon-connections"
              repo="fuse-on-v2"
              demo
            />
          }
        />
        <Route path="/design" element={<DesignPage />} />
        <Route path="/install" element={<InstallPage />} />
        <Route path="/:owner/:repo" element={<RepoBoardPage />} />
      </Routes>
    </BrowserRouter>
  )
}
