import React, { useState } from 'react';
import { Building2, Users, Group as GroupIcon, Menu, X } from 'lucide-react';
import logo from '../../assets/logo.png';

interface SidebarProps {
  activeTab: 'locations' | 'clients' | 'groups';
  onTabChange: (tab: 'locations' | 'clients' | 'groups') => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      key: 'clients',
      label: 'Alumnos',
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
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white shadow-md p-4 fixed w-full top-0 left-0 z-40">
        <img 
          src={logo} 
          alt="Logo" 
          className="h-14 cursor-pointer" 
          onClick={() => onTabChange('clients')}
        />
        <button onClick={() => setIsOpen(true)} aria-label="Abrir menú">
          <Menu className="h-6 w-6 text-gray-800" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute inset-0 bg-black opacity-50" onClick={() => setIsOpen(false)}></div>
        <div className="relative bg-white w-64 h-full shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-14 cursor-pointer" 
                onClick={() => {
                  onTabChange('clients');
                  setIsOpen(false);
                }}
              />
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Cerrar menú">
              <X className="h-6 w-6 text-gray-800" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key as 'clients' | 'groups' | 'locations');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                  activeTab === item.key
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white shadow-lg">
        <div className="flex items-center p-4 border-b">
          <img src={logo} alt="Logo" className="h-20 cursor-pointer" onClick={() => onTabChange('clients')} />
        </div>
        <nav className="p-4 flex-1 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key as 'clients' | 'groups' | 'locations')}
              className={`w-full flex items-center px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                activeTab === item.key
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
