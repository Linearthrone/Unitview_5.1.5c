# UnitView media pack

Drop captures here so the UnitView product page upgrades from stand-in frames to real screenshots and clips.

Suggested filenames (already documented in the brief):

| File | Use |
|------|-----|
| `board-overview.png` | Full unit board |
| `census-panel.png` | Census statistics strip |
| `assignments-demo.webm` (or `.mp4`) | Short silent assignment clip |
| `assignments-poster.png` | Poster frame for the clip |
| `print-preview.png` | Print layout preview |

Then wire paths in `src/pages/UnitViewPage.tsx` via `MediaFrame` `imageSrc` / `videoSrc` props.
