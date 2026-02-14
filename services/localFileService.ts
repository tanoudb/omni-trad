
import JSZip from 'jszip';
import { Series, Chapter } from '../types';

/**
 * Service pour la gestion du système de fichiers local avec tri naturel et extraction de métadonnées.
 */
export class LocalFileSystemProvider {
  private static collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  /**
   * Génère une vignette basse résolution pour optimiser l'affichage de la bibliothèque.
   */
  private static async generateThumbnail(url: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300; // Taille suffisante pour une grille mobile/desktop
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(url);
        }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }

  /**
   * Scanne une liste de fichiers et les transforme en structure Series/Chapters avec tri naturel.
   */
  static async mapDirectoryToManga(files: FileList | File[] | Record<string, any>, sourceName: string): Promise<Series> {
    const seriesId = `local-${Date.now()}`;
    const chapterMap: Record<string, { number: number; pages: string[] }> = {};
    
    if (!(files instanceof FileList) && !(Array.isArray(files))) {
        return this.processZipArborescence(files as any, sourceName, seriesId);
    }

    const filesArray = Array.isArray(files) ? files : Array.from(files as FileList);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    filesArray.forEach(file => {
      const pathParts = file.webkitRelativePath.split('/');
      const lowerName = file.name.toLowerCase();
      
      if (imageExtensions.some(ext => lowerName.endsWith(ext))) {
        // Détection du chapitre : Dossier parent direct du fichier
        const chapterName = pathParts.length > 2 ? pathParts[pathParts.length - 2] : "Chapitre 1";
        
        if (!chapterMap[chapterName]) {
          chapterMap[chapterName] = { 
            number: this.extractChapterNumber(chapterName), 
            pages: [] 
          };
        }
        chapterMap[chapterName].pages.push(URL.createObjectURL(file));
      }
    });

    return this.finalizeSeriesStructure(seriesId, sourceName, chapterMap);
  }

  private static async processZipArborescence(zip: JSZip, sourceName: string, seriesId: string): Promise<Series> {
    const chapterMap: Record<string, { number: number; pages: string[] }> = {};
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    const entries = Object.keys(zip.files);
    
    for (const path of entries) {
      const entry = zip.files[path];
      if (entry.dir) continue;

      const lowerPath = path.toLowerCase();
      if (imageExtensions.some(ext => lowerPath.endsWith(ext))) {
        const pathParts = path.split('/');
        const chapterName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : "Chapitre 1";

        if (!chapterMap[chapterName]) {
          chapterMap[chapterName] = { 
            number: this.extractChapterNumber(chapterName), 
            pages: [] 
          };
        }

        const blob = await entry.async('blob');
        chapterMap[chapterName].pages.push(URL.createObjectURL(blob));
      }
    }

    return this.finalizeSeriesStructure(seriesId, sourceName, chapterMap);
  }

  private static async finalizeSeriesStructure(id: string, title: string, chapterMap: Record<string, any>): Promise<Series> {
    // Tri naturel des noms de chapitres
    const sortedChapterNames = Object.keys(chapterMap).sort(this.collator.compare);

    const chapters: Chapter[] = sortedChapterNames.map((name, index) => {
      const data = chapterMap[name];
      return {
        id: `${id}-ch${index + 1}`,
        number: data.number || index + 1,
        title: name,
        // Tri naturel des pages à l'intérieur du chapitre
        pages: data.pages.sort(this.collator.compare)
      };
    });

    if (chapters.length === 0) throw new Error("Aucune image valide trouvée.");

    // Création de la vignette pour la couverture
    const originalCover = chapters[0].pages[0];
    const thumbnailCover = await this.generateThumbnail(originalCover);

    return {
      id,
      title,
      author: "Local Import",
      status: 'termine',
      isLocal: true,
      description: `Collection locale importée : ${title}`,
      coverUrl: thumbnailCover,
      chapters
    };
  }

  private static extractChapterNumber(name: string): number {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }
}

export const mapDirectoryToManga = async (files: FileList | File[], title: string): Promise<Series> => {
    return LocalFileSystemProvider.mapDirectoryToManga(files, title);
};

export const processLocalFile = async (file: File): Promise<Series> => {
  const zip = new JSZip();
  const content = await zip.loadAsync(file);
  return LocalFileSystemProvider.mapDirectoryToManga(content, file.name.replace(/\.[^/.]+$/, ""));
};
