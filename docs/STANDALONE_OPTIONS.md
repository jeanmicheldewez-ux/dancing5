# Standalone And VJ Options

Do not implement Electron yet. The app is currently a static browser app, which is a good base for the first public version.

## Web/PWA

Keep the app static and add a web app manifest plus service worker later. This is the lightest route and keeps GitHub Pages compatibility.

Pros: simple deployment, browser security model, easy updates.

Needs: offline dependency strategy, cached demo files, storage/export UX.

## Lightweight Local Launcher

Ship the static files with a tiny local server script or launcher that opens the browser.

Pros: minimal app changes, easier local file/fetch/camera behavior than `file://`.

Needs: packaging per platform and clear user startup flow.

## Tauri Or Lightweight Webview Wrapper

Wrap the static app in a small native shell.

Pros: smaller than Electron, desktop window control, possible native integrations.

Needs: Rust/Tauri setup, permissions, update strategy.

## Python + Local Webview

Serve the static app with Python and optionally package a webview executable.

Pros: practical for prototypes and installations.

Needs: Python packaging, platform testing, dependency management.

## Future VJ Output

Potential VJ routes:

- Fullscreen performance mode.
- Browser source capture in OBS or Resolume.
- Virtual camera output.
- Spout on Windows.
- Syphon on macOS.
- NDI for network video workflows.
- Render-to-video export for prebuilt clips.

These should be researched after the public web demo is stable.
