import { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ── ThemeProvider ──────────────────────────────────────────────────────────────
// Estado do tema em memória apenas — sem localStorage, sem cookies.
// O valor inicial é sempre 'light' — o modo escuro só é activado manualmente
// pelo utilizador nas definições. A preferência do sistema operativo é ignorada.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}

// ── AppShell ───────────────────────────────────────────────────────────────────
// Wrapper exclusivo da app autenticada.
// Aplica data-theme="dark" neste elemento — NÃO no <html>.
// Todo o dark mode CSS usa o selector [data-theme="dark"] como raiz,
// por isso NUNCA afecta ecrãs fora deste wrapper (login, registo, etc.).
//
// Para o Apurador, passar forceLight={true} para sempre usar tema claro.
interface AppShellProps {
  children: React.ReactNode;
  forceLight?: boolean;
}

export function AppShell({ children, forceLight = false }: AppShellProps) {
  const { isDark } = useTheme();
  const effectiveTheme = forceLight ? 'light' : (isDark ? 'dark' : 'light');

  return (
    <div
      data-theme={effectiveTheme}
      // Garante que o shell ocupa o ecrã completo como se fosse o root
      style={{ minHeight: '100dvh', colorScheme: effectiveTheme }}
    >
      {children}
    </div>
  );
}
