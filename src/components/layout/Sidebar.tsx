import React, { useState } from 'react';
import { Building2, Users, Group as GroupIcon, Menu, X, UserX, BarChart3 } from 'lucide-react';
import logo from '../../assets/logo.png';
import { ThemeToggle } from '../shared/ThemeToggle';

interface SidebarProps {
  activeTab: 'dashboard' | 'locations' | 'clients' | 'groups' | 'clients-inactive';
  onTabChange: (tab: 'dashboard' | 'locations' | 'clients' | 'groups' | 'clients-inactive') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="h-5 w-5 mr-2" />,
    },
    {
      key: 'clients',
      label: 'Alumnos Activos',
      icon: <Users className="h-5 w-5 mr-2" />,
    },
    {
      key: 'groups',
      label: 'Grupos',
      icon: <GroupIcon className="h-5 w-5 mr-2" />,
    },
    {
      key: 'locations',
      label: 'Sedes',
      icon: <Building2 className="h-5 w-5 mr-2" />,
    },
    {
      key: 'clients-inactive',
      label: 'Alumnos Inactivos',
      icon: <UserX className="h-5 w-5 mr-2" />,
    },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-gradient-primary shadow-lg p-4 fixed w-full top-0 left-0 z-40 glass">
        <img
          src={logo}
          alt="Logo"
          className="h-14 cursor-pointer hover:scale-105 transition-transform duration-200 animate-pulse-soft"
          onClick={() => onTabChange('dashboard')}
        />
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <button 
            onClick={() => setIsOpen(true)} 
            aria-label="Abrir menú"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover-glow"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
        <div className="relative bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 w-72 h-full shadow-2xl glass animate-slide-in-left">
          <div className="flex items-center justify-between p-6 bg-gradient-primary">
            <div className="flex items-center">
              <img
                src={logo}
                alt="Logo"
                className="h-16 cursor-pointer hover:scale-105 transition-transform duration-200 animate-pulse-soft"
                onClick={() => {
                  onTabChange('dashboard');
                  setIsOpen(false);
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button 
                onClick={() => setIsOpen(false)} 
                aria-label="Cerrar menú"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 hover-glow"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
          <nav className="p-6 space-y-3">
            {navItems.map((item, index) => (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key as 'dashboard' | 'locations' | 'clients' | 'groups' | 'clients-inactive');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 hover-lift animate-fade-in ${
                  activeTab === item.key
                    ? 'bg-gradient-primary text-white shadow-lg animate-glow'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 hover:text-indigo-600 dark:hover:text-indigo-300 font-semibold'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className={`mr-3 ${
                  activeTab === item.key ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'
                }`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 shadow-2xl border-r border-gray-200 dark:border-gray-700 glass">
        <div className="flex items-center justify-between p-6 bg-gradient-primary">
          <img
            src={logo}
            alt="Logo"
            className="h-16 cursor-pointer hover:scale-105 transition-transform duration-200 animate-pulse-soft"
            onClick={() => onTabChange('dashboard')}
          />
          <ThemeToggle />
        </div>
        <nav className="p-6 flex-1 space-y-3 overflow-y-auto">
          {navItems.map((item, index) => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key as 'dashboard' | 'locations' | 'clients' | 'groups' | 'clients-inactive')}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 hover-lift animate-fade-in ${
                activeTab === item.key
                  ? 'bg-gradient-primary text-white shadow-lg animate-glow'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 hover:text-indigo-600 dark:hover:text-indigo-300 font-semibold'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className={`mr-3 ${
                activeTab === item.key ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'
              }`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
