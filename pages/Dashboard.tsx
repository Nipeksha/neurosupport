import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Activity, BookOpen, Smile, Gamepad2, PlayCircle } from 'lucide-react';
import { UserMode } from '../types';

const Dashboard: React.FC = () => {
  const { profile } = useApp();

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {profile.name}</h1>
        <p className="text-opacity-80">
            {profile.mode === UserMode.DYSLEXIA 
             ? "Ready to read, write, and create today?" 
             : profile.mode === UserMode.AUTISM
             ? "Let's explore feelings and play some games."
             : "Select a module to get started with your personalized learning journey."}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dyslexia Features */}
        <DashboardCard 
            to="/dyslexia" 
            color="bg-blue-50 border-blue-200" 
            icon={<BookOpen className="text-blue-600" size={32} />}
            title="Dyslexia Toolkit"
            description="Handwriting analysis, text simplifier, and visual dictionaries."
        />

        {/* Autism Features */}
        <DashboardCard 
            to="/autism" 
            color="bg-emerald-50 border-emerald-200" 
            icon={<Smile className="text-emerald-600" size={32} />}
            title="Autism Support"
            description="Emotion tracking, calming avatar therapist, and sensory settings."
        />

        {/* Games */}
        <DashboardCard 
            to="/autism/games" 
            color="bg-purple-50 border-purple-200" 
            icon={<Gamepad2 className="text-purple-600" size={32} />}
            title="Brain Games"
            description="Cognitive exercises for memory, sorting, and focus."
        />
      </div>

      {/* Tutorial Video Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <PlayCircle size={24} className="text-indigo-600" />
            Quick App Tour
        </h2>
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 shadow-md">
            <video 
                className="w-full h-full" 
                controls 
                poster="https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80&w=2000"
            >
                <source src="tutorial1.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
        <p className="mt-4 text-sm text-gray-500">
            New to NeuroSupport? Watch this guide to learn how our AI-powered tools can help with dyslexia and autism support.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity size={20} /> Recent Activity
          </h2>
          <div className="space-y-4">
              {profile.gameScores.memory > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Memory Game High Score</span>
                      <span className="font-bold text-indigo-600">{profile.gameScores.memory} pts</span>
                  </div>
              )}
               {profile.gameScores.sorting > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Sorting Game High Score</span>
                      <span className="font-bold text-indigo-600">{profile.gameScores.sorting} pts</span>
                  </div>
              )}
              {profile.gameScores.memory === 0 && profile.gameScores.sorting === 0 && (
                  <p className="text-gray-500 italic">No recent activity. Try playing a game!</p>
              )}
          </div>
      </div>
    </div>
  );
};

const DashboardCard: React.FC<{ to: string, color: string, icon: React.ReactNode, title: string, description: string }> = ({ to, color, icon, title, description }) => (
    <Link to={to} className={`block p-6 rounded-2xl border transition-transform hover:-translate-y-1 hover:shadow-lg ${color}`}>
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
    </Link>
);

export default Dashboard;
