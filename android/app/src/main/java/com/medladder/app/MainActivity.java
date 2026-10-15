package com.medladder.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.DownloadListener;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

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
        setupDownloadBridge();
        setupUpiIntentHandler();
    }

    @Override
    public void onStart() {
        super.onStart();
        setupDownloadBridge();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupDownloadBridge();
    }

    /**
     * Lets Razorpay's UPI flow work inside the app's WebView.
     *
     * Razorpay opens the user's UPI app (GPay/PhonePe/Paytm) via intent:// URLs.
     * A stock WebView drops those silently, so Razorpay hides the UPI option.
     * This client forwards intent:// and upi:// URLs to Android's intent system
     * while delegating everything else to Capacitor's default handling.
     */
    private void setupUpiIntentHandler() {
        try {
            if (getBridge() == null || getBridge().getWebView() == null) return;
            getBridge().getWebView().setWebViewClient(new BridgeWebViewClient(getBridge()) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    return handleUpiIntent(view, request.getUrl().toString())
                            || super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                @SuppressWarnings("deprecation")
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    return handleUpiIntent(view, url)
                            || super.shouldOverrideUrlLoading(view, url);
                }

                private boolean handleUpiIntent(WebView view, String url) {
                    if (url == null) return false;
                    if (!url.startsWith("intent://") && !url.startsWith("upi://")) return false;
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        intent.addCategory(Intent.CATEGORY_BROWSABLE);
                        intent.setComponent(null);
                        intent.setSelector(null);
                        view.getContext().startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        // No UPI app available — let the WebView/Razorpay fall back gracefully.
                        return false;
                    }
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void setupDownloadBridge() {
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
        String url = (urlString != null && !urlString.isEmpty()) ? urlString : "https://medladder.top/MedLadder-latest.apk";
        try {
            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm != null) {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType("application/vnd.android.package-archive");
                request.setDescription("Downloading MedLadder update...");
                String filename = "MedLadder-latest.apk";
                request.setTitle(filename);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
                dm.enqueue(request);
                Toast.makeText(getApplicationContext(), "📥 Downloading " + filename + " in background...", Toast.LENGTH_LONG).show();
            }
        } catch (Exception ex) {
            Toast.makeText(getApplicationContext(), "Download error: " + ex.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
}
