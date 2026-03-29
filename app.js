'use strict';

const Homey = require('homey');
const { Cluster } = require('zigbee-clusters');
const TuyaSpecificCluster = require('./lib/TuyaSpecificCluster');

class TZX1App extends Homey.App {

  async onInit() {
    this.log('');
    this.log('╔══════════════════════════════════════╗');
    this.log('║  TZ-X1 Smart Scene Button App        ║');
    this.log('║  Starting up …                       ║');
    this.log('╚══════════════════════════════════════╝');

    // Register the Tuya proprietary cluster (0xEF00) so homey-zigbeedriver
    // will surface it as endpoint.clusters.tuya in device.js.
    try {
      Cluster.addCluster(TuyaSpecificCluster);
      this.log('✓ Tuya cluster (0xEF00) registered');
    } catch (err) {
      // May already be registered if multiple drivers do this
      this.log('ℹ Tuya cluster already registered:', err.message);
    }

    this.log('TZ-X1 app ready');
  }

}

module.exports = TZX1App;
