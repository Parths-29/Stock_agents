export const signInTypes = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "salt", type: "bytes32" },
  ],
  SignIn: [
    { name: "wallet", type: "address" },
    { name: "uri", type: "string" },
    { name: "nonce", type: "bytes32" },
    { name: "issuedAt", type: "string" },
    { name: "expirationTime", type: "string" },
    { name: "statement", type: "string" },
  ],
} as const;
export type SignInChallenge = {
  id: string;
  domain: {
    name: string;
    version: string;
    chainId: number;
    salt: `0x${string}`;
  };
  types: typeof signInTypes;
  primaryType: "SignIn";
  message: {
    wallet: `0x${string}`;
    uri: string;
    nonce: `0x${string}`;
    issuedAt: string;
    expirationTime: string;
    statement: string;
  };
};
// JSON-RPC transports chainId as a number; viem's explicit uint256 schema uses bigint.
export function signingData(challenge: SignInChallenge) {
  return {
    domain: { ...challenge.domain, chainId: BigInt(challenge.domain.chainId) },
    types: challenge.types,
    primaryType: challenge.primaryType,
    message: challenge.message,
  };
}
