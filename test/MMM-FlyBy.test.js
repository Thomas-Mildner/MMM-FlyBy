const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const moduleSource = fs.readFileSync(path.join(__dirname, "..", "MMM-FlyBy.js"), "utf8");

function loadModule({ reducedMotion = false } = {}) {
  let definition;
  const warnings = [];
  const elements = [];
  const document = {
    createElement(tagName) {
      const element = {
        tagName,
        children: [],
        listeners: {},
        style: {},
        addEventListener(eventName, listener) {
          this.listeners[eventName] = listener;
        },
        appendChild(child) {
          this.children.push(child);
        },
        setAttribute() {}
      };
      elements.push(element);
      return element;
    }
  };
  const context = {
    Module: {
      register(name, moduleDefinition) {
        assert.equal(name, "MMM-FlyBy");
        definition = moduleDefinition;
      }
    },
    console: { warn: (message) => warnings.push(message) },
    document,
    window: {
      innerHeight: 1080,
      innerWidth: 1920,
      matchMedia: () => ({ matches: reducedMotion })
    }
  };

  vm.runInNewContext(moduleSource, context, { filename: "MMM-FlyBy.js" });
  const instance = Object.create(definition);
  instance.config = { ...definition.defaults };
  instance.file = (filename) => filename;
  return { instance, warnings, elements };
}

test("invalid configuration values fall back to defaults", () => {
  const { instance, warnings } = loadModule();
  instance.config = {
    ...instance.config,
    size: -1,
    interval: 0,
    minY: 80,
    maxY: 20,
    images: ["ghost.png", null],
    nightHours: [24, 6]
  };

  const config = instance.normalizeConfig();

  assert.equal(config.size, 160);
  assert.equal(config.interval, 300000);
  assert.equal(config.minY, 10);
  assert.equal(config.maxY, 60);
  assert.deepEqual(Array.from(config.images), ["ghost.png"]);
  assert.deepEqual(Array.from(config.nightHours), [23, 6]);
  assert.ok(warnings.length >= 5);
});

test("reduced-motion preference skips the flight", () => {
  const { instance } = loadModule({ reducedMotion: true });
  instance.config = { ...instance.config, nightHours: null };
  instance.sprite = { style: {}, animate() { throw new Error("Animation should be skipped"); } };
  instance.imageElement = {};

  instance.fly();

  assert.equal(instance.sprite.style.display, undefined);
});

test("flight uses a bounded number of keyframes and releases its layer hint", () => {
  const { instance } = loadModule();
  instance.config = { ...instance.config, nightHours: null, respectReducedMotion: false, randomDirection: false };
  instance.imageElement = { src: "images/airplane.png" };
  instance.sprite = {
    style: {},
    animate(frames, options) {
      this.frames = frames;
      this.options = options;
      return { playState: "running" };
    }
  };

  instance.fly();

  assert.equal(instance.sprite.frames.length, 25);
  assert.equal(instance.sprite.style.willChange, "transform");
  assert.equal(instance.sprite.options.duration, instance.config.duration);
  instance.animation.onfinish();
  assert.equal(instance.sprite.style.willChange, "");
  assert.equal(instance.sprite.style.display, "none");
});

test("a missing selected image falls back to the configured default", () => {
  const { instance, elements, warnings } = loadModule();
  instance.config = { ...instance.config, image: "airplane.png" };

  instance.getDom();
  const image = elements.find((element) => element.tagName === "img");
  image.src = "images/missing.png";
  image.listeners.error();

  assert.equal(image.src, "images/airplane.png");
  assert.equal(warnings.length, 1);
});
