# Dancing5 Integration Notes

## Face-Hair Cutout Integration

The face image upload feature is intentionally isolated:

- `index.html` adds the avatar upload button and preview dialog.
- `integrations/faceHairCutoutAdapter.js` adapts the external `face-hair-cutout-js` browser API to Dancing5.
- `dancer-6.js` handles validation, local persistence, selection, renderer handoff, export, and import.
- `dancer.css` styles the preview dialog and avatar-control status messages.

No build system or backend was added.

## Avatar Renderer

The existing `myHead` avatar style already draws `CUSTOM_HEAD_IMAGE` on the robot head. Saved cutouts are selected through the same `Head Picture` selector, so they do not affect the existing `robot`, `neon`, `wire`, or `leSaint` styles.

## Persistence

`LocalDB` was upgraded from version `2` to version `3` by adding:

```text
avatarImages
```

The existing stores are preserved:

```text
datas
models
settings
```

The old localStorage-based custom head picture key remains readable for backward compatibility:

```text
Dancing5.headPictures
```

New cutout uploads use IndexedDB when available, with `Dancing5.avatarImages` as a small fallback.

## Import And Export

Exports remain valid Dancing5 model JSON. When the selected head is a saved cutout image, the export embeds only that selected record under `avatarImages`.

Imports write embedded avatar images to the avatar image storage layer before applying visual settings. This allows the imported model/settings file to select the restored head image immediately.

## GitHub Pages

Dancing5 remains static and browser-only. `integrations/faceHairCutoutAdapter.js` dynamically imports the reusable library from:

```text
https://cdn.jsdelivr.net/gh/jeanmicheldewez-ux/face-hair-cutout-js@main/src/index.js
```

`index.html` provides an import map for `@mediapipe/tasks-vision`, so the ESM library works on GitHub Pages without adding a build step. If a local or pinned copy is preferred, set `window.DANCING5_FACE_HAIR_CUTOUT_MODULE_URL` before loading the adapter.
