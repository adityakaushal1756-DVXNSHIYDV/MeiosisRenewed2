(function () {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.");

  const protocol = window.location.protocol;
  const host = window.location.hostname;

  // For Vercel/Production: Backend is usually at the same origin under /api
  // For Local: Backend is at localhost:5002
  const backendOrigin = isLocal
    ? `${protocol}//${host}:5002`
    : `${protocol}//${host}`;

  // For Local: Doctor frontend is at localhost:5173
  // For Production: Might be a subdomain or same domain
  const doctorFrontendUrl = isLocal
    ? `${protocol}//${host}:5173`
    : `${protocol}//${host}`;

  window.MEIOSIS_RUNTIME_CONFIG = {
    backendOrigin,
    doctorFrontendUrl,
    isLocal,
  };

  console.log("MEIOSIS Config Loaded:", window.MEIOSIS_RUNTIME_CONFIG);
})();

