---
version: alpha
name: Sprout
description: A friendly, joyful voice chatbot. A pale mint page, deep green-black text, one vibrant green for action, and a blob face that reacts to the conversation.
colors:
  dew: "#F1FAEC"
  leaf: "#FFFFFF"
  ink: "#12301F"
  moss: "#557263"
  sprout: "#14853F"
  zest: "#C6F36B"
  sunny: "#FFD84D"
  berry: "#C93A32"
  on-sprout: "#FFFFFF"
  on-berry: "#FFFFFF"
typography:
  display:
    fontFamily: Fredoka
    fontSize: 30px
    fontWeight: 600
    lineHeight: 36px
  wordmark:
    fontFamily: Fredoka
    fontSize: 18px
    fontWeight: 600
    lineHeight: 28px
  assistant-body:
    fontFamily: Figtree
    fontSize: 17px
    fontWeight: 400
    lineHeight: 28px
  user-body:
    fontFamily: Figtree
    fontSize: 15px
    fontWeight: 400
    lineHeight: 24px
  input:
    fontFamily: Figtree
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  label:
    fontFamily: Figtree
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  caption:
    fontFamily: Figtree
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
rounded:
  sm: 8px
  md: 12px
  lg: 20px
  composer: 28px
  bubble: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  page:
    backgroundColor: "{colors.dew}"
    textColor: "{colors.ink}"
    typography: "{typography.assistant-body}"
  header:
    backgroundColor: "{colors.dew}"
    textColor: "{colors.ink}"
    typography: "{typography.wordmark}"
    height: 56px
  header-status:
    backgroundColor: "{colors.dew}"
    textColor: "{colors.moss}"
    typography: "{typography.caption}"
  empty-state-headline:
    backgroundColor: "{colors.dew}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
  empty-state-hint:
    backgroundColor: "{colors.dew}"
    textColor: "{colors.moss}"
    typography: "{typography.label}"
  message-assistant:
    backgroundColor: "{colors.dew}"
    textColor: "{colors.ink}"
    typography: "{typography.assistant-body}"
  message-user:
    backgroundColor: "{colors.zest}"
    textColor: "{colors.ink}"
    typography: "{typography.user-body}"
    rounded: "{rounded.bubble}"
    padding: 10px 16px
  composer:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.composer}"
    padding: 8px
  composer-placeholder:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.moss}"
    typography: "{typography.input}"
  button-call:
    backgroundColor: "{colors.sprout}"
    textColor: "{colors.on-sprout}"
    rounded: "{rounded.full}"
    size: 44px
  button-call-active:
    backgroundColor: "{colors.berry}"
    textColor: "{colors.on-berry}"
    rounded: "{rounded.full}"
    size: 44px
  button-send:
    backgroundColor: "{colors.sprout}"
    textColor: "{colors.on-sprout}"
    rounded: "{rounded.full}"
    size: 44px
  button-ghost:
    backgroundColor: "{colors.dew}"
    textColor: "{colors.moss}"
    rounded: "{rounded.full}"
    size: 44px
  button-ghost-hover:
    backgroundColor: "{colors.dew}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 44px
  activity-indicator:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.moss}"
    typography: "{typography.label}"
  error-banner:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 10px 16px
  toast:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
---

# Sprout

## Overview

Sprout is a voice-first chatbot with a sunny personality. The interface should feel like a
bright morning in a garden: airy, warm, and a little playful, without getting noisy. The page
is a single conversation column on a pale mint background, with a floating white composer at
the bottom. It is designed mobile-first and is light mode only.

The one bold element is **Sprout's blob face**. It is a green blob with a lime highlight, a
leaf on top, dark eyes, yellow cheeks and a smile. It reacts to the call: it blinks while
thinking, looks up while listening, and bobs with a talking mouth while speaking. Everything
else stays quiet so the face and the words carry the joy.

## Colors

- **Dew `#F1FAEC`** is the page background. It is a pale mint, never cream or grey.
- **Leaf `#FFFFFF`** is for raised surfaces: the composer, toasts and the error banner.
- **Ink `#12301F`** is for all primary text. It is a deep green-black, never neutral black.
  It has 13.4:1 contrast on dew and 14.3:1 on leaf.
- **Moss `#557263`** is for muted text: hints, placeholders and status. It has 4.9:1
  contrast on dew and 5.3:1 on leaf.
- **Sprout `#14853F`** is the primary action color: the call and send buttons and the focus
  ring. White on sprout has 4.7:1 contrast. Don't use it for body text on dew (4.4:1).
- **Zest `#C6F36B`** is a lime used for the user's bubble (ink on zest has 11.2:1 contrast)
  and for the highlight on the blob face.
- **Sunny `#FFD84D`** is used only for the blob's cheeks and the "Live" status dot. Never use it for text.
- **Berry `#C93A32`** is for destructive actions and errors: ending the call, a muted mic,
  and error icons. White on berry has 5.1:1 contrast.

Borders are sprout at 16% opacity, so they read as soft green lines instead of grey rules.

## Typography

- **Fredoka** (variable, semibold 600) is the display face, with rounded terminals that echo
  the blob. Use it only for the "Sprout" wordmark and the empty-state headline.
- **Figtree** (variable) is used for everything else. Assistant replies are 17/28 so they are easy
  to read at arm's length. User bubbles are 15/24 so they sit back slightly. Inputs are 16px so
  iOS doesn't zoom.
- Use sentence case everywhere. Don't use all-caps labels or letter-spaced eyebrows.

## Layout

- There is one centered column with a maximum width of 768px and 16px side gutters (12px
  around the composer).
- The header is a sticky 56px bar with the wordmark and status in the center and the
  new-conversation button on the left.
- Messages are stacked with 24px gaps. Assistant text runs full width without a bubble, and
  user bubbles are right-aligned at up to 85% of the width.
- The composer is pinned to the bottom and respects the safe-area insets and the on-screen keyboard.
- Touch targets are at least 44px.

## Elevation & Depth

The interface is mostly flat. Only the composer floats, with a large, soft shadow tinted
green (`rgb(20 133 63 / 0.12)`). Shadows are never grey or black. The header uses a
translucent dew background with a backdrop blur instead of a shadow.

## Shapes

- The composer has a 28px radius, which makes it a soft pill-like card.
- User bubbles are fully rounded (24px) with one tighter 8px corner at the bottom right, pointing
  toward the speaker.
- All buttons are circles.
- The error banner and toasts use a 12px radius.
- The blob face is organic, not a perfect circle: slightly wider at the bottom, like a gumdrop.

## Components

- **Sprout face**: shown at 96px in the empty state, 32px at the end of the transcript, and
  24px next to the wordmark. It is decorative (`aria-hidden`).
- **User bubble**: zest with ink text. While the transcript is still streaming, the text drops
  to 75% ink.
- **Assistant message**: plain ink text on dew. It shows only the words the TTS has already
  spoken, and each word pops in as it arrives.
- **Composer**: a leaf card with a borderless textarea and a row of round buttons. When it
  has focus, its border turns sprout.
- **Call button**: sprout with a phone icon when idle, and berry with a phone-off icon during a
  call. It shows a spinner while connecting or ending.
- **Mic toggle**: a ghost button with a moss icon. When muted, it shows a berry icon on a 15% berry tint.
- **Activity indicator**: three rounded sprout bars next to a moss label ("Listening",
  "Thinking", "Speaking").
- **Error banner**: a 10% berry tint with a berry border, a berry icon and ink text.

## Do's and Don'ts

**Do**
- Let the blob face be the only playful thing on screen.
- Tint every neutral toward green: text, borders and shadows.
- Write copy in Sprout's voice, which is warm, short and first person ("I'm all ears").
- Keep every text and background pair at WCAG AA (4.5:1) or better.

**Don't**
- Don't add a dark mode or grey surfaces.
- Don't use sunny or zest for text, or sprout for body text on dew.
- Don't add gradients, glows or extra mascots.
- Don't animate user messages or anything else besides the face and the assistant's words.

## Motion

- **Word pop**: each spoken word fades in from 0.5em below, at 96% scale, overshoots by 0.08em,
  and settles over 380ms with `cubic-bezier(0.34, 1.56, 0.64, 1)`. Words that arrive together
  ripple in about 40ms apart.
- **Blob**: it bobs every 0.9s while speaking, its mouth opens and closes every 0.3s, it blinks
  every 3.2s while thinking, and its eyes lift 1.5px while listening.
- `prefers-reduced-motion: reduce` turns off every one of these animations. Words and the face
  then appear at rest.
