import * as crypto from 'crypto';

function utf8Encode(input: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(input);
}

function byteArrayToHexString(byteArray: Uint8Array): string {
  return Array.from(byteArray, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function getId(nodes: string[]): string {
  nodes = nodes.map((node) => node.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  nodes = nodes.sort();
  const concatenatedString = nodes.join('').toLowerCase();
  const sha224Hash = crypto.createHash('sha224').update(utf8Encode(concatenatedString)).digest();
  return byteArrayToHexString(sha224Hash).slice(0, 24);
}
