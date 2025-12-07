const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Login failed');
  return data as { _id: string; username: string; email: string; token: string };
}

export async function apiRegister(username: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Registration failed');
  return data as { _id: string; username: string; email: string; token: string };
}

function authHeaders() {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function apiMintNFT(toAddress: string, metadataURI: string) {
  const res = await fetch(`${API_URL}/api/nft/mint`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ toAddress, metadataURI })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Minting failed');
  return data as { success: boolean; txHash: string };
}

export async function apiGetAllNFTs() {
  const res = await fetch(`${API_URL}/api/nft/all`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to fetch NFTs');
  return data as Array<{ id: number|string; name: string; owner: string; uri: string }>;
}

export async function apiUploadToIPFS(params: {
  image: File;
  name: string;
  description: string;
  attributes?: Array<Record<string, any>>;
}) {
  const fd = new FormData();
  fd.append('image', params.image);
  fd.append('name', params.name);
  fd.append('description', params.description);
  if (params.attributes) fd.append('attributes', JSON.stringify(params.attributes));

  const res = await fetch(`${API_URL}/api/nft/upload`, {
    method: 'POST',
    headers: {
      // Authorization optional if backend protects /upload; safe to include
      ...('Authorization' in authHeaders() ? { Authorization: authHeaders().Authorization } : {}),
    } as any,
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to upload to IPFS');
  return data as { imageCID: string; imageURI: string; metadataCID: string; metadataURI: string };
}

// Wallet API functions
export async function apiConnectWallet(walletAddress: string) {
  const res = await fetch(`${API_URL}/api/auth/wallet/connect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ walletAddress })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to connect wallet');
  return data as { message: string; walletCount: number; wallets: Array<{ address: string; connectedAt: string; lastUsed: string }> };
}

export async function apiGetConnectedWallets() {
  const res = await fetch(`${API_URL}/api/auth/wallet`, {
    headers: authHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to get wallets');
  return data as { walletCount: number; wallets: Array<{ address: string; connectedAt: string; lastUsed: string }> };
}

export async function apiDisconnectWallet(walletAddress: string) {
  const res = await fetch(`${API_URL}/api/auth/wallet/disconnect`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ walletAddress })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to disconnect wallet');
  return data as { message: string; walletCount: number; wallets: Array<{ address: string; connectedAt: string; lastUsed: string }> };
}

export function isLoggedIn(): boolean {
  return Boolean(localStorage.getItem('token'));
}
