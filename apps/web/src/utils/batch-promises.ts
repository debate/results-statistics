export default async function batchPromises<T>(promises: Promise<T>[], batchSize: number) {
  const results: T[] = [];
  let batchStart = 0;
  while (batchStart < promises.length) {
    let batchEnd = batchStart + batchSize;
    const batchResults = await Promise.all(promises.slice(batchStart, promises.length < batchEnd ? promises.length : batchEnd));
    results.push(...batchResults);
    batchStart = batchEnd;
  }
  return results;
}
