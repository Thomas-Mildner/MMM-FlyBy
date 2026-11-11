/* MagicMirror² Modul: MMM-FlyingPup
 * Lässt eine Figur (eigenes Bild) in Intervallen über den Spiegel fliegen.
 */
Module.register("MMM-FlyingPup", {
  defaults: {
    image: "skye.png",     // Datei in modules/MMM-FlyingPup/images/ (eigenes Bild, transparenter Hintergrund)
    images: [],
    size: 160,             // Breite in px
    interval: 5 * 60 * 1000, // alle 5 Minuten
    firstDelay: 5000,      // erster Flug nach 5 s
    duration: 12000,       // Flugdauer in ms
    minY: 10,              // Höhe in % (oben)
    maxY: 60,              // Höhe in % (unten)
    bob: 25,               // Auf-und-ab in px
    showSparkles: true,
    showStars: false,
    randomDirection: true, // links→rechts oder rechts→links
    nightHours: [23, 6]    // keine Flüge in dieser Zeitspanne, null = immer
  },

  getStyles() { return ["MMM-FlyingPup.css"]; },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "flyingpup-wrapper";
    this.sprite = document.createElement("div");
    this.sprite.className = "flyingpup-sprite";
    this.sprite.style.width = this.config.size + "px";
    this.sprite.style.display = "none";

    const trail = document.createElement("div");
    trail.className = "flyingpup-trail";
    trail.setAttribute("aria-hidden", "true");
    if (this.config.showSparkles) {
      const sparkles = document.createElement("div");
      sparkles.className = "flyingpup-sparkles";
      for (let i = 0; i < 3; i++) {
        sparkles.appendChild(document.createElement("span"));
      }
      trail.appendChild(sparkles);
    }
    if (this.config.showStars) {
      const stars = document.createElement("div");
      stars.className = "flyingpup-stars";
      for (let i = 0; i < 3; i++) {
        stars.appendChild(document.createElement("span"));
      }
      trail.appendChild(stars);
    }
    this.sprite.appendChild(trail);

    const image = document.createElement("img");
    image.className = "flyingpup-image";
    image.src = this.file("images/" + this.config.image);
    image.alt = "";
    this.imageElement = image;
    this.sprite.appendChild(image);
    wrapper.appendChild(this.sprite);
    return wrapper;
  },

  start() {
    setTimeout(() => {
      this.fly();
      setInterval(() => this.fly(), this.config.interval);
    }, this.config.firstDelay);
  },

  isNight() {
    const n = this.config.nightHours;
    if (!n) return false;
    const h = new Date().getHours();
    return n[0] > n[1] ? (h >= n[0] || h < n[1]) : (h >= n[0] && h < n[1]);
  },

  fly() {
    if (!this.sprite || this.isNight()) return;
    const c = this.config;
    if (Array.isArray(c.images) && c.images.length) {
      const image = c.images[Math.floor(Math.random() * c.images.length)];
      this.imageElement.src = this.file("images/" + image);
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ltr = c.randomDirection ? Math.random() < 0.5 : true;
    const y = h * (c.minY + Math.random() * (c.maxY - c.minY)) / 100;
    const startX = ltr ? -c.size : w + c.size;
    const endX = ltr ? w + c.size : -c.size;
    const flip = ltr ? 1 : -1;

    // Flugbahn mit sanftem Wellenmuster
    const steps = 96;
    const frames = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + (endX - startX) * t;
      const dy = Math.sin(t * Math.PI * 4) * c.bob;
      const rot = Math.cos(t * Math.PI * 4) * 6;
      frames.push({
        transform: `translate3d(${x}px, ${y + dy}px, 0) scaleX(${flip}) rotate(${rot}deg)`,
        opacity: t < 0.03 || t > 0.97 ? 0 : 1,
        offset: t
      });
    }
    this.sprite.style.display = "block";
    const anim = this.sprite.animate(frames, { duration: c.duration, easing: "linear" });
    anim.onfinish = () => { this.sprite.style.display = "none"; };
  }
});