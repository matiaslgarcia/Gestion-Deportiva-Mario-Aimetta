import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Verificar preferencia guardada o del sistema
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const html = document.documentElement;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      html.setAttribute('data-theme', 'dark');
      html.classList.remove('light');
      html.classList.add('dark');
    } else {
      setIsDark(false);
      html.setAttribute('data-theme', 'light');
      html.classList.remove('dark');
      html.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    console.log('ThemeToggle clicked, current isDark:', isDark);
    
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Forzar la aplicación inmediata del tema
    const html = document.documentElement;
    
    if (newTheme) {
      html.classList.remove('light');
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      console.log('Switched to dark theme - data-theme:', html.getAttribute('data-theme'));
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      html.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      console.log('Switched to light theme - data-theme:', html.getAttribute('data-theme'));
    }
    
    // Forzar repaint del navegador
    html.style.display = 'none';
    html.offsetHeight; // Trigger reflow
    html.style.display = '';
    
    // Log after a short delay to ensure changes are applied
    setTimeout(() => {
      console.log('Theme applied - data-theme:', html.getAttribute('data-theme'));
      console.log('Theme applied - classes:', html.classList.toString());
    }, 100);
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 group hover:shadow-lg transform hover:scale-105"
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      <div className="relative w-6 h-6">
        <Sun 
          className={`absolute inset-0 w-6 h-6 text-yellow-400 transition-all duration-500 transform ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon 
          className={`absolute inset-0 w-6 h-6 text-blue-300 transition-all duration-500 transform ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
      
      {/* Efecto de brillo */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
    </button>
  );
}