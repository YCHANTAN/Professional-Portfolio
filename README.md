# Christian A. Osorno — editorial portfolio

React 19 + TypeScript + Vite, custom CSS, and Motion scroll-linked animation. A playful, maximalist magazine portfolio for internship recruiters and collaborators: four selected project spreads, seven filterable archive entries, native project dialogs, a design/development skills switch, a receding hero and sticky project stack, and an honest contact flow.

## Run

```sh
npm install
npm run dev
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static host. The site currently assumes a root-domain deployment; configure Vite `base` and public asset paths for a subdirectory host.

## Content and images

- Edit **`src/data/portfolio.ts`** for projects, experience, skills, contact details, and social links. All project external links deliberately lead to Christian’s GitHub **profile**, not invented repositories or demos.
- Place the real, authorized portrait at **`public/Formal_Picture.png`**, served as `/Formal_Picture.png`. It is not included. Until replaced, the slot shows a designed cobalt monogram with “portrait to come”; no other person is presented as Christian.
- Project photos use the supplied Unsplash URLs, explicitly labeled **illustrative**, not product screenshots. Replace URLs and alt text with authorized images when available. Failed images display a static fallback. Fonts are loaded from Google Fonts; all have local fallbacks. Network access is needed for remote images/fonts.
- No project outcome metrics, testimonials, deployment links, or clinical research claims are invented.

## Contact configuration

Copy `.env.example` to `.env.local`, then set `VITE_WEB3FORMS_KEY` to your Web3Forms access key and restart/rebuild. Vite exposes this public form key in the client bundle; do not put secret server credentials here. Configure allowed domains and abuse protection in Web3Forms before deployment.

With a Gmail-linked key: controlled name/email/message fields post JSON directly to `https://api.web3forms.com/submit`, including `access_key`, `subject`, `from_name`, and a honeypot. No custom backend or email app is involved. The submit button transitions from Send Message to a disabled Sending spinner, then to a green Sent check only after HTTP OK and `success: true`. Confirmed success clears the fields and remains visible for 3.5 seconds. Failure and timeout retain the input. Configure the recipient address in Web3Forms; the recipient is determined by the key, not by this site's email text.

Without a key: submission reports that sending is not configured and **does not send anything**. There is no draft flow or false success. `.env.local` is ignored by Git and contains an empty key slot until you supply your key. Restart Vite after setting it; static deployments must be rebuilt with that environment value. Verify a real message arrives in Gmail before considering delivery ready.

## Shared implementation

- `src/components/SectionHeading.tsx`: section identity and title composition.
- `ProjectSpread.tsx` / `ProjectCard.tsx`: featured spreads and archive cards.
- `ProjectDialog.tsx`: native modal with Escape, focus containment via `showModal()`, explicit initial close-button focus, restoration to the opener, scroll lock, and backdrop dismissal.
- `ResponsiveImage.tsx`: responsive remote sources, lazy loading, explicit alt text, portrait/image fallback.
- `ContactForm.tsx`: delivery configuration and honest states.
- `src/App.tsx`: semantic page composition, mobile navigation, archive filters, and skills controls.
- `src/styles.css`: cream/ink/cobalt/orange/acid tokens, display/serif/mono roles, responsive layout and accessibility.

## Original résumé download and social links

The icon beside the hero's Elsewhere social links downloads **`public/Christian-Osorno-Resume.pdf`**. This is an unchanged copy of the supplied one-page résumé (`Resume-Christian-withpicture.pdf`), verified against the attachment and by matching SHA-256 hashes. The About section also has a subtle résumé link. The generated portfolio document and its generator were removed; the site does not recreate or rewrite your résumé.

To update the résumé, replace that PDF with your new original file and rebuild. The download URL respects Vite's configured base path. Social icons and email links remain accessible in the hero and footer. The header is sticky and anchor offsets account for its height on desktop and mobile.

## Motion

`src/components/motion/SectionDepth.tsx` and CSS implement native sticky layers. The hero moves upward, scales from 1 to 0.91, and fades as the opaque Selected Work foreground covers it. Scroll progress maps directly to the visual surface, leaving the sticky layout stationary and reversing immediately when scrolling upward. A tall hero scrolls to reveal its bottom before pinning. Project cards stack at increasing offsets (12px desktop/tablet, 8px mobile), hold briefly as a complete pile, and release naturally into About at their shared container boundary. Resize and font measurements enable the project stack only when all cards fit below the header; taller cards use normal flow. Reduced motion restores normal scrolling and full opacity.

`DisciplineMarquee.tsx` supplies a continuous, scroll-direction-aware strip with pointer and keyboard pause. `ProjectSurface.tsx` adds interruptible spring feedback to archive arrows. Featured project imagery stays static. `ContentTransition.tsx` supplies restrained content arrivals. `SkillsToolkit.tsx` gives Design/Development controls a moving active indicator and a 150ms exit/200ms entrance, retaining responsive panel height and resolving rapid switches to the latest choice. CSS handles menu and native-dialog arrivals. `ScrollComposition.tsx` remains available as an optional depth utility.

The archive has a dedicated coordinator in `ProjectArchive.tsx`: 120ms exit, commit the latest requested category, then a 180ms card entry with a capped 25ms stagger. Category controls remain responsive; the displayed result count tracks actual content. A measured All-project footprint prevents filtering from jumping the layout; it recalculates at responsive widths and after fonts settle. Excluded entries remain mounted but use native `hidden`, preserving dialog opener identity while removing them from the tab order. Reduced motion commits filters immediately.

Motion values update the hero without per-frame React renders; CSS owns its transform and opacity. Static collage rotations are preserved. Native scrolling and anchor navigation are not intercepted. `useMotionPreference.ts` reactively follows system preference changes in both directions, removing scroll subscriptions when reduced motion is enabled without remounting content or losing focus. Reduced motion disables spatial animation; essential content never begins fully hidden. Dialog dismissal is immediate so Escape and focus return are not delayed. Inspired by the editorial and compositional directions of Pamidor, Gallery Play, Danilo De Marco, and Thibaut Crépelle; no reference-site assets were copied.

## Automated checks
### React Bits-informed accents

The short hero introduction uses an inline word-stagger blur reveal with a stable, unsplit screen-reader sentence. The decorative code collage briefly decrypts its `Infinity` value and then returns to canonical text. The Explore link has a spring-driven magnetic arrow; its native link, hit area, and focus ring stay stationary. These accents reuse Motion and reactive reduced-motion handling, without new dependencies or API keys. Touch/coarse pointers do not activate magnetic movement.

Source links and the full React Bits MIT + Commons Clause notice are retained in `THIRD_PARTY_NOTICES.md`. The adaptations are purpose-specific rather than a wholesale component library import.

### Run the checks

```sh
npx playwright install chromium
npm test
```

Playwright starts two local Vite servers automatically. The Chromium tests cover four viewport widths, filters, skills switching, native-dialog keyboard/focus behavior, sticky/mobile navigation, normal/reduced-motion scrolling, measurable desktop/mobile parallax travel, live preference changes, interrupted transitions, failed images, accessible text accents, stationary magnetic-link geometry, original résumé download, missing-key errors, and configured-form success/failure. Web3Forms responses are mocked with a test-only key; these tests do **not** prove real inbox delivery. Screenshots are generated in ignored `test-results/`. Cross-browser behavior and measured frame pacing still require separate checks.

## Acceptance / QA

Build with `npm run build` (strict TypeScript and production Vite). Manually check widths 320/375/768/1440, 200% text zoom, mobile menu and Escape, archive filters, both skills modes, every project opener, dialog Tab/Shift+Tab/Escape/focus restoration, scroll lock, failed imagery, reduced motion, and both contact modes. Test Web3Forms delivery with a real configured key before launch. Browser visual and live-delivery verification must not be inferred from the build alone.

Design guidance used: installed `find-skills` discovery workflow and `apple-design` typography, interaction feedback, agency, and reduced-motion principles. The Skills leaderboard and Anthropic frontend-design source were inspected; no new skills were installed. Existing workspace was empty; no component reuse was available.
