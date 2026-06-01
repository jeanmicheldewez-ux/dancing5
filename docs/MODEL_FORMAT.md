# Dancing5 Model JSON Format

Dancing5 model exports are JSON files intended for browser import and future repository demo files.

## Envelope

```json
{
  "app": "Dancing5",
  "formatVersion": 1,
  "exportedAt": "2026-05-31T00:00:00.000Z",
  "modelName": "demo-breaker.json",
  "source": "local-export",
  "model": {
    "name": "demo-breaker.json",
    "data": {},
    "createdAt": "2026-05-31T00:00:00.000Z"
  },
  "settings": {
    "training": {},
    "visual": {}
  }
}
```

## Fields

- `app`: must be `Dancing5`.
- `formatVersion`: starts at `1`.
- `exportedAt`: ISO timestamp.
- `modelName`: display name and safe default import name.
- `source`: usually `local-export`; demo files may use another descriptive source.
- `model.data`: raw Brain.js `NeuralNetwork.toJSON()` output.
- `settings.training`: selected activation, hidden layers, training inputs, and camera view values.
- `settings.visual`: avatar style, avatar color, and background settings.

## Import Rules

The importer minimally validates that the JSON is a Dancing5 export and contains model data or settings data. When model data exists, it is saved into the existing IndexedDB `models` store using the same shape as the Save Model button.

## Demo Files

Static demo files should live under `examples/`. The first demo file is:

- `examples/demo-breaker.json`
- `examples/basic-dancer-model.json`
