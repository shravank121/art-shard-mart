export function ipfsToHttp(uri?: string, gateway?: string) {
  if (!uri) return '';
  if (!uri.startsWith('ipfs://')) return uri;
  const cidPath = uri.replace('ipfs://', '');
  const base = gateway || 'https://ipfs.io/ipfs/';
  return base + cidPath;
}

export async function fetchIpfsJson<T = any>(uri: string, gateway?: string): Promise<T> {
  const url = ipfsToHttp(uri, gateway);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch IPFS JSON: ${res.status}`);
  return res.json();
}
