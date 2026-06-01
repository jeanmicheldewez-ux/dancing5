# Dancing5 Motion Format

Dancing5 learns a mapping from audio frequency data to a reduced body pose.

## Input

The current model input is an array of 64 normalized audio frequency values:

- Source: Web Audio API analyser frequency bins.
- Range: `0` to `1`.
- Shape: `number[64]`.

## Output

The current model output is a flat array of 39 numbers, representing 13 body landmarks with 3 values each:

- Shape: `number[39]`.
- Landmark order: nose, left/right shoulders, left/right elbows, left/right wrists, left/right hips, left/right knees, left/right ankles.
- Stored triplet per landmark: normalized `x`, `y`, `z`.

During playback the values are converted back approximately as:

```js
x = output[i] * 2 - 1
y = output[i + 1] * 3
z = output[i + 2] * 10 - 5
```

## Training Data

Training datasets are saved in IndexedDB store `datas` as:

```json
{
  "name": "dataset-name",
  "data": [
    {
      "input": [0.0],
      "output": [0.0]
    }
  ],
  "createdAt": "2026-05-31T00:00:00.000Z"
}
```

The training data format is not yet versioned separately.
