import { useEffect, useRef, useCallback } from 'react';
import { SimpleDatabase } from '../lib/database-simple';

interface AutosaveConfig {
  interval?: number;
  onSave?: () => void;
}

export function useAutosave<T extends Record<string, any>>(
  data: T,
  config: AutosaveConfig = {}
) {
  const { interval = 5000, onSave } = config;
  const previousDataRef = useRef<T>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const save = useCallback(async () => {
    try {
      const { getDb } = await import('../lib/database-simple');
      const db = await getDb();
      db.autoSave();
      onSave?.();
    } catch (error) {
      console.error('Autosave failed:', error);
    }
  }, [onSave]);

  useEffect(() => {
    // Deep comparison of data
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (hasChanged) {
      previousDataRef.current = { ...data };
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Schedule new save
      saveTimeoutRef.current = setTimeout(() => {
        save();
      }, interval);
    }
  }, [data, interval, save]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Save one final time
        save();
      }
    };
  }, [save]);

  // Manual save function
  const manualSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    save();
  }, [save]);

  return { manualSave };
}