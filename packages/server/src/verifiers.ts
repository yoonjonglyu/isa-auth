/**
 * Server-side verifiers for Web3 SIWE, World ID, and Passkey WebAuthn
 */

export interface SiweParsedMessage {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}

export function parseSiweMessage(message: string): SiweParsedMessage | null {
  try {
    const lines = message.split('\n');
    const headerLine = lines[0]; // "${domain} wants you to sign in with your Ethereum account:"
    const domainMatch = headerLine.match(/^(.+) wants you to sign in with your Ethereum account:/);
    if (!domainMatch) return null;
    const domain = domainMatch[1].trim();

    const address = lines[1]?.trim();
    if (!address || !address.startsWith('0x') || address.length !== 42) return null;

    let uri = '';
    let version = '1';
    let chainId = 1;
    let nonce = '';
    let issuedAt = '';
    let expirationTime: string | undefined;
    let statement: string | undefined;

    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('URI: ')) uri = line.replace('URI: ', '').trim();
      else if (line.startsWith('Version: ')) version = line.replace('Version: ', '').trim();
      else if (line.startsWith('Chain ID: ')) chainId = parseInt(line.replace('Chain ID: ', '').trim(), 10) || 1;
      else if (line.startsWith('Nonce: ')) nonce = line.replace('Nonce: ', '').trim();
      else if (line.startsWith('Issued At: ')) issuedAt = line.replace('Issued At: ', '').trim();
      else if (line.startsWith('Expiration Time: ')) expirationTime = line.replace('Expiration Time: ', '').trim();
      else if (!line.includes(': ') && line.length > 0 && !statement) {
        statement = line;
      }
    }

    return {
      domain,
      address,
      statement,
      uri,
      version,
      chainId,
      nonce,
      issuedAt,
      expirationTime,
    };
  } catch {
    return null;
  }
}

export async function verifyWorldIdProof(
  appId: string,
  action: string,
  proofPayload: any
): Promise<{ success: boolean; nullifierHash?: string; error?: string }> {
  try {
    const verifyUrl = `https://developer.worldcoin.org/api/v2/verify/${appId}`;
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...proofPayload,
        action,
      }),
    });

    const result: any = await response.json();
    if (response.ok && result.success) {
      return { success: true, nullifierHash: result.nullifier_hash || proofPayload.nullifier_hash };
    }

    return {
      success: false,
      error: result.detail || result.code || 'World ID proof verification failed',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function verifyPasskeyAssertionFormat(
  assertion: any,
  expectedChallenge?: string
): { success: boolean; userHandle?: string; error?: string } {
  try {
    if (!assertion || !assertion.id || !assertion.response) {
      return { success: false, error: 'Invalid Passkey assertion payload structure.' };
    }

    const { clientDataJSON, authenticatorData, signature, userHandle } = assertion.response;
    if (!clientDataJSON || !authenticatorData || !signature) {
      return { success: false, error: 'Missing required WebAuthn assertion response fields.' };
    }

    // Verify clientDataJSON contains challenge and webauthn.get
    const clientDataStr = Buffer.from(clientDataJSON, 'base64').toString('utf8');
    const clientData = JSON.parse(clientDataStr);

    if (clientData.type !== 'webauthn.get') {
      return { success: false, error: `Invalid clientData type: ${clientData.type}` };
    }

    if (expectedChallenge && clientData.challenge !== expectedChallenge) {
      return { success: false, error: 'Challenge mismatch in Passkey assertion.' };
    }

    const resolvedUserHandle = userHandle ? Buffer.from(userHandle, 'base64').toString('utf8') : assertion.id;

    return { success: true, userHandle: resolvedUserHandle };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
