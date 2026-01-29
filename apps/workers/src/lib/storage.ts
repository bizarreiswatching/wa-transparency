import { Storage } from '@google-cloud/storage';

let storage: Storage | null = null;

export function getStorage(): Storage {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });
  }
  return storage;
}

export async function uploadToGCS(
  bucketName: string,
  fileName: string,
  data: Buffer | string
): Promise<string> {
  const storage = getStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  await file.save(data);

  return `gs://${bucketName}/${fileName}`;
}

export async function downloadFromGCS(
  bucketName: string,
  fileName: string
): Promise<Buffer> {
  const storage = getStorage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  const [contents] = await file.download();
  return contents;
}

export async function listGCSFiles(
  bucketName: string,
  prefix?: string
): Promise<string[]> {
  const storage = getStorage();
  const bucket = storage.bucket(bucketName);

  const [files] = await bucket.getFiles({ prefix });
  return files.map((f) => f.name);
}
