/**
 * Unified State Manager
 * Single source of truth for application state with cross-tab synchronization
 */

import { type ActionRecord } from "./core-engine";

const STORAGE_KEY = "vpr_stable_pi_records";
const SYNC_CHANNEL = "vpr_state_sync";

export class StateManager {
  private static instance: StateManager | null = null;
  private records: ActionRecord[] = [];
  private listeners: Set<(records: ActionRecord[]) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  private constructor() {
    this.initializeBroadcastChannel();
    this.loadFromStorage();
    this.setupStorageListener();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  /**
   * Initialize BroadcastChannel for cross-tab synchronization
   */
  private initializeBroadcastChannel(): void {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data.type === "STATE_UPDATE") {
            const incomingRecords = event.data.records;
            console.log(
              "[v0] StateManager: Cross-tab sync received",
              incomingRecords.length,
              "records"
            );
            
            // Merge incoming records with existing ones to prevent data loss
            this.mergeRecords(incomingRecords);
            this.notifyListeners();
          }
        };
        console.log("[v0] StateManager: BroadcastChannel initialized");
      } catch (error) {
        console.error("[v0] StateManager: BroadcastChannel init failed:", error);
      }
    } else {
      console.log("[v0] StateManager: BroadcastChannel not available, using storage events");
    }
  }

  /**
   * Merge records from another tab without losing local changes
   */
  private mergeRecords(incomingRecords: ActionRecord[]): void {
    // Create a map of existing records by ID
    const existingMap = new Map(this.records.map((r) => [r.id, r]));
    
    // Merge incoming records
    for (const incoming of incomingRecords) {
      const existing = existingMap.get(incoming.id);
      
      if (!existing) {
        // New record, add it
        existingMap.set(incoming.id, incoming);
      } else if (new Date(incoming.updatedAt) > new Date(existing.updatedAt)) {
        // Incoming record is newer, update it
        existingMap.set(incoming.id, incoming);
      }
      // If existing is newer, keep it
    }
    
    // Convert map back to array, sorted by creation time (newest first)
    this.records = Array.from(existingMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Load records from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.records = JSON.parse(stored);
        console.log("[v0] Loaded records from storage:", this.records.length);
      }
    } catch (error) {
      console.error("[v0] Failed to load from storage:", error);
      this.records = [];
    }
  }

  /**
   * Save records to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
      console.log("[v0] Saved records to storage:", this.records.length);
    } catch (error) {
      console.error("[v0] Failed to save to storage:", error);
    }
  }

  /**
   * Broadcast state update to other tabs
   */
  private broadcastUpdate(): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: "STATE_UPDATE",
          records: this.records,
          timestamp: new Date().toISOString(),
        });
        console.log(
          "[v0] StateManager: Broadcast sent -",
          this.records.length,
          "records"
        );
      } catch (error) {
        console.error("[v0] StateManager: Broadcast failed:", error);
      }
    }
  }

  /**
   * Listen for storage changes from other tabs (fallback for BroadcastChannel)
   */
  private setupStorageListener(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          this.records = JSON.parse(event.newValue);
          console.log("[v0] Synced from storage event:", this.records.length);
          this.notifyListeners();
        } catch (error) {
          console.error("[v0] Failed to parse storage event:", error);
        }
      }
    });
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.records]);
      } catch (error) {
        console.error("[v0] Listener notification error:", error);
      }
    });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (records: ActionRecord[]) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener([...this.records]);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get all records
   */
  getRecords(): ActionRecord[] {
    return [...this.records];
  }

  /**
   * Add or update a record (deduplication by ID and reference ID)
   */
  addRecord(record: ActionRecord): void {
    // Check for duplicate by ID first (primary key)
    const existingIdIndex = this.records.findIndex((r) => r.id === record.id);
    
    // Also check for duplicate by reference ID (prevents duplicates from same source)
    const existingRefIndex = this.records.findIndex(
      (r) => r.referenceId === record.referenceId && r.id !== record.id
    );
    
    if (existingIdIndex >= 0) {
      // Update existing record by ID (same record, new state)
      const oldStatus = this.records[existingIdIndex].status;
      this.records[existingIdIndex] = record;
      console.log(
        "[v0] StateManager: Updated record",
        record.referenceId,
        `${oldStatus} → ${record.status}`
      );
    } else if (existingRefIndex >= 0) {
      // Found duplicate reference ID with different ID - merge them
      this.records[existingRefIndex] = record;
      console.log(
        "[v0] StateManager: Merged duplicate reference",
        record.referenceId
      );
    } else {
      // Add new record to beginning
      this.records.unshift(record);
      console.log("[v0] StateManager: Added new record", record.referenceId);
    }

    this.saveToStorage();
    this.broadcastUpdate();
    this.notifyListeners();
  }

  /**
   * Update an existing record
   */
  updateRecord(recordId: string, updater: (record: ActionRecord) => ActionRecord): void {
    const index = this.records.findIndex((r) => r.id === recordId);
    
    if (index >= 0) {
      this.records[index] = updater(this.records[index]);
      console.log("[v0] Updated record:", this.records[index].referenceId);
      
      this.saveToStorage();
      this.broadcastUpdate();
      this.notifyListeners();
    }
  }

  /**
   * Get record by ID
   */
  getRecordById(id: string): ActionRecord | null {
    return this.records.find((r) => r.id === id) || null;
  }

  /**
   * Clear all records (for testing)
   */
  clearAll(): void {
    this.records = [];
    this.saveToStorage();
    this.broadcastUpdate();
    this.notifyListeners();
    console.log("[v0] Cleared all records");
  }

  /**
   * Cleanup (call on unmount)
   */
  cleanup(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.listeners.clear();
  }
}
