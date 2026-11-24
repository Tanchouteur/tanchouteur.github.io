import test from "node:test";
import assert from "node:assert/strict";
import { mountScene } from "../../assets/js/scene.mjs";

test("sans environnement WebGL, le décor retourne un contrôleur de secours utilisable", () => {
  // Node ne fournit ni document ni canvas : le constructeur WebGL échoue réellement.
  const fallback = mountScene({});
  assert.deepEqual(
    fallback.frame(
      { explode: 1, intro: 0, labels: 1, exit: 0 },
      { x: 0, y: 0 },
      1,
    ),
    [],
  );
  assert.doesNotThrow(() => fallback.resize());
  assert.doesNotThrow(() => fallback.dispose());
  assert.doesNotThrow(() => fallback.dispose());
});
