import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserMode, SensoryTheme } from '../types';

interface AppContextType {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateSensoryTheme: (theme: SensoryTheme) => void;
  toggleDyslexicFont: () => void;
  updateFontScale: (scale: number) => void;
  setMode: (mode: UserMode) => void;
}

const defaultProfile: UserProfile = {
  name: 'User',
  mode: UserMode.DEFAULT,
  sensoryTheme: SensoryTheme.BALANCED,
  fontScale: 1,
  useDyslexicFont: false,
  gameScores: { memory: 0, sorting: 0 },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  const updateSensoryTheme = (sensoryTheme: SensoryTheme) => {
    setProfile(prev => ({ ...prev, sensoryTheme }));
  };

  const toggleDyslexicFont = () => {
    setProfile(prev => ({ ...prev, useDyslexicFont: !prev.useDyslexicFont }));
  };

  const updateFontScale = (fontScale: number) => {
    setProfile(prev => ({ ...prev, fontScale }));
  };

  const setMode = (mode: UserMode) => {
    setProfile(prev => ({ ...prev, mode }));
  }

  return (
    <AppContext.Provider value={{ profile, setProfile, updateSensoryTheme, toggleDyslexicFont, updateFontScale, setMode }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
