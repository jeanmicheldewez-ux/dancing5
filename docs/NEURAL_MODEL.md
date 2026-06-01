# Neural Model

Dancing5 dancer models are Brain.js neural-network models saved as JSON.

## Concept

The model learns a relationship between music-analysis values and body-motion values. During playback, the current audio spectrum becomes the model input. The model output becomes a target dancer pose.

## Input

The current input is:

- 64 normalized frequency-bin values.
- Range: `0` to `1`.
- Source: Web Audio API analyser data.

## Output

The output is a flat normalized pose array:

- 13 landmarks.
- 3 values per landmark.
- Shape: `39` numbers.

The renderer converts the flat output into local pose points:

```js
x = output[i] * 2 - 1
y = output[i + 1] * 3
z = output[i + 2] * 10 - 5
```

## Trigger

The neural model is evaluated when the audio analyser detects enough low or high frequency energy. In code, `analyzeAudio()` updates `newDt` and sets `beatFlag`. Then `visualize()` calls:

```js
network.run(newDt)
```

The generated pose is interpolated until the next trigger.

## Future Motion Formats

Future model versions can support richer motion formats:

- MediaPipe landmarks.
- Normalized skeleton points.
- Bone vectors.
- Joint angles.
- Quaternions.
- Avatar-rig mapping data.

Those formats can make Dancing5 models easier to transfer to BOW, WATTOO, game engines, and standalone VJ runtimes.
