package com.medladder.app;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    public class NativeBridge {
        @android.webkit.JavascriptInterface
        public void downloadApk(String downloadUrl) {
            runOnUiThread(() -> triggerNativeDownload(downloadUrl));
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                // Direct JS bridge to trigger download without touching navigation or WebView screen
                getBridge().getWebView().addJavascriptInterface(new NativeBridge(), "MedLadderAndroidApp");

                // Also attach standard DownloadListener as secondary fallback
                getBridge().getWebView().setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                        triggerNativeDownload(url);
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void triggerNativeDownload(String urlString) {
        try {
            String url = (urlString != null && !urlString.isEmpty()) ? urlString : "https://medladder.top/MedLadder-latest.apk";
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setMimeType("application/vnd.android.package-archive");
            request.setDescription("Downloading MedLadder update...");
            String filename = "MedLadder-latest.apk";
            request.setTitle(filename);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                Toast.makeText(getApplicationContext(), "📥 Downloading " + filename + " in background...", Toast.LENGTH_LONG).show();
            }
        } catch (Exception ex) {
            Toast.makeText(getApplicationContext(), "Download error: " + ex.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
}
