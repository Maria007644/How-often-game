> Revision 4: Centre the visible alarm clock in Game 1. Game 2 question and answer must stay hidden after spins until SHOW QUESTION / SHOW ANSWER is pressed in the lower panel. New pair hides both; frequency re-spin hides the previous answer. Reveal buttons are optional, not extra required spin steps.

> Revision 3: Game 1 WHO also includes I. Game 2 activity wheel is larger (480px instead of 370px); remove all three result badges below the wheels.

> Revision 2 — latest user instructions override the original requirements below.
> Home: remove the Present Simple Games subtitle and use a generated playroom background.
> Game 1: preserve the machine design/layout/mechanics, but replace full-body people with large shoulder portraits and add six activities (14 total).
> Game 2: add I to WHO, use shoulder portraits, remove visible activity labels, replace get up late / go swimming with read a book / ride a bike. Keep only SPIN WHO + ACTIVITY and SPIN HOW OFTEN. Reveal question/answer automatically after the corresponding spin; the first button also starts the next round.
> Current launch instructions: LAUNCH.md. Current tests: tests/check.cjs and tests/CHECKLIST.md.
# HOW OFTEN? — TWO-GAME PROJECT

## FIRST: read this before changing anything
Build ONE browser project that contains a start screen and TWO separate games.

### GAME 1 — SPIN & SAY
Source: `games/game1_frequency_machine.html`
This is the approved working game. Preserve its appearance, assets, wording, layout and game logic. Do NOT redesign it. Integrate it into the project so the user can open it from the start screen and return HOME.

### GAME 2 — HOW OFTEN? CHALLENGE
IMPORTANT: rebuild this game cleanly. Do NOT repair or continue `games/game2_old_DO_NOT_USE.html`; it is included only as a record of the failed prototype.
Use `assets/game2_reference/reference_wheels.png` only as a visual reference if present.

Game 2 has THREE wheels and the categories must NEVER mix:
1. WHO wheel: Alice / Sam / Alice and Sam / WE only.
2. ACTIVITY wheel: clean teeth / get up late / go swimming / feed the fish / have a shower / eat burgers / play basketball / play computer games only.
3. HOW OFTEN wheel: always / usually / often / sometimes / rarely / never / once a week / twice a week / every day only.

Critical visual rule: no activity image may ever appear in WHO; no character may ever appear in ACTIVITY. All items must remain fully inside their own wheel sectors. Frequency words must be centered and must not overlap each other.

### GAME 2 FLOW
Round flow:
1. Spin WHO + ACTIVITY.
2. Student makes a `How often ...?` question.
3. `SHOW QUESTION` reveals the correct question.
4. Spin HOW OFTEN.
5. Student answers.
6. `SHOW ANSWER` reveals the complete Present Simple answer.
7. New round.

Use correct grammar for the selected subject (I/we vs he/she; Alice and Sam = they). Keep answer/question text in a clear blue framed panel, never over the wheels.

## START SCREEN
Create `index.html` as the only entry point. Full-screen 16:9 feel, no vertical page scrolling. Match the bright arcade/game-room style of Game 1.

Title: `HOW OFTEN?`
Subtitle: `Present Simple Games`

Two large visual cards:
- `GAME 1 — SPIN & SAY` + PLAY button
- `GAME 2 — HOW OFTEN? CHALLENGE` + PLAY button

The cards should look like parts of the same product, not two unrelated websites.

## NAVIGATION
Every game screen must have small unobtrusive navigation that does not cover the game:
- HOME
- GAME 1
- GAME 2

Switch screens without a full browser-page reload if practical. Only one screen is visible at a time.

## TECHNICAL REQUIREMENTS
- Must work locally by opening `index.html` (or with VS Code Live Server) and on GitHub Pages.
- No external/CDN dependencies.
- Keep all assets inside this project.
- No vertical scrolling at normal desktop 16:9 sizes.
- Responsive scaling: preserve aspect ratio; do not let controls or assets drift outside their intended areas.
- Do not use emoji as UI graphics.
- Do not silently replace the approved Game 1 with a recreation.

## FILE ORGANIZATION TO CREATE/USE
- `index.html` — start screen + app shell
- `css/style.css` — shared UI/start/navigation
- `js/app.js` — screen switching
- `js/game2.js` — Game 2 logic
- `games/game1_frequency_machine.html` — approved Game 1 source
- `assets/` — local images

## BEFORE YOU FINISH
Test these exact cases:
- Game 1 opens and still works as before.
- HOME returns to start.
- Game 2 WHO contains no toothbrush/toothpaste/activity icons.
- Game 2 ACTIVITY contains no Alice/Sam/WE.
- All three wheels stay inside their physical frames at 1920x1080 and 1366x768.
- Frequency labels do not overlap.
- SHOW QUESTION and SHOW ANSWER work.
- No text panel overlaps a wheel.
- No vertical scrollbars.

Do not declare completion until all of these checks pass.



