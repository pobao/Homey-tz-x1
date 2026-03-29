'use strict';

/**
 * TZ-X1 Smart Scene Button (_TZ3000_gwkzibhs / TS004F)
 *
 * Frame decoding — bytes from arg1.data (the payload buffer):
 *   data[2]=0xfd, data[3]=0 → single press
 *   data[2]=0xfd, data[3]=1 → double press
 *   data[2]=0xfd, data[3]=2 → long press  (also starts press+rotate window)
 *   data[2]=0xfc, data[3]=0 → rotate right
 *   data[2]=0xfc, data[3]=1 → rotate left
 *
 * Press+rotate detection:
 *   A long-press event arms this.isPressed for 1 second. If a rotation
 *   arrives within that window it fires press_rotate_right / press_rotate_left
 *   instead of the plain rotate action. If the window expires with no
 *   rotation, the regular long_pressed trigger fires.
 */

const { ZigBeeDevice } = require('homey-zigbeedriver');

const PRESS_ROTATE_WINDOW_MS = 1000;

class TZX1Device extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    this.log('TZ-X1 connected:', this.getName());

    this.isPressed        = false;
    this._pressTimer      = null;
    this._hadRotation     = false;
    this._lastRotateTime  = null;

    this.registerCapabilityListener('button', async () => {});

    this._attachFrameDecoder(zclNode);
    this._attachBatteryListener(zclNode);
  }

  onDeleted() {
    this._clearPressTimer();
    this.log('TZ-X1 removed');
  }

  // ── Battery ──────────────────────────────────────────────────────────────

  _attachBatteryListener(zclNode) {
    const powerCluster = zclNode.endpoints[1]?.clusters?.genPowerCfg;
    if (!powerCluster) {
      this.log('genPowerCfg cluster not found — battery monitoring unavailable');
      return;
    }

    powerCluster.on('attr.batteryPercentageRemaining', (value) => {
      this._onBatteryUpdate(value);
    });

    // Read current level once on connect
    powerCluster.readAttributes(['batteryPercentageRemaining'])
      .catch((err) => this.log('Battery read failed:', err));
  }

  _onBatteryUpdate(rawValue) {
    const pct = Math.min(100, Math.round(rawValue / 2));
    const prev = this.getCapabilityValue('measure_battery') ?? 100;

    this.setCapabilityValue('measure_battery', pct).catch(this.error.bind(this));
    this.log(`Battery: ${pct}%`);

    // Only fire threshold triggers when crossing downward
    if (pct < 20 && prev >= 20) {
      this.log('Battery low — firing trigger');
      this.driver.triggerBatteryLow(this);
    }
    if (pct < 10 && prev >= 10) {
      this.log('Battery critical — firing trigger');
      this.driver.triggerBatteryCritical(this);
    }
  }

  // ── Frame decoder ────────────────────────────────────────────────────────

  _attachFrameDecoder(zclNode) {
    let wrapped = 0;
    for (const [epId, endpoint] of Object.entries(zclNode.endpoints)) {
      if (typeof endpoint.handleFrame !== 'function') continue;
      const orig = endpoint.handleFrame.bind(endpoint);
      endpoint.handleFrame = (...args) => {
        this._decodeFrame(args);
        return orig(...args);
      };
      this.log(`Frame decoder attached to EP${epId}`);
      wrapped++;
    }
    if (wrapped === 0) {
      this.log('WARNING: no endpoint.handleFrame found — device may not respond');
    }
  }

  _decodeFrame(args) {
    const frame = args[1];
    if (!frame) return;

    const buf = frame.data ?? frame.payload ?? (Buffer.isBuffer(frame) ? frame : null);
    if (!Buffer.isBuffer(buf) || buf.length < 4) return;

    const byte2 = buf[2];
    const byte3 = buf[3];

    this.log(`Frame: data[2]=0x${byte2.toString(16)} data[3]=0x${byte3.toString(16)}`);

    if (byte2 === 0xfd) {
      switch (byte3) {
        case 0: return this._onSinglePress();
        case 1: return this._onDoublePress();
        case 2: return this._onLongPress();
      }
    } else if (byte2 === 0xfc) {
      switch (byte3) {
        case 0: return this._onRotate('right');
        case 1: return this._onRotate('left');
      }
    }

    this.log(`Unhandled frame: data[2]=0x${byte2.toString(16)} data[3]=0x${byte3.toString(16)}`);
  }

  // ── Action handlers ──────────────────────────────────────────────────────

  _onSinglePress() {
    this._clearPressTimer();
    this.isPressed    = false;
    this._hadRotation = false;
    this._dispatch('button_pressed');
  }

  _onDoublePress() {
    this._clearPressTimer();
    this.isPressed    = false;
    this._hadRotation = false;
    this._dispatch('double_pressed');
  }

  _onLongPress() {
    // Arm the press+rotate window instead of firing long_pressed immediately.
    // If no rotation arrives within 1 second, the timer fires long_pressed.
    // If rotations do arrive, each one resets the timer — isPressed stays true
    // until 1 second passes with no further events.
    this._clearPressTimer();
    this.isPressed    = true;
    this._hadRotation = false;
    this.log('Press window armed — waiting for rotation or 1s timeout');
    this._startPressTimer();
  }

  _startPressTimer() {
    this._pressTimer = this._setTimeout(() => {
      if (this.isPressed) {
        const hadRotation = this._hadRotation;
        this.isPressed    = false;
        this._hadRotation = false;
        this._pressTimer  = null;
        if (hadRotation) {
          this.log('Press window expired after rotation — back to normal');
        } else {
          this.log('Press window expired — triggering long press');
          this._dispatch('long_pressed');
        }
      }
    }, PRESS_ROTATE_WINDOW_MS);
  }

  _onRotate(direction) {
    // Compute speed from time between consecutive rotate events.
    // < 300 ms between events = fast, otherwise slow.
    const now = Date.now();
    const speed = (this._lastRotateTime !== null && (now - this._lastRotateTime) < 300) ? 'fast' : 'slow';
    this._lastRotateTime = now;

    if (this.isPressed) {
      // Rotation while button is held — fire press+rotate and reset the timer
      // so isPressed stays true as long as rotations keep arriving.
      this._hadRotation = true;
      this._clearPressTimer();
      this._startPressTimer();
      this._dispatch(direction === 'right' ? 'press_rotate_right' : 'press_rotate_left');
    } else {
      this.driver.triggerKnobRotated(this, direction, speed);
      this._dispatch(direction === 'right' ? 'rotated_right' : 'rotated_left');
    }
  }

  // ── Dispatch ─────────────────────────────────────────────────────────────

  _dispatch(action) {
    this.log('Action:', action);

    const notifications = {
      button_pressed:    '👆 Single press',
      double_pressed:    '👆👆 Double press',
      long_pressed:      '⏱️ Long press',
      rotated_right:     '➡️ Rotate right',
      rotated_left:      '⬅️ Rotate left',
      press_rotate_right: '🔄 Press + rotate right',
      press_rotate_left:  '🔄 Press + rotate left',
    };

    this._notify(notifications[action] ?? action);

    switch (action) {
      case 'button_pressed':
        this.setCapabilityValue('button', true).catch(this.error.bind(this));
        this.driver.triggerButtonPressed(this);
        break;
      case 'double_pressed':
        this.driver.triggerDoublePressed(this);
        break;
      case 'long_pressed':
        this.driver.triggerLongPressed(this);
        break;
      case 'rotated_right':
        this.setCapabilityValue('rotate_right', true).catch(this.error.bind(this));
        this.driver.triggerRotatedRight(this);
        break;
      case 'rotated_left':
        this.setCapabilityValue('rotate_left', true).catch(this.error.bind(this));
        this.driver.triggerRotatedLeft(this);
        break;
      case 'press_rotate_right':
        this.driver.triggerPressRotateRight(this);
        break;
      case 'press_rotate_left':
        this.driver.triggerPressRotateLeft(this);
        break;
    }
  }

  // ── Timer helpers ────────────────────────────────────────────────────────

  _setTimeout(fn, ms) {
    if (typeof this.homey.setTimeout === 'function') {
      return this.homey.setTimeout(fn, ms);
    }
    return setTimeout(fn, ms);
  }

  _clearPressTimer() {
    if (this._pressTimer === null) return;
    if (typeof this.homey.clearTimeout === 'function') {
      this.homey.clearTimeout(this._pressTimer);
    } else {
      clearTimeout(this._pressTimer);
    }
    this._pressTimer = null;
  }

  // ── Notifications ────────────────────────────────────────────────────────

  _notify(excerpt) {
    // DEBUG: this.homey.notifications
    //   .createNotification({ excerpt: String(excerpt).slice(0, 255) })
    //   .catch((err) => this.error('Notification error:', err));
  }

}

module.exports = TZX1Device;
