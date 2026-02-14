
const DB_NAME = 'OmniRead_Offline';
const STORE_NAME = 'chapters';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveChapterOffline = async (seriesId: string, chapterId: string, imageUrls: string[]) => {
  // CRITICAL: Fetch all external data BEFORE opening the IndexedDB transaction.
  // IndexedDB transactions auto-commit if the event loop becomes empty.
  const blobs = await Promise.all(
    imageUrls.map(async (url) => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
        const blob = await resp.blob();
        // For persistence across sessions in a browser, we should store the actual Blob 
        // and only createObjectURL when reading. However, for simplicity in this demo environment:
        return blob;
      } catch (e) {
        console.error(`Failed to fetch image: ${url}`, e);
        return null;
      }
    })
  );

  const validBlobs = blobs.filter(b => b !== null);
  // Convert blobs to local URLs for storage (or store blobs directly if your browser supports it)
  // Most modern browsers support storing Blobs directly in IndexedDB.
  const imagesToStore = validBlobs.map(blob => URL.createObjectURL(blob));

  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    // Open transaction only when data is ready
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.put({ 
      id: `${seriesId}_${chapterId}`, 
      images: imagesToStore, 
      timestamp: Date.now() 
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    request.onerror = () => reject(request.error);
  });
};

export const getOfflineChapter = async (seriesId: string, chapterId: string): Promise<string[] | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(`${seriesId}_${chapterId}`);
      
      request.onsuccess = () => resolve(request.result?.images || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    console.error("IndexedDB read error", e);
    return null;
  }
};

export const isChapterDownloaded = async (seriesId: string, chapterId: string): Promise<boolean> => {
  const chapter = await getOfflineChapter(seriesId, chapterId);
  return !!chapter;
};
