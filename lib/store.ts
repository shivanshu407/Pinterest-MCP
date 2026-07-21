import { Redis } from "@upstash/redis";

let redisInstance: Redis | undefined;

function getCredential(primary: string, fallback: string): string | undefined {
  return process.env[primary] ?? process.env[fallback];
}

export function getRedis(): Redis {
  if (redisInstance) return redisInstance;

  const url = getCredential("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL");
  const token = getCredential(
    "UPSTASH_REDIS_REST_TOKEN",
    "KV_REST_API_TOKEN",
  );

  if (!url || !token) {
    throw new Error(
      "Redis is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  }

  redisInstance = new Redis({ url, token });
  return redisInstance;
}

export async function putJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  await getRedis().set(key, value, { ex: ttlSeconds });
}

export async function getJson<T>(key: string): Promise<T | null> {
  return (await getRedis().get<T>(key)) ?? null;
}

export async function takeJson<T>(key: string): Promise<T | null> {
  const value = await getRedis().getdel<T>(key);
  return value ?? null;
}

export async function deleteKey(key: string): Promise<void> {
  await getRedis().del(key);
}
