# /polish

Systematic visual and UX polish pass. Finds rough edges and produces a prioritised punch list.

## Usage

```
/polish                # Full polish audit
/polish display        # Display only
/polish controller     # Controller only
/polish transitions    # Phase transitions and animations only
```

## Instructions

When the user invokes this skill:

### 1. Ask What Feels Rough

Start by asking the user:

> "What feels rough or unfinished? Pick anything that bothers you, or say 'full audit' and I'll check everything."

Options to offer:
- a) **Full audit** — check everything systematically
- b) **Something specific** — "the game over screen feels empty" / "transitions are jarring"
- c) **Just make it look good** — agent uses best judgement

If the user picks (b), focus on their concern first, then do a lighter pass on everything else.

### 2. Polish Audit Checklist

Work through each category. For each item, note: GOOD (no action), ROUGH (needs work), or MISSING (not implemented).

#### A. Visual Hierarchy & Layout

| Check | What to Look For |
|-------|-----------------|
| Focal point | Every screen should have ONE clear thing to look at first |
| Information density | Not too crowded, not too empty. TV screens need breathing room. |
| Consistent spacing | Margins and padding consistent across all screens |
| Alignment | Elements aligned to a grid — nothing floating randomly |
| Colour contrast | Text readable against backgrounds (WCAG AA minimum for TV: 4.5:1) |
| Font sizes | Title: 48px+, body: 24px+, secondary: 18px+. All readable from 3m. |
| Brand consistency | Same colour palette, font weights, and border styles throughout |

#### B. Transitions & Animations

| Check | What to Look For |
|-------|-----------------|
| Phase transitions | Smooth entry/exit between lobby, playing, game over (not instant jump) |
| State changes | Score update, answer feedback, timer — animated not just swapped |
| Loading states | Any async operation has a visible loading indicator |
| Micro-interactions | Buttons have hover/active states, inputs have focus styles |
| Duration | Transitions 200-400ms. Under 200ms feels broken, over 600ms feels slow. |
| Easing | Use ease-out for entrances, ease-in for exits. Never linear. |
| No layout shift | Elements don't jump position when content changes |

#### C. Display Polish (TV)

| Check | What to Look For |
|-------|-----------------|
| Empty states | What shows before any data loads? Should be intentional, not blank. |
| Score animation | Score changes should pop, flash, or count up — not just change number |
| Timer visual | If there's a timer, it should feel urgent in the last 25% |
| Player indicators | Can viewers tell who's winning at a glance? |
| Background | Not just a flat colour — subtle gradient, pattern, or particle effect |
| Safe zone | Content within 90% of screen area (TV overscan safe zone) |
| Celebration | Correct answers, round wins, game wins need visual reward |

#### D. Controller Polish (Phone)

| Check | What to Look For |
|-------|-----------------|
| Touch feedback | Every tap produces immediate visual response (before server round-trip) |
| Button states | Disabled buttons look disabled. Active buttons look tappable. |
| Loading after action | After submitting, show a spinner/disabled state until confirmed |
| Error states | Network error, timeout, invalid input — all handled with user-friendly message |
| Keyboard handling | If there's text input: keyboard doesn't obscure the input field |
| Safe areas | Content doesn't hide behind phone notch or home indicator |
| Scroll behaviour | Long content scrolls smoothly. No bouncing or clipping. |

#### E. Sound & Feedback

| Check | What to Look For |
|-------|-----------------|
| Background music | Appropriate for the game mood. Loops cleanly. Not annoying after 5 min. |
| Correct answer SFX | Satisfying ding/chime on correct answer |
| Wrong answer SFX | Gentle buzz/whomp — not punishing |
| Timer warning SFX | Tick or urgency sound in last few seconds |
| Round transition SFX | Swoosh or fanfare between phases |
| Game over SFX | Celebratory for winner, sympathetic for losers |
| Volume balance | SFX not louder than music. Nothing startling. |
| Mute support | Game is playable with sound off (no critical info in audio only) |

#### F. Content & Copy

| Check | What to Look For |
|-------|-----------------|
| Spelling and grammar | All visible text correct |
| Tone consistency | Casual/fun, formal/serious, or retro/quirky — pick one and stick to it |
| Instructions clear | New player understands what to do without explanation |
| Feedback text | "Correct!" / "Try again" — short, encouraging, not condescending |
| Empty copy | No placeholder text ("Lorem ipsum", "TODO", "[insert here]") |

### 3. Produce the Punch List

After the audit, output a prioritised list:

```
## Polish Punch List

### Must Fix (affects gameplay or readability)
1. [issue] — [which screen, what's wrong, what it should be]
2. [issue] — ...

### Should Fix (noticeably rough)
3. [issue] — ...
4. [issue] — ...

### Nice to Have (extra delight)
5. [issue] — ...
6. [issue] — ...

### Already Good
- [thing that's working well — positive reinforcement]
- ...
```

### 4. Execute Fixes

Work through the punch list in priority order:

1. **Must Fix** items first — these are blockers
2. **Should Fix** next — these are the "it looks professional" items
3. **Nice to Have** only if time permits — ask user before doing these

For each fix:
- Make the change
- Verify visually (open in browser, check both display and controller)
- Move to the next item

Don't gold-plate. The goal is "polished and professional," not "award-winning."

## When to Use

- After `/build-game` and `/playtest` pass
- When the user says "make it look better" / "it looks rough" / "polish it"
- Before a demo or deployment
- When the game works but doesn't feel finished
