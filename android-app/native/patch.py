"""Adds the background-playback service to the Android project that `npx cap add android` generates."""
import os, re, shutil, sys
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "android", "app", "src", "main")
pkg = os.path.join(root, "java", "com", "laind", "acidautopilot")
os.makedirs(pkg, exist_ok=True)
here = os.path.dirname(os.path.abspath(__file__))
for f in ["BgAudioPlugin.java", "BgAudioService.java", "MainActivity.java"]:
    shutil.copy(os.path.join(here, f), os.path.join(pkg, f))
mf = os.path.join(root, "AndroidManifest.xml")
s = open(mf).read()
perms = ["android.permission.FOREGROUND_SERVICE", "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
         "android.permission.WAKE_LOCK", "android.permission.POST_NOTIFICATIONS"]
add = "".join('    <uses-permission android:name="%s" />\n' % p for p in perms if p not in s)
s = s.replace("<application", add + "\n    <application", 1)
svc = '        <service android:name=".BgAudioService" android:exported="false" android:foregroundServiceType="mediaPlayback" />\n'
if "BgAudioService" not in s:
    s = s.replace("</application>", svc + "    </application>", 1)
open(mf, "w").write(s)
print("patched", mf)

# Launcher icon: Capacitor's template ships its own vector logo (drawable-v24/ic_launcher_foreground.xml) and a
# default background, and Android picks those over the generated images. Point the adaptive icon at our two layers
# and remove the template artwork.
res = os.path.join(root, "res")
for rel in ["drawable-v24/ic_launcher_foreground.xml", "drawable/ic_launcher_foreground.xml",
            "drawable/ic_launcher_background.xml", "values/ic_launcher_background.xml"]:
    f = os.path.join(res, rel)
    if os.path.exists(f):
        os.remove(f); print("removed", rel)
adaptive = ('<?xml version="1.0" encoding="utf-8"?>\n'
            '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@mipmap/ic_launcher_background" />\n'
            '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n'
            '</adaptive-icon>\n')
os.makedirs(os.path.join(res, "mipmap-anydpi-v26"), exist_ok=True)
for name in ["ic_launcher.xml", "ic_launcher_round.xml"]:
    open(os.path.join(res, "mipmap-anydpi-v26", name), "w").write(adaptive)
missing = [d for d in ["mipmap-xxxhdpi/ic_launcher_foreground.png", "mipmap-xxxhdpi/ic_launcher_background.png"]
           if not os.path.exists(os.path.join(res, d))]
if missing:
    sys.exit("icon layers missing: " + ", ".join(missing))
print("adaptive icon points at the generated layers")
