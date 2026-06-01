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
- visual settings.

Visual settings include avatar style, color, thickness, reactivity, motion amount, and background settings.

## Import

The import flow:

1. Reads a user-selected `.json` file.
2. Validates that it looks like a Dancing5 model/settings file.
3. Saves model data into IndexedDB store `models`.
4. Activates the imported model when safe.
5. Refreshes the model dropdown.

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

The last loaded/saved model preference is stored in `localStorage` under `Dancing5.lastModelName`.
