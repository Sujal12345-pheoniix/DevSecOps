import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Sun, Moon, Check, CheckCheck, Menu } from 'lucide-react';

const Navbar = ({ title, onMenuClick }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const popoverRef = useRef(null);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAlertColor = (notifType) => {
    switch (notifType) {
      case 'SUCCESS': return 'bg-emerald-500';
      case 'ERROR': return 'bg-rose-500';
      case 'WARNING': return 'bg-amber-500';
      case 'INFO':
      default: return 'bg-sky-500';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-darkCard px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-150">
      
      {/* Title & Mobile Toggle Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-md sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight truncate max-w-[200px] sm:max-w-none">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Dark/Light Mode */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-150"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 relative transition-all duration-150"
            aria-label="View alerts"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 transform origin-top-right transition-all">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/10">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-450 dark:text-slate-400">System Alerts</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Read all
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-450 dark:text-slate-500">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.readStatus && markAsRead(notif.id)}
                      className={`p-3.5 border-b border-slate-105 dark:border-slate-800/60 flex gap-3 cursor-pointer transition-all duration-150 ${
                        notif.readStatus 
                          ? 'opacity-50 hover:bg-slate-55 dark:hover:bg-slate-800/10' 
                          : 'bg-indigo-50/30 dark:bg-indigo-500/5 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${getAlertColor(notif.type)}`} />
                      <div className="flex-1">
                        <p className="text-xs text-slate-705 dark:text-slate-200 leading-normal">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!notif.readStatus && (
                        <button className="text-slate-405 hover:text-indigo-600 dark:hover:text-indigo-400 self-center">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
