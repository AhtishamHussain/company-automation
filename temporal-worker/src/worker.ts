import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";

const address = process.env.TEMPORAL_ADDRESS || "localhost:7233";
const namespace = process.env.TEMPORAL_NAMESPACE || "default";
const taskQueue = process.env.TEMPORAL_TASK_QUEUE || "master-durable";

async function run() {
  const connection = await NativeConnection.connect({ address });
  const worker = await Worker.create({
    connection,
    namespace,
    taskQueue,
    workflowsPath: require.resolve("./workflows"),
    activities,
  });
  console.log(`Temporal worker listening on ${address} queue=${taskQueue} ns=${namespace}`);
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
