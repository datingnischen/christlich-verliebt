const DEFAULT_ASSET_HOST = "https://christlich-verliebt.vercel.app";
const DEFAULT_ASSET_PATH_PREFIX = "/app-assets";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeAssetPathPrefix(value: string) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  const trimmed = trimTrailingSlash(withLeadingSlash);
  return trimmed || DEFAULT_ASSET_PATH_PREFIX;
}

export const assetHost = trimTrailingSlash(
  process.env.NEXT_PUBLIC_ASSET_HOST || DEFAULT_ASSET_HOST,
);

export const assetPathPrefix = normalizeAssetPathPrefix(
  process.env.NEXT_PUBLIC_ASSET_PATH_PREFIX || DEFAULT_ASSET_PATH_PREFIX,
);

export const assetBaseUrl = `${assetHost}${assetPathPrefix}`;

export function staticAsset(path: string) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${assetBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
