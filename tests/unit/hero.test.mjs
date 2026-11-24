import test from "node:test";
import assert from "node:assert/strict";
import {
  heroState,
  layerLift,
  pixelRatio,
  follow,
  LAYER_COUNT,
} from "../../lib/hero.mjs";

test("l’état du héros reste borné et suit le défilement de façon monotone", () => {
  let previous = heroState(0, 1000);
  assert.deepEqual(
    [
      previous.progress,
      previous.intro,
      previous.explode,
      previous.labels,
      previous.exit,
    ],
    [0, 1, 0, 0, 0],
  );
  for (let scroll = 0; scroll <= 1200; scroll += 25) {
    const state = heroState(scroll, 1000);
    for (const value of Object.values(state))
      assert.ok(value >= 0 && value <= 1);
    assert.ok(state.explode >= previous.explode);
    assert.ok(state.labels >= previous.labels);
    assert.ok(state.intro <= previous.intro);
    previous = state;
  }
  assert.equal(heroState(-200, 1000).progress, 0);
  assert.equal(heroState(500, 0).progress, 0);
  const end = heroState(1000, 1000);
  assert.equal(end.explode, 1);
  assert.equal(end.labels, 1);
  assert.equal(end.intro, 0);
});

test("l’identité disparaît avant que les étiquettes d’expertise apparaissent", () => {
  const readable = heroState(40, 1000);
  assert.equal(readable.intro, 1);
  assert.equal(readable.labels, 0);
  const crossing = heroState(420, 1000);
  assert.ok(crossing.intro < 0.05 && crossing.labels < 0.05);
});

test("les couches s’empilent puis s’écartent dans l’ordre", () => {
  const assembled = Array.from({ length: LAYER_COUNT }, (_, i) =>
    layerLift(i, 0),
  );
  const exploded = Array.from({ length: LAYER_COUNT }, (_, i) =>
    layerLift(i, 1),
  );
  for (let i = 1; i < LAYER_COUNT; i++) {
    assert.ok(assembled[i] > assembled[i - 1]);
    assert.ok(exploded[i] - exploded[i - 1] > 0.9);
  }
  assert.equal(layerLift(0, 1), 0);
});

test("la densité de pixels respecte le budget de rendu", () => {
  assert.equal(pixelRatio(390, 844, 3), 1.25);
  assert.equal(pixelRatio(1280, 720, 2), 1.5);
  assert.ok(pixelRatio(1440, 900, 2) < 1.5);
  const ratio = pixelRatio(2560, 1440, 2);
  assert.ok(2560 * 1440 * ratio * ratio <= 2400000 * 1.0001);
  assert.equal(pixelRatio(7680, 4320, 2), 0.75);
  assert.equal(pixelRatio(0, 0, 2), 1);
});

test("le lissage converge sans dépasser la cible", () => {
  let value = 0;
  for (let i = 0; i < 120; i++) {
    value = follow(value, 1, 1 / 60);
    assert.ok(value <= 1);
  }
  assert.ok(value > 0.999);
  assert.equal(follow(0.5, 1, 0), 0.5);
});
