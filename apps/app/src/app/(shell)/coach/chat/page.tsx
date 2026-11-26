"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { cn } from "@elena/ui";
import { ChatBox } from "@/components/ChatBox";
import { useIdentity } from "@/lib/identity";
import { repo } from "@/lib/repo";
import { hhmm } from "@/lib/dates";
import type { Thread } from "@/lib/types";

function Inbox() {
  const { identity } = useIdentity();
  const router = useRouter();
  const selected = useSearchParams().get("client");
  const [threads, setThreads] = useState<Thread[] | null>(null);

  const load = useCallback(() => repo.listThreads().then(setThreads).catch(() => setThreads([])), []);
  useEffect(() => {
    void load();
    return repo.subscribeMessages(null, () => void load()); // Realtime: cualquier mensaje nuevo reordena la bandeja
  }, [load]);

  const current = threads?.find((t) => t.client.id === selected);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display-tight text-5xl font-extrabold sm:text-6xl">
          Men<span className="text-volt">sajes</span>
        </h1>
        <p className="text-mute">Chat privado con cada cliente.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <ul className={cn("space-y-2", selected && "hidden lg:block")}>
          {threads === null && <li className="py-8 text-center text-mute">Cargando…</li>}
          {threads?.map((t) => (
            <li key={t.client.id}>
              <button
                onClick={() => router.replace(`/coach/chat?client=${t.client.id}`)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                  selected === t.client.id ? "border-volt bg-ink-2" : "border-line bg-ink-2 hover:border-volt/50",
                )}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-3 font-display text-xl text-volt">{t.client.full_name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold">{t.client.full_name}</span>
                    {t.last && <span className="shrink-0 text-[11px] text-mute">{hhmm(t.last.created_at)}</span>}
                  </span>
                  <span className="block truncate text-sm text-mute">{t.last?.content ?? "Sin mensajes"}</span>
                </span>
                {t.unread > 0 && (
                  <span aria-label={`${t.unread} sin leer`} className="grid min-w-6 place-items-center rounded-full bg-volt px-1.5 text-xs font-bold text-ink">
                    {t.unread}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className={cn(!selected && "hidden lg:grid lg:place-items-center lg:rounded-3xl lg:border lg:border-dashed lg:border-line")}>
          {current && identity ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button onClick={() => router.replace("/coach/chat")} className="inline-flex items-center gap-1 text-sm text-mute hover:text-volt lg:hidden">
                  <ArrowLeft className="size-4" /> Mensajes
                </button>
                <Link href={`/coach/clientes/${current.client.id}`} className="ml-auto inline-flex items-center gap-1 text-sm text-mute hover:text-volt">
                  <UserRound className="size-4" /> Ficha
                </Link>
              </div>
              <ChatBox
                key={current.client.id}
                clientId={current.client.id}
                meId={identity.id}
                peerName={current.client.full_name}
                className="h-[calc(100dvh-18rem)] min-h-[22rem] lg:h-[calc(100dvh-14rem)]"
              />
            </div>
          ) : (
            <p className="py-16 text-mute">Elige una conversación.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoachChat() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-mute">Cargando…</p>}>
      <Inbox />
    </Suspense>
  );
}
