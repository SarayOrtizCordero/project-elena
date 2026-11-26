/**
 * Web Push (RFC 8030 + VAPID RFC 8292 + cifrado aes128gcm RFC 8188/8291)
 * escrito SOLO con Web Crypto (`crypto.subtle`) y `fetch`: corre en Cloudflare Workers,
 * Vercel Edge y Node 20+. No usa la librería `web-push` ni módulos nativos de Node.
 *
 * Claves VAPID: las del formato estándar (base64url) que genera `npx web-push generate-vapid-keys`
 * (solo se usa el CLI para generarlas; no es dependencia del proyecto).
 */

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type VapidKeys = {
  /** Clave pública (65 bytes, base64url) = la misma que NEXT_PUBLIC_VAPID_PUBLIC_KEY */
  publicKey: string;
  /** Clave privada (32 bytes, base64url) */
  privateKey: string;
  /** mailto:… o https://… de contacto */
  subject: string;
};

export type PushOptions = {
  /** Segundos que el servicio push guarda el aviso si el dispositivo está apagado. */
  ttl?: number;
  urgency?: "very-low" | "low" | "normal" | "high";
  topic?: string;
};

export type PushResult = {
  ok: boolean;
  status: number;
  /** true si la suscripción caducó (404/410): hay que borrarla. */
  gone: boolean;
  error?: string;
};

type Bytes = Uint8Array<ArrayBuffer>;

const encoder = new TextEncoder();

export function b64uToBytes(s: string): Bytes {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToB64u(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(new ArrayBuffer(parts.reduce((n, p) => n + p.length, 0)));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** JWT VAPID firmado con ES256 (ECDSA P-256 + SHA-256; WebCrypto devuelve r||s, el formato JWS). */
async function vapidJwt(audience: string, vapid: VapidKeys): Promise<string> {
  const pub = b64uToBytes(vapid.publicKey);
  if (pub.length !== 65 || pub[0] !== 4) throw new Error("VAPID public key inválida (se esperan 65 bytes sin comprimir)");
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      x: bytesToB64u(pub.slice(1, 33)),
      y: bytesToB64u(pub.slice(33, 65)),
      d: vapid.privateKey,
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = bytesToB64u(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64u(
    encoder.encode(
      JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: vapid.subject }),
    ),
  );
  const input = `${header}.${payload}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(input));
  return `${input}.${bytesToB64u(sig)}`;
}

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, bytes: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8);
  return new Uint8Array(bits) as Bytes;
}

/** Cifra el mensaje para el navegador (RFC 8291, un único registro aes128gcm). */
async function encryptPayload(sub: PushSubscriptionJSON, plaintext: string): Promise<Bytes> {
  const uaPublic = b64uToBytes(sub.keys.p256dh);
  const authSecret = b64uToBytes(sub.keys.auth);

  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey)) as Bytes;
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, pair.privateKey, 256),
  ) as Bytes;

  // IKM = HKDF(salt=auth, ikm=ecdh, info="WebPush: info\0"||ua_pub||as_pub, 32)
  const ikm = await hkdf(authSecret, shared, concat(encoder.encode("WebPush: info\0"), uaPublic, asPublic), 32);

  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0") as Bytes, 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0") as Bytes, 12);

  const data = encoder.encode(plaintext);
  if (data.length > 3800) throw new Error("Payload demasiado grande para un registro push (máx. ~3,8 KB)");
  const record = concat(data, new Uint8Array([2])); // 0x02 = delimitador del último registro
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, record));

  const rs = new Uint8Array([0, 0, 0x10, 0]); // record size = 4096 (uint32 BE)
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}

/** Envía un push (con o sin payload) al servicio de Google (FCM), Apple (APNs web) o Mozilla. */
export async function sendWebPush(
  sub: PushSubscriptionJSON,
  payload: string | object | null,
  vapid: VapidKeys,
  opts: PushOptions = {},
): Promise<PushResult> {
  try {
    const url = new URL(sub.endpoint);
    if (url.protocol !== "https:") return { ok: false, status: 0, gone: false, error: "endpoint no https" };

    const jwt = await vapidJwt(url.origin, vapid);
    const headers: Record<string, string> = {
      Authorization: `vapid t=${jwt}, k=${vapid.publicKey}`,
      TTL: String(opts.ttl ?? 86400),
      Urgency: opts.urgency ?? "normal",
    };
    if (opts.topic) headers.Topic = opts.topic.replace(/[^\w-]/g, "").slice(0, 32);

    let body: Bytes | undefined;
    if (payload !== null) {
      const text = typeof payload === "string" ? payload : JSON.stringify(payload);
      body = await encryptPayload(sub, text);
      headers["Content-Encoding"] = "aes128gcm";
      headers["Content-Type"] = "application/octet-stream";
    }

    const res = await fetch(sub.endpoint, { method: "POST", headers, body });
    if (res.status >= 200 && res.status < 300) return { ok: true, status: res.status, gone: false };
    const error = (await res.text().catch(() => "")).slice(0, 200);
    return { ok: false, status: res.status, gone: res.status === 404 || res.status === 410, error };
  } catch (e) {
    return { ok: false, status: 0, gone: false, error: e instanceof Error ? e.message : String(e) };
  }
}
