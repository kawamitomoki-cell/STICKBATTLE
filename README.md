# STICK BATTLE ONLINE

[Play](https://kawamitomoki-cell.github.io/STICKBATTLE/)

This is the maintained source layout for the existing browser game.

| Path | Purpose |
|---|---|
| `index.html` | GitHub Pages entrypoint; **generated** |
| `src/index.template.html` | HTML screens and menu markup |
| `src/styles/` | Split CSS |
| `src/game/` | JS split by existing feature sections, in exact original order |
| `assets/audio/` | English filenames for sound assets |
| `scripts/build.mjs` | Generates the standalone `index.html` |
| `tests/` | Build and JavaScript smoke tests |

### Development

Node.js 20+ required. No install needed.

```sh
npm run build
npm run check
npm test
```

Edit the files under `src/`, then run `npm run build`. Commit the source files **and** the regenerated `index.html`. CI verifies they match.

The code deliberately remains a single **classic** JavaScript script at runtime to preserve globals, p5 callbacks, and Firebase compatibility. The split is in the *source*, without prematurely migrating a 6000+ line app to independent ES modules.

### Audio

- `goku_ki_charge.mp3`: charging
- `goku_transform.mp3`: transformation
- `goku_teleport.mp3`: teleport
- `goku_revert.mp3`: transformation ending
- `jotaro_time_stop.mp3`: time stop
- `goku_battle_bgm.mp3`: **optional; not bundled**

Renamed MP3s are decoded from the embedded audio originally in `index.html` (sound content unchanged). Old files at the repo root are removed on this branch.

### Rollout

Review/test the refactor branch before merging; `main` continues serving the previous live game. After merge, GitHub Pages will still load `index.html` at the same URL. Run browser gameplay and multiplayer tests before release.
