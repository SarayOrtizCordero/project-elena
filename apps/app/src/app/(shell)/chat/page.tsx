"use client";

import { ChatBox } from "@/components/ChatBox";
import { useIdentity } from "@/lib/identity";

export default function ChatPage() {
  const { identity } = useIdentity();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display-tight text-5xl font-extrabold sm:text-6xl">
          Chat con <span className="text-volt">Elena</span>
        </h1>
        <p className="text-mute">Dudas, ajustes de plan o lo que necesites.</p>
      </div>
      {identity ? (
        <ChatBox
          clientId={identity.id}
          meId={identity.id}
          peerName="Elena"
          className="h-[calc(100dvh-20rem)] min-h-[22rem] lg:h-[calc(100dvh-16rem)]"
        />
      ) : (
        <p className="py-10 text-center text-mute">Cargando…</p>
      )}
    </div>
  );
}
