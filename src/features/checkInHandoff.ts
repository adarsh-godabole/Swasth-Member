/**
 * Holds a scanned door code across the sign-in detour.
 *
 * A member who scans the poster while signed out lands on /check-in, gets sent
 * to /welcome, and would otherwise arrive at the home screen with the code
 * lost — having scanned, signed in, and still not been checked in. The code is
 * parked here instead and picked up once they are through.
 *
 * In memory on purpose: the app is running from the moment the deep link opens
 * it until sign-in finishes, and a code that outlived the process would check
 * someone in on a later launch they never asked for.
 */
let pending: string | null = null;

export function rememberCheckInCode(code: string): void {
  pending = code;
}

/** Reads and clears in one step, so a code is never acted on twice. */
export function takePendingCheckInCode(): string | null {
  const code = pending;
  pending = null;
  return code;
}

export function hasPendingCheckInCode(): boolean {
  return pending !== null;
}
