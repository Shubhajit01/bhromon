export const routingModes = ['bicycle', 'drive', 'transit', 'walk'] as const;

export type RoutingMode = (typeof routingModes)[number];
