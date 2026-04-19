export interface BuildInfo {
  fetchedAt: Date;
}

const URL = "/data/build-info.json";

export async function loadBuildInfo(): Promise<BuildInfo | null> {
  try {
    const res = await fetch(URL, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { fetchedAt?: string };
    if (!json.fetchedAt) return null;
    const t = new Date(json.fetchedAt);
    if (Number.isNaN(t.getTime())) return null;
    return { fetchedAt: t };
  } catch {
    return null;
  }
}
