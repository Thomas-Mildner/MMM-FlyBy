# MMM-FlyBy

MMM-FlyBy is a overlay module for MagicMirror² that brings your display to life. It animates custom floating images—from seasonal sprites like Santa Claus to kids' favorite cartoon characters—soaring across your screen with a gentle bobbing flight path, sparkles, and stars.

Easily configure your characters to appear at scheduled times or regular intervals, and utilize the optional nighttime quiet period to keep things distraction-free when needed.

## Demo

<p align="center">
<img src="docs/Demo.png" alt="MMM-FlyBy Demo Screenshot" >
</p>


### Live Demo
<p align="center">
  <img src="docs/Demo.gif" alt="MMM-FlyBy Demo" width="600">
</p>

## Installation

```bash
cd ~/MagicMirror/modules
git clone https://github.com/Thomas-Mildner/MMM-FlyBy
```

## Configuration

Add an entry to the `modules` array in `config/config.js`:

```js
  {
      module: "MMM-FlyBy",
      position: "fullscreen_above",
      config: {
        images: ["airplane.png", "ghost.png"],
        firstDelay: 1000,
        interval: 10000,
        duration: 9000,
        showSparkles: false,
        showStars: true,
        nightHours: null
      }
    },
```

The module can be configured with these options:

| Option | Default | Description |
| --- | --- | --- |
| `image` | `"airplane.png"` | The default image, used for every flight when `images` is empty. It is also used as a fallback if a randomly selected image cannot be loaded. |
| `images` | `[]` | Optional list of image filenames. When non-empty, one entry is selected at random for each flight and replaces `image` for that flight. |
| `size` | `160` | Image width in pixels. |
| `interval` | `300000` | Time between flights in milliseconds (5 minutes). |
| `firstDelay` | `5000` | Delay before the first flight in milliseconds. |
| `duration` | `12000` | Duration of each flight in milliseconds. |
| `minY` | `10` | Top of the flight-height range, as a percentage of the screen height. |
| `maxY` | `60` | Bottom of the flight-height range, as a percentage of the screen height. |
| `bob` | `25` | Vertical wave amount in pixels. |
| `showSparkles` | `true` | Show sparkles in the character's trail. |
| `showStars` | `false` | Show stars in the character's trail. |
| `randomDirection` | `true` | Randomly choose left-to-right or right-to-left. Set to `false` to always fly left-to-right. |
| `nightHours` | `[23, 6]` | Hours during which flights are suppressed, using the local 24-hour clock. `[23, 6]` suppresses flights from 23:00 until 06:00. Set to `null` to allow flights at all times. |
| `respectReducedMotion` | `true` | Skip flights when the operating system requests reduced motion. |

Numeric settings are checked when the module initializes. Invalid values use their documented defaults; invalid filenames in `images` are ignored. If an image cannot be loaded, the module logs a warning and falls back to `image`.

Use `image` when you want the same picture on every flight. Use `images` when you want the picture to vary. Each flight makes a new, independent random selection from the `images` array; every array entry has the same chance, so the same image may appear on consecutive flights. Repeating a filename in the array gives it a proportionally higher chance of being selected. When `images` contains at least one valid filename, `image` is only used as the fallback.

For example, to randomly use the included images and show stars:

```js
{
	module: "MMM-FlyBy",
	position: "fullscreen_above",
	config: {
		images: ["ghost.png"],
		showStars: true
	}
}
```

Custom images can also be added to the module's `images` directory and referenced by filename in `image` or `images`. Transparent PNG images work well for this animation.

## Releases

Releases and `CHANGELOG.md` are managed by [Release Please](https://github.com/googleapis/release-please). Push commits using the Conventional Commits format to `main`. Release Please opens a pull request with the version update and generated changelog; merging that pull request publishes the GitHub release.

- `feat: add configurable flight speed` creates a minor release.
- `fix: correct flight direction` creates a patch release.
- `feat!: change the configuration format` creates a major release for a breaking change.
