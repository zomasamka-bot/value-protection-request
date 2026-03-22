'use client';

/**
 * React Hook for unified state management
 * Provides single source of truth with automatic synchronization
 */

import { useState, useEffect, useCallback } from "react";
import { StateManager } from "@/lib/state-manager";
import { type ActionRecord } from "@/lib/core-engine";

export function useAppState() {
  const [records, setRecords] = useState<ActionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stateManager = StateManager.getInstance();
    
    // Subscribe to state changes
    const unsubscribe = stateManager.subscribe((updatedRecords) => {
      setRecords(updatedRecords);
      setIsLoading(false);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const addRecord = useCallback((record: ActionRecord) => {
    const stateManager = StateManager.getInstance();
    stateManager.addRecord(record);
  }, []);

  const updateRecord = useCallback((recordId: string, updater: (record: ActionRecord) => ActionRecord) => {
    const stateManager = StateManager.getInstance();
    stateManager.updateRecord(recordId, updater);
  }, []);

  const getRecordById = useCallback((id: string): ActionRecord | null => {
    const stateManager = StateManager.getInstance();
    return stateManager.getRecordById(id);
  }, []);

  const clearAll = useCallback(() => {
    const stateManager = StateManager.getInstance();
    stateManager.clearAll();
  }, []);

  return {
    records,
    isLoading,
    addRecord,
    updateRecord,
    getRecordById,
    clearAll,
  };
}
