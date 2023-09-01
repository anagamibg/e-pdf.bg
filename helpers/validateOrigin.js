export function validateOrigin(handler) {
  return (req, res) => {
    // The allowed origins (your app's frontend URL)
    // Set the allowed origin based on the environment
    const allowedOrigins =
      process.env.NODE_ENV === "production"
        ? [
            process.env.NEXT_PUBLIC_APP_URL, // Production URL >  Change the value of NEXT_PUBLIC_APP_URL in next.config.js
            process.env.NEXT_PUBLIC_APP_URL_WWW, // Production URL > Change the value of NEXT_PUBLIC_APP_URL_WWW in next.config.js
          ].filter(Boolean) // Removes empty or undefined entries
        : ["http://localhost:3000"]; // Development URL

    // Get the origin or referer from the request headers
    const origin = req.headers.origin || req.headers.referer;

    // Check if the origin starts with any of the allowed origins
    const isAllowed = allowedOrigins.some((allowed) =>
      origin?.startsWith(allowed)
    );

    if (!isAllowed) {
      return res.status(403).json({ error: "Forbidden: Invalid Origin" });
    }

    return handler(req, res);
  };
}
