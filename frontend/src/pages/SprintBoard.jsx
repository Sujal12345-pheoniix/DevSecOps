import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Plus, User, Calendar, Trash2, Edit2, ShieldAlert } from 'lucide-react';

const SprintBoard = () => {
  const { user } = useAuth();
  const { triggerToast } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null if creating
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
  });

  const columns = [
    { name: 'To Do', status: 'TODO', color: 'border-t-slate-400 bg-slate-50 dark:bg-slate-900/50' },
    { name: 'In Progress', status: 'IN_PROGRESS', color: 'border-t-blue-500 bg-blue-50/10 dark:bg-blue-950/5' },
    { name: 'In Review', status: 'IN_REVIEW', color: 'border-t-amber-500 bg-amber-50/10 dark:bg-amber-950/5' },
    { name: 'Completed', status: 'COMPLETED', color: 'border-t-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const projectsRes = await API.get('/projects');
      setProjects(projectsRes.data);
      if (projectsRes.data.length > 0) {
        setSelectedProjectId(projectsRes.data[0].id);
      }

      const usersRes = await API.get('/auth/users');
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching sprint board dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (projId) => {
    if (!projId) return;
    try {
      const response = await API.get(`/tasks/project/${projId}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Drag and Drop implementation
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('taskId');
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr);

    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate || taskToUpdate.status === targetStatus) return;

    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
      );

      // Backend API update
      await API.put(`/tasks/${taskId}`, {
        title: taskToUpdate.title,
        description: taskToUpdate.description,
        status: targetStatus,
        priority: taskToUpdate.priority,
        assigneeId: taskToUpdate.assigneeId,
        projectId: selectedProjectId,
        dueDate: taskToUpdate.dueDate,
      });

      triggerToast(`Task moved to ${targetStatus.replace('_', ' ')}`, 'SUCCESS');
      fetchTasks(selectedProjectId);
    } catch (error) {
      console.error('Error updating task status via drag:', error);
      triggerToast('Failed to transition task status.', 'ERROR');
      fetchTasks(selectedProjectId); // roll back
    }
  };

  // Form Handling
  const openCreateModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: '',
      dueDate: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || '',
      dueDate: task.dueDate || '',
    });
    setModalOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...taskForm,
        projectId: selectedProjectId,
        assigneeId: taskForm.assigneeId ? parseInt(taskForm.assigneeId) : null,
      };

      if (editingTask) {
        await API.put(`/tasks/${editingTask.id}`, payload);
        triggerToast('Sprint Task updated successfully.', 'SUCCESS');
      } else {
        await API.post('/tasks', payload);
        triggerToast('Sprint Task created successfully.', 'SUCCESS');
      }
      setModalOpen(false);
      fetchTasks(selectedProjectId);
    } catch (error) {
      console.error('Error saving task:', error);
      triggerToast('Failed to save sprint task settings.', 'ERROR');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      triggerToast('Sprint Task removed.', 'SUCCESS');
      setModalOpen(false);
      fetchTasks(selectedProjectId);
    } catch (error) {
      console.error('Error deleting task:', error);
      triggerToast('Failed to delete task.', 'ERROR');
    }
  };

  const getTaskPriorityStyle = (prio) => {
    switch (prio) {
      case 'HIGH': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'LOW':
      default: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-8 overflow-y-auto custom-scrollbar flex flex-col h-full text-slate-700 dark:text-slate-300">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <label className="font-bold text-xs uppercase tracking-wider text-slate-400">Current Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold shadow-sm focus:outline-none focus:border-indigo-500"
          >
            {projects.length === 0 ? (
              <option value="">No Projects Configured</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>
        </div>

        <button
          onClick={openCreateModal}
          disabled={!selectedProjectId}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/15 disabled:opacity-50 transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 bg-white dark:bg-darkCard">
          <ShieldAlert className="h-12 w-12 text-slate-400 mb-4 animate-bounce" />
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">No Projects Created</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-sm text-center">
            Go to Settings & DB page to create a project or seed default mock data.
          </p>
        </div>
      ) : (
        /* Kanban Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 items-start">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.status)}
                className={`rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 border-t-4 ${col.color} flex flex-col min-h-[500px] transition-all duration-150`}
              >
                {/* Column Title */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-white">{col.name}</span>
                  <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar pb-6">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => openEditModal(task)}
                      className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-150 hover:-translate-y-0.5"
                    >
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white leading-tight mb-2">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {task.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/40">
                        {/* Assignee */}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <User className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="truncate max-w-[80px] font-semibold">
                            {task.assigneeUsername || 'Unassigned'}
                          </span>
                        </div>

                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getTaskPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="h-28 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl">
                      Drag tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
              {editingTask ? 'Edit Sprint Task' : 'Create Sprint Task'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Deploy Docker Service..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
                  placeholder="Task specifications..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Column Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Developer Assignment</label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-all duration-150"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 transition-all duration-150"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintBoard;
