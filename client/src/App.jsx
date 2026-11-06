import { MotionConfig } from "framer-motion";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import IncidentHistory from "./pages/IncidentHistory.jsx";
import IncidentDetail from "./pages/IncidentDetail.jsx";
import MemoryBank from "./pages/MemoryBank.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="incidents" element={<IncidentHistory />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route path="memory" element={<MemoryBank />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
    </MotionConfig>
  );
}
