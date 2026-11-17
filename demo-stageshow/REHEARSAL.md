# Rehearsal: Lex, buscar un cliente y recordar su audiencia

Gold: `examples/linear`.
- **Kept:** the window with a sidebar and the inset content panel, the list's anatomy (one column template), the neutral palette, the pace of the cursor and the story shape: one gesture with its result under the hand, and an undo with keycaps as the caused reset.
- **Changed:**
  - The product is a law firm's practice app, with its own accent green (`#2e6b4f`), status rings for client states and area chips.
  - Search lives in a toolbar field instead of a command menu.
  - The search also returns the client's case files ("Expedientes"), so the filtered pane stays full.
  - The client opens in a side panel (the payoff) instead of updating a row.
  - There is no camera push-in: the payoff reads at the shown size.

Beats:
1. The cursor clicks the search field and types "valdes"; non-matching rows close up and the case files appear.
2. It opens Constructora Valdés & Hijos; the panel slides in with tomorrow's hearing.
3. It presses "Recordarme" and the button confirms on itself ("Recordatorio creado"). This is the payoff; it holds for 2.2 s.
4. Esc closes the panel, Esc clears the search and the rows come back. The cursor returns to its start.

The loop runs about 17 s.

Captured:
- **Widths:** wide (920×410 design) and 390 (compact design at 358×330).
- **States:** `--states`.
- **Reduced motion:** the poster is the payoff frame.
- **Host page:** the built `dist/index.html` at 1280 and 390, plus `layout.mjs` on the host at 390.
- **Look:** light only.

Gate:
- Wide loop: `rehearsal passed (necessary, not sufficient: references/verify.md and the fresh eye in review.md still stand)`.
- 390, states, host at 1280 and host at 390 also end `rehearsal passed`.

Film, line → frame → fix:
- **`empty pane` on the window body (2.1 s):** a single result left 90 % of the pane empty. Search now also lists the client's case files.
- **`empty pane` on the panel, and `hard edge` (panel text cut by the window edge while sliding):** the surface slides in 0.5 s; its content fades in after the edge has passed (0.3 s delay) and fades out first on close.
- **`lands on a transform`:** `will-change: transform` on the panel.
- **`appears with no entrance` / `vanishes with no exit` (bell and check icons):** one icon slot with `States`, which crossfades.
- **`loop seam: cursor does not end where it starts`:** the script moves the cursor back to its rest point.
- **390, `framing` (window narrower than tall) and `cut by the crop` (search field cut on the right):** the compact layout became its own design, with the window whole across between 16 px gutters and bleeding only at the bottom.
- **390, `uneven inset` (panel header, then the row avatar):** the header name column flexes; the compact row's right padding is 10 px, matching the avatar's vertical inset.
- **`covers` (seen in frames, not flagged):** the cursor was resting on the word "Recordarme"; it now aims at the bell icon.

Lines that stand (candidates, not gate failures):
- **`jump: ss-field__chars width` while typing:** each typed character lands at once, which is instant typing feedback inside the kit's `Field`.
- **`handoff shift` of 0.2 to 0.4 px on `ss-roll__item`, and `jump: ss-button width -2.3px` (host, wide):** both happen inside the kit's `Button` label roll, "Recordarme" to "Recordatorio creado". Not fixable from the scene without reshaping a kit part, which the skill forbids.
- **`lopsided` 12/16 px on the compact row:** within a few pixels, kept.

Review: no separate fresh-eye reviewer was used (`review.md` asks for one). The builder reviewed the frames against `verify.md` and the linear gold. The one difference from the gold: the payoff is a panel, not a two-mark change in a row, so no camera is needed.

Assumptions:
- The page is white and the demo sits in a ~930 px column.
- Spanish copy.
- Placeholder bars for every string the story does not touch.

Unresolved:
- The kit's `Button` label sub-pixel shift (see above).
- Coverage is reported as `inconclusive` because of sampling gaps on this machine (frames >27 ms apart). Motion inside those gaps was not judged.

Not checked:
- **Dark theme:** the scene inherits the gold's dark tokens, but they were not filmed.
- **Real devices and browsers:** touch, Safari, iOS Low Power Mode and live frame pacing. Only headless Chromium on Linux was used.
- **Playback:** pause, resume and offscreen behavior in a real browser.
