import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CheckSquare, GitBranch, Settings, LogOut, ShieldAlert, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Sprint Board', path: '/tasks', icon: <CheckSquare className="h-5 w-5" /> },
    { name: 'Pipelines', path: '/pipelines', icon: <GitBranch className="h-5 w-5" /> },
    { name: 'Settings & DB', path: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const formatRole = (role) => {
    if (!role) return '';
    return role.replace('ROLE_', '');
  };

  return (
    <>
      {/* Mobile Sidebar Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800/60 text-slate-300 flex flex-col h-full z-50 lg:z-30 lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Platform Branding & Close Btn */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-1.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-md">DevTrack</span>
              <span className="text-[9px] text-indigo-400 block -mt-1 font-semibold uppercase tracking-wider">DevSecOps Suite</span>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white lg:hidden transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)} // Auto close on mobile
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/15'
                    : 'hover:bg-slate-850 hover:text-white text-slate-400'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Session Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-950 to-slate-900 border border-indigo-700/30 flex items-center justify-center font-bold text-indigo-300 text-sm uppercase shadow-inner">
              {user?.username?.substring(0, 2) || 'DV'}
            </div>
            <div className="overflow-hidden">
              <span className="font-semibold text-white block text-sm truncate">{user?.username}</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                {formatRole(user?.role)}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-800 hover:border-rose-500/20 hover:bg-rose-500/5 hover:text-rose-400 transition-all duration-150 text-slate-450 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
