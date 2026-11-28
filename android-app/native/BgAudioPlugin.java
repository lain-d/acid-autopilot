package com.laind.acidautopilot;

import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Starts and stops the foreground service that keeps a set playing in the background. */
@CapacitorPlugin(name = "BgAudio")
public class BgAudioPlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        try {
            ContextCompat.startForegroundService(getContext(), new Intent(getContext(), BgAudioService.class));
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), BgAudioService.class));
        call.resolve();
    }
}
