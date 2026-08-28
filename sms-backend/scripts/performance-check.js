const baseUrl = process.env.PERF_URL || "http://localhost:4000/api/health";
const concurrency = Number(process.env.PERF_CONCURRENCY || 100);
const targetMs = Number(process.env.PERF_TARGET_MS || 3000);

async function run() {
  const started = Date.now();
  const results = await Promise.all(
    Array.from({ length: concurrency }, async () => {
      const requestStarted = performance.now();
      try {
        const response = await fetch(baseUrl);
        await response.arrayBuffer();
        return {
          status: response.status,
          durationMs: performance.now() - requestStarted,
        };
      } catch (error) {
        return {
          status: 0,
          durationMs: performance.now() - requestStarted,
          error: error.message,
        };
      }
    }),
  );

  const durations = results
    .map((result) => result.durationMs)
    .sort((a, b) => a - b);
  const p95 =
    durations[
      Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1)
    ];
  const failures = results.filter((result) => result.status !== 200);
  console.log(
    JSON.stringify(
      {
        url: baseUrl,
        concurrency,
        totalMs: Date.now() - started,
        p95Ms: Number(p95.toFixed(1)),
        failures: failures.length,
      },
      null,
      2,
    ),
  );

  if (failures.length > 0 || p95 > targetMs) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
