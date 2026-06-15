# Dancing5 Manual Tests

Open the app at:

```text
http://localhost:8080/index.html
```

Open the browser developer console before testing.

## Export Model JSON

1. Load or create a model.
2. Click `Save Model`.
3. Click `Export model JSON`.
4. Verify a `.json` file downloads.
5. Verify the console shows:
   - `Dancing5 export started.`
   - a model found/no model found message
   - `Dancing5 export success: ...`

## Import Model JSON

1. Click `Import model JSON`.
2. Select a Dancing5 `.json` export.
3. Verify the visible status says the import loaded.
4. Verify the model appears in the model dropdown.
5. Verify the console shows:
   - `Dancing5 import started: ...`
   - `Dancing5 import success: ...`

## Load Demo Model

1. Click `Load demo model`.
2. Verify the visible status says the demo model loaded.
3. Verify `demo-breaker.json` appears in the model dropdown.
4. Verify the console shows:
   - `Dancing5 demo load started.`
   - `Dancing5 demo load success.`

## Avatar And Visual Controls

1. Find the `Avatar / Visual` block near the X/Y/Zoom sliders.
2. Change `Avatar Style`.
3. Change `Avatar Color`.
4. Change `Background` to `Solid color`, then choose a background color.
5. Change `Background` to `Animated gradient`.
6. Click the small icon button in the block and verify the controls collapse/expand.

## Face Image Upload

1. Set `Avatar Style` to `My Head`.
2. Click `Add Avatar Head`.
3. Select a PNG, JPG, or WebP portrait photo.
4. Verify the preview dialog shows the original image and transparent cutout.
5. Enter a name and click `Save / Use this avatar image`.
6. Verify the saved image appears in `Head Picture`.
7. Select it and verify the canvas avatar uses it as the head.
8. Export model JSON and verify the selected cutout appears under `avatarImages`.
9. Import that JSON in another browser/profile and verify the selected head is restored.
10. Temporarily set `window.DANCING5_FACE_HAIR_CUTOUT_MODULE_URL` to a bad path before the adapter loads and verify the UI reports that `face-hair-cutout-js` is not loaded.

## Export/Import Settings

1. Change avatar style, avatar color, background mode/color, X, Y, and Zoom.
2. Export JSON.
3. Change those controls to different values.
4. Import the JSON.
5. Verify the visual settings and X/Y/Zoom values are restored.

## Refresh Check

1. Refresh `http://localhost:8080/index.html`.
2. Verify there are no fatal console errors from Dancing5.
3. Verify the existing Save Model button still works.
