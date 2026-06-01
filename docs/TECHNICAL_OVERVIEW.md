# Technical Overview

Dancing5 is a static browser app. It runs from `index.html` or `index-6.html` and uses browser APIs for audio, storage, and canvas rendering.

## Runtime Flow

1. A microphone, audio file, or video file provides input.
2. The Web Audio API analyser reads frequency bins.
3. The first 64 bins are normalized to values between `0` and `1`.
4. Beat/energy thresholds decide when the neural model should produce a new target pose.
5. The Brain.js model maps normalized audio values to normalized dancer pose values.
6. The avatar renderer interpolates between poses and draws the result on canvas.
7. Models and settings can be persisted in IndexedDB or exported as JSON.

## Main Files

- `index.html`: GitHub Pages entry point and app page.
- `index-6.html`: preserved working app page.
- `dancer-6.js`: audio analysis, model persistence, import/export, model inference, avatar drawing, and UI wiring.
- `dancer.css`: styling.
- `brain.js`: local Brain.js bundle.
- `camera_utils.js` and `pose.js`: local MediaPipe-related bundles.
- `examples/demo-breaker.json`: startup public demo model.
- `examples/basic-dancer-model.json`: compatibility public demo model.

## Libraries

Dancing5 currently uses:

- Brain.js for neural-network models.
- Web Audio API for frequency analysis.
- MediaPipe Pose and Tasks Vision for body/person workflows.
- Canvas 2D for rendering avatars.

Some MediaPipe assets are loaded from CDN paths. This is acceptable for the first public web version, but full offline/VJ packaging should revisit dependency vendoring.

## Artist Control

The neural model does not fully automate the artwork. The artist controls:

- which model is loaded,
- which music or microphone source is used,
- avatar style, color, thickness, reactivity, and motion,
- background mode,
- export/import of reusable models,
- future mapping to external avatar systems.

This keeps the neural network as a performance instrument rather than a fixed black-box output.

## Future Runtime Targets

The current static web app is the base for:

- GitHub Pages demos,
- web/PWA installs,
- local launcher workflows,
- Tauri or lightweight webview wrappers,
- Python local-webview packaging,
- standalone VJ runtime experiments.
