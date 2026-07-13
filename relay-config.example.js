// Copy this file to relay-config.js (which is git-ignored) and set your deployed relay server URL.
// relay-config.js is loaded by activate.html at runtime — it must NOT be committed to the repo.
//
// For CI/CD (GitHub Actions), add RELAY_URL as a repository secret. The deploy workflow
// generates relay-config.js automatically from the secret before publishing.
window.RELAY_URL = 'https://your-relay.example.com';
