import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, User, AlertCircle, Info } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden px-4">
      {/* Background glow animations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[100px] opacity-15 animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600 rounded-full blur-[100px] opacity-15 animate-pulse-glow" />

      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white mb-3 shadow-md shadow-indigo-600/20">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Access DevTrack</h2>
          <p className="text-slate-400 text-xs mt-1">DevOps Orchestration & Pipeline Simulation</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                placeholder="developer / admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-sm font-semibold rounded-xl text-white transition-all duration-150 flex items-center justify-center shadow-lg shadow-indigo-600/25 disabled:opacity-50 mt-6"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Authenticate Session'
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          First time here?{' '}
          <Link to="/register" className="text-indigo-400 hover:underline font-semibold">
            Create Dev Identity
          </Link>
        </div>

        {/* Development seed account helpers */}
        <div className="mt-6 border-t border-slate-700/50 pt-5">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/30">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5 mb-2">
              <Info className="h-3.5 w-3.5 text-indigo-400" />
              Pre-seeded Accounts (Password: password123)
            </span>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono">
              <div className="bg-slate-950/50 p-1.5 rounded text-center border border-slate-800">
                <span className="text-indigo-300 font-semibold block uppercase">Admin</span>
                username: admin
              </div>
              <div className="bg-slate-950/50 p-1.5 rounded text-center border border-slate-800">
                <span className="text-indigo-300 font-semibold block uppercase">Manager</span>
                username: manager
              </div>
              <div className="bg-slate-950/50 p-1.5 rounded text-center border border-slate-800">
                <span className="text-indigo-300 font-semibold block uppercase">Developer</span>
                username: developer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
