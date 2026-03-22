import React, { useState } from 'react';
import { Card, Badge, Button, Icons } from '../components/UI';
import { Project } from '../types';

interface ProjectsProps {
  projects: Project[];
  onSetActive: (id: string) => void;
  onCreate: (project: Project) => void;
  onDelete?: (id: string) => void;
}

export const Projects: React.FC<ProjectsProps> = ({ projects, onSetActive, onCreate, onDelete }) => {
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  // Color selection removed
  const [startActive, setStartActive] = useState(false);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDesc,
      // color removed
      timeSpentMinutes: 0,
      avgFocusScore: 0,
      workload: 0,
      status: startActive ? 'Active' : 'Inactive',
    };

    onCreate(newProject);

    // Reset and close
    setNewProjectName('');
    setNewProjectDesc('');
    setStartActive(false);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-700">Project Management</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-colors"
        >
          <Icons.FolderKanban className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => {
          const isActive = project.status === 'Active';
          return (
            <Card
              key={project.id}
              className={`transition-all duration-300 ${isActive
                ? 'border-indigo-500 shadow-indigo-100 ring-1 ring-indigo-500/20'
                : 'hover:border-slate-300'
                }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/10 text-white font-bold text-2xl`}>
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-800">{project.name}</h3>
                      {isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5 animate-pulse"></span>
                          Active
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-slate-500 mt-1 max-w-md">{project.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end items-center gap-4 flex-1 max-w-2xl bg-slate-50/50 p-4 rounded-xl border border-slate-100">

                  <div className="space-y-1 flex flex-col justify-between items-end">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide text-right">Status</p>
                      <p className={`text-sm font-semibold text-right ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {project.status}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isActive && (
                        <>
                          <button
                            onClick={() => onSetActive(project.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                          >
                            Set Active
                          </button>
                          <button
                            onClick={() => onDelete && onDelete(project.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete Project"
                          >
                            <Icons.Trash className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {isActive && (
                        <button
                          onClick={() => onDelete && onDelete(project.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-50 hover:opacity-100"
                          title="Delete Project"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* --- NEW PROJECT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800">New Project</h3>
              <p className="text-sm text-slate-500">Create a workspace for your analytics.</p>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Project Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-300"
                  placeholder="e.g. Mobile App Refactor"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Description <span className="font-normal text-slate-400">(Optional)</span></label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none h-20 placeholder:text-slate-300"
                  placeholder="What are the goals for this project?"
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer" onClick={() => setStartActive(!startActive)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${startActive ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300'}`}>
                  {startActive && <Icons.Zap className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-slate-600 font-medium">Immediately set as Active Project</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={!newProjectName.trim()}
                >
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};