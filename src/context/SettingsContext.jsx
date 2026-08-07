import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { resolveMediaUrl } from '../lib/mediaUrl';

const SettingsContext = createContext(null);
const STORAGE_KEY = 'ccs_settings';
const FONTS_STORAGE_KEY = 'ccs_fonts';
const DEFAULT_LOGO = '/img/logo.jpg';

const FAVICON_MIME_TYPES = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  ico: 'image/x-icon',
  gif: 'image/gif',
  webp: 'image/webp',
};

function applyFavicon(settings) {
  const link = document.getElementById('app-favicon');
  if (!link) return;
  const href = resolveMediaUrl(settings?.store_logo || DEFAULT_LOGO);
  const ext = String(href).split('.').pop().toLowerCase().split('?')[0];
  link.href = href;
  link.type = FAVICON_MIME_TYPES[ext] || 'image/x-icon';
}

function applyTheme(settings) {
  if (!settings) return;
  const root = document.documentElement;
  // Both the "accent" pair (wa-green/wa-green-dark, used for buttons, links,
  // text highlights) and the "header" pair (wa-teal/wa-teal-light, used for
  // the Navbar/AdminSidebar/Footer background and login hero gradients) need
  // to track the chosen colors - otherwise headers stay the old fixed teal
  // while only buttons re-theme.
  if (settings.theme_color_dark) {
    root.style.setProperty('--color-wa-green', settings.theme_color_dark);
    root.style.setProperty('--color-wa-teal-light', settings.theme_color_dark);
  }
  if (settings.theme_color_light) {
    root.style.setProperty('--color-wa-green-dark', settings.theme_color_light);
    root.style.setProperty('--color-wa-teal', settings.theme_color_light);
  }
}

// Loads the Google Fonts stylesheet for the site's active font and points
// the --font-sans variable (used by body + Tailwind's font-sans utility) at
// it, so switching fonts in Admin Settings applies everywhere without a
// rebuild. Falls back to just the CSS variable if the font list hasn't
// loaded yet - the stylesheet link gets attached as soon as it does.
function applyFont(activeFontName, fonts) {
  if (!activeFontName) return;
  const root = document.documentElement;
  root.style.setProperty('--font-sans', `"${activeFontName}", system-ui, 'Segoe UI', Roboto, sans-serif`);

  const font = fonts?.find((f) => f.name === activeFontName);
  if (!font) return;
  let link = document.getElementById('active-font-link');
  if (!link) {
    link = document.createElement('link');
    link.id = 'active-font-link';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = `https://fonts.googleapis.com/css2?family=${font.family_param}&display=swap`;
}

function applyTitle(settings) {
  document.title = settings?.store_name || 'Soon';
}

function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const cached = readCache(STORAGE_KEY);
    const cachedFonts = readCache(FONTS_STORAGE_KEY);
    applyTheme(cached);
    applyTitle(cached);
    applyFavicon(cached);
    applyFont(cached?.active_font, cachedFonts);
    return cached;
  });

  function refreshSettings() {
    return Promise.all([api.get('/settings'), api.get('/fonts')]).then(([settingsRes, fontsRes]) => {
      setSettings(settingsRes.data);
      applyTheme(settingsRes.data);
      applyTitle(settingsRes.data);
      applyFavicon(settingsRes.data);
      applyFont(settingsRes.data.active_font, fontsRes.data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsRes.data));
      localStorage.setItem(FONTS_STORAGE_KEY, JSON.stringify(fontsRes.data));
      return settingsRes.data;
    });
  }

  useEffect(() => {
    refreshSettings().catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
