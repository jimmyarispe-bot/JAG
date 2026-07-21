/**
 * Shared center / panel card shapes for Mission Control and Enterprise Admin.
 */

export type CenterCard = {
  id: string;
  title: string;
  summary: string;
  severity?: number;
  score?: number;
  domains?: string[];
  meta?: Record<string, unknown>;
};

export type CenterControl = {
  id: string;
  label: string;
  enabled: boolean;
};

export type CenterPanelShell = {
  title: string;
  subtitle: string;
  cards: CenterCard[];
  emptyMessage: string;
  controls?: CenterControl[];
};
