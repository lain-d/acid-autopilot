# Acid Autopilot for Android

The same app as the website, packaged with Capacitor. GitHub Actions builds it on every change
(see `.github/workflows/android.yml`) and attaches `AcidAutopilot.apk` to the **android-latest** release.

What the app adds over the website:
- keeps playing with the screen off or in another app (a foreground service shows a "Playing a set" notification);
- exports open Android's share sheet, so a set can be saved to Files or Drive or sent to another app.

The website itself (`index.html`, `ladder.js` at the top of this repository, served from the `gh-pages` branch) is unchanged.
