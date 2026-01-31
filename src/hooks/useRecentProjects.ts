import { useState, useEffect, useCallback } from 'react';

const RECENT_PROJECTS_KEY = 'recent_projects';
const MAX_RECENT_PROJECTS = 10;

export interface RecentProject {
  name: string;
  developer: string;
  usedAt: string; // ISO date string
}

export const useRecentProjects = () => {
  const [recents, setRecents] = useState<RecentProject[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentProject[];
        // Sort by most recently used
        parsed.sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime());
        setRecents(parsed);
      }
    } catch (e) {
      console.error('Failed to load recent projects:', e);
    }
  }, []);

  // Save to localStorage
  const saveRecents = useCallback((projects: RecentProject[]) => {
    try {
      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
      setRecents(projects);
    } catch (e) {
      console.error('Failed to save recent projects:', e);
    }
  }, []);

  // Add a project to recents
  const addRecent = useCallback((name: string, developer?: string) => {
    if (!name.trim()) return;

    const newRecent: RecentProject = {
      name: name.trim(),
      developer: developer?.trim() || '',
      usedAt: new Date().toISOString(),
    };

    setRecents(prev => {
      // Remove existing entry with same name (to update timestamp)
      const filtered = prev.filter(
        p => p.name.toLowerCase() !== name.trim().toLowerCase()
      );
      
      // Add new entry at the beginning
      const updated = [newRecent, ...filtered];
      
      // Keep only the most recent entries
      const trimmed = updated.slice(0, MAX_RECENT_PROJECTS);
      
      // Save to localStorage
      try {
        localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(trimmed));
      } catch (e) {
        console.error('Failed to save recent projects:', e);
      }
      
      return trimmed;
    });
  }, []);

  // Get recents, optionally filtered by developer
  const getRecents = useCallback((filterByDeveloper?: string): RecentProject[] => {
    if (!filterByDeveloper) return recents;
    
    const lowerDeveloper = filterByDeveloper.toLowerCase();
    return recents.filter(p => 
      !p.developer || p.developer.toLowerCase() === lowerDeveloper
    );
  }, [recents]);

  // Clear all recents
  const clearRecents = useCallback(() => {
    try {
      localStorage.removeItem(RECENT_PROJECTS_KEY);
      setRecents([]);
    } catch (e) {
      console.error('Failed to clear recent projects:', e);
    }
  }, []);

  return {
    recents,
    addRecent,
    getRecents,
    clearRecents,
  };
};
