
import { Series, Chapter } from '../types';
import { saveChapterOffline } from './downloadService';

/**
 * Service de Scan de Dossiers Locaux (Natural Folder Engine v2.1)
 */
export class LocalFileSystemProvider {
  private static collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  private static async generateThumbnail(url: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * (MAX_WIDTH / img.width);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(url);
        }
      };
      img.src = url;
    });
  }

  /**
   * Scanne une liste de fichiers et organise les chapitres par structure de dossiers unique.
   */
  static async scanLocalDirectory(files: FileList | File[], sourceName: string): Promise<Series> {
    const seriesId = `local-${Date.now()}`;
    const chaptersMap: Record<string, { fileName: string; file: File }[]> = {};
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

    const filesArray = Array.from(files);

    // Groupement strict par chemin de dossier
    filesArray.forEach(file => {
      const lowerName = file.name.toLowerCase();
      if (imageExtensions.some(ext => lowerName.endsWith(ext))) {
        // webkitRelativePath donne : "Parent/SousDossier/image.jpg"
        const pathParts = file.webkitRelativePath.split('/');
        pathParts.pop(); // Retire le nom du fichier
        
        // On crée une clé unique basée sur le chemin complet du dossier
        const chapterPathKey = pathParts.join('/') || "Racine";

        if (!chaptersMap[chapterPathKey]) {
          chaptersMap[chapterPathKey] = [];
        }
        chaptersMap[chapterPathKey].push({ fileName: file.name, file });
      }
    });

    // Tri des clés de dossiers de manière naturelle (1, 2, 10...)
    const sortedChapterKeys = Object.keys(chaptersMap).sort(this.collator.compare);
    const chapters: Chapter[] = [];

    if (sortedChapterKeys.length === 0) throw new Error("Aucune image trouvée.");
    
    for (let i = 0; i < sortedChapterKeys.length; i++) {
      const key = sortedChapterKeys[i];
      const chapterFiles = chaptersMap[key]
        .sort((a, b) => this.collator.compare(a.fileName, b.fileName))
        .map(item => item.file);

      const chapterId = `${seriesId}-ch${i + 1}`;
      
      // Extraction du nom du dossier final
      const folderParts = key.split('/');
      const displayTitle = folderParts[folderParts.length - 1] || `Chapitre ${i + 1}`;
      
      await saveChapterOffline(seriesId, chapterId, chapterFiles);

      chapters.push({
        id: chapterId,
        number: i + 1,
        title: displayTitle,
        pages: [] 
      });
    }

    // Génération de la miniature à partir de la première page du premier chapitre
    const firstKey = sortedChapterKeys[0];
    const firstImageFile = chaptersMap[firstKey][0].file;
    const firstImageUrl = URL.createObjectURL(firstImageFile);
    const coverUrl = await this.generateThumbnail(firstImageUrl);
    URL.revokeObjectURL(firstImageUrl);

    return {
      id: seriesId,
      title: sourceName,
      author: "Import Local",
      description: `${chapters.length} chapitres détectés via l'arborescence.`,
      coverUrl,
      chapters,
      status: 'termine',
      isLocal: true
    };
  }
}

export const mapDirectoryToManga = async (files: FileList | File[], title: string): Promise<Series> => {
  return LocalFileSystemProvider.scanLocalDirectory(files, title);
};
