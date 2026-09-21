import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/common/Layout';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import SearchPage from './pages/SearchPage';
import RelationsPage from './pages/RelationsPage';
import CostsPage from './pages/CostsPage';
import BackupPage from './pages/BackupPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/relations" element={<RelationsPage />} />
          <Route path="/costs" element={<CostsPage />} />
          <Route path="/backup" element={<BackupPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
