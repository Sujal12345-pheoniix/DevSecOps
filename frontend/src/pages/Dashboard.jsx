import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ShieldCheck, Activity, Layers, Clock, Terminal, Cpu, Database, Server, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const { triggerToast } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [recentDeployments, setRecentDeployments] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [stats, setStats] = useState({
    projectsCount: 0,
    runningPipelines: 0,
    activeTasks: 0,
    successRate: 0,
  });
  const [taskChartData, setTaskChartData] = useState([]);
  const [pipelineChartData, setPipelineChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live nodes state for DevSecOps look & feel
  const systemNodes = [
    { name: 'API Gateway', status: 'ONLINE', latency: '4ms', type: 'Gateway', icon: <Server className="h-4 w-4 text-emerald-500" /> },
    { name: 'Auth Server (JWT)', status: 'SECURE', latency: '8ms', type: 'Security', icon: <ShieldCheck className="h-4 w-4 text-indigo-500" /> },
    { name: 'MySQL Database Cluster', status: 'SYNCED', latency: '2ms', type: 'Database', icon: <Database className="h-4 w-4 text-cyan-500" /> },
    { name: 'Orchestrator Node', status: 'ACTIVE', latency: '12ms', type: 'Runner', icon: <Cpu className="h-4 w-4 text-violet-500" /> },
  ];

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const projectsRes = await API.get('/projects');
      const projectsData = projectsRes.data;
      setProjects(projectsData);

      const pipelinesRes = await API.get('/pipelines');
      const pipelinesData = pipelinesRes.data;
      setPipelines(pipelinesData);

      const recentRes = await API.get('/pipelines/recent-deployments');
      setRecentDeployments(recentRes.data);

      const myTasksRes = await API.get(`/tasks/assignee/${user.id}`);
      setMyTasks(myTasksRes.data);

      let allTasks = [];
      let successRuns = 0;
      let totalRuns = 0;

      for (const proj of projectsData) {
        const tasksRes = await API.get(`/tasks/project/${proj.id}`);
        allTasks = [...allTasks, ...tasksRes.data];

        const runsRes = await API.get(`/pipelines/${proj.id}/runs`);
        const runs = runsRes.data;
        totalRuns += runs.length;
        successRuns += runs.filter(r => r.status === 'SUCCESS').length;
      }

      const activeTasksCount = allTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
      const runningPipelinesCount = pipelinesData.filter(p => p.status === 'RUNNING').length;
      const rate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;

      setStats({
        projectsCount: projectsData.length,
        runningPipelines: runningPipelinesCount,
        activeTasks: activeTasksCount,
        successRate: rate,
      });

      const todo = allTasks.filter(t => t.status === 'TODO').length;
      const inProgress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const inReview = allTasks.filter(t => t.status === 'IN_REVIEW').length;
      const completed = allTasks.filter(t => t.status === 'COMPLETED').length;

      setTaskChartData([
        { name: 'To Do', value: todo || 0, color: '#94a3b8' },
        { name: 'In Progress', value: inProgress || 0, color: '#3b82f6' },
        { name: 'In Review', value: inReview || 0, color: '#f59e0b' },
        { name: 'Completed', value: completed || 0, color: '#10b981' },
      ]);

      const pipelineStats = projectsData.map(proj => {
        const projPipelines = pipelinesData.filter(p => p.projectId === proj.id);
        const active = projPipelines.filter(p => p.status === 'RUNNING').length;
        const idle = projPipelines.filter(p => p.status === 'IDLE').length;
        const success = projPipelines.filter(p => p.status === 'SUCCESS').length;
        return {
          name: proj.name,
          Success: success,
          Active: active,
          Idle: idle,
        };
      });
      setPipelineChartData(pipelineStats);

      if (silent) {
        triggerToast('Dashboard metrics refreshed.', 'INFO');
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleRefreshClick = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white transition-colors duration-150">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const getTaskPriorityColor = (prio) => {
    switch (prio) {
      case 'HIGH': return 'text-rose-550 bg-rose-500/10 border-rose-500/20 dark:text-rose-450';
      case 'MEDIUM': return 'text-amber-550 bg-amber-500/10 border-amber-500/20 dark:text-amber-450';
      case 'LOW':
      default: return 'text-emerald-550 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-450';
    }
  };

  const getPipelineRunColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
      case 'FAILED': return 'text-rose-600 dark:text-rose-400 bg-rose-500/10';
      case 'RUNNING': return 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 animate-pulse';
      case 'IDLE':
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  const formatGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 sm:p-8 overflow-y-auto custom-scrollbar transition-colors duration-150 text-slate-700 dark:text-slate-350">
      
      {/* Welcome Greeting Banner (Vercel Style Card) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-10 animate-pulse-glow pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-violet-600 rounded-full blur-[120px] opacity-10 animate-pulse-glow pointer-events-none" />
        
        <div className="relative z-10">
          <span className="text-xs text-indigo-455 font-bold uppercase tracking-widest block mb-1">Operational Overview</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {formatGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-200">{user?.username}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
            All DevSecOps clusters are monitored. Toggle deployment pipeline executors under the Simulator panel to update active workloads.
          </p>
        </div>

        <button
          onClick={handleRefreshClick}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-850 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-md relative z-10 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Sync Registry'}
        </button>
      </div>

      {/* 4 Stats Cards Grid with hover translations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Total Projects */}
        <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-xl transition-all group-hover:scale-105">
              <Layers className="h-6 w-6" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider font-mono">NODE_01</span>
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider block">Registry Projects</span>
          <span className="text-3xl font-extrabold dark:text-white mt-1 block">{stats.projectsCount}</span>
        </div>

        {/* Active Pipelines */}
        <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 p-3 rounded-xl transition-all group-hover:scale-105">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider font-mono">NODE_02</span>
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider block">Running Pipeline Jobs</span>
          <span className="text-3xl font-extrabold dark:text-white mt-1 block">{stats.runningPipelines}</span>
        </div>

        {/* Active Tasks */}
        <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-xl transition-all group-hover:scale-105">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider font-mono">NODE_03</span>
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider block">Sprint Backlog Queue</span>
          <span className="text-3xl font-extrabold dark:text-white mt-1 block">{stats.activeTasks}</span>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl transition-all group-hover:scale-105">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider font-mono">NODE_04</span>
          </div>
          <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider block">Success Index</span>
          <span className="text-3xl font-extrabold dark:text-white mt-1 block">{stats.successRate}%</span>
        </div>
      </div>

      {/* Cluster Nodes Latency Monitor Grid (Sleek custom component) */}
      <div className="mb-8">
        <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-indigo-500" />
            Operational Pod Latency Monitors
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemNodes.map((node) => (
              <div key={node.name} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl hover:border-indigo-500/20 transition-all duration-150">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800/80 shadow-sm">
                    {node.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block">{node.name}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{node.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-500 block">● {node.status}</span>
                  <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{node.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Task Distribution */}
        <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-6">Sprint Task Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {taskChartData.every(item => item.value === 0) ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                <AlertCircle className="h-6 w-6 text-slate-400" />
                No tasks seeded. Create tasks in the Sprint Board.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {taskChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pipeline Analytics */}
        <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-400 mb-6">Pipeline Job Metrics</h3>
          <div className="h-64">
            {pipelineChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 flex flex-col gap-2">
                <AlertCircle className="h-6 w-6 text-slate-400" />
                No active pipelines found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Success" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="Idle" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row with User's Tasks and Recent Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User's Assigned Tasks */}
        <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4">My Sprint Assignments</h3>
          {myTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              No sprint tasks assigned to you.
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-550">
                    <th className="pb-3 font-semibold">Title</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Priority</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                  {myTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-850 dark:text-slate-200">{task.title}</td>
                      <td className="py-3.5">
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${getTaskPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 dark:text-slate-500 font-mono">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Deployments */}
        <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-4 flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-indigo-500" />
            Live Build Stream
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[280px] custom-scrollbar">
            {recentDeployments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                No recent deployments recorded.
              </div>
            ) : (
              recentDeployments.map((run) => (
                <div key={run.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 last:border-b-0 last:pb-0">
                  <div className="overflow-hidden pr-2">
                    <span className="font-semibold text-xs text-slate-805 dark:text-white block truncate">
                      {run.pipelineName}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                      Run #{run.runNumber} • Triggered: {run.triggeredByUsername}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase flex-shrink-0 ${getPipelineRunColor(run.status)}`}>
                    {run.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
