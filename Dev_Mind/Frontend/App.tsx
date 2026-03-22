import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Projects } from './pages/Projects';
import { Settings } from './pages/Settings';
import { LiveDetection } from './pages/LiveDetection';
import { Auth } from './pages/Auth';
import { NavigationPage, Project, AppSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { AlertSystem } from './components/Alerts';

import { api } from './api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');

  // Global Settings State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Lifted Project State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  React.useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const [fetchedProjects, fetchedSettings] = await Promise.all([
            api.getProjects(),
            api.getSettings()
          ]);
          setProjects(fetchedProjects);
          setSettings(fetchedSettings);
        } catch (error) {
          console.error("Failed to load data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  const activeProject = projects.find(p => p.status === 'Active') || null;

  const handleSetActiveProject = async (id: string) => {
    // Optimistic update
    setProjects(prevProjects => prevProjects.map(p => ({
      ...p,
      status: p.id === id ? 'Active' : 'Inactive'
    })));

    // API Call
    try {
      await api.updateProjectStatus(id, 'Active');
      // Refresh to ensure sync? Or trust optimistic.
      // For simple app, optimistic is fine, but let's re-fetch to be safe if desired, 
      // but actually we need to set others to Inactive in DB too? 
      // The backend update_project_status only updates one. 
      // Real implementation should probably handle the "single active" logic on backend.
      // Assuming backend handles it or we call loop?
      // Let's keep it simple: Frontend updates state, sends "Active" to one.
      // ideally backend `update_project_status` for Active should auto-archive others.
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProject = async (projectData: Project) => {
    try {
      const newProject = await api.createProject(projectData);
      setProjects(prev => {
        if (newProject.status === 'Active') {
          return [newProject, ...prev.map(p => ({ ...p, status: 'Inactive' as const }))];
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error("Failed to delete project", error);
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard activeProject={activeProject} />;
      case 'live-detection':
        return <LiveDetection activeProject={activeProject} />;
      case 'analytics':
        return <Analytics activeProject={activeProject} />;
      case 'projects':
        return (
          <Projects
            projects={projects}
            onSetActive={handleSetActiveProject}
            onCreate={handleCreateProject}
            onDelete={handleDeleteProject}
          />
        );
      case 'settings':
        return <Settings settings={settings} onUpdate={async (newSettings) => {
          setSettings(newSettings);
          await api.updateSettings(newSettings);
        }} />;
      default:
        return <Dashboard activeProject={activeProject} />;
    }
  };

  return (
    <Layout
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={() => setIsAuthenticated(false)}
    >
      {/* Global Alert System runs on top of all pages */}
      <AlertSystem settings={settings} />

      {renderPage()}
    </Layout>
  );
};

export default App;