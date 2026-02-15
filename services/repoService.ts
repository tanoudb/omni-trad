
import { Extension } from '../types';

/**
 * Service de gestion des dépôts d'extensions (Format Keiyoushi)
 */
export class RepoService {
  /**
   * Récupère la liste des extensions depuis un dépôt JSON
   */
  static async fetchExtensions(repoUrl: string): Promise<Extension[]> {
    try {
      const response = await fetch(repoUrl);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const data = await response.json();
      // Le format Keiyoushi est souvent une liste directe
      const extensions = Array.isArray(data) ? data : (data.extensions || []);
      
      return extensions.map((ext: any) => ({
        name: ext.name,
        pkg: ext.pkg,
        version: ext.version,
        lang: ext.lang,
        icon: this.getIconUrl(repoUrl, ext.pkg, ext.icon),
        apk: ext.apk,
        baseUrl: this.inferBaseUrl(ext.pkg, ext.name)
      }));
    } catch (e) {
      console.error("[REPO] Erreur lors du fetch:", e);
      throw e;
    }
  }

  /**
   * Calcule l'URL de l'icône à partir du dépôt
   */
  private static getIconUrl(repoUrl: string, pkg: string, iconFilename: string): string {
    // Si l'icône est un nom de fichier, elle est souvent dans le même dossier que le JSON ou un sous-dossier /icon/
    const baseUrl = repoUrl.substring(0, repoUrl.lastIndexOf('/'));
    return `${baseUrl}/icon/${pkg}.png`;
  }

  /**
   * HEURISTIQUE : Extrait l'URL de base probable du site à partir du package
   * Ex: "eu.kanade.tachiyomi.extension.fr.mangadex" -> "mangadex.org"
   */
  static inferBaseUrl(pkg: string, name: string): string {
    const parts = pkg.split('.');
    const siteName = parts[parts.length - 1];
    
    // Mapping manuel pour les gros sites si nécessaire
    const mapping: Record<string, string> = {
      'mangadex': 'mangadex.org',
      'asurascans': 'asuracomics.com',
      'reaperscans': 'reaperscans.com',
      'mangatx': 'mangatx.com',
      'manganato': 'manganato.com'
    };

    return mapping[siteName] || `${siteName}.com`;
  }
}
