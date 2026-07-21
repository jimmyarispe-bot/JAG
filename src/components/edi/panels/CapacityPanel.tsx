"use client";

import type { CapacitySnapshot } from "@/lib/edi/types";
import { Metric } from "@/components/edi/panels/shared";

export function CapacityPanel({ capacity }: { capacity: CapacitySnapshot }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Available seats" value={capacity.availableSeats} />
      <Metric label="Used seats" value={capacity.usedSeats} />
      <Metric label="Teacher utilization" value={`${capacity.teacherUtilizationPct}%`} />
      <Metric label="Room utilization" value={`${capacity.roomUtilizationPct}%`} />
      <Metric label="Schedule utilization" value={`${capacity.scheduleUtilizationPct}%`} />
      <Metric label="Campus utilization" value={`${capacity.campusUtilizationPct}%`} />
      <Metric label="Program utilization" value={`${capacity.programUtilizationPct}%`} />
      <Metric label="Virtual capacity (hrs)" value={capacity.virtualCapacityHours.toFixed(0)} />
    </section>
  );
}
