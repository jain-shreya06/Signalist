export type SessionLike = {
  user?: {
    id?: unknown;
  } | null;
} | null | undefined;

export function getAuthenticatedUserId(session: SessionLike): string | null {
  const id = session?.user?.id;
  return typeof id === "string" && id.trim().length > 0 ? id : null;
}
