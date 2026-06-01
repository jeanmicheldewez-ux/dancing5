# GitHub Pages

Dancing5 can be hosted as a static GitHub Pages site.

## Entry Point

The repository root includes:

- `index.html`: GitHub Pages entry point.
- `index-6.html`: preserved working app page.
- `.nojekyll`: prevents GitHub Pages/Jekyll processing from interfering with static files.

Both pages use relative paths.

## Publish Steps

1. Commit the project files.
2. Push to GitHub.
3. Open repository settings.
4. Open Pages.
5. Set the source to the main branch and repository root.
6. Save.
7. Open:

```text
https://jeanmicheldewez-ux.github.io/dancing5/
```

## Public Demo Data

The app imports `examples/demo-breaker.json` on startup. This means first-time visitors get a usable demo model even when their browser IndexedDB is empty.

Keep `examples/*.json` committed.

## Checks

Before publishing:

- run locally with `npx http-server -p 8080`,
- open `http://localhost:8080/index.html`,
- confirm the model dropdown includes `demo-breaker.json`,
- test microphone/music analysis,
- test model export/import,
- check browser console for fatal errors.
