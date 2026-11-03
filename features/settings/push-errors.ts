/** Turn Firebase/Firestore push errors into something actionable (and keep the raw code visible). */
export function describePushError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  const hint =
    code === "permission-denied"
      ? "Firestore rules rejected saving this device. Publish firestore.rules."
      : code.includes("token-subscribe") || code.includes("token-unsubscribe")
        ? "Google rejected the push registration. Check the Firebase Cloud Messaging API is enabled and that the API key isn't restricted."
        : code.includes("failed-service-worker")
          ? "The service worker couldn't start. Reinstall the app and try again."
          : code.includes("permission-blocked")
            ? "Notifications are blocked for this site in the browser."
            : code.includes("unsupported")
              ? "This browser doesn't support web push."
              : "Check your Firebase push setup.";
  return `Couldn't enable notifications${code ? ` (${code})` : ""}. ${hint}`;
}
