# Dancing5 Current State

## Main Files And Folders

- `index-6.html`: current app page and UI wiring.
- `dancer-6.js`: audio analysis, MediaPipe pose handling, human selection, Brain.js model training/loading, drawing, and IndexedDB persistence.
- `dancer.css`: app styling.
- `brain.js`: local Brain.js browser bundle.
- `camera_utils.js`: local MediaPipe camera utility copy.
- `pose.js`: local MediaPipe Pose copy.
- `examples/demo-breaker.json`: startup public demo model export.
- `examples/basic-dancer-model.json`: compatibility public demo model export.
- `docs/`: project documentation.

## How The App Runs

The app is a static browser app. Open `index.html` or `index-6.html` from a local static server or from GitHub Pages. No backend is required.

Some browser APIs, especially camera, microphone, module imports, and `fetch()` for demo JSON, work more reliably through `http://localhost` or HTTPS than through a direct `file://` open.

## Current Model Storage

Models and training datasets are saved in IndexedDB:

- Database: `LocalDB`
- Object store: `models`
- Model key: `name`
- Model payload: `{ name, data, createdAt }`
- `data`: Brain.js `network.toJSON()` output
- Object store: `datas`
- Training data payload: `{ name, data, createdAt }`

The app does not use `localStorage` for model persistence.

## External Libraries

- Brain.js: loaded locally from `brain.js`.
- MediaPipe Camera Utils: loaded locally from `camera_utils.js` and also from jsDelivr CDN.
- MediaPipe Pose: loaded locally from `pose.js` and also from jsDelivr CDN; pose asset lookup uses jsDelivr.
- MediaPipe Tasks Vision object detector: loaded from jsDelivr CDN as an ES module; its EfficientDet model loads from Google Cloud Storage.
- Meyda: loaded from jsDelivr CDN, but current audio analysis mainly uses the Web Audio API analyser node.

The app uses MediaPipe, Brain.js, and references Meyda. It does not currently use a backend runtime or package manager.

## GitHub Pages Needs

- Keep `index.html` at the repository root.
- Keep all app assets on relative paths.
- Do not require a backend or terminal command for visitors.
- Keep demo content available as a static file, especially `examples/demo-breaker.json`, because first-time visitors do not have IndexedDB data.
- Use HTTPS via GitHub Pages for camera/microphone compatibility.
- Document that CDN-hosted libraries require internet access unless they are later vendored locally.

## Later Standalone/VJ Needs

- Decide whether the standalone app should remain static web/PWA, use a local launcher, or be wrapped with Tauri/webview/Python.
- Add a fullscreen-first performance mode.
- Add import/export presets for shows.
- Consider video output integrations such as Spout on Windows, Syphon on macOS, NDI, virtual camera output, or capture-friendly fullscreen/browser source workflows.
- Consider vendoring CDN dependencies if offline use is important.
