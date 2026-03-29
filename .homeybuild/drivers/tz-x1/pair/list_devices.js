'use strict';

/**
 * Server-side pairing logic for the list_devices view.
 *
 * Called by TZX1Driver.onPairListDevices(). ZigBeeDriver's base class
 * handles the actual Zigbee scan; this module wraps it with logging and
 * sets a friendly device name/data for the pairing UI.
 *
 * @param {import('../driver')} driver  - The TZX1Driver instance
 * @returns {Promise<object[]>}         - Array of device descriptors
 */
async function onPairListDevices(driver) {
  driver.log('[pair] Scanning for TZ-X1 (TS004F / _TZ3000_gwkzibhs) …');

  // Delegate to ZigBeeDriver's built-in Zigbee discovery
  const devices = await driver.homey.zigbee
    ? _listViaZigbee(driver)
    : [];

  driver.log(`[pair] Discovery complete — found ${devices.length} device(s)`);
  devices.forEach((d, i) => driver.log(`  [${i}]`, JSON.stringify(d)));

  return devices;
}

/**
 * ZigBeeDriver exposes Zigbee discovery via super.onPairListDevices().
 * We call it through the driver instance so the base class does the work.
 */
async function _listViaZigbee(driver) {
  try {
    // ZigBeeDriver.onPairListDevices() is the base implementation
    const result = await Object.getPrototypeOf(
      Object.getPrototypeOf(driver),
    ).onPairListDevices.call(driver);

    return (result || []).map((device) => ({
      ...device,
      name: device.name || 'TZ-X1 Smart Scene Button',
    }));
  } catch (err) {
    driver.error('[pair] Zigbee discovery error:', err);
    return [];
  }
}

module.exports = { onPairListDevices };
