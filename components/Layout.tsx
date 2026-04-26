import React from 'react';
import { useApp } from '../context/AppContext';
import { UserMode, SensoryTheme } from '../types';
import { Settings, Home, Brain, Activity, User, Volume2, ClipboardCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const getThemeStyles = (theme: SensoryTheme) => {
  switch (theme) {
    case SensoryTheme.CALM:
      return 'bg-slate-100 text-slate-700'; // Muted blues
    case SensoryTheme.FOCUS:
      return 'bg-white text-black contrast-125'; // High contrast
    case SensoryTheme.OVERWHELMED:
      return 'bg-[#fdf6e3] text-[#586e75]'; // Warm, solarized light
    case SensoryTheme.BALANCED:
    default:
      return 'bg-gray-50 text-gray-900';
  }
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, toggleDyslexicFont, updateSensoryTheme, setMode } = useApp();
  const location = useLocation();

  const themeClass = getThemeStyles(profile.sensoryTheme);
  const fontClass = profile.useDyslexicFont ? 'font-opendyslexic' : 'font-lexend';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${themeClass} ${fontClass}`} style={{ fontSize: `${profile.fontScale}rem` }}>
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Link to="/" className="text-xl font-bold text-indigo-600 flex items-center gap-2">
             <Brain className="w-8 h-8" />
             NeuroSupport
           </Link>
        </div>

        <div className="flex items-center gap-4">
            {/* Quick Sensory Toggles */}
            <div className="hidden md:flex gap-1 bg-gray-100 p-1 rounded-full">
                <button onClick={() => updateSensoryTheme(SensoryTheme.CALM)} className="px-3 py-1 rounded-full text-xs font-semibold hover:bg-white shadow-sm transition-all" title="Calm Mode">Calm</button>
                <button onClick={() => updateSensoryTheme(SensoryTheme.FOCUS)} className="px-3 py-1 rounded-full text-xs font-semibold hover:bg-white shadow-sm transition-all" title="Focus Mode">Focus</button>
                <button onClick={() => updateSensoryTheme(SensoryTheme.OVERWHELMED)} className="px-3 py-1 rounded-full text-xs font-semibold hover:bg-white shadow-sm transition-all" title="Warm/Cozy Mode">Warm</button>
            </div>
            
            <button 
                onClick={toggleDyslexicFont}
                className={`p-2 rounded-full ${profile.useDyslexicFont ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
                title="Toggle Dyslexia Font"
            >
                <span className="font-bold text-lg">Aa</span>
            </button>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 md:w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col items-center md:items-stretch py-6 gap-2">
            <NavItem to="/" icon={<Home />} label="Dashboard" active={location.pathname === '/'} />
            
            <div className="my-2 border-t border-gray-100 mx-4"></div>
            <p className="hidden md:block px-6 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Modules</p>
            
            <NavItem to="/dyslexia" icon={<Activity />} label="Dyslexia Support" active={location.pathname.startsWith('/dyslexia')} />
            <NavItem to="/autism" icon={<User />} label="Autism Support" active={location.pathname === '/autism' || location.pathname === '/autism/games'} />
            <NavItem to="/autism/assessment" icon={<ClipboardCheck />} label="Trait Assessment" active={location.pathname === '/autism/assessment'} />
            
            <div className="mt-auto">
                 <div className="px-4 py-4 md:block hidden">
                    <div className="bg-indigo-50 p-4 rounded-xl">
                        <p className="text-sm font-medium text-indigo-900">Current Mode</p>
                        <select 
                            value={profile.mode} 
                            onChange={(e) => setMode(e.target.value as UserMode)}
                            className="mt-2 block w-full rounded-md border-gray-300 py-1.5 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        >
                            <option value={UserMode.DEFAULT}>General</option>
                            <option value={UserMode.DYSLEXIA}>Dyslexia Focus</option>
                            <option value={UserMode.AUTISM}>Autism Focus</option>
                        </select>
                    </div>
                 </div>
            </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean }> = ({ to, icon, label, active }) => (
    <Link to={to} className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
        <span className="hidden md:block font-medium">{label}</span>
    </Link>
);

export default Layout;