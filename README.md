
# Dancing5

Browser-based creative AI dancer models for music-reactive avatars and live visuals.

Dancing5 is a static browser app for training, loading, and performing with neural-network dancer models. Music or microphone input is analysed in the browser, converted into normalized control values, passed through a dancer model, and rendered as animated avatar motion on canvas.

<img width="520" height="434" alt="sh-1" src="https://github.com/user-attachments/assets/f1903f54-816d-4d2b-8ce1-e6f92d64ec3c" />

## Live Demo

GitHub Pages demo:

https://jeanmicheldewez-ux.github.io/dancing5/

The public demo imports example models from `examples/models.json` on startup so visitors do not need existing browser storage. Current demo models include `examples/demo-breaker.json` and `examples/demo-disco.json`.

## Features

- Animated avatars and dancer visualization.
- Microphone and music-file analysis.
- Neural-network based dancer behavior.
- Import/export JSON dancer models.
- Avatar style, color, thickness, reactivity, motion, and background settings.
- Local browser persistence through IndexedDB.
- Future BOW/WATTOO/VJ integration path.

## How It Works

1. Music file or microphone input enters the browser.
2. Web Audio analyser extracts frequency data.
3. Audio bins are normalized into control values.
4. A Brain.js neural dancer model maps audio values to motion values.
5. Motion values are converted into avatar pose parameters.
6. Canvas animation renders the dancer.
7. Dancer models and visual settings can be exported as JSON.

## Run Locally

Install or run a static server from the project root:

```powershell
npx http-server -p 8080
```

Then open:

```text
http://localhost:8080/index.html
```

Using a local server is recommended. Browser microphone, camera, module imports, and `fetch()` demo-model loading are more reliable on `localhost` or HTTPS than from `file://`.

## GitHub Pages

1. Push the repository to GitHub.
2. Open the repository settings.
3. Go to Pages.
4. Set the source to the main branch and repository root.
5. Save and open the generated Pages URL.

The app is static and does not require a backend. Paths are relative so it can run from GitHub Pages.

## Model Storage

Saved models live in browser IndexedDB:

- Database: `LocalDB`
- Store: `models`
- Model record shape: `{ name, data, createdAt, importedAt }`
- `data`: Brain.js `NeuralNetwork.toJSON()` output

Exported model JSON files are intended to be shareable demo assets and future repository examples.

## Portfolio Note

Dancing5 demonstrates browser-based creative AI engineering: real-time audio analysis, neural model inference, browser persistence, JSON model portability, interactive canvas animation, and live-performance oriented controls without a backend.

## Roadmap

- Improve model/gallery UX for public demos.
- Add stronger versioning for model and motion formats.
- Explore MediaPipe landmarks, normalized skeletons, bone vectors, joint angles/quaternions, and avatar rig mapping.
- Prepare compatibility with BOW, WATTOO, and standalone VJ runtimes.
- Add fullscreen/show presets and external video-output options.

## License

License placeholder. Add the final public license before release.
