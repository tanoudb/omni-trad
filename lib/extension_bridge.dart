
import 'package:flutter/services.dart';

class ExtensionBridge {
  static const _channel = MethodChannel('com.omniread/extensions');

  /// Charge un APK téléchargé
  static Future<bool> loadExtension(String apkPath, String className) async {
    try {
      final bool success = await _channel.invokeMethod('loadExtension', {
        'path': apkPath,
        'className': className,
      });
      return success;
    } on PlatformException catch (e) {
      print("Failed to load extension: '${e.message}'.");
      return false;
    }
  }

  /// Récupère la liste des mangas via l'APK
  static Future<dynamic> fetchMangaList() async {
    return await _channel.invokeMethod('fetchMangaList');
  }
}
