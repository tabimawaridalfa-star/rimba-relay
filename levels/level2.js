// Data rintangan hanya digunakan host; jarak dalam px, jeda dalam detik.
export default {
  "name": "Lintasan Kabut",
  "theme": "sand",
  "background": "desert",
  "width": 16600,
  "ground": [
    [
      0,
      1280
    ],
    [
      1440,
      2760
    ],
    [
      2930,
      4270
    ],
    [
      4440,
      5720
    ],
    [
      6120,
      7260
    ],
    [
      7440,
      8800
    ],
    [
      9200,
      10300
    ],
    [
      10490,
      11850
    ],
    [
      12030,
      13400
    ],
    [
      13580,
      14800
    ],
    [
      14990,
      16600
    ]
  ],
  "platforms": [
    [
      700,
      405,
      3
    ],
    [
      1980,
      385,
      4
    ],
    [
      3400,
      410,
      3
    ],
    [
      4820,
      390,
      3
    ],
    [
      6450,
      410,
      4
    ],
    [
      7900,
      395,
      4
    ],
    [
      9400,
      390,
      3
    ],
    [
      11000,
      405,
      4
    ],
    [
      12600,
      390,
      4
    ],
    [
      14100,
      400,
      3
    ],
    [
      15600,
      395,
      4
    ]
  ],
  "boxes": [
    [
      400,
      350
    ],
    [
      3100,
      350
    ],
    [
      10640,
      350
    ],
    [
      15150,
      350
    ]
  ],
  "checkpoints": [
    {
      "x": 4500,
      "y": 472
    },
    {
      "x": 10750,
      "y": 472
    }
  ],
  "spikes": [],
  "springs": [],
  "saws": [
    {
      "x": 1650,
      "y": 488,
      "axis": "x",
      "length": 0,
      "speed": 0
    },
    {
      "x": 3900,
      "y": 488,
      "axis": "x",
      "length": 80,
      "speed": 40
    },
    {
      "x": 10000,
      "y": 470,
      "axis": "y",
      "length": 40,
      "speed": 30
    },
    {
      "x": 13200,
      "y": 488,
      "axis": "x",
      "length": 0,
      "speed": 0
    }
  ],
  "pools": [
    {
      "start": 2760,
      "end": 2930,
      "y": 680,
      "type": "water",
      "fish": "blue",
      "height": 90,
      "period": 2600
    },
    {
      "start": 7260,
      "end": 7440,
      "y": 680,
      "type": "water",
      "fish": "purple",
      "height": 95,
      "period": 2800
    },
    {
      "start": 11850,
      "end": 12030,
      "y": 680,
      "type": "water",
      "fish": "blue",
      "height": 90,
      "period": 2400
    }
  ],
  "coinRows": [
    [
      400,
      460,
      6
    ],
    [
      730,
      350,
      3
    ],
    [
      1800,
      460,
      6
    ],
    [
      2780,
      310,
      3
    ],
    [
      3265,
      460,
      3
    ],
    [
      4600,
      460,
      6
    ],
    [
      6160,
      460,
      7
    ],
    [
      7650,
      460,
      6
    ],
    [
      9200,
      460,
      7
    ],
    [
      10700,
      460,
      6
    ],
    [
      12250,
      460,
      7
    ],
    [
      13800,
      460,
      6
    ],
    [
      15200,
      460,
      8
    ]
  ],
  "enemies": [
    {
      "type": "snail",
      "x": 1050,
      "y": 480,
      "min": 900,
      "max": 1150
    },
    {
      "type": "bee",
      "x": 2400,
      "y": 375,
      "min": 2250,
      "max": 2550
    },
    {
      "type": "mouse",
      "x": 3700,
      "y": 480,
      "min": 3600,
      "max": 4050,
      "speed": 80
    },
    {
      "type": "slime",
      "x": 5200,
      "y": 480,
      "min": 5100,
      "max": 5500
    },
    {
      "type": "fly",
      "x": 6800,
      "y": 380,
      "min": 6700,
      "max": 7000
    },
    {
      "type": "frog",
      "x": 8250,
      "y": 480,
      "min": 8150,
      "max": 8500
    },
    {
      "type": "ladybug",
      "x": 9700,
      "y": 480,
      "min": 9600,
      "max": 10050
    },
    {
      "type": "bee",
      "x": 11400,
      "y": 390,
      "min": 11200,
      "max": 11600
    },
    {
      "type": "mouse",
      "x": 12900,
      "y": 480,
      "min": 12750,
      "max": 13200,
      "speed": 85
    },
    {
      "type": "snail",
      "x": 14400,
      "y": 480,
      "min": 14300,
      "max": 14600
    },
    {
      "type": "slime",
      "x": 15950,
      "y": 480,
      "min": 15800,
      "max": 16250
    },
    {
      "type": "fly",
      "x": 16100,
      "y": 350,
      "min": 15900,
      "max": 16250
    }
  ],
  "flag": {
    "x": 16350,
    "y": 472
  },
  "spawn": {
    "x": 160,
    "y": 440
  },
  "movingPlatforms": [
    {
      "x": 5720,
      "y": 552,
      "tiles": 4,
      "axis": "x",
      "range": 400,
      "speed": 60,
      "pause": 0.8,
      "required": true
    },
    {
      "x": 8800,
      "y": 552,
      "tiles": 4,
      "axis": "x",
      "range": 400,
      "speed": 60,
      "pause": 0.8,
      "required": true
    },
    {
      "x": 4600,
      "y": 330,
      "tiles": 4,
      "axis": "y",
      "range": 120,
      "speed": 50,
      "pause": 0.8
    },
    {
      "x": 2760,
      "y": 390,
      "tiles": 4,
      "axis": "x",
      "range": 100,
      "speed": 60,
      "pause": 0.8
    }
  ]
};
