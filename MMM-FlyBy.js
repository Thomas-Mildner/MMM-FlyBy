/* MagicMirror² Modul: MMM-FlyBy
 * Lässt eine Figur (eigenes Bild) in Intervallen über den Spiegel fliegen.
 */
Module.register("MMM-FlyBy", {
  defaults: {
    image: "airplane.png",     // Datei in modules/MMM-FlyBy/images/ (eigenes Bild, transparenter Hintergrund)
    images: [],
    size: 160,             // Breite in px
    interval: 5 * 60 * 1000, // alle 5 Minuten
    firstDelay: 5000,      // erster Flug nach 5 s
    duration: 12000,       // Flugdauer in ms
    minY: 10,              // Höhe in % (oben)
    maxY: 60,              // Höhe in % (unten)
    bob: 25,               // Auf-und-ab in px
    motionProfile: "wave",
    showSparkles: true,
    showStars: false,
    randomDirection: true, // links→rechts oder rechts→links
    nightHours: [23, 6]    // keine Flüge in dieser Zeitspanne, null = immer
  },

  getStyles() { return ["MMM-FlyBy.css"]; },

  getDom() {
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
    if (this.sprite) this.sprite.style.display = "none";
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

  getMotionProfile() {
    switch (this.config.motionProfile) {
      case "straight":
        return { cycles: 0, bobScale: 0, rotation: 0 };
      case "gentle":
        return { cycles: 1, bobScale: 0.5, rotation: 3 };
      case "wave":
      default:
        return { cycles: 2, bobScale: 1, rotation: 6 };
    }
  },

  fly() {
    if (!this.sprite || !this.imageElement || this.isNight()) return;
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
    const motionProfile = this.getMotionProfile();

    const frameCount = 96;
    const frames = [];
    for (let frameIndex = 0; frameIndex <= frameCount; frameIndex++) {
      const progress = frameIndex / frameCount;
      const x = startX + (endX - startX) * progress;
      const waveAngle = progress * Math.PI * 2 * motionProfile.cycles;
      const verticalOffset = Math.sin(waveAngle) * config.bob * motionProfile.bobScale;
      const rotation = Math.cos(waveAngle) * motionProfile.rotation;
      frames.push({
        transform: `translate3d(${x}px, ${flightY + verticalOffset}px, 0) scaleX(${horizontalScale}) rotate(${rotation}deg)`,
        opacity: progress < 0.03 || progress > 0.97 ? 0 : 1,
        offset: progress
      });
    }

    this.sprite.style.display = "block";
    const animation = this.sprite.animate(frames, {
      duration: config.duration,
      easing: "linear"
    });
    this.animation = animation;
    animation.onfinish = () => {
      if (this.animation !== animation) return;
      this.animation = null;
      this.sprite.style.display = "none";
    };
  }
});