# MMM-FlyBy

MMM-FlyBy is a [MagicMirror²](https://magicmirror.builders/) module that animates a character flying across the screen at regular intervals. It supports custom images, a gentle bobbing flight path, sparkles, stars, and an optional quiet period at night.

## Installation

1. Place this project in your MagicMirror `modules` directory. The folder should be named `MMM-FlyBy`.
2. Make sure the module's image files are in the `images` directory.
3. Add the module to your MagicMirror configuration as shown below.
4. Restart MagicMirror.

## Configuration

Add an entry to the `modules` array in `config/config.js`:

```js
  {
      module: "MMM-FlyBy",
      position: "fullscreen_above",
      config: {
        images: ["skye.png", "chase.png", "marshal.png", "zooma.png"],
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
| `image` | `"skye.png"` | Image to display, located in the module's `images` directory. |
| `images` | `[]` | Optional list of image filenames. When non-empty, one is chosen at random for each flight, overriding `image` for that flight. |
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

For example, to randomly use the included images and show stars:

```js
{
	module: "MMM-FlyBy",
	position: "fullscreen_above",
	config: {
		images: ["skye.png", "chase.png", "marshal.png", "zooma.png"],
		showStars: true
	}
}
```

Custom images can also be added to the module's `images` directory and referenced by filename in `image` or `images`. Transparent PNG images work well for this animation.
