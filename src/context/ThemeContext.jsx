import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ConfigProvider, App as AntApp, theme as antdTheme } from 'antd';
import { lightToken, darkToken, componentTokens } from '../theme/tokens';

const ThemeCtx = createContext(null);
const STORAGE_KEY = 'b2b.theme';

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'light');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const toggle = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

  const config = useMemo(() => ({
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: mode === 'dark' ? darkToken : lightToken,
    components: componentTokens,
    cssVar: true,
  }), [mode]);

  const value = useMemo(() => ({ mode, isDark: mode === 'dark', toggle, setMode }), [mode]);

  return (
    <ThemeCtx.Provider value={value}>
      <ConfigProvider theme={config}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
