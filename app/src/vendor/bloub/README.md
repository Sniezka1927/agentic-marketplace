# bloub (vendored)

Avatar engine from [jeremy-prt/bloub](https://github.com/jeremy-prt/bloub), MIT licensed (see `LICENSE`).

- Source: `src/bot/` at commit `b4bb3c1b5f93c7b87a2e8d620f667c4093d97749`
- Copied files: `decor`, `engine`, `expressions`, `eyefit`, `face`, `math`, `profiles`, `repere`, `shape`, `skins`, `states` (tests and `cycles.ts` left out)
- Files are kept unmodified; the React rendering lives in `src/components/bot-avatar.tsx` (port of `BloubBot.vue` body + eyes rendering).
- The project is not affiliated with x.ai; it recreates the look of the x.ai bot avatar.

The package is not published to npm, which is why the engine is copied instead of installed.
