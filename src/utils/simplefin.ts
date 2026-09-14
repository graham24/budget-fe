// SimpleFin Bridge hosts the re-authorization flow; we only link out to it.
export const SIMPLEFIN_BRIDGE_URL = "https://beta-bridge.simplefin.org";
export const SIMPLEFIN_CONNECTIONS_URL = `${SIMPLEFIN_BRIDGE_URL}/my-account/connections`;

const BRIDGE_URL_PATTERN = /https:\/\/[\w.-]*simplefin\.org\/\S+/;

// The SimpleFin API doesn't expose a per-connection fix URL (its conn_id is a
// CON-… id, while the Bridge fix page is keyed by the aggregator's own member
// id, e.g. /connections/mx/fix/MBR-…). Use one if the error message carries
// it; otherwise send the user to their connections list, where every broken
// connection has its own Fix button.
export const simplefinFixLink = (message: string): { url: string; text: string } => {
  const match = message.match(BRIDGE_URL_PATTERN);
  if (!match) return { url: SIMPLEFIN_CONNECTIONS_URL, text: message };
  const url = match[0].replace(/[.,;)]+$/, "");
  const text = message.replace(match[0], "").replace(/\s*[:\-–]?\s*$/, "").trim();
  return { url, text: text || message };
};
