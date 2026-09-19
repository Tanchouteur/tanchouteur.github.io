import test from "node:test";
import assert from "node:assert/strict";
import { mountScene } from "../../assets/js/scene.mjs";

test("sans environnement WebGL, le décor retourne un contrôleur de secours utilisable", () => {
  // Node ne fournit ni document ni canvas : le constructeur WebGL échoue réellement.
  const fallback = mountScene({});
  assert.doesNotThrow(() => fallback.update({ camera: 1, darkness: 1 }));
  assert.doesNotThrow(() => fallback.dispose());
  assert.doesNotThrow(() => fallback.dispose());
});
