import test from "node:test";
import assert from "node:assert/strict";
import { journeyState, panelPose, snapStation } from "../../lib/journey.mjs";
test("parcours borné et caméra monotone dans les deux sens", () => {
  assert.equal(journeyState(-100, 1000, 5).camera, 0);
  assert.equal(journeyState(2000, 1000, 5).camera, 4);
  let previous = -1;
  for (let scroll = 0; scroll <= 1000; scroll++) {
    const current = journeyState(scroll, 1000, 5).camera;
    assert.ok(current >= previous);
    previous = current;
  }
  assert.equal(
    journeyState(300, 1000, 5).camera,
    journeyState(300, 1000, 5).camera,
  );
});
test("réponse continue dès le début du geste, sans zone morte", () => {
  assert.equal(journeyState(270, 1000, 5).camera, 1.08);
  assert.equal(journeyState(10, 1000, 5).camera, 0.04);
  assert.ok(journeyState(470, 1000, 5).camera > 1.8);
});
test("seul le panneau courant est interactif ; le précédent passe au-dessus", () => {
  assert.equal(panelPose(1, 1).interactive, true);
  assert.equal(panelPose(0, 1).interactive, false);
  assert.equal(panelPose(2, 1).interactive, false);
  assert.ok(panelPose(0, 0.5).y < 0);
  assert.ok(panelPose(0, 0.5).z > 0);
  assert.equal(panelPose(0, 1).opacity, 0);
});

test("crans : stabilisation directionnelle, tolérance et catalogue libre", () => {
  assert.equal(snapStation(300, 4000, 5, 1), 1000);
  assert.equal(snapStation(1700, 4000, 5, -1), 1000);
  assert.equal(snapStation(1030, 4000, 5, 1), 1000);
  assert.equal(snapStation(3700, 4000, 5, 1), 4000);
  assert.equal(snapStation(4200, 4000, 5, 1), null);
  assert.equal(snapStation(-50, 4000, 5, -1), null);
});

test("approche extérieure continue, rapide et raccordée aux stations intérieures", async () => {
  const { cameraDepth } = await import("../../lib/journey.mjs");
  assert.equal(cameraDepth(0), 54);
  assert.equal(cameraDepth(1), -12);
  assert.equal(cameraDepth(2), -32);
  assert.ok(Math.abs(cameraDepth(1 - 1e-7) - cameraDepth(1)) < 1e-4);
  let previous = Infinity;
  for (let position = 0; position <= 4; position += 0.01) {
    assert.ok(cameraDepth(position) < previous);
    previous = cameraDepth(position);
  }
  assert.ok(
    cameraDepth(0) - cameraDepth(1) > 3 * (cameraDepth(1) - cameraDepth(2)),
  );
});

test("aimantation : départ et arrivée sans saut de vitesse", async () => {
  const { snapProgress } = await import("../../lib/journey.mjs");
  assert.equal(snapProgress(0, 600), 0);
  assert.equal(snapProgress(600, 600), 1);
  assert.equal(snapProgress(900, 600), 1);
  assert.ok(snapProgress(1, 600) < 0.00001);
  assert.ok(1 - snapProgress(599, 600) < 0.00001);
  let previous = 0;
  for (let t = 1; t <= 600; t++) {
    const current = snapProgress(t, 600);
    assert.ok(current >= previous);
    previous = current;
  }
});
