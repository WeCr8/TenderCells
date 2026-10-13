// ownership.ts - one rule for "who owns this device", shared by every hub route.
//
// The web app writes BOTH `ownerId` (canonical, what the hub checks) and `userId` (what
// firestore.rules check) when it registers a device. Hub-side writes must do the same, or a
// device claimed on the hub is invisible to its owner in the app (rules read `userId`).
// Reads accept either field so a device registered by any path has exactly one owner.

/** The owning uid of a device document, or undefined when it is unclaimed. */
export function deviceOwner(data: Record<string, unknown> | undefined | null): string | undefined {
  const owner = data?.ownerId ?? data?.userId;
  return typeof owner === "string" && owner ? owner : undefined;
}

/** Fields a hub write sets when it binds a device to an account (both owner fields). */
export function ownerFields(uid: string): { ownerId: string; userId: string } {
  return { ownerId: uid, userId: uid };
}

/**
 * May `uid` link a robot mower under this device id?
 *
 * @param existing - The current devices/{id} document data, if any
 * @param uid - The signed-in caller
 * @returns null when allowed, otherwise the reason (HTTP 409)
 */
export function mowerLinkConflict(existing: Record<string, unknown> | undefined | null, uid: string): string | null {
  if (!existing) return null;
  const owner = deviceOwner(existing);
  if (owner && owner !== uid) return "That device id belongs to another account. Leave deviceId blank to get a new one.";
  const type = existing.productType;
  if (typeof type === "string" && type && type !== "robot-mower") {
    return `That device id is already a ${type}. Leave deviceId blank to get a new one.`;
  }
  return null;
}
