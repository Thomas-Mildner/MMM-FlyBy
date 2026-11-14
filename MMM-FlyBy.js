/* MagicMirror² Modul: MMM-FlyBy
 * Lässt eine Figur (eigenes Bild) in Intervallen über den Spiegel fliegen.
 */
const MMM_FLYBY_DEFAULT_CONFIG = {
  image: "airplane.png",
  images: [],
  size: 160,
  interval: 5 * 60 * 1000,
  firstDelay: 5000,
  duration: 12000,
  minY: 10,
  maxY: 60,
  bob: 25,
  showSparkles: true,
  showStars: false,
  randomDirection: true,
  nightHours: [23, 6],
  respectReducedMotion: true
};

Module.register("MMM-FlyBy", {
  defaults: MMM_FLYBY_DEFAULT_CONFIG,

  getStyles() { return ["MMM-FlyBy.css"]; },

  normalizeConfig() {
    const config = { ...MMM_FLYBY_DEFAULT_CONFIG, ...this.config };
    const warn = (key, reason) => {
      console.warn(`[MMM-FlyBy] Invalid config option "${key}" (${reason}); using its default.`);
    };
    const normalizeNumber = (key, isValid) => {
      if (typeof config[key] !== "number" || !Number.isFinite(config[key]) || !isValid(config[key])) {
        warn(key, "out of range");
        config[key] = MMM_FLYBY_DEFAULT_CONFIG[key];
      }
    };

    if (typeof config.image !== "string" || !config.image.trim()) {
      warn("image", "expected a non-empty filename");
      config.image = MMM_FLYBY_DEFAULT_CONFIG.image;
    }
    if (!Array.isArray(config.images)) {
      warn("images", "expected an array of filenames");
      config.images = [];
    } else {
      const validImages = config.images.filter((image) => typeof image === "string" && image.trim());
      if (validImages.length !== config.images.length) warn("images", "invalid filenames were ignored");
      config.images = validImages;
    }

    normalizeNumber("size", (value) => value > 0);
    normalizeNumber("interval", (value) => value > 0);
    normalizeNumber("firstDelay", (value) => value >= 0);
    normalizeNumber("duration", (value) => value > 0);
    normalizeNumber("minY", (value) => value >= 0 && value <= 100);
    normalizeNumber("maxY", (value) => value >= 0 && value <= 100);
    normalizeNumber("bob", (value) => value >= 0);

    if (config.minY > config.maxY) {
      warn("minY/maxY", "minY must not exceed maxY");
      config.minY = MMM_FLYBY_DEFAULT_CONFIG.minY;
      config.maxY = MMM_FLYBY_DEFAULT_CONFIG.maxY;
    }

    if (config.nightHours !== null && (!Array.isArray(config.nightHours)
      || config.nightHours.length !== 2
      || config.nightHours.some((hour) => !Number.isInteger(hour) || hour < 0 || hour > 23))) {
      warn("nightHours", "expected null or two hours from 0 to 23");
      config.nightHours = [...MMM_FLYBY_DEFAULT_CONFIG.nightHours];
    } else if (Array.isArray(config.nightHours)) {
      config.nightHours = [...config.nightHours];
    }

    for (const key of ["showSparkles", "showStars", "randomDirection", "respectReducedMotion"]) {
      if (typeof config[key] !== "boolean") {
        warn(key, "expected a boolean");
        config[key] = MMM_FLYBY_DEFAULT_CONFIG[key];
      }
    }

    return config;
  },

  getDom() {
    this.config = this.normalizeConfig();
    const wrapper = document.createElement("div");
    wrapper.className = "flyby-wrapper";
    this.sprite = document.createElement("div");
    this.sprite.className = "flyby-sprite";
    this.sprite.style.width = this.config.size + "px";
    this.sprite.style.display = "none";

    const trail = document.createElement("div");
    trail.className = "flyby-trail";
    trail.setAttribute("aria-hidden", "true");
    if (this.config.showSparkles) {
      const sparkles = document.createElement("div");
      sparkles.className = "flyby-sparkles";
      for (let i = 0; i < 3; i++) {
        sparkles.appendChild(document.createElement("span"));
      }
      trail.appendChild(sparkles);
    }
    if (this.config.showStars) {
      const stars = document.createElement("div");
      stars.className = "flyby-stars";
      for (let i = 0; i < 3; i++) {
        stars.appendChild(document.createElement("span"));
      }
      trail.appendChild(stars);
    }
    this.sprite.appendChild(trail);

    const image = document.createElement("img");
    image.className = "flyby-image";
    image.src = this.file("images/" + this.config.image);
    image.alt = "";
    const fallbackImage = image.src;
    image.addEventListener("error", () => {
      if (image.src === fallbackImage) {
        console.warn(`[MMM-FlyBy] Could not load fallback image "${this.config.image}".`);
        return;
      }
      console.warn(`[MMM-FlyBy] Could not load image "${image.src}"; using "${this.config.image}" instead.`);
      image.src = fallbackImage;
    });
    this.imageElement = image;
    this.sprite.appendChild(image);
    wrapper.appendChild(this.sprite);
    return wrapper;
  },

  start() {
    this.stop();
    this.firstFlightTimeout = setTimeout(() => {
      this.fly();
      this.flightInterval = setInterval(() => this.fly(), this.config.interval);
    }, this.config.firstDelay);
  },

  stop() {
    clearTimeout(this.firstFlightTimeout);
    clearInterval(this.flightInterval);
    this.firstFlightTimeout = null;
    this.flightInterval = null;

    if (this.animation) {
      this.animation.cancel();
      this.animation = null;
    }
    if (this.sprite) {
      this.sprite.style.display = "none";
      this.sprite.style.willChange = "";
    }
  },

  prefersReducedMotion() {
    return this.config.respectReducedMotion
      && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  isNight() {
    const nightHours = this.config.nightHours;
    if (!nightHours) return false;

    const currentHour = new Date().getHours();
    const [startHour, endHour] = nightHours;
    return startHour > endHour
      ? currentHour >= startHour || currentHour < endHour
      : currentHour >= startHour && currentHour < endHour;
  },

  fly() {
    if (!this.sprite || !this.imageElement || this.isNight() || this.prefersReducedMotion()) return;
    if (this.animation && this.animation.playState === "running") return;

    const config = this.config;
    if (Array.isArray(config.images) && config.images.length > 0) {
      const imageIndex = Math.floor(Math.random() * config.images.length);
      this.imageElement.src = this.file("images/" + config.images[imageIndex]);
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const leftToRight = !config.randomDirection || Math.random() < 0.5;
    const flightY = viewportHeight * (
      config.minY + Math.random() * (config.maxY - config.minY)
    ) / 100;
    const startX = leftToRight ? -config.size : viewportWidth + config.size;
    const endX = leftToRight ? viewportWidth + config.size : -config.size;
    const horizontalScale = leftToRight ? 1 : -1;

    const frameCount = 24;
    const frames = [];
    for (let frameIndex = 0; frameIndex <= frameCount; frameIndex++) {
      const progress = frameIndex / frameCount;
      const x = startX + (endX - startX) * progress;
      const waveAngle = progress * Math.PI * 4;
      const verticalOffset = Math.sin(waveAngle) * config.bob;
      const rotation = Math.cos(waveAngle) * 6;
      frames.push({
        transform: `translate3d(${x}px, ${flightY + verticalOffset}px, 0) scaleX(${horizontalScale}) rotate(${rotation}deg)`,
        opacity: progress < 0.03 || progress > 0.97 ? 0 : 1,
        offset: progress
      });
    }

    this.sprite.style.display = "block";
  this.sprite.style.willChange = "transform";
    const animation = this.sprite.animate(frames, {
      duration: config.duration,
      easing: "linear"
    });
    this.animation = animation;
    animation.onfinish = () => {
      if (this.animation !== animation) return;
      this.animation = null;
      this.sprite.style.display = "none";
      this.sprite.style.willChange = "";
    };
  }
});