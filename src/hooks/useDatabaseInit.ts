import { useState, useEffect } from 'react';
import { initDatabase } from '../database/connection';
import { createTables } from '../database/schema';

interface UseDatabaseInitResult {
  initComplete: boolean;
  error: string | null;
}

export function useDatabaseInit(): UseDatabaseInitResult {
  const [initComplete, setInitComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        await initDatabase();
        createTables();

        if (mounted) {
          setInitComplete(true);
        }
      } catch (err: any) {
        console.error('Database initialization error:', err);
        if (mounted) {
          setError(err.message || 'Failed to initialize database');
        }
      }
    }

    const timer = setTimeout(initialize, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return { initComplete, error };
}