# TZ-X1 Smart Scene Button — Homey App

Control your Homey flows with a Tuya Zigbee rotary knob. The TZ-X1 supports single press, double press, long press, left/right rotation, and press-while-rotating combos — plus battery monitoring with low and critical alerts.

---

## Device

![TZ-X1 Smart Scene Button](assets/images/large.png)

| Field | Value |
|---|---|
| Device name | TZ-X1 Smart Scene Button |
| Manufacturer ID | `_TZ3000_gwkzibhs` |
| Model ID | `TS004F` |
| Protocol | Zigbee |

---

## Supported Actions

All actions appear as **When…** trigger cards in the Homey Flow editor.

| Action | Flow trigger |
|---|---|
| Single press | Button pressed |
| Double press | Button double pressed |
| Long press | Button long pressed |
| Rotate right (clockwise) | Knob rotated right |
| Rotate left (counter-clockwise) | Knob rotated left |
| Press and rotate right | Knob pressed and rotated right |
| Press and rotate left | Knob pressed and rotated left |
| Any rotation (with direction + speed tokens) | Knob rotated |

### Knob rotated tokens

The **Knob rotated** card provides two tokens you can use in your flow:

- `direction` — `"left"` or `"right"`
- `speed` — `"slow"` or `"fast"` (fast = two rotation events within 300 ms)

### Press + rotate behaviour

Hold the button down, then rotate. Each rotation step fires a **Knob pressed and rotated** trigger. The held state resets 1 second after the last rotation event, or immediately on a single/double press.

---

## Battery Monitoring

The app reads the battery level from the device on connect and on every change report.

- Battery percentage is shown on the device tile in the Homey app.
- **Battery is low (below 20%)** — trigger card fires once when the level crosses below 20 %.
- **Battery is critical (below 10%)** — trigger card fires once when the level crosses below 10 %.
- **Battery level is less than [X]%** — condition card usable in the **If…** section of any flow.

---

## Installation

### Requirements

- [Homey Pro](https://homey.app) (SDK 3, Homey firmware ≥ 5.0.0)
- [Node.js](https://nodejs.org) ≥ 18
- [Homey CLI](https://apps.developer.homey.app/tools/cli)

```bash
npm install -g homey
```

### Install the app on your Homey

```bash
git clone https://github.com/<your-username>/homey-tz-x1.git
cd homey-tz-x1
npm install
homey app install
```

---

## Pairing

1. Open the **Homey** app on your phone.
2. Go to **Devices → Add device**.
3. Search for **TZ-X1 Smart Scene Button** and select it.
4. Follow the on-screen instructions — when prompted, put the device into pairing mode:
   - Press and hold the center button for **5 seconds** until the LED blinks rapidly.
5. Homey will discover the device and add it automatically.

---

## Found a bug?

Please open an issue on GitHub:
[github.com/<your-username>/homey-tz-x1/issues](https://github.com/<your-username>/homey-tz-x1/issues)

Include your Homey firmware version, app version, and a description of what happened vs. what you expected.

---

## License

MIT — see [LICENSE](LICENSE).
