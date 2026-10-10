import "dotenv/config";
import { getStorageConfig, getLocalUploadRoot } from "../lib/storage";

async function main() {
  const config = await getStorageConfig();
  console.log("[STORAGE] provider:", config?.provider);
  console.log("[STORAGE] enabled:", config?.enabled);
  console.log("[STORAGE] localRoot:", getLocalUploadRoot());
  console.log("[STORAGE] maxFileSizeMb:", config?.maxFileSizeMb);
  console.log("[STORAGE] allowedTypes:", config?.allowedTypes);
}

main().catch((error) => { console.error(error); process.exit(1); });
