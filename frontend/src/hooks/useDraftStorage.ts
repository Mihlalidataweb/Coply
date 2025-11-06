import { useState, useEffect, useCallback } from 'react';
import { MosaicDraft, UploadedImage } from '@/types';

const DRAFTS_STORAGE_KEY = 'mosaic_drafts';
const MAX_DRAFTS = 10; // Maximum number of drafts to store
const MAX_DRAFT_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

interface UseDraftStorageOptions {
  autoSave?: boolean;
  maxDrafts?: number;
  maxAge?: number;
}

interface DraftStorageData {
  id: string;
  name: string;
  images: SerializedImage[];
  pattern: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  createdAt: number;
  lastModified: number;
  thumbnail?: string;
}

interface SerializedImage {
  id: string;
  name: string;
  size: number;
  type: string;
  preview: string; // Base64 data URL
  position?: { x: number; y: number };
  rotation?: number;
  scale?: number;
  cropped?: boolean;
}

export const useDraftStorage = (options: UseDraftStorageOptions = {}) => {
  const [drafts, setDrafts] = useState<MosaicDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    autoSave = true,
    maxDrafts = MAX_DRAFTS,
    maxAge = MAX_DRAFT_AGE,
  } = options;

  // Convert UploadedImage to SerializedImage
  const serializeImages = useCallback((images: UploadedImage[]): SerializedImage[] => {
    return images.map(img => ({
      id: img.id,
      name: img.name,
      size: img.size,
      type: img.type,
      preview: img.preview, // Already a blob URL that can be converted to base64
      position: img.position,
      rotation: img.rotation,
      scale: img.scale,
      cropped: img.cropped,
    }));
  }, []);

  // Convert SerializedImage back to UploadedImage
  const deserializeImages = useCallback((images: SerializedImage[]): UploadedImage[] => {
    return images.map(img => ({
      id: img.id,
      name: img.name,
      size: img.size,
      type: img.type,
      preview: img.preview,
      position: img.position,
      rotation: img.rotation,
      scale: img.scale,
      cropped: img.cropped,
    }));
  }, []);

  // Load drafts from localStorage
  const loadDrafts = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      const storedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (!storedDrafts) {
        setDrafts([]);
        return;
      }

      const draftsData: DraftStorageData[] = JSON.parse(storedDrafts);

      // Filter out old drafts and limit number
      const now = Date.now();
      const validDrafts = draftsData
        .filter(draft => now - draft.lastModified < maxAge)
        .slice(0, maxDrafts)
        .map(draft => ({
          ...draft,
          images: deserializeImages(draft.images),
        }));

      setDrafts(validDrafts);

      // Clean up old drafts in storage
      if (validDrafts.length !== draftsData.length) {
        saveDraftsToStorage(validDrafts);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drafts';
      setError(errorMessage);
      console.error('Error loading drafts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [maxAge, maxDrafts, deserializeImages]);

  // Save drafts to localStorage
  const saveDraftsToStorage = useCallback((draftsToSave: MosaicDraft[]) => {
    try {
      const serializedDrafts: DraftStorageData[] = draftsToSave.map(draft => ({
        ...draft,
        images: serializeImages(draft.images),
      }));

      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(serializedDrafts));
    } catch (err) {
      console.error('Error saving drafts to storage:', err);
      throw err;
    }
  }, [serializeImages]);

  // Create a new draft
  const createDraft = useCallback((
    name: string,
    images: UploadedImage[],
    pattern: any
  ): MosaicDraft => {
    const draft: MosaicDraft = {
      id: Date.now().toString(),
      name,
      images: [...images],
      pattern,
      createdAt: Date.now(),
      lastModified: Date.now(),
    };

    return draft;
  }, []);

  // Save a draft
  const saveDraft = useCallback((
    name: string,
    images: UploadedImage[],
    pattern: any,
    thumbnail?: string
  ) => {
    try {
      const draft = createDraft(name, images, pattern);
      if (thumbnail) {
        draft.thumbnail = thumbnail;
      }

      const updatedDrafts = [draft, ...drafts.filter(d => d.id !== draft.id)]
        .slice(0, maxDrafts);

      setDrafts(updatedDrafts);
      saveDraftsToStorage(updatedDrafts);

      return draft;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save draft';
      setError(errorMessage);
      throw err;
    }
  }, [drafts, maxDrafts, createDraft, saveDraftsToStorage]);

  // Update existing draft
  const updateDraft = useCallback((
    draftId: string,
    updates: Partial<MosaicDraft>
  ) => {
    try {
      const draftIndex = drafts.findIndex(d => d.id === draftId);
      if (draftIndex === -1) {
        throw new Error('Draft not found');
      }

      const updatedDrafts = [...drafts];
      updatedDrafts[draftIndex] = {
        ...updatedDrafts[draftIndex],
        ...updates,
        lastModified: Date.now(),
      };

      setDrafts(updatedDrafts);
      saveDraftsToStorage(updatedDrafts);

      return updatedDrafts[draftIndex];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update draft';
      setError(errorMessage);
      throw err;
    }
  }, [drafts, saveDraftsToStorage]);

  // Delete a draft
  const deleteDraft = useCallback((draftId: string) => {
    try {
      const updatedDrafts = drafts.filter(d => d.id !== draftId);
      setDrafts(updatedDrafts);
      saveDraftsToStorage(updatedDrafts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete draft';
      setError(errorMessage);
      throw err;
    }
  }, [drafts, saveDraftsToStorage]);

  // Load a specific draft
  const loadDraft = useCallback((draftId: string): MosaicDraft | null => {
    const draft = drafts.find(d => d.id === draftId);
    return draft || null;
  }, [drafts]);

  // Duplicate a draft
  const duplicateDraft = useCallback((draftId: string, newName?: string) => {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    const duplicatedDraft = createDraft(
      newName || `${draft.name} (Copy)`,
      draft.images,
      draft.pattern
    );

    const updatedDrafts = [duplicatedDraft, ...drafts].slice(0, maxDrafts);
    setDrafts(updatedDrafts);
    saveDraftsToStorage(updatedDrafts);

    return duplicatedDraft;
  }, [drafts, maxDrafts, createDraft, saveDraftsToStorage]);

  // Clear all drafts
  const clearAllDrafts = useCallback(() => {
    try {
      setDrafts([]);
      localStorage.removeItem(DRAFTS_STORAGE_KEY);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear drafts';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Export draft to JSON
  const exportDraft = useCallback((draftId: string) => {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    const exportData = {
      ...draft,
      exportedAt: Date.now(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mosaic-draft-${draft.name}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [drafts]);

  // Import draft from JSON
  const importDraft = useCallback((file: File) => {
    return new Promise<MosaicDraft>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);

          // Validate imported data
          if (!importData.name || !importData.images || !importData.pattern) {
            throw new Error('Invalid draft file format');
          }

          const draft = createDraft(
            `${importData.name} (Imported)`,
            deserializeImages(importData.images),
            importData.pattern
          );

          if (importData.thumbnail) {
            draft.thumbnail = importData.thumbnail;
          }

          const updatedDrafts = [draft, ...drafts].slice(0, maxDrafts);
          setDrafts(updatedDrafts);
          saveDraftsToStorage(updatedDrafts);

          resolve(draft);
        } catch (err) {
          reject(new Error('Failed to import draft file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read draft file'));
      };

      reader.readAsText(file);
    });
  }, [drafts, maxDrafts, createDraft, deserializeImages, saveDraftsToStorage]);

  // Get storage stats
  const getStorageStats = useCallback(() => {
    try {
      const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
      const size = stored ? new Blob([stored]).size : 0;

      return {
        draftCount: drafts.length,
        storageSize: size,
        storageSizeFormatted: `${(size / 1024).toFixed(2)} KB`,
        maxDrafts,
        oldestDraft: drafts.length > 0 ? Math.min(...drafts.map(d => d.createdAt)) : null,
        newestDraft: drafts.length > 0 ? Math.max(...drafts.map(d => d.lastModified)) : null,
      };
    } catch (err) {
      return {
        draftCount: 0,
        storageSize: 0,
        storageSizeFormatted: '0 KB',
        maxDrafts,
        oldestDraft: null,
        newestDraft: null,
      };
    }
  }, [drafts, maxDrafts]);

  // Auto-save functionality
  const autoSaveDraft = useCallback((
    name: string,
    images: UploadedImage[],
    pattern: any,
    thumbnail?: string
  ) => {
    if (!autoSave) return;

    // Find existing draft with same name and pattern
    const existingDraftIndex = drafts.findIndex(d =>
      d.name === name && d.pattern.id === pattern.id
    );

    if (existingDraftIndex !== -1) {
      // Update existing draft
      updateDraft(drafts[existingDraftIndex].id, {
        images,
        thumbnail,
        lastModified: Date.now(),
      });
    } else {
      // Create new draft
      saveDraft(name, images, pattern, thumbnail);
    }
  }, [autoSave, drafts, updateDraft, saveDraft]);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  return {
    // State
    drafts,
    isLoading,
    error,

    // CRUD operations
    saveDraft,
    updateDraft,
    deleteDraft,
    loadDraft,
    duplicateDraft,
    clearAllDrafts,

    // Import/Export
    exportDraft,
    importDraft,

    // Auto-save
    autoSaveDraft,

    // Utilities
    createDraft,
    getStorageStats,
    clearError: () => setError(null),
    refreshDrafts: loadDrafts,
  };
};