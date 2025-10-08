import { useState, useEffect, useCallback } from 'react';
import { SecurityViolation } from '@/types/exam';

export const useExamSecurity = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState<SecurityViolation[]>([]);

  const addViolation = useCallback((type: SecurityViolation['type'], details?: string) => {
    const violation: SecurityViolation = {
      type,
      timestamp: Date.now(),
      details
    };
    setViolations(prev => [...prev, violation]);
    console.warn('Security violation detected:', violation);
  }, []);

  const requestFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      if (!isNowFullscreen && isFullscreen) {
        addViolation('fullscreen-exit', 'User exited fullscreen mode');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('tab-switch', 'User switched tabs or minimized browser');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation('right-click', 'User attempted to right-click');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const ctrlOrMeta = e.ctrlKey || e.metaKey; // Support Windows Ctrl and macOS Cmd

      // Block refresh actions
      if (
        key === 'F5' ||
        (ctrlOrMeta && (key.toLowerCase() === 'r')) ||
        (ctrlOrMeta && e.shiftKey && key.toLowerCase() === 'r')
      ) {
        e.preventDefault();
        addViolation('refresh', 'Blocked page refresh (F5/Ctrl+R/Cmd+R)');
        return;
      }

      // Block navigation shortcuts (back/forward)
      if (e.altKey && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        e.preventDefault();
        addViolation('shortcut', `Blocked navigation: Alt+${key}`);
        return;
      }

      // Block fullscreen toggle which may conflict with exam fullscreen
      if (key === 'F11') {
        e.preventDefault();
        addViolation('shortcut', 'Blocked fullscreen toggle (F11)');
        return;
      }

      // Developer tools and view-source
      if (
        key === 'F12' ||
        (ctrlOrMeta && e.shiftKey && key.toUpperCase() === 'I') ||
        (ctrlOrMeta && e.shiftKey && key.toUpperCase() === 'J') ||
        (ctrlOrMeta && key.toLowerCase() === 'u')
      ) {
        e.preventDefault();
        addViolation('shortcut', `Blocked devtools shortcut: ${key}`);
        return;
      }

      // Copy/paste/select-all
      if (ctrlOrMeta && ['c', 'v', 'a', 'x'].includes(key.toLowerCase())) {
        e.preventDefault();
        addViolation('copy-paste', `Blocked clipboard shortcut: ${key}`);
        return;
      }

      // Misc common shortcuts (print/save/find/new tab/window/open location)
      if (ctrlOrMeta && ['p', 's', 'f', 'g', 'n', 't', 'w', 'l'].includes(key.toLowerCase())) {
        e.preventDefault();
        addViolation('shortcut', `Blocked shortcut: ${key}`);
        return;
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave the exam?';
      addViolation('tab-switch', 'User attempted to leave the page');
    };

    // Add event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isFullscreen, addViolation]);

  return {
    isFullscreen,
    violations,
    requestFullscreen,
    exitFullscreen,
    addViolation,
    clearViolations: () => setViolations([])
  };
};