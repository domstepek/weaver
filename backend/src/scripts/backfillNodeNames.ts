import { and, eq, isNull } from 'drizzle-orm';
import { db, nodes } from '../db/index.js';
import { generateNodeName } from '../services/ai.js';

const BATCH_SIZE = 50;

async function backfillNodeNames(): Promise<void> {
  let batchNumber = 0;
  let scanned = 0;
  let updated = 0;
  let failed = 0;

  while (true) {
    const unnamedNodes = await db
      .select({
        id: nodes.id,
        content: nodes.content,
      })
      .from(nodes)
      .where(isNull(nodes.name))
      .limit(BATCH_SIZE);

    if (unnamedNodes.length === 0) {
      break;
    }

    batchNumber += 1;
    let updatedThisBatch = 0;
    console.log(
      `[batch ${batchNumber}] processing ${unnamedNodes.length} unnamed node(s)`,
    );

    for (const node of unnamedNodes) {
      scanned += 1;

      try {
        const generatedName = await generateNodeName(node.content);
        const updatedRows = await db
          .update(nodes)
          .set({
            name: generatedName,
            updatedAt: new Date(),
          })
          .where(and(eq(nodes.id, node.id), isNull(nodes.name)))
          .returning({ id: nodes.id });

        if (updatedRows.length > 0) {
          updated += 1;
          updatedThisBatch += 1;
        }
      } catch (error) {
        failed += 1;
        console.error(`[node ${node.id}] failed to backfill name`, error);
      }
    }

    if (updatedThisBatch === 0) {
      console.error(
        `No rows were updated in batch ${batchNumber}; aborting to avoid an infinite loop.`,
      );
      break;
    }
  }

  console.log(
    `Backfill complete. scanned=${scanned} updated=${updated} failed=${failed}`,
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

backfillNodeNames().catch((error) => {
  console.error('Backfill crashed with an unexpected error:', error);
  process.exit(1);
});
