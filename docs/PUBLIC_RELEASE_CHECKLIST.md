# Public Release Checklist

Before publishing Dancing5 publicly:

- Confirm there are no API keys, passwords, tokens, or secrets.
- Confirm there are no absolute local paths or Windows-only paths in app files.
- Confirm there is no private client, personal, or production data.
- Review local model exports before committing them.
- Confirm `examples/demo-breaker.json` is safe for public demo use.
- Confirm `examples/basic-dancer-model.json` is safe for compatibility/demo use.
- Confirm `index.html` opens from a local static server.
- Confirm `index-6.html` still opens from a local static server.
- Confirm model import/export works.
- Confirm microphone/music analysis works.
- Confirm GitHub Pages loads relative assets correctly.
- Confirm the browser console has no fatal startup errors.
