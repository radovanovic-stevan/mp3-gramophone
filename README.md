# Gramophone

A 3D horn gramophone in the browser. Add any MP3 (or other audio file) and it plays on the record.

- Press play and the crank winds, the record spins up to 78 RPM, the tonearm swings over and the needle drops
- The arm follows the music inward as the track plays
- Each record gets a label with the song's name
- **Shellac sound** narrows the audio like a horn gramophone and adds surface crackle; switch it off for the original sound
- Add several files and they play one after another from the record crate
- Comes with a short demo waltz, generated in the browser
- Files never leave your browser

## Run it

It's static files with no build step. Serve the folder:

```sh
python3 -m http.server 8644
```

and go to http://localhost:8644/. (Opening `index.html` straight from disk won't work, because browsers block ES modules on `file://`.) three.js and the fonts load from CDNs.

## Deploy

`.github/workflows/pages.yml` deploys `index.html`, `style.css` and `main.js` to GitHub Pages on every push to `main`. In the repo settings, set Pages' source to **GitHub Actions**.
