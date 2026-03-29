'use strict';

/**
 * Tuya-specific ZCL cluster (0xEF00) — registered as "manuSpecificTuya",
 * which is the name Homey's own ZCL registry uses for this cluster.
 *
 * Frame layout (hub ↔ device):
 *
 *   ┌──────┬────┬──────────┬──────────┬───────────────────┐
 *   │ seq  │ dp │ datatype │  length  │ value             │
 *   │ 2 B  │ 1B │   1 B    │   2 B    │ <length> bytes    │
 *   └──────┴────┴──────────┴──────────┴───────────────────┘
 *
 * Tuya datatype codes:
 *   0x00 RAW   0x01 BOOL   0x02 VALUE (int32)
 *   0x03 STRING  0x04 ENUM   0x05 BITMAP
 *
 * For sending simple 1-byte DPs (mode switch etc.) the value parameter is
 * defined as uint8. For receiving, longer value bytes are captured in the
 * ZCL frame remainder — device.js reads them via payload.value / payload.data.
 */

const { Cluster, ZCLDataTypes } = require('zigbee-clusters');

class TuyaSpecificCluster extends Cluster {

  static get ID()   { return 0xEF00; }
  static get NAME() { return 'manuSpecificTuya'; }

  static get ATTRIBUTES() { return {}; }

  static get COMMANDS() {
    return {
      // ── Hub → Device ─────────────────────────────────────────────────
      // 0x00  Write a datapoint value to the device.
      // value is uint8 here — sufficient for ENUM/BOOL mode-switch DPs.
      dataRequest: {
        id: 0x00,
        parameters: [
          { name: 'seq',      type: ZCLDataTypes.uint16 },
          { name: 'dp',       type: ZCLDataTypes.uint8  },
          { name: 'datatype', type: ZCLDataTypes.uint8  },
          { name: 'length',   type: ZCLDataTypes.uint16 },
          { name: 'value',    type: ZCLDataTypes.uint8  },
        ],
      },

      // ── Device → Hub ─────────────────────────────────────────────────
      // 0x01  Device replies to a dataRequest.
      dataResponse: {
        id: 0x01,
        parameters: [
          { name: 'seq',      type: ZCLDataTypes.uint16 },
          { name: 'dp',       type: ZCLDataTypes.uint8  },
          { name: 'datatype', type: ZCLDataTypes.uint8  },
          { name: 'length',   type: ZCLDataTypes.uint16 },
          // Remaining bytes (the value) land in the ZCL frame remainder.
        ],
      },
      // 0x02  Device sends an unsolicited state report.
      dataReport: {
        id: 0x02,
        parameters: [
          { name: 'seq',      type: ZCLDataTypes.uint16 },
          { name: 'dp',       type: ZCLDataTypes.uint8  },
          { name: 'datatype', type: ZCLDataTypes.uint8  },
          { name: 'length',   type: ZCLDataTypes.uint16 },
        ],
      },
    };
  }
}

module.exports = TuyaSpecificCluster;
