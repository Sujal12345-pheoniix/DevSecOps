import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Plus, Trash2, Folder, ShieldCheck, Database, ShieldAlert, Award } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { triggerToast } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await API.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects in settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name) return;
    try {
      await API.post('/projects', newProject);
      triggerToast('Project created! A CI/CD pipeline was automatically provisioned.', 'SUCCESS');
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      triggerToast('Failed to create project. Verify permissions.', 'ERROR');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks, pipelines, and logs will be permanently deleted.')) return;
    try {
      await API.delete(`/projects/${id}`);
      triggerToast('Project and pipelines deleted successfully.', 'SUCCESS');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      triggerToast('Failed to delete project. Verify authority.', 'ERROR');
    }
  };

  const hasManagementAccess = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER';

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-8 overflow-y-auto custom-scrollbar flex flex-col h-full text-slate-700 dark:text-slate-300">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Project Creation & Management */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Create Project Panel */}
          <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Folder className="h-4 w-4 text-indigo-500" />
              Provision New Project
            </h3>

            {hasManagementAccess ? (
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-850 dark:text-white focus:outline-none focus:border-indigo-500"
                    placeholder="E.g., Payment Gateway Service"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-850 dark:text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
                    placeholder="Specify project scope and docker containers parameters..."
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 transition-all duration-150"
                >
                  Provision Project
                </button>
              </form>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
                <span>Unauthorized: Project creation is reserved for managers and administrators.</span>
              </div>
            )}
          </div>

          {/* Manage Projects List */}
          <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Registry Projects List</h3>
            
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No projects currently provisioned in the registry.
                </div>
              ) : (
                projects.map((proj) => (
                  <div key={proj.id} className="p-4 border border-slate-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-sm text-slate-800 dark:text-white block">{proj.name}</span>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{proj.description}</p>
                      <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                        Owner: {proj.ownerUsername} • Provisioned on: {new Date(proj.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {hasManagementAccess && (
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-2 border border-slate-100 dark:border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-xl transition-all duration-150"
                        title="Delete project"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Role Explanations Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              Role Permissions Matrix
            </h3>

            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Administrator (ROLE_ADMIN)</span>
                <p className="text-slate-400 leading-normal">
                  Full read and write capabilities. Can manage system projects, trigger simulator tasks, and review analytical logs.
                </p>
              </div>

              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Project Manager (ROLE_MANAGER)</span>
                <p className="text-slate-400 leading-normal">
                  Can create and configure projects, create and update sprint tasks, and trigger deployment pipelines.
                </p>
              </div>

              <div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">Developer (ROLE_DEVELOPER)</span>
                <p className="text-slate-400 leading-normal">
                  Assigned sprint board tasks. Can update task states on the Kanban board (drag & drop) and review pipeline execution consoles.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600/5 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-950/60 p-6 rounded-2xl flex flex-col items-center text-center">
            <Award className="h-10 w-10 text-indigo-500 mb-3" />
            <h4 className="font-bold text-sm text-slate-850 dark:text-white">Enterprise Readiness</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              DevTrack demonstrates production-ready principles: stateless JWT sessions, relational referential integrity, and asynchronous simulation pipelines.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
