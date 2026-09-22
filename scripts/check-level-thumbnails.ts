import { list, get, getDownloadUrl } from "@vercel/blob";

const token = "vercel_blob_rw_IeaNErnEyKfJpb32_iZCAl22t7z4vQQPLqU8InQ7I6sVDws";

async function main() {
  const res = await list({ token });
  const b = res.blobs[0];
  console.log("Blob:", b.pathname, b.url);

  try {
    const dlUrl = await getDownloadUrl(b.url);
    console.log("getDownloadUrl result:", dlUrl);
    const r = await fetch(dlUrl);
    console.log("fetch dlUrl status:", r.status);
  } catch (err: unknown) {
    console.log("getDownloadUrl error:", err instanceof Error ? err.message : String(err));
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await get(b.url, { access: "public" });
    console.log("get result keys:", Object.keys(result || {}));
    if (result && result.body) {
      console.log("Got body stream! Reading...");
      const buf = Buffer.from(await result.arrayBuffer());
      console.log("Successfully downloaded bytes:", buf.length);
    }
  } catch (err: unknown) {
    console.log("get error:", err instanceof Error ? err.message : String(err));
  }
}

main().catch(console.error);

