import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AlertsPage } from '../pages/AlertsPage';
import { AuditPage } from '../pages/AuditPage';
import { DashboardPage } from '../pages/DashboardPage';
import { LogGeneratorPage } from '../pages/LogGeneratorPage';
import { LogsPage } from '../pages/LogsPage';
import { ThesisAuditAlertPage } from '../pages/ThesisAuditAlertPage';
import { ThesisDashboardPage } from '../pages/ThesisDashboardPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/thesis-dashboard" element={<ThesisDashboardPage />} />
      <Route path="/thesis-audit-alert" element={<ThesisAuditAlertPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/log-generator" element={<LogGeneratorPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
      </Route>
    </Routes>
  );
}
