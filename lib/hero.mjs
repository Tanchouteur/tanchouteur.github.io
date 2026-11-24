// Pure helpers shared by the home hero controller and the WebGL scene.
export const clamp = (value, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
export const smoothstep = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const range = (value, from, to) => smoothstep((value - from) / (to - from));

// Four layers of the exploded processor, from the substrate to the lid.
// Each one carries an expertise domain; the order matches skills.html.
export const LAYER_COUNT = 4;

// Native scroll inside the pinned hero drives every phase. No snapping, no
// wheel capture: the camera simply follows the scroll position.
export function heroState(scroll, travel) {
  const progress = clamp(travel > 0 ? scroll / travel : 0);
  return {
    progress,
    // Identity block leaves first, before the processor opens up.
    intro: 1 - range(progress, 0.06, 0.3),
    explode: range(progress, 0.12, 0.62),
    labels: range(progress, 0.42, 0.68),
    exit: range(progress, 0.86, 1),
  };
}

// Vertical offset of a layer: assembled stack, idle breathing, exploded view.
export function layerLift(index, explode, breathing = 0) {
  const assembled = [0, 0.2, 0.34, 0.5][index] ?? index * 0.2;
  return assembled + explode * index * 1.05 + breathing * index * 0.05;
}

// Device pixel ratio bounded by a pixel budget so large screens stay smooth.
export function pixelRatio(width, height, devicePixelRatio = 1) {
  if (width <= 0 || height <= 0) return 1;
  return Math.max(
    0.75,
    Math.min(
      devicePixelRatio,
      width <= 760 ? 1.25 : 1.5,
      Math.sqrt(2400000 / (width * height)),
    ),
  );
}

// Exponential smoothing independent of the frame rate.
export function follow(current, target, delta, speed = 8) {
  return target + (current - target) * Math.exp(-speed * clamp(delta, 0, 0.1));
}
