"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, CheckCheck, SendHorizontal } from "lucide-react";
import { cn } from "@elena/ui";
import { repo } from "@/lib/repo";
import { hhmm } from "@/lib/dates";
import type { Message } from "@/lib/types";

type Props = {
  /** Hilo = cliente. Cliente: su propio id. Elena: el cliente seleccionado. */
  clientId: string;
  meId: string;
  peerName: string;
  /** Altura cuando no hay teclado (clase Tailwind). */
  className?: string;
};

/**
 * Hook de teclado virtual. En iOS el teclado NO reduce el viewport de layout: solo el visual viewport.
 * Cuando el teclado está abierto devolvemos su rectángulo para fijar el chat a pantalla completa
 * justo encima del teclado. En Android (Chrome) `interactiveWidget: resizes-content` ya lo reduce
 * y esto converge al mismo resultado.
 */
function useKeyboardViewport() {
  const [vp, setVp] = useState<{ open: boolean; top: number; height: number }>({ open: false, top: 0, height: 0 });
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const update = () => {
      const open = window.innerHeight - v.height > 120 && v.width < 1024;
      setVp({ open, top: v.offsetTop, height: v.height });
      if (open && window.scrollY !== 0) window.scrollTo(0, 0); // iOS empuja la página al enfocar
    };
    update();
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    return () => {
      v.removeEventListener("resize", update);
      v.removeEventListener("scroll", update);
    };
  }, []);
  return vp;
}

export function ChatBox({ clientId, meId, peerName, className }: Props) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const kb = useKeyboardViewport();

  const upsert = useCallback((m: Message) => {
    setMessages((cur) => {
      const list = cur ?? [];
      const i = list.findIndex((x) => x.id === m.id);
      if (i >= 0) {
        const next = [...list];
        next[i] = m;
        return next;
      }
      return [...list, m].sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
  }, []);

  // Carga inicial + Realtime
  useEffect(() => {
    let alive = true;
    setMessages(null);
    repo.listMessages(clientId).then((m) => alive && setMessages(m)).catch(() => alive && setMessages([]));
    const off = repo.subscribeMessages(clientId, (e) => {
      if (e.type !== "DELETE") upsert(e.row);
    });
    return () => {
      alive = false;
      off();
    };
  }, [clientId, upsert]);

  // Doble check: marca como leído lo recibido mientras el chat está visible.
  const unreadIncoming = messages?.some((m) => !m.is_read && m.sender_id !== meId) ?? false;
  useEffect(() => {
    if (!unreadIncoming || document.visibilityState !== "visible") return;
    void repo.markRead(clientId, meId).catch(() => {});
  }, [unreadIncoming, clientId, meId, messages?.length]);
  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && unreadIncoming && void repo.markRead(clientId, meId);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [unreadIncoming, clientId, meId]);

  // Scroll automático: solo si ya estabas abajo (o si el mensaje es tuyo)
  const scrollToEnd = useCallback((smooth = true) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);
  useLayoutEffect(() => {
    if (!messages) return;
    const last = messages[messages.length - 1];
    if (stick.current || last?.sender_id === meId) scrollToEnd(messages.length > 1);
  }, [messages, meId, scrollToEnd]);
  // Al abrir/cerrar el teclado el alto cambia: mantén el final visible
  useLayoutEffect(() => {
    if (stick.current) scrollToEnd(false);
  }, [kb.open, kb.height, scrollToEnd]);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    setDraft("");
    stick.current = true;
    try {
      upsert(await repo.sendMessage({ clientId, senderId: meId, content }));
    } catch (e) {
      setDraft(content);
      setError(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setSending(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  // Textarea que crece hasta 5 líneas
  useLayoutEffect(() => {
    const t = inputRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
  }, [draft]);

  const rows = messages ?? [];
  let lastDay = "";

  return (
    <div
      // Teclado abierto → capa fija del tamaño exacto del visual viewport (tapa cabecera y tab bar)
      style={kb.open ? { top: kb.top, height: kb.height } : undefined}
      className={cn(
        "flex flex-col overflow-hidden bg-ink",
        kb.open ? "fixed inset-x-0 z-[65]" : cn("rounded-3xl border border-line", className),
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-ink-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:pt-3">
        <span className="grid size-10 place-items-center rounded-full bg-volt font-display text-xl text-ink">{peerName[0]}</span>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{peerName}</p>
          <p className="text-xs text-mute">{repo.mode === "demo" ? "Chat de demostración" : "Chat privado"}</p>
        </div>
      </header>

      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-3 py-4"
        role="log"
        aria-live="polite"
        aria-label={`Conversación con ${peerName}`}
      >
        {messages === null && <p className="py-10 text-center text-sm text-mute">Cargando…</p>}
        {messages && rows.length === 0 && (
          <p className="py-10 text-center text-sm text-mute">Aún no hay mensajes. ¡Escribe el primero!</p>
        )}
        {rows.map((m) => {
          const mine = m.sender_id === meId;
          const day = new Date(m.created_at).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && (
                <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wider text-mute">{day}</p>
              )}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-3.5 py-2 shadow-sm",
                    mine ? "rounded-br-md bg-volt text-ink" : "rounded-bl-md bg-ink-3 text-bone",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.content}</p>
                  <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", mine ? "text-ink/70" : "text-mute")}>
                    {hhmm(m.created_at)}
                    {mine && (
                      <span aria-label={m.is_read ? "Leído" : "Enviado"} className={m.is_read ? "text-ink" : "text-ink/50"}>
                        {m.is_read ? <CheckCheck className="size-4" strokeWidth={2.5} /> : <Check className="size-4" strokeWidth={2.5} />}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="shrink-0 bg-bad/15 px-4 py-2 text-xs text-bad">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex shrink-0 items-end gap-2 border-t border-line bg-ink-2 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:pb-2.5"
      >
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter envía en escritorio; en móvil Enter = salto de línea (como WhatsApp)
            if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Escribe un mensaje…"
          aria-label="Mensaje"
          enterKeyHint="send"
          className="max-h-[120px] min-h-11 flex-1 resize-none rounded-3xl border border-line bg-ink px-4 py-2.5 leading-snug focus:border-volt focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-label="Enviar"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-volt text-ink transition active:scale-90 disabled:opacity-40"
        >
          <SendHorizontal className="size-5" />
        </button>
      </form>
    </div>
  );
}
