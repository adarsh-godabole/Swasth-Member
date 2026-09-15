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

/**
 * Pulls the door code out of whatever the scanner read.
 *
 * The poster encodes the full deep link — `swasth://check-in?code=K7M29QX4` —
 * because that is what makes the phone's own camera app able to open us. The
 * in-app scanner reads the same poster, so it gets the whole URL and has to
 * unwrap it. A bare code is accepted too, in case a gym ever prints one.
 *
 * Returns null for any other QR the camera happens to land on, so a stray code
 * on a water bottle is ignored rather than sent to the server.
 */
export function codeFromScan(data: string): string | null {
  const value = data.trim();
  if (!value) return null;

  const match = /[?&]code=([^&#\s]+)/.exec(value);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      // Malformed percent-encoding: the raw value is still worth a try.
      return match[1];
    }
  }

  // A plain code, printed without the link wrapper. Length and alphabet are
  // checked server-side; this only rules out obvious non-codes so the scanner
  // does not fire on every QR in the room.
  return /^[0-9A-Za-z-]{8,12}$/.test(value) ? value : null;
}
