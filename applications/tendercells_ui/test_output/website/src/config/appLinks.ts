const DEFAULT_APP_ENTRY_URL = "https://tendercells.com/app/account";

export const TENDERCELLS_APP_ENTRY_URL =
  import.meta.env.VITE_TENDERCELLS_APP_URL || DEFAULT_APP_ENTRY_URL;
