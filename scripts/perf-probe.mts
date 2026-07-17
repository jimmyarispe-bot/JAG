import {
  resetPerformanceSingletonsForTests,
  runPerformanceProbe,
} from "../src/lib/performance/index";

async function main() {
  resetPerformanceSingletonsForTests();
  const r = await runPerformanceProbe();
  console.log(
    JSON.stringify(
      {
        comparisons: r.comparisons,
        routeTimings: r.routeTimings,
        routeInventory: r.routeInventory,
        detections: r.detections.map((d) => ({
          id: d.id,
          severity: d.severity,
          title: d.title,
        })),
        singletons: r.singletons,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
