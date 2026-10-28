# Pixel companions

The fixed overlay is mounted outside page scrolling in `PixelCompanion`. It preserves dragging, keyboard placement, double-click/tap Hide/Cancel, safe-area bounds, the 20-second gaze deadline, project-dialog suspension, and reduced motion.

## What was fixed

- Earlier gait atlases reused nearly the same foreground-leg contact. The temporary split-leg rotation was removed. New complete, authored contact and passing poses alternate the foreground and background legs; separate corrected opposite-contact artwork supplies frames 32 and 36.
- The cat used a single 6px follow threshold, repeatedly switching from a full side-view walking body to a front-facing sitting body. Its pose clock was global rather than tied to movement. `catController.ts` now applies start/stop hysteresis, computes actual velocity, and selects exactly one `idle`, `walking`, or `running` clip after movement. Its gait phase persists across continuous following and direction changes. A short standing settle precedes sitting.
- Repeated placements use `catNavigation.ts`: exact segment checks, a visibility graph around expanded control bounds, nearby safe landing points when a drop overlaps a control, and retrying blocked routes. Every pickup invalidates old waypoints. The final clear segment tracks a moving owner every tick so detours do not introduce sit/walk pauses.
- Cat following and orbital motion share the same velocity-based gait selection. Rest, grooming, stretching, sleeping, and orbit planning are independent of the human's special idle states. There is one RAF controller and one canvas per character, with cleanup on unmount and browser visibility changes.

## Human activities and timing

Edit `COMPANION_TIMING` in `animationClips.ts`:

- Standing before special idle eligibility: 12 seconds. Standing bouts are 12–20 seconds.
- Movement selection remains 65% stationary, 30% walking, 5% running. Stationary selections after extended inactivity can enter a special activity.
- First special activity is random; subsequent special activities alternate laptop/painting.
- Enter transition: 1.1 seconds. Active activity: 18–26 seconds. Exit: 0.9 seconds. Standing follows each completed activity or trip.
- Walking uses four authored phases at 150ms/frame; running uses four at 105ms/frame. Facing reverses the entire completed pose, preserving anatomy.
- Laptop: sit/open, alternating hand motions, leaning, blink, thinking pause, stand/clear props.
- Painting: reach for supplies, sit at easel, progressive blue/orange/yellow artwork, then detail strokes, thinking and blinking with the completed painting retained.
- Dragging and keyboard movement interrupt activities immediately. Controls, reduced motion, and project suspension clear activity props. Showing the avatar resets placement; hiding also hides the cat.

## Production assets

Only these two PNGs are downloaded by the website:

- `public/avatars/christian-animations.png`: 768×768, eight columns of 96px tiles; 46 active poses. IDs 6–17 are deliberately blank retired poses.
- `public/avatars/tabby-cat-animations.png`: 576×384, six columns of 96px tiles; 17 active poses. Retired cat IDs 4–7 and 13–15 are blank.

Total approximately 543 KB. Both retain crisp pixels and clean transparency. `compiledSprite.ts` clears and draws exactly one tile. It never blends idle and walking sprites. `CompanionSprite.tsx` adds subtle directional head articulation only for gaze/pickup poses.

Source PNGs are preserved in `output/companion-animation-sources/`. New artwork was generated with the built-in imagegen tool, then inspected and compiled through the same Canvas renderer used for acceptance checks. `sourceSpriteRenderer.ts` and `spriteFrames.ts` retain measured alpha rectangles and character anchors for rebuilding; they are excluded from the website's runtime imports.

With a local Vite server running, rebuild using:

```powershell
node scripts/compile-companion-sprites.cjs http://127.0.0.1:4175
```

## Implementation-specific acceptance checks

`tests/companion-animation.spec.ts` checks:

1. The rendered brighter foreground jean leg moves from right of the body to left in both walk and run opposite-contact frames, using color/position measurements on the actual shipped PNG.
2. All four cat walk and four gallop poses differ; the gathered gallop is visibly narrower than the extended phase.
3. Simulated 30px/s and 70px/s following uses walking/running respectively on every moving tick, with no sitting frames interleaved. Reversals preserve gait phase; blocked/paused travel cannot show a movement clip.
4. Both special activities enter, display at least three visibly different poses, exit to standing, and select the other activity next.
5. Painting visibly adds colored artwork; finished-art frames never revert to blank painting during the active loop.
6. Drag, keyboard placement, controls, project dialogs, and reduced motion remove special props. Only one human canvas and one cat canvas exist.
7. Phone painting fits a 320px viewport and touch pickup interrupts it immediately.

`tests/pixel-companion.spec.ts` additionally verifies gaze across the viewport, 20-second deadlines, repeat drops, touch and keyboard controls, Hide/Show, safe placement on resize, lane bounds, route obstacles, dialog suspension, independent cat orbiting, and reduced motion. `tests/portfolio.spec.ts` covers page overflow, navigation, filters, dialogs, and form behavior.

## Generation prompt set

All source prompts preserved the curly fringe, black glasses, navy-and-cream star shirt, jeans, sneakers and watch, or the tabby's green eyes, striped coat, white muzzle/chest/socks. They requested transparent backgrounds, crisp pixel edges, full subjects, no labels or floor shadows, and constant proportions.

- `christian-gait-v2.png`: four walk and four run poses facing right, contact/passing/opposite-contact/passing, with foreground and background legs in opposite phases.
- `christian-opposite-contact.png`: corrected foreground bright jean leg extending back-left and darker far leg forward-right; both toes and the face point right. The left source pose is the approved walking contact.
- `christian-run-opposite.png`: the same corrected leg identity, with the bright rear knee bent and shoe lifted behind; darker leg reaches forward in a run.
- `tabby-cat-gait-v2.png`: four feline walking phases with staggered paws, and four gallop phases including extended, contact, gathered suspension, and push-off.
- `tabby-cat-opposite-contact.png`: near forepaw behind the shoulder beneath the belly, far forepaw ahead, complete staggered hind paws.
- `christian-activities-v2.png`: sixteen standing/crouching/sitting, laptop typing/blink/thinking, easel-painting and standing-up poses; artwork gains blue strokes, orange shapes and yellow accents.
- `christian-painting-finish.png`: four detail-stroke/thinking/blinking poses with the same finished sun-and-ocean painting retained in every frame.

Existing `christian-sprites.png`, `christian-strides.png`, and `tabby-cat-sprites.png` are retained as source/reference art. Their old gait poses are not used for live locomotion.

`tests/cat-following.spec.ts` reproduces the center-to-left failure with a control between the cat and owner, checks detours and safe landing, confirms recovery from temporarily blocked routes, and exercises rapid mobile drops before the cat finishes its previous trip.
