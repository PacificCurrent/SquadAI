// vite.config.js
export default {
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      // Replit preview domains
      '.replit.dev',
      '.repl.co'
    ]
  }
}