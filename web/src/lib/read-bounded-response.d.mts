export type BoundedResponseText =
  | { ok: true; text: string }
  | { ok: false; reason: 'too_large' | 'unreadable' };

export function readBoundedResponseText(
  response: Response,
  maxBytes: number,
): Promise<BoundedResponseText>;
