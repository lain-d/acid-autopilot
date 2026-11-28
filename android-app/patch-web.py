"""App-only adjustments to the app's copy of the page (the website itself is not changed).

Inside the Android app, background playback is handled by the native media service, so the page's web workarounds
for locked phones get in the way:
- the page re-routes its sound through a media element when hidden; inside the app that element re-times the audio,
  which is heard as pitch and timing wobbles, so the app always plays straight to the speakers;
- on hiding, the page wrote 8 seconds of music ahead in one go, a burst of work right at the moment the phone locks
  and slows its processor; the app keeps a steady 3 seconds ahead instead;
- the shared room reverb (the lighter setting for slow devices) is the app's default.
"""
import sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
def one(a, b):
    global s
    if s.count(a) != 1:
        sys.exit("patch-web: expected exactly one match for: " + a)
    s = s.replace(a, b)
one("function aheadSec(){ return document.hidden?8:.35; }", "function aheadSec(){ return document.hidden?3:.35; }")
one("var c=live.ctx, want=running&&document.hidden;", "var c=live.ctx, want=false;")
one("var DJ={ecoRev:false,", "var DJ={ecoRev:true,")
open(p, "w", encoding="utf-8").write(s)
print("patched", p)
