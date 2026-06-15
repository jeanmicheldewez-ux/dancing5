# Face Image Upload

Dancing5 supports custom avatar head images through the `My Head` avatar style.

## User Flow

1. Open the avatar controls.
2. Set `Avatar Style` to `My Head`.
3. Click `Add Avatar Head`.
4. Choose a PNG, JPG, or WebP portrait from disk.
5. Dancing5 calls `face-hair-cutout-js` through `integrations/faceHairCutoutAdapter.js`.
6. Review the original image and transparent PNG cutout in the preview dialog.
7. Enter a name.
8. Click `Save / Use this avatar image`.

Saved images appear in the `Head Picture` selector and are applied by the existing canvas avatar renderer.

## Library Loading

The reusable cutout library is not vendored in this repository. Dancing5 loads its ESM API on demand from jsDelivr:

```text
https://cdn.jsdelivr.net/gh/jeanmicheldewez-ux/face-hair-cutout-js@main/src/index.js
```

`index.html` includes an import map for the library's MediaPipe dependency:

```html
<script type="importmap">
  {
    "imports": {
      "@mediapipe/tasks-vision": "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs"
    }
  }
</script>
```

The public library/demo URL is:

```text
https://jeanmicheldewez-ux.github.io/face-hair-cutout-js/
```

If you later vendor or publish a pinned browser module, override the import URL before `integrations/faceHairCutoutAdapter.js`:

```html
<script>
  window.DANCING5_FACE_HAIR_CUTOUT_MODULE_URL = "libs/face-hair-cutout-js/src/index.js";
</script>
```

For compatibility with future browser bundles, the adapter also accepts a global object/function named one of:

- `FaceHairCutoutJS`
- `FaceHairCutout`
- `faceHairCutout`
- `faceHairCutoutJs`

It calls the first available method among:

- `extractFaceHair`
- `extractFaceAndHair`
- `extract`
- `processImage`
- `process`
- `cutout`

The library should return a PNG data URL, `Blob`, `HTMLCanvasElement`, or `ImageData`. Dancing5 normalizes that into a transparent PNG data URL.

## Errors

The UI reports:

- invalid file,
- library not loaded,
- no face detected,
- extraction failed,
- save failed.

Failed extractions are not stored.

## Storage

New cutout images are stored browser-only:

- Database: `LocalDB`
- Version: `3`
- Store: `avatarImages`
- Key: `id`

Stored object shape:

```json
{
  "id": "avatar-head-...",
  "name": "Portrait name",
  "dataUrl": "data:image/png;base64,...",
  "width": 512,
  "height": 512,
  "createdAt": "2026-06-12T00:00:00.000Z",
  "source": "face-hair-cutout-js",
  "metadata": {}
}
```

If IndexedDB is unavailable or the upgraded object store is missing, Dancing5 falls back to `localStorage` key `Dancing5.avatarImages`.

## Export And Import

Model export includes:

- `settings.headPictureName`
- `settings.selectedAvatarImageId`
- `avatarImages`, containing the selected cutout image record when the selected head is a saved cutout image.

Import restores embedded `avatarImages` before applying settings, so a shared model JSON can restore the selected custom head image in another browser.
