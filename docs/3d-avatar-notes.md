# Future 3D Rigged Avatar Renderer

Dancing5 currently renders a reduced 13-landmark pose with Canvas 2D. The runtime pose shape is `x/y/z` landmark positions for nose, shoulders, elbows, wrists, hips, knees, and ankles. This is a good format for the current stylized avatar renderers, but a rigged 3D avatar needs joint or bone rotations, plus a skeleton with consistent bind-pose orientation.

## Recommended Asset Pipeline

OBJ and STP are not good runtime targets for a rigged browser avatar. OBJ has no standard skeletal animation support, and STP is a CAD interchange format rather than a web character-animation format.

A safer future pipeline is:

1. Build or choose a humanoid character.
2. Rig and animate/calibrate it in Mixamo or Blender.
3. Export from Blender as glTF/GLB.
4. Load and render it in the browser with Three.js.

GLB is the best first runtime target because it packages mesh, skeleton, materials, and animations in one browser-friendly file.

## Mapping Strategy

The current project stores landmark positions. A rigged avatar wants rotations for bones such as spine, neck, upper arms, forearms, thighs, and shins. A direct position-to-bone mapping will need an intermediate pose solver:

- compute torso direction from shoulders and hips;
- compute head direction from nose and shoulders;
- compute upper-arm and forearm vectors from shoulder, elbow, and wrist landmarks;
- convert those vectors into local bone rotations relative to the avatar rest pose;
- smooth rotations to avoid jitter.

## Safe Prototype Path

Do not replace the current Canvas 2D renderers first. Add the 3D renderer as a separate experimental renderer behind a feature flag or explicit UI option.

A minimal prototype should map only:

- head;
- torso/spine;
- left and right shoulders;
- left and right upper arms;
- left and right forearms.

After the upper-body prototype is stable, extend to hips and legs, then evaluate whether lightweight IK is needed for feet and full-body contact. This keeps the current webcam, Magic mode, model import/export, datasets, and GitHub Pages behavior intact while the 3D path matures.
