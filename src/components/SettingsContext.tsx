import React, { createContext, useContext, useState, useEffect } from 'react';
import { BlockTheme } from '../utils/types';

interface SettingsContextType {
  blockTheme: BlockTheme;
  setBlockTheme: (theme: BlockTheme) => void;
  showBlockIcons: boolean;
  setShowBlockIcons: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blockTheme, setBlockTheme] = useState<BlockTheme>('gem');
  const [showBlockIcons, setShowBlockIcons] = useState<boolean>(true);

  // Persist settings
  useEffect(() => {
    const savedTheme = localStorage.getItem('tetrix-block-theme');
    if (savedTheme) setBlockTheme(savedTheme as BlockTheme);
    
    const savedIcons = localStorage.getItem('tetrix-show-icons');
    if (savedIcons) setShowBlockIcons(savedIcons === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('tetrix-block-theme', blockTheme);
  }, [blockTheme]);

  useEffect(() => {
    localStorage.setItem('tetrix-show-icons', String(showBlockIcons));
  }, [showBlockIcons]);

  return (
    <SettingsContext.Provider value={{ blockTheme, setBlockTheme, showBlockIcons, setShowBlockIcons }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};