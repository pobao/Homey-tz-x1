'use strict';

const { ZigBeeDriver } = require('homey-zigbeedriver');
const { onPairListDevices } = require('./pair/list_devices');

class TZX1Driver extends ZigBeeDriver {

  async onInit() {
    this.log('TZ-X1 driver initialised');

    this._buttonPressedCard    = this.homey.flow.getDeviceTriggerCard('button_pressed');
    this._doublePressedCard    = this.homey.flow.getDeviceTriggerCard('double_pressed');
    this._longPressedCard      = this.homey.flow.getDeviceTriggerCard('long_pressed');
    this._rotatedLeftCard      = this.homey.flow.getDeviceTriggerCard('rotated_left');
    this._rotatedRightCard     = this.homey.flow.getDeviceTriggerCard('rotated_right');
    this._pressRotateRightCard = this.homey.flow.getDeviceTriggerCard('press_rotate_right');
    this._pressRotateLeftCard  = this.homey.flow.getDeviceTriggerCard('press_rotate_left');
    this._knobRotatedCard      = this.homey.flow.getDeviceTriggerCard('knob_rotated');
    this._batteryLowCard       = this.homey.flow.getDeviceTriggerCard('battery_low');
    this._batteryCriticalCard  = this.homey.flow.getDeviceTriggerCard('battery_critical');

    this._batteryLessThanCard  = this.homey.flow.getConditionCard('battery_less_than');
    this._batteryLessThanCard.registerRunListener(async (args) => {
      const pct = args.device.getCapabilityValue('measure_battery') ?? 100;
      return pct < args.percentage;
    });
  }

  async onPairListDevices() {
    return onPairListDevices(this);
  }

  triggerButtonPressed(device) {
    return this._buttonPressedCard.trigger(device, {}, {}).catch(this.error.bind(this));
  }

  triggerDoublePressed(device) {
    return this._doublePressedCard.trigger(device, {}, {}).catch(this.error.bind(this));
  }

  triggerLongPressed(device) {
    return this._longPressedCard.trigger(device, {}, {}).catch(this.error.bind(this));
  }

  triggerRotatedLeft(device) {
    return this._rotatedLeftCard.trigger(device, {}, {}).catch(this.error.bind(this));
  }

  triggerRotatedRight(device) {
    return this._rotatedRightCard.trigger(device, {}, {}).catch(this.error.bind(this));
  }

  triggerPressRotateRight(device) {
    return this._pressRotateRightCard.trigger(device, {}, {}).catch(this.error.bind(this));
  }

  triggerPressRotateLeft(device) {
    return this._pressRotateLeftCard.trigger(device, {}, {}).catch(this.error.bind(this));
  }

  triggerKnobRotated(device, direction, speed) {
    return this._knobRotatedCard.trigger(device, { direction, speed }, {}).catch(this.error.bind(this));
  }

  triggerBatteryLow(device) {
    return this._batteryLowCard.trigger(device, {}, {}).catch(this.error.bind(this));
  }

  triggerBatteryCritical(device) {
    return this._batteryCriticalCard.trigger(device, {}, {}).catch(this.error.bind(this));
  }

}

module.exports = TZX1Driver;
