export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
  const keyHex = Array.from(new Uint8Array(exportedKey)).map((b) => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${keyHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, keyHex] = storedHash.split(':');
    if (!saltHex || !keyHex) return false;

    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const computedKeyHex = Array.from(new Uint8Array(exportedKey)).map((b) => b.toString(16).padStart(2, '0')).join('');

    return computedKeyHex === keyHex;
  } catch {
    return false;
  }
}
