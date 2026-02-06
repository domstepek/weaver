import 'dotenv/config';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db, nodes } from '../db/index.js';
import { generateNodeName } from '../services/ai.js';

const BATCH_SIZE = 50;
const repairAll = process.argv.includes('--all');

async function backfillNodeNames(): Promise<void> {
  let scanned = 0;
  let updated = 0;
  let failed = 0;
  const processBatch = async (
    batchNumber: number,
    batchNodes: Array<{ id: string; content: string }>,
    onlyIfNameNull: boolean,
  ) => {
    let updatedThisBatch = 0;
    console.log(
      `[batch ${batchNumber}] processing ${batchNodes.length} node(s)`,
    );

    for (const node of batchNodes) {
      scanned += 1;

      try {
        const generatedName = await generateNodeName(node.content);
        const updatedRows = await db
          .update(nodes)
          .set({
            name: generatedName,
            updatedAt: new Date(),
          })
          .where(
            onlyIfNameNull
              ? and(eq(nodes.id, node.id), isNull(nodes.name))
              : eq(nodes.id, node.id),
          )
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

    return updatedThisBatch;
  };

  if (repairAll) {
    const allNodes = await db
      .select({
        id: nodes.id,
        content: nodes.content,
      })
      .from(nodes)
      .orderBy(asc(nodes.id));

    for (let i = 0; i < allNodes.length; i += BATCH_SIZE) {
      const batchNumber = i / BATCH_SIZE + 1;
      const batchNodes = allNodes.slice(i, i + BATCH_SIZE);
      await processBatch(batchNumber, batchNodes, false);
    }
  } else {
    let batchNumber = 0;
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
      const updatedThisBatch = await processBatch(
        batchNumber,
        unnamedNodes,
        true,
      );

      if (updatedThisBatch === 0) {
        console.error(
          `No rows were updated in batch ${batchNumber}; aborting to avoid an infinite loop.`,
        );
        break;
      }
    }
  }

  console.log(
    `Backfill complete. scanned=${scanned} updated=${updated} failed=${failed}`,
  );

  process.exit(failed > 0 ? 1 : 0);
}

backfillNodeNames().catch((error) => {
  console.error('Backfill crashed with an unexpected error:', error);
  process.exit(1);
});
