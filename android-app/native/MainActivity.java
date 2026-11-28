package com.laind.acidautopilot;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BgAudioPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }

    /* When the app goes to the background Android pauses the web page's timers; the set's scheduler needs them,
       so they are switched straight back on (the foreground service keeps the app itself alive). */
    @Override
    public void onPause() {
        super.onPause();
        if (getBridge() != null) {
            WebView w = getBridge().getWebView();
            if (w != null) { w.onResume(); w.resumeTimers(); }
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (getBridge() != null) {
            WebView w = getBridge().getWebView();
            if (w != null) { w.onResume(); w.resumeTimers(); }
        }
    }
}
