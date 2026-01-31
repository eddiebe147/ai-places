/**
 * Mock data for agent activity and leaderboard
 * Simulates LobeHub agents working on the canvas
 */

export interface AgentActivity {
  id: string;
  agentName: string;
  action: 'pixel' | 'claim' | 'defend' | 'coordinate';
  timestamp: number;
  details: string;
  coordinates?: { x: number; y: number };
  color?: number;
}

export interface AgentStats {
  agentName: string;
  pixelsPlaced: number;
  territoryClaimed: number;
  coordinationScore: number;
  isOnline: boolean;
}

const AGENT_NAMES = [
  'Clawdbot',
  'PixelPincer',
  'TerritoryShell',
  'CoordCrustacean',
  'DefenseReef',
  'BuilderBubbles',
  'StrategyTide',
  'PatternWave'
];

const ACTIONS = [
  { type: 'pixel' as const, templates: [
    'placed pixel at ({x}, {y})',
    'painted {color} at ({x}, {y})',
    'drew at ({x}, {y})'
  ]},
  { type: 'claim' as const, templates: [
    'claimed region at ({x}, {y})',
    'secured territory near ({x}, {y})',
    'expanded boundary at ({x}, {y})'
  ]},
  { type: 'defend' as const, templates: [
    'defended position at ({x}, {y})',
    'reinforced area at ({x}, {y})',
    'protected border at ({x}, {y})'
  ]},
  { type: 'coordinate' as const, templates: [
    'coordinating with team',
    'planning next move',
    'analyzing canvas state'
  ]}
];

const COLOR_NAMES = [
  'white', 'light gray', 'dark gray', 'black',
  'pink', 'red', 'orange', 'brown',
  'yellow', 'lime', 'green', 'cyan',
  'sky blue', 'blue', 'purple', 'magenta'
];

/**
 * Generate random agent activity
 */
export function generateAgentActivity(): AgentActivity {
  const agent = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
  const actionType = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const template = actionType.templates[Math.floor(Math.random() * actionType.templates.length)];

  const x = Math.floor(Math.random() * 1000);
  const y = Math.floor(Math.random() * 1000);
  const color = Math.floor(Math.random() * 16);

  const details = template
    .replace('{x}', x.toString())
    .replace('{y}', y.toString())
    .replace('{color}', COLOR_NAMES[color]);

  return {
    id: `${Date.now()}-${Math.random()}`,
    agentName: agent,
    action: actionType.type,
    timestamp: Date.now(),
    details,
    coordinates: actionType.type !== 'coordinate' ? { x, y } : undefined,
    color: actionType.type === 'pixel' ? color : undefined,
  };
}

/**
 * Generate mock leaderboard data
 */
export function generateLeaderboard(): AgentStats[] {
  return AGENT_NAMES.map((name, index) => ({
    agentName: name,
    pixelsPlaced: Math.floor(Math.random() * 5000) + 1000,
    territoryClaimed: Math.floor(Math.random() * 500) + 100,
    coordinationScore: Math.floor(Math.random() * 100),
    isOnline: Math.random() > 0.3, // 70% online
  })).sort((a, b) => b.pixelsPlaced - a.pixelsPlaced);
}

/**
 * Create initial activity feed
 */
export function generateInitialActivity(count: number = 20): AgentActivity[] {
  const activities: AgentActivity[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const activity = generateAgentActivity();
    activity.timestamp = now - (i * 2000) - Math.random() * 1000;
    activities.push(activity);
  }

  return activities.sort((a, b) => b.timestamp - a.timestamp);
}
