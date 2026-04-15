require("./lib/load-env")();

const http = require("http");
const app = require("./app");
const prisma = require("./lib/prisma");

const port = Number(process.env.PORT || 5002);

const server = http.createServer(app);

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.listen(port, "0.0.0.0", () => {
  console.log(`MEIOSIS backend listening on http://0.0.0.0:${port}`);
  console.log(`  → Local: http://localhost:${port}`);
  const os = require("os");
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        console.log(`  → Network: http://${iface.address}:${port}`);
      }
    }
  }
});

server.on("error", (error) => {
  console.error("HTTP server error:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down backend...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("Prisma disconnect failed:", error);
    } finally {
      process.exit(0);
    }
  });

  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
