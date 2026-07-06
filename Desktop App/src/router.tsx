import { HashRouter, Route, Routes } from "react-router-dom";

import { Layout } from "./components/layout/Layout";
import { PairingGuard } from "./components/pairing/PairingGuard";
import CampaignDetail from "./pages/CampaignDetail";
import Contacts from "./pages/Contacts";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Lists from "./pages/Lists";
import NewCampaign from "./pages/NewCampaign";
import Pairing from "./pages/Pairing";
import Settings from "./pages/Settings";

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/pareo" element={<Pairing />} />
        <Route element={<PairingGuard />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contactos" element={<Contacts />} />
            <Route path="/listas" element={<Lists />} />
            <Route path="/campana/nueva" element={<NewCampaign />} />
            <Route path="/historial" element={<History />} />
            <Route path="/historial/:id" element={<CampaignDetail />} />
            <Route path="/configuracion" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}
