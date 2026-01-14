import React, { createContext, useContext, useState, useLayoutEffect } from "react";

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check if running in browser environment
    if (typeof window !== "undefined") {
      // 1. Check local storage
      const stored = window.localStorage.getItem("theme");
      // 2. Default to 'dark' if nothing stored
      const initialTheme = stored || "dark";
      
      // 3. IMMEDIATE DOM UPDATE
      // We apply the class directly during state initialization.
      // This ensures the class exists on <html> BEFORE the first paint,
      // preventing any flash of light mode content.
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(initialTheme);
      
      return initialTheme;
    }
    
    // Fallback for non-browser environments
    return "dark";
  });

  // useLayoutEffect fires synchronously after DOM mutations but before browser paint.
  // This is preferred over useEffect for theme changes to avoid visual flickering.
  useLayoutEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};