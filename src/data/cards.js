/**
 * UNO Card Definitions
 * Complete deck: 40 number cards + 12 action cards + 2 wild cards = 54 unique designs
 *
 * Naming convention for image files (kept for backward compat with existing code):
 *   {color}_{value}.png  →  red_0, red_skip, green_reverse, blue_plus2, wild, wild_plus4
 */

export const COLORS = {
  red:    { bg: '#D32F2F', dark: '#B71C1C', text: '#fff', name: 'Red'    },
  yellow: { bg: '#F9A825', dark: '#F57F17', text: '#1a1a1a', name: 'Yellow' },
  green:  { bg: '#2E7D32', dark: '#1B5E20', text: '#fff', name: 'Green'  },
  blue:   { bg: '#1565C0', dark: '#0D47A1', text: '#fff', name: 'Blue'   },
};

// All 54 unique card types
export const ALL_CARDS = [
  // ── Red ──────────────────────────────────────────────────
  { id: 'red_0',       color: 'red',    type: 'number',  value: '0'  },
  { id: 'red_1',       color: 'red',    type: 'number',  value: '1'  },
  { id: 'red_2',       color: 'red',    type: 'number',  value: '2'  },
  { id: 'red_3',       color: 'red',    type: 'number',  value: '3'  },
  { id: 'red_4',       color: 'red',    type: 'number',  value: '4'  },
  { id: 'red_5',       color: 'red',    type: 'number',  value: '5'  },
  { id: 'red_6',       color: 'red',    type: 'number',  value: '6'  },
  { id: 'red_7',       color: 'red',    type: 'number',  value: '7'  },
  { id: 'red_8',       color: 'red',    type: 'number',  value: '8'  },
  { id: 'red_9',       color: 'red',    type: 'number',  value: '9'  },
  { id: 'red_skip',    color: 'red',    type: 'action',  value: 'skip'    },
  { id: 'red_reverse', color: 'red',    type: 'action',  value: 'reverse' },
  { id: 'red_plus2',   color: 'red',    type: 'action',  value: 'plus2'   },

  // ── Yellow ───────────────────────────────────────────────
  { id: 'yellow_0',       color: 'yellow', type: 'number',  value: '0'  },
  { id: 'yellow_1',       color: 'yellow', type: 'number',  value: '1'  },
  { id: 'yellow_2',       color: 'yellow', type: 'number',  value: '2'  },
  { id: 'yellow_3',       color: 'yellow', type: 'number',  value: '3'  },
  { id: 'yellow_4',       color: 'yellow', type: 'number',  value: '4'  },
  { id: 'yellow_5',       color: 'yellow', type: 'number',  value: '5'  },
  { id: 'yellow_6',       color: 'yellow', type: 'number',  value: '6'  },
  { id: 'yellow_7',       color: 'yellow', type: 'number',  value: '7'  },
  { id: 'yellow_8',       color: 'yellow', type: 'number',  value: '8'  },
  { id: 'yellow_9',       color: 'yellow', type: 'number',  value: '9'  },
  { id: 'yellow_skip',    color: 'yellow', type: 'action',  value: 'skip'    },
  { id: 'yellow_reverse', color: 'yellow', type: 'action',  value: 'reverse' },
  { id: 'yellow_plus2',   color: 'yellow', type: 'action',  value: 'plus2'   },

  // ── Green ─────────────────────────────────────────────────
  { id: 'green_0',       color: 'green',  type: 'number',  value: '0'  },
  { id: 'green_1',       color: 'green',  type: 'number',  value: '1'  },
  { id: 'green_2',       color: 'green',  type: 'number',  value: '2'  },
  { id: 'green_3',       color: 'green',  type: 'number',  value: '3'  },
  { id: 'green_4',       color: 'green',  type: 'number',  value: '4'  },
  { id: 'green_5',       color: 'green',  type: 'number',  value: '5'  },
  { id: 'green_6',       color: 'green',  type: 'number',  value: '6'  },
  { id: 'green_7',       color: 'green',  type: 'number',  value: '7'  },
  { id: 'green_8',       color: 'green',  type: 'number',  value: '8'  },
  { id: 'green_9',       color: 'green',  type: 'number',  value: '9'  },
  { id: 'green_skip',    color: 'green',  type: 'action',  value: 'skip'    },
  { id: 'green_reverse', color: 'green',  type: 'action',  value: 'reverse' },
  { id: 'green_plus2',   color: 'green',  type: 'action',  value: 'plus2'   },

  // ── Blue ──────────────────────────────────────────────────
  { id: 'blue_0',       color: 'blue',   type: 'number',  value: '0'  },
  { id: 'blue_1',       color: 'blue',   type: 'number',  value: '1'  },
  { id: 'blue_2',       color: 'blue',   type: 'number',  value: '2'  },
  { id: 'blue_3',       color: 'blue',   type: 'number',  value: '3'  },
  { id: 'blue_4',       color: 'blue',   type: 'number',  value: '4'  },
  { id: 'blue_5',       color: 'blue',   type: 'number',  value: '5'  },
  { id: 'blue_6',       color: 'blue',   type: 'number',  value: '6'  },
  { id: 'blue_7',       color: 'blue',   type: 'number',  value: '7'  },
  { id: 'blue_8',       color: 'blue',   type: 'number',  value: '8'  },
  { id: 'blue_9',       color: 'blue',   type: 'number',  value: '9'  },
  { id: 'blue_skip',    color: 'blue',   type: 'action',  value: 'skip'    },
  { id: 'blue_reverse', color: 'blue',   type: 'action',  value: 'reverse' },
  { id: 'blue_plus2',   color: 'blue',   type: 'action',  value: 'plus2'   },

  // ── Wild ──────────────────────────────────────────────────
  { id: 'wild',       color: null, type: 'wild', value: 'wild'      },
  { id: 'wild_plus4', color: null, type: 'wild', value: 'wild_plus4' },
];

export const getCardById = (id) => ALL_CARDS.find((c) => c.id === id);
