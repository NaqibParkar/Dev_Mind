import { Project, AppSettings, User, NavigationPage } from './types';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  async createProject(project: Partial<Project>): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  async updateProjectStatus(projectId: string, status: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/status?status=${status}`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to update project status');
    return response.json();
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete project');
  },

  async getSettings(): Promise<AppSettings> {
    const response = await fetch(`${API_BASE_URL}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },

  async updateSettings(settings: AppSettings): Promise<AppSettings> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  },

  async getDashboardStats(): Promise<{
    current_zone: string;
    focus_score: number;
    burnout_risk: string;
    deep_work_minutes: number;
    chart_data: { name: string; val: number }[];
  }> {
    const response = await fetch(`${API_BASE_URL}/activity/dashboard`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  async getLiveActivity(): Promise<{
    keystrokes: number;
    mouse_intensity: number;
    focus_score: number;
    cognitive_load: number;
    active_window: string;
    burnout_risk: string;
    context_switches: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/activity/live`);
    if (!response.ok) throw new Error('Failed to fetch live activity');
    return response.json();
  },

  async getAnalyticsData(projectId: string | null, granularity: string): Promise<{
    label: string;
    focus: number;
    workload: number;
    cognitiveLoad: number;
    prevFocus: number;
    prevWorkload: number;
  }[]> {
    const query = new URLSearchParams({ granularity });
    if (projectId) query.append('project_id', projectId);

    const response = await fetch(`${API_BASE_URL}/activity/analytics?${query.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch analytics data');
    return response.json();
  },

  async login(email: string, password: string): Promise<User & { accessToken: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    return { name: email.split('@')[0], email, accessToken: data.access_token };
  },

  async register(email: string, password: string, fullName?: string): Promise<User & { accessToken: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    if (!response.ok) throw new Error('Registration failed');
    const data = await response.json();
    return { name: fullName || email.split('@')[0], email, accessToken: data.access_token };
  }
};
