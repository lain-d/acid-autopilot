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
