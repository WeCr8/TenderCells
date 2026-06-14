// loadEnv.ts
// Loads .env before any other module reads process.env. Must be the very first
// import in server.ts. In ESM, imported modules evaluate before the importing
// module's body, so calling dotenv.config() in the server body would run too
// late for the broker and MQTT bridge that connect on import.
import dotenv from "dotenv";
dotenv.config();
