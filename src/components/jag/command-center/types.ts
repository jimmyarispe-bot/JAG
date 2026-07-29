export type JagCardStatus = "loading" | "empty" | "ready";

export type JagOverviewCardModel = {
  readonly id: string;
  readonly title: string;
  readonly status: JagCardStatus;
  readonly summary: string;
  readonly metricLabel?: string;
  readonly metricValue?: string;
  readonly href?: string;
  readonly detail?: string;
};
