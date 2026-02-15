
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

/**
 * Sauvegarde physiquement un chapitre dans IndexedDB en stockant les Blobs.
 * Supporte désormais les Blobs directs pour éviter les erreurs de fetch local.
 */
export const saveChapterOffline = async (seriesId: string, chapterId: string, resources: (string | Blob)[]) => {
  console.log(`[STORAGE] Début de la persistance physique pour : ${chapterId} (${resources.length} items)`);
  
  const blobs = await Promise.all(
    resources.map(async (item) => {
      // Si c'est déjà un Blob (cas de l'import local), on l'utilise directement
      if (item instanceof Blob) {
        return item;
      }
      
      // Si c'est une URL (cas de l'import distant), on la fetch
      try {
        const resp = await fetch(item);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        if (blob.size === 0) throw new Error("Blob vide détecté");
        return blob;
      } catch (e) {
        console.error(`[STORAGE] Echec extraction ressource : ${item}`, e);
        return null;
      }
    })
  );

  const validBlobs = blobs.filter((b): b is Blob => b !== null && b.size > 0);
  
  if (validBlobs.length === 0) {
    console.error("[STORAGE] Aucun blob valide n'a pu être extrait. Annulation de la sauvegarde pour " + chapterId);
    return false;
  }

  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const request = store.put({ 
      id: `${seriesId}_${chapterId}`, 
      blobs: validBlobs, 
      timestamp: Date.now() 
    });

    tx.oncomplete = () => {
      console.log(`[STORAGE] Succès : ${validBlobs.length} images stockées physiquement pour ${chapterId}.`);
      resolve(true);
    };
    tx.onerror = () => {
      console.error("[STORAGE] Erreur transaction IndexedDB :", tx.error);
      reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Récupère un chapitre extrait physiquement.
 */
export const getOfflineChapter = async (seriesId: string, chapterId: string): Promise<string[] | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(`${seriesId}_${chapterId}`);
      
      request.onsuccess = () => {
        const result = request.result;
        if (!result || !result.blobs || result.blobs.length === 0) {
          console.warn(`[STORAGE] Chapitre introuvable ou vide dans IndexedDB : ${chapterId}`);
          resolve(null);
          return;
        }
        
        console.log(`[STORAGE] Hydratation de ${result.blobs.length} blobs pour ${chapterId}`);
        const urls = result.blobs.map((blob: Blob) => {
          if (!(blob instanceof Blob)) {
            console.error("[STORAGE] L'objet récupéré n'est pas un Blob valide !");
            return "";
          }
          return URL.createObjectURL(blob);
        }).filter((u: string) => u !== "");
        
        resolve(urls);
      };
      request.onerror = () => {
        console.error("[STORAGE] Erreur lors de la lecture IndexedDB");
        resolve(null);
      };
    });
  } catch (e) {
    console.error("[STORAGE] Exception système IndexedDB :", e);
    return null;
  }
};

export const isChapterDownloaded = async (seriesId: string, chapterId: string): Promise<boolean> => {
  const chapter = await getOfflineChapter(seriesId, chapterId);
  return !!chapter;
};
