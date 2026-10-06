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
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                        try {
                            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                            request.setMimeType(mimetype != null ? mimetype : "application/vnd.android.package-archive");
                            request.addRequestHeader("User-Agent", userAgent);
                            request.setDescription("Downloading MedLadder update...");
                            String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                            if (filename == null || !filename.endsWith(".apk")) {
                                filename = "MedLadder-latest.apk";
                            }
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
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
