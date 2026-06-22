# Magic Style

Magic is an abstract VJ-oriented visual mode for Dancing5. It turns tracked body landmarks and music analysis into glowing ribbons, mesh geometry, body-controlled particles, trails, pulses, and an animated generative background.

## Magic Avatar

Select `Magic` or `Magic-2` in the Avatar Style menu.

The Magic avatar is not a robot or literal skeleton. It keeps a readable human structure through glowing joint nodes, trails, animated ribbons, and mesh geometry.

`Magic` is the ribbon/body-link version. It keeps visible curved body ribbons between tracked landmarks.

`Magic-2` is the darker edge-beam version. The body segments are mostly invisible emitters: points along those invisible limbs send wild beams and curves out to the screen borders, with less white in the brightest highlights.

Body motion affects:

- hands and feet as particle emitters,
- arm speed as trail, spark, and edge-beam intensity,
- torso center as the center of halos and geometry,
- shoulder and hip width as controlled spread for the body mesh,
- movement speed as turbulence, brightness, and ribbon activity.

## Magic Background

Select `Magic` in the Background menu.

The Magic background draws full-screen animated radial waves, flowing grid lines, nebula-like gradients, and audio-reactive halos. It can run with no body detected, using a calm idle animation. With a body detected, it follows the dancer center so the performer appears to generate the background.

## Audio Reactivity

Magic reuses the existing normalized analyser bins:

- bass expands pulses, halos, and wave radius,
- mids thicken ribbons and deform curves,
- highs add sparks, flicker, particles, and bright highlights,
- overall energy increases glow, contrast, and visual density.

If audio is inactive, Magic still responds to body movement. If body and audio are both inactive, it displays a low-motion idle visual.

## Controls

Magic reuses the existing appearance controls:

- `Avatar Color`: base color for the palette.
- `Thickness`: ribbon, beam, and line weight.
- `Head Size`: Magic node scale.
- `Reactivity`: audio sensitivity.
- `Motion`: screen fill and expansion.
- `Zoom`, `Rotation X`, `Rotation Y`: projection and body-space orientation.
- `Background Color`: still used by other background modes.

No extra dependencies or assets are required.

## Performance Notes

Magic keeps a fixed particle cap and a short trail history. It avoids full-screen pixel processing and uses normal Canvas 2D primitives, gradients, and compositing. The default limits are designed for smooth browser playback while still filling the screen during strong movement and audio.

## Manual Tests

Recommended checks:

- Magic avatar with normal background.
- Normal avatar with Magic background.
- Magic avatar plus Magic background.
- No body detected.
- Body detected but no audio.
- Audio active but no body.
- Low and high audio input values.
- Strong arm movement.
- Slow body movement.
- Existing avatar styles and backgrounds.
- Existing model import/export.
- Existing color and appearance controls.
