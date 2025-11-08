import dotenv from 'dotenv';
import pinataSDK from '@pinata/sdk';
import { Readable } from 'stream';

dotenv.config();

const PINATA_JWT = process.env.PINATA_JWT;
let pinata;
if (PINATA_JWT) {
  pinata = new pinataSDK({ pinataJWTKey: PINATA_JWT });
}

export async function pinataPinFile(buffer, filename) {
  if (!pinata) throw new Error('PINATA_JWT missing in environment');
  const stream = Readable.from(buffer);
  const options = { pinataMetadata: { name: filename || 'asset' } };
  const res = await pinata.pinFileToIPFS(stream, options);
  const cid = res?.IpfsHash;
  if (!cid) throw new Error('Pinata file pin failed: missing IpfsHash');
  return { cid, uri: `ipfs://${cid}` };
}

export async function pinataPinJSON(json) {
  if (!pinata) throw new Error('PINATA_JWT missing in environment');
  const res = await pinata.pinJSONToIPFS(json, { pinataMetadata: { name: json?.name || 'metadata' } });
  const cid = res?.IpfsHash;
  if (!cid) throw new Error('Pinata JSON pin failed: missing IpfsHash');
  return { cid, uri: `ipfs://${cid}` };
}
