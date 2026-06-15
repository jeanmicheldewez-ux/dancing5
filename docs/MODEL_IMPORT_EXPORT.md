# Model Import And Export

Dancing5 model JSON files are designed to be portable demo assets.

## Export

The export button writes a `.json` file containing:

- app metadata,
- format version,
- export timestamp,
- model name,
- Brain.js model data,
- training/view settings,
- visual settings,
- selected custom avatar head image data when the selected head is a saved cutout image.

Visual settings include avatar style, color, thickness, reactivity, motion amount, background settings, and selected head-image references. When the selected head is a saved `face-hair-cutout-js` cutout, export embeds that PNG record under `avatarImages` so the file can be imported in another browser.

## Import

The import flow:

1. Reads a user-selected `.json` file.
2. Validates that it looks like a Dancing5 model/settings file.
3. Saves model data into IndexedDB store `models`.
4. Restores embedded avatar images into the local `avatarImages` store.
5. Activates the imported model when safe.
6. Refreshes the model dropdown.

## Startup Demo

On startup the app imports:

```text
examples/demo-breaker.json
```

The model is stored locally under the public demo name:

```text
demo-breaker.json
```

This ensures the GitHub Pages demo does not rely only on a developer's local browser database.

`examples/basic-dancer-model.json` is kept as a compatibility model file for older documentation and tests.

## Storage

Local model records use IndexedDB:

- Database: `LocalDB`
- Store: `models`
- Key: `name`
- Data: Brain.js `NeuralNetwork.toJSON()`

Custom cutout avatar head records use:

- Store: `avatarImages`
- Key: `id`
- Data: `{ id, name, dataUrl, width, height, createdAt, source, metadata }`

The last loaded/saved model preference is stored in `localStorage` under `Dancing5.lastModelName`.
