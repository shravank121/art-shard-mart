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
