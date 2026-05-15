import React, { createContext, useContext } from 'react';
import { useStore } from './store';
import { DARK, LIGHT } from './theme';

const ThemeCtx = createContext(DARK);

export function ThemeProvider({ children }) {
  const { state } = useStore();
  const colors = state.themeMode === 'light' ? LIGHT : DARK;
  return <ThemeCtx.Provider value={colors}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
