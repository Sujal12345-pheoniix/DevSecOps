import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Play, Terminal, History, ChevronRight, Activity, CheckCircle2, XCircle, ShieldAlert, Loader } from 'lucide-react';

const PipelineSimulator = () => {
  const { user } = useAuth();
  const { triggerToast } = useNotifications();
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [stages, setStages] = useState([]);
  const [logs, setLogs] = useState('');
  
  const [activeRunId, setActiveRunId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const terminalEndRef = useRef(null);
  const pollingRef = useRef(null);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      const response = await API.get('/pipelines');
      setPipelines(response.data);
      if (response.data.length > 0) {
        setSelectedPipelineId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (pipeId) => {
    if (!pipeId) return;
    try {
      const response = await API.get(`/pipelines/${pipeId}/runs`);
      setRuns(response.data.sort((a, b) => b.runNumber - a.runNumber));
    } catch (error) {
      console.error('Error fetching run history:', error);
    }
  };

  const fetchRunDetails = async (runId) => {
    try {
      const runRes = await API.get(`/pipelines/runs/${runId}`);
      const stagesRes = await API.get(`/pipelines/runs/${runId}/stages`);
      
      setSelectedRun(runRes.data);
      setStages(stagesRes.data);

      // Aggregate live logs from stages
      let consolidatedLogs = '';
      stagesRes.data.forEach((stage) => {
        consolidatedLogs += `=== ${stage.stageName} STAGE (${stage.status}) ===\n${stage.logs || ''}\n`;
      });
      setLogs(consolidatedLogs);

      if (runRes.data.status !== 'RUNNING') {
        setActiveRunId(null);
        if (pollingRef.current) clearInterval(pollingRef.current);
        // Refresh history to update the lists
        fetchHistory(selectedPipelineId);
      }
    } catch (error) {
      console.error('Error polling run logs:', error);
    }
  };

  const handleTriggerPipeline = async () => {
    if (!selectedPipelineId) return;
    try {
      const response = await API.post(`/pipelines/${selectedPipelineId}/trigger`);
      const newRun = response.data;
      
      triggerToast('Pipeline job triggered. Starting BUILD stage...', 'INFO');
      
      setActiveRunId(newRun.id);
      setSelectedRun(newRun);
      setLogs('Triggering build job...\nInitializing pipeline runner...\n');
      setStages([]);
      
      // Refresh list
      fetchHistory(selectedPipelineId);
    } catch (error) {
      console.error('Error triggering pipeline:', error);
      triggerToast(error.response?.data?.message || 'Failed to trigger pipeline.', 'ERROR');
    }
  };

  // Initial loads
  useEffect(() => {
    fetchPipelines();
  }, []);

  // History load on pipeline select
  useEffect(() => {
    if (selectedPipelineId) {
      fetchHistory(selectedPipelineId);
      setSelectedRun(null);
      setStages([]);
      setLogs('Select an execution run from history to audit terminal outputs.');
      setActiveRunId(null);
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [selectedPipelineId]);

  // Polling setup for active runs
  useEffect(() => {
    if (activeRunId) {
      fetchRunDetails(activeRunId);
      pollingRef.current = setInterval(() => {
        fetchRunDetails(activeRunId);
      }, 1500);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeRunId]);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getStageIcon = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      case 'RUNNING':
        return <Loader className="h-5 w-5 text-indigo-500 animate-spin" />;
      case 'PENDING':
      default:
        return <Clock className="h-5 w-5 text-slate-400 dark:text-slate-600" />;
    }
  };

  const getPipelineStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'FAILED': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'RUNNING': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 animate-pulse';
      case 'IDLE':
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const activePipeline = pipelines.find((p) => p.id === parseInt(selectedPipelineId));

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-8 overflow-y-auto custom-scrollbar flex flex-col h-full text-slate-700 dark:text-slate-300">
      
      {pipelines.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 bg-white dark:bg-darkCard">
          <ShieldAlert className="h-12 w-12 text-slate-400 mb-4 animate-bounce" />
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">No Pipelines Loaded</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-sm text-center">
            Pipelines are automatically created when you register new projects. Please create a project under settings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 items-stretch">
          
          {/* Left Panel: Trigger & Stepper & History */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Pipeline Configuration Control */}
            <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
              <div>
                <label className="font-bold text-xs uppercase tracking-wider text-slate-400 block mb-2">Target Pipeline</label>
                <select
                  value={selectedPipelineId}
                  onChange={(e) => setSelectedPipelineId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold shadow-sm focus:outline-none"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {activePipeline && (
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Status</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border mt-1 inline-block ${getPipelineStatusColor(activePipeline.status)}`}>
                      {activePipeline.status}
                    </span>
                  </div>

                  <button
                    onClick={handleTriggerPipeline}
                    disabled={activePipeline.status === 'RUNNING' || activeRunId !== null}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all duration-150 shadow-md shadow-indigo-600/10"
                  >
                    <Play className="h-4 w-4" />
                    Trigger Run
                  </button>
                </div>
              )}
            </div>

            {/* Stepper (Visible when a run is selected) */}
            {selectedRun && (
              <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Pipeline Execution Stages</h3>
                <div className="space-y-4">
                  {stages.map((stage) => (
                    <div key={stage.id} className="flex items-center gap-3 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl">
                      {getStageIcon(stage.status)}
                      <div className="flex-1">
                        <span className="font-semibold text-xs text-slate-800 dark:text-white block uppercase tracking-wide">
                          {stage.stageName} Stage
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Status: {stage.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}

                  {stages.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Initializing stages...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Execution History */}
            <div className="bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex-1 flex flex-col min-h-[250px]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-500" />
                Execution History
              </h3>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                {runs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                    No runs recorded yet.
                  </div>
                ) : (
                  runs.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => {
                        if (activeRunId === null) {
                          setSelectedRun(run);
                          fetchRunDetails(run.id);
                        }
                      }}
                      className={`p-3 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-150 ${
                        selectedRun?.id === run.id 
                          ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/20'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-xs text-slate-800 dark:text-white block">
                          Run #{run.runNumber}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(run.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getPipelineStatusColor(run.status)}`}>
                        {run.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Panel: Terminal Logs Console */}
          <div className="lg:col-span-2 bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden flex flex-col shadow-2xl min-h-[500px]">
            {/* Terminal Window Header */}
            <div className="h-10 bg-slate-900 border-b border-slate-850 px-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 uppercase font-semibold">
                <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                console_terminal.sh
              </span>
              <div className="w-12" />
            </div>

            {/* Terminal Console Stream */}
            <div className="flex-1 p-6 font-mono text-xs overflow-y-auto custom-scrollbar select-text selection:bg-indigo-500 selection:text-white text-emerald-400 whitespace-pre-wrap leading-relaxed">
              {logs}
              <div ref={terminalEndRef} />
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default PipelineSimulator;
