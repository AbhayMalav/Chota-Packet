// src/config.js
// Frontend feature flags and app-level constants for Chota Packet.
// Toggle UI features here without touching component code.

const FEATURES = Object.freeze({
  SHOW_CHOTA_CHAT: false, // Set true to show Chota Chat button in sidebar
  SHOWBACKENDSTATUSBAR: false, // Show/hide the "Backend connected / offline" status bar below the navbar
});

const APP_CONFIG = Object.freeze({
  APP_NAME: 'Chota Packet',
  // Add future constants here
});

export { FEATURES, APP_CONFIG };
