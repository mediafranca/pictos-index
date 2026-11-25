// Shared by individual evaluation and panel coordination. Fetches stay in the browser.
export class LibraryAddressError extends Error {
  constructor(reason) { super(reason); this.reason = reason; }
}
export async function readLibraryAddress(address, { baseUrl, fetcher = fetch } = {}) {
  let url;
  try {
    if (typeof address !== "string" || !address.trim()) throw new Error("empty");
    url = new URL(address.trim(), baseUrl);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error("protocol");
  } catch { throw new LibraryAddressError("badUrl"); }
  let payload;
  try {
    const response = await fetcher(url, { mode: "cors", credentials: "omit" });
    if (!response.ok) throw new Error("http");
    payload = await response.json();
  } catch { throw new LibraryAddressError("unreachable"); }
  if (!Array.isArray(payload?.rows) || !payload.rows.length) throw new LibraryAddressError("notALibrary");
  let fileName = url.pathname.split("/").pop() || "library.json";
  try { fileName = decodeURIComponent(fileName); } catch { /* Keep undecodable file names readable. */ }
  return { payload, url, fileName };
}
