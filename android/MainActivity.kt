
package com.omniread

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.omniread.extensions.ExtensionLoader

class MainActivity: FlutterActivity() {
    private val CHANNEL = "com.omniread/extensions"
    private lateinit var extensionLoader: ExtensionLoader

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        extensionLoader = ExtensionLoader(this)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "loadExtension" -> {
                    val path = call.argument<String>("path")
                    val className = call.argument<String>("className")
                    if (path != null && className != null) {
                        val success = extensionLoader.loadExtension(path, className)
                        result.success(success)
                    } else {
                        result.error("INVALID_ARGS", "Path or class name missing", null)
                    }
                }
                "fetchMangaList" -> {
                    // Simulation d'appel
                    val data = extensionLoader.callMethod("getPopularManga", null)
                    result.success(data)
                }
                else -> result.notImplemented()
            }
        }
    }
}
