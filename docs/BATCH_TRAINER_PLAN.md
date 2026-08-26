# Dancing5 Batch Trainer Plan

## Goal

Create a separate batch training tool that can process MP4 dance videos without browser interaction, build a larger pose/audio dataset, and train a stronger Brain.js model that can be imported back into Dancing5.

The intended use is overnight training from a folder of videos, producing one best model JSON plus a short report explaining what was trained and why the selected model won.

## Why Separate from the Browser App

Dancing5 should remain a client-side browser app focused on interactive capture, playback, import, and export. Large batch jobs have different needs:

- Long-running processing that may take hours.
- Folder access and batch file management.
- CPU-heavy pose extraction and model training.
- Parallel candidate training.
- Repeatable command-line runs on a laptop or Linux server.
- Crash recovery, logs, and reports.

Keeping this outside the browser avoids adding server assumptions, file-system permissions, worker orchestration, and overnight-job complexity to the main app.

## Proposed Architecture

1. **Videos input folder**
   - Read one or more `.mp4` files from an input directory.
   - Store per-video metadata such as file name, duration, frame count, sampling rate, and extraction status.

2. **Pose extraction**
   - Use MediaPipe on decoded video frames.
   - Extract only the Dancing5 landmark subset.
   - Keep confidence/visibility values so weak frames can be filtered before training.

3. **Canonical normalization**
   - Convert raw MediaPipe coordinates into the same canonical pose space used by Dancing5.
   - Preserve the current 13-landmark, 39-number output shape.
   - Store normalization metadata with the exported dataset.

4. **Pose quality gate**
   - Drop frames with missing landmarks, low visibility, unstable body scale, or implausible joint positions.
   - Track rejection counts by reason for the training report.

5. **Combined dataset**
   - Merge accepted frames from all videos into one Dancing5-compatible dataset.
   - Keep source metadata so poor videos can be identified later.
   - Shuffle or split data deterministically using a configured random seed.

6. **Brain.js training**
   - Train using the same frame shape Dancing5 expects:

```json
{
  "input": [0.0],
  "output": [0.0]
}
```

   - Export models using the existing Dancing5 model JSON import format.

7. **Multiple parallel candidate models**
   - Train several candidate Brain.js models with different hidden layers, activation settings, learning rates, or sampled datasets.
   - Run candidates in separate Node.js worker processes so one slow or failed run does not block the whole batch.

8. **Best model export**
   - Compare candidates using consistent validation metrics.
   - Export the best model as a Dancing5-compatible JSON file.
   - Save rejected candidates optionally for debugging, but keep the default output simple.

## Recommended Implementation Path

Use a two-stage pipeline:

1. **Python MediaPipe extraction**
   - Decode MP4 files.
   - Run MediaPipe pose detection.
   - Select the 13 Dancing5 landmarks.
   - Apply canonical normalization and quality gates.
   - Export a Dancing5-compatible dataset JSON.

2. **Node.js Brain.js training**
   - Load the exported dataset JSON.
   - Train Brain.js using the same model structure expected by Dancing5.
   - Export a Dancing5-compatible model JSON.

3. **Optional parallel workers**
   - Add a coordinator script after the single-model path works.
   - Launch multiple Node.js training workers with different candidate configs.
   - Collect metrics and select the best exported model automatically.

This keeps pose extraction close to MediaPipe's strongest Python tooling while keeping training close to the Brain.js runtime already used by Dancing5.

## Compatibility Requirements

The batch trainer must match Dancing5 instead of defining a new model format.

- Use the same 13 landmarks:
  - nose
  - left/right shoulders
  - left/right elbows
  - left/right wrists
  - left/right hips
  - left/right knees
  - left/right ankles
- Use the same canonical pose normalization as the browser workflow.
- Use the same quality gate concepts: landmark presence, visibility/confidence, stable body scale, and plausible pose shape.
- Export datasets with the existing Dancing5 dataset envelope.
- Export models with the existing Dancing5 model JSON import envelope.
- Preserve the Brain.js `NeuralNetwork.toJSON()` payload shape.

## Server and Laptop Usage

Small development tests should run locally on a laptop:

- One short MP4.
- Small dataset export.
- One Brain.js training run.
- Manual import into Dancing5.

Overnight training should run on a Linux server:

- Folder of MP4 files.
- Long-running extraction and CPU training.
- Multiple candidate runs in parallel if CPU cores are available.
- Logs and a training report written to disk.

No GPU should be assumed. The first version should be designed for CPU-only execution.

## Risks and Open Questions

- **Normalization parity:** Python normalization must stay identical to Dancing5 JavaScript normalization. A shared fixture test should compare known raw landmarks against expected normalized output.
- **Frame rate and sampling:** Sampling every frame may overrepresent slow sections and make training expensive. The MVP needs a simple fixed sampling interval; later versions can add motion-aware sampling.
- **Audio feature compatibility:** Dancing5 currently uses Web Audio frequency bins. The batch tool must either reproduce compatible audio features outside the browser or start with pose-only/dataset workflows until audio parity is solved.
- **Model comparison metrics:** The project needs a practical validation metric, such as average output error on held-out frames plus checks for smoothness and pose plausibility.
- **Overfitting:** Larger models may memorize a small video set. Use train/validation splits by video where possible, not only random frame splits.
- **Data quality:** Bad camera angles, occlusion, mirrored videos, cuts, and multi-person footage can poison the dataset unless rejected or labeled.
- **Runtime compatibility:** Brain.js behavior and JSON output should be verified in the same Node.js/package version targeted by the batch trainer.

## First MVP

Build the smallest useful pipeline:

1. Process one MP4 file.
2. Extract Dancing5's 13 pose landmarks.
3. Apply canonical normalization and a basic quality gate.
4. Export one Dancing5-compatible dataset JSON.
5. Train one Brain.js model in Node.js.
6. Export one Dancing5-compatible model JSON.
7. Import the model manually in Dancing5 and compare behavior against a browser-trained model.

The MVP succeeds when the exported dataset and model can be loaded by the existing app without application-code changes.

## Later Version

After the MVP is proven:

1. Process a full folder of MP4 files.
2. Resume interrupted extraction runs.
3. Train multiple Brain.js candidates in parallel.
4. Produce a training report with dataset counts, rejection reasons, candidate configs, validation scores, and final selection.
5. Select and export the best model automatically.
6. Keep optional archives of candidate models and per-video diagnostics for debugging.

