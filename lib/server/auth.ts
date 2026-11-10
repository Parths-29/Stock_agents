import { verifyTypedData, type Hex } from "viem";
import { Store, ServiceError } from "./store";
import { signingData } from "../auth-message";
export async function verifyWalletSignIn(
  store: Store,
  token: string,
  id: unknown,
  signature: unknown,
  origin: string,
) {
  const challenge = store.readChallenge(token, id, origin);
  if (typeof signature !== "string" || !/^0x[a-fA-F0-9]{130}$/.test(signature))
    throw new ServiceError("Invalid wallet signature.");
  let valid = false;
  try {
    valid = await verifyTypedData({
      address: challenge.message.wallet,
      ...signingData(challenge),
      signature: signature as Hex,
    });
  } catch {
    throw new ServiceError("Signature could not be verified.", 401);
  }
  if (!valid)
    throw new ServiceError("Signature does not match this wallet.", 401);
  return store.completeSignIn(token, challenge);
}
