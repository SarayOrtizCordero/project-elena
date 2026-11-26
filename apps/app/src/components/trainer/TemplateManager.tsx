"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Dumbbell, Folder as FolderIcon, FolderPlus, Pencil, Plus, Search, Send, Trash2, Utensils, Video } from "lucide-react";
import { cn } from "@elena/ui";
import { repo } from "@/lib/repo";
import { youtubeId } from "@/lib/youtube";
import type { ExerciseBlock, Folder, MealBlock, NewTemplate, Profile, Template, TemplateCategory } from "@/lib/types";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-ink px-3 focus:border-volt focus:outline-none";

const emptyExercise = (): ExerciseBlock => ({ name: "", sets: 3, reps: "10", rest_seconds: 60, video_url: "" });
const emptyMeal = (): MealBlock => ({ name: "", time: "", items: [{ name: "", qty: "", kcal: 0 }] });

export function TemplateManager() {
  const toast = useToast((s) => s.show);
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [editor, setEditor] = useState(false);
  const [assigning, setAssigning] = useState<Template | null>(null);

  const loadFolders = useCallback(() => repo.listFolders().then(setFolders).catch((e) => toast(String(e.message ?? e))), [toast]);
  useEffect(() => void loadFolders(), [loadFolders]);

  const loadTemplates = useCallback(
    (f: Folder) => {
      setTemplates(null);
      return repo.listTemplates(f.id).then(setTemplates).catch((e) => toast(String(e.message ?? e)));
    },
    [toast],
  );

  async function addFolder() {
    const name = newName.trim();
    if (!name) return;
    try {
      await repo.createFolder(name);
      setNewName("");
      setCreatingFolder(false);
      await loadFolders();
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo crear");
    }
  }

  async function saveRename(f: Folder) {
    const name = renameVal.trim();
    setRenaming(null);
    if (!name || name === f.name) return;
    try {
      await repo.renameFolder(f.id, name);
      await loadFolders();
      setFolder((cur) => (cur?.id === f.id ? { ...cur, name } : cur));
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo renombrar");
    }
  }

  async function remove(t: Template) {
    if (!window.confirm(`¿Borrar la plantilla "${t.title}"? Los planes ya asignados no cambian.`)) return;
    try {
      await repo.deleteTemplate(t.id);
      if (folder) await loadTemplates(folder);
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo borrar");
    }
  }

  /* ─────────── Vista de carpetas ─────────── */
  if (!folder) {
    return (
      <div className="space-y-4">
        {folders === null ? (
          <p className="py-10 text-center text-mute">Cargando…</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {folders.map((f) => (
              <li key={f.id} className="rounded-3xl border border-line bg-ink-2 p-4">
                {renaming === f.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void saveRename(f);
                    }}
                    className="flex gap-2"
                  >
                    <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} aria-label="Nombre de la carpeta" className={inputCls} />
                    <button className="grid size-11 shrink-0 place-items-center rounded-xl bg-volt text-ink" aria-label="Guardar nombre">
                      <Check className="size-5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setFolder(f);
                        void loadTemplates(f);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink-3" style={{ color: f.color ?? "#FAA307" }}>
                        <FolderIcon className="size-6" />
                      </span>
                      <span className="truncate font-display-tight text-3xl font-bold">{f.name}</span>
                    </button>
                    <button
                      onClick={() => {
                        setRenaming(f.id);
                        setRenameVal(f.name);
                      }}
                      aria-label={`Renombrar ${f.name}`}
                      className="grid size-10 shrink-0 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-bone"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
            <li>
              {creatingFolder ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void addFolder();
                  }}
                  className="flex gap-2 rounded-3xl border border-volt/50 bg-ink-2 p-4"
                >
                  <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ej. Rehabilitación" aria-label="Nombre de la nueva carpeta" className={inputCls} />
                  <button className="grid size-11 shrink-0 place-items-center rounded-xl bg-volt text-ink" aria-label="Crear carpeta">
                    <Check className="size-5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setCreatingFolder(true)}
                  className="flex h-full min-h-20 w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-line p-4 text-mute transition-colors hover:border-volt hover:text-volt"
                >
                  <FolderPlus className="size-5" /> Nueva carpeta
                </button>
              )}
            </li>
          </ul>
        )}
      </div>
    );
  }

  /* ─────────── Dentro de una carpeta ─────────── */
  return (
    <div className="space-y-4">
      <button onClick={() => setFolder(null)} className="inline-flex items-center gap-1 text-sm text-mute hover:text-volt">
        <ArrowLeft className="size-4" /> Carpetas
      </button>

      <div className="flex items-center gap-3">
        {renaming === folder.id ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveRename(folder);
            }}
            className="flex flex-1 gap-2"
          >
            <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} aria-label="Nombre de la carpeta" className={inputCls} />
            <button className="grid size-11 shrink-0 place-items-center rounded-xl bg-volt text-ink" aria-label="Guardar nombre">
              <Check className="size-5" />
            </button>
          </form>
        ) : (
          <>
            <h2 className="font-display-tight min-w-0 flex-1 truncate text-4xl font-extrabold">{folder.name}</h2>
            <button
              onClick={() => {
                setRenaming(folder.id);
                setRenameVal(folder.name);
              }}
              aria-label="Renombrar carpeta"
              className="grid size-10 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-bone"
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => setEditor(true)}
              className="flex h-11 items-center gap-2 rounded-full bg-volt px-5 font-display text-base uppercase tracking-wide text-ink transition active:scale-95"
            >
              <Plus className="size-5" /> Plantilla
            </button>
          </>
        )}
      </div>

      {templates === null ? (
        <p className="py-10 text-center text-mute">Cargando…</p>
      ) : templates.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line py-12 text-center text-mute">Esta carpeta está vacía. Crea la primera plantilla.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => {
            const count = t.category === "workout" ? t.content_data.exercises?.length ?? 0 : t.content_data.meals?.length ?? 0;
            return (
              <li key={t.id} className="flex flex-col rounded-3xl border border-line bg-ink-2 p-5">
                <div className="mb-3 flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-ink-3 text-volt">
                    {t.category === "workout" ? <Dumbbell className="size-5" /> : <Utensils className="size-5" />}
                  </span>
                  <button onClick={() => remove(t)} aria-label={`Borrar ${t.title}`} className="grid size-9 place-items-center rounded-full text-mute hover:bg-ink-3 hover:text-bad">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">
                  {t.category === "workout" ? "Entrenamiento" : "Nutrición"} · {count} {t.category === "workout" ? "ejercicios" : "comidas"}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{t.title}</h3>
                {t.description && <p className="mt-1 line-clamp-2 flex-1 text-sm text-mute">{t.description}</p>}
                <button
                  onClick={() => setAssigning(t)}
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full border border-volt/60 font-display text-base uppercase tracking-wide text-volt transition hover:bg-volt hover:text-ink active:scale-95"
                >
                  <Send className="size-4" /> Asignar a cliente
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={editor} onClose={() => setEditor(false)} title="Nueva plantilla">
        <TemplateEditor
          folder={folder}
          onSaved={async () => {
            setEditor(false);
            toast("Plantilla creada");
            await loadTemplates(folder);
          }}
        />
      </Sheet>

      <Sheet open={!!assigning} onClose={() => setAssigning(null)} title="Asignar a cliente">
        {assigning && <AssignList template={assigning} onDone={() => setAssigning(null)} />}
      </Sheet>
    </div>
  );
}

/* ─────────── Editor de plantilla ─────────── */
function TemplateEditor({ folder, onSaved }: { folder: Folder; onSaved: () => void | Promise<void> }) {
  const toast = useToast((s) => s.show);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>(/nutri/i.test(folder.name) ? "nutrition" : "workout");
  const [exercises, setExercises] = useState<ExerciseBlock[]>([emptyExercise()]);
  const [meals, setMeals] = useState<MealBlock[]>([emptyMeal()]);
  const [busy, setBusy] = useState(false);

  const patchEx = (i: number, p: Partial<ExerciseBlock>) => setExercises((l) => l.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const patchMeal = (i: number, p: Partial<MealBlock>) => setMeals((l) => l.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function save() {
    if (!title.trim()) return toast("Pon un título a la plantilla");
    const exs = exercises.filter((e) => e.name.trim());
    const mls = meals
      .map((m) => ({ ...m, items: m.items.filter((it) => it.name.trim()) }))
      .filter((m) => m.name.trim());
    if (category === "workout" && exs.length === 0) return toast("Añade al menos un ejercicio");
    if (category === "nutrition" && mls.length === 0) return toast("Añade al menos una comida");
    const bad = exs.find((e) => e.video_url && !youtubeId(e.video_url));
    if (bad) return toast(`El enlace de "${bad.name}" no es de YouTube`);

    const input: NewTemplate = {
      folder_id: folder.id,
      title: title.trim(),
      category,
      description: description.trim(),
      content_data:
        category === "workout"
          ? { exercises: exs.map((e) => ({ ...e, name: e.name.trim(), video_url: e.video_url?.trim() || undefined })) }
          : { meals: mls },
    };
    setBusy(true);
    try {
      await repo.createTemplate(input);
      await onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (ej. Pierna y glúteo · 4 días)" aria-label="Título" className={inputCls} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descripción (opcional)" aria-label="Descripción" className={cn(inputCls, "h-auto py-2.5")} />

      <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 gap-2">
        {(["workout", "nutrition"] as const).map((c) => (
          <button
            key={c}
            role="radio"
            aria-checked={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors",
              category === c ? "border-volt bg-volt text-ink" : "border-line text-mute",
            )}
          >
            {c === "workout" ? <Dumbbell className="size-4" /> : <Utensils className="size-4" />}
            {c === "workout" ? "Entrenamiento" : "Nutrición"}
          </button>
        ))}
      </div>

      {category === "workout" ? (
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <fieldset key={i} className="space-y-2 rounded-2xl bg-ink-3 p-3">
              <legend className="sr-only">Ejercicio {i + 1}</legend>
              <div className="flex gap-2">
                <input value={ex.name} onChange={(e) => patchEx(i, { name: e.target.value })} placeholder={`Ejercicio ${i + 1}`} aria-label="Nombre del ejercicio" className={inputCls} />
                {exercises.length > 1 && (
                  <button onClick={() => setExercises((l) => l.filter((_, j) => j !== i))} aria-label="Quitar ejercicio" className="grid size-11 shrink-0 place-items-center rounded-xl text-mute hover:text-bad">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs text-mute">
                  Series
                  <input type="number" min={1} value={ex.sets} onChange={(e) => patchEx(i, { sets: Math.max(1, Number(e.target.value) || 1) })} className={cn(inputCls, "mt-1")} />
                </label>
                <label className="text-xs text-mute">
                  Reps
                  <input value={ex.reps} onChange={(e) => patchEx(i, { reps: e.target.value })} className={cn(inputCls, "mt-1")} />
                </label>
                <label className="text-xs text-mute">
                  Descanso (s)
                  <input type="number" min={0} step={5} value={ex.rest_seconds} onChange={(e) => patchEx(i, { rest_seconds: Math.max(0, Number(e.target.value) || 0) })} className={cn(inputCls, "mt-1")} />
                </label>
              </div>
              <label className="block text-xs text-mute">
                <span className="flex items-center gap-1">
                  <Video className="size-3.5" /> Vídeo de YouTube (oculto: el cliente solo ve el botón «Ver técnica»)
                </span>
                <input
                  type="url"
                  inputMode="url"
                  value={ex.video_url ?? ""}
                  onChange={(e) => patchEx(i, { video_url: e.target.value })}
                  placeholder="https://youtu.be/…"
                  aria-invalid={!!ex.video_url && !youtubeId(ex.video_url)}
                  className={cn(inputCls, "mt-1", ex.video_url && !youtubeId(ex.video_url) && "border-bad")}
                />
              </label>
            </fieldset>
          ))}
          <button onClick={() => setExercises((l) => [...l, emptyExercise()])} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line text-mute hover:border-volt hover:text-volt">
            <Plus className="size-4" /> Añadir ejercicio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((m, i) => (
            <fieldset key={i} className="space-y-2 rounded-2xl bg-ink-3 p-3">
              <legend className="sr-only">Comida {i + 1}</legend>
              <div className="flex gap-2">
                <input value={m.name} onChange={(e) => patchMeal(i, { name: e.target.value })} placeholder="Comida (ej. Desayuno)" aria-label="Nombre de la comida" className={inputCls} />
                <input type="time" value={m.time ?? ""} onChange={(e) => patchMeal(i, { time: e.target.value })} aria-label="Hora" className={cn(inputCls, "w-28 shrink-0")} />
                {meals.length > 1 && (
                  <button onClick={() => setMeals((l) => l.filter((_, j) => j !== i))} aria-label="Quitar comida" className="grid size-11 shrink-0 place-items-center rounded-xl text-mute hover:text-bad">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              {m.items.map((it, k) => (
                <div key={k} className="grid grid-cols-[1fr_5.5rem_4.5rem] gap-2">
                  <input value={it.name} onChange={(e) => patchMeal(i, { items: m.items.map((x, j) => (j === k ? { ...x, name: e.target.value } : x)) })} placeholder="Alimento" aria-label="Alimento" className={inputCls} />
                  <input value={it.qty} onChange={(e) => patchMeal(i, { items: m.items.map((x, j) => (j === k ? { ...x, qty: e.target.value } : x)) })} placeholder="Cant." aria-label="Cantidad" className={inputCls} />
                  <input type="number" min={0} value={it.kcal || ""} onChange={(e) => patchMeal(i, { items: m.items.map((x, j) => (j === k ? { ...x, kcal: Math.max(0, Number(e.target.value) || 0) } : x)) })} placeholder="kcal" aria-label="Calorías" className={inputCls} />
                </div>
              ))}
              <button onClick={() => patchMeal(i, { items: [...m.items, { name: "", qty: "", kcal: 0 }] })} className="text-sm text-mute hover:text-volt">
                + Añadir alimento
              </button>
            </fieldset>
          ))}
          <button onClick={() => setMeals((l) => [...l, emptyMeal()])} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line text-mute hover:border-volt hover:text-volt">
            <Plus className="size-4" /> Añadir comida
          </button>
        </div>
      )}

      <button onClick={save} disabled={busy} className="h-14 w-full rounded-full bg-volt font-display text-lg uppercase tracking-wide text-ink transition active:scale-[0.97] disabled:opacity-60">
        {busy ? "Guardando…" : "Guardar plantilla"}
      </button>
    </div>
  );
}

/* ─────────── Lista de clientes para asignar ─────────── */
function AssignList({ template, onDone }: { template: Template; onDone: () => void }) {
  const toast = useToast((s) => s.show);
  const [clients, setClients] = useState<Profile[] | null>(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    repo.listClients().then(setClients).catch(() => setClients([]));
  }, []);

  const list = useMemo(
    () => (clients ?? []).filter((c) => c.full_name.toLowerCase().includes(q.toLowerCase())),
    [clients, q],
  );

  async function assign(c: Profile) {
    setBusyId(c.id);
    try {
      await repo.assignTemplate(template, c.id);
      toast(`"${template.title}" asignada a ${c.full_name.split(" ")[0]}`);
      onDone();
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo asignar");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-mute">
        Se copia <b className="text-bone">{template.title}</b> al cliente. Después puedes editarla solo para esa persona.
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mute" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente…" aria-label="Buscar cliente" className={cn(inputCls, "pl-9")} />
      </div>
      {clients === null ? (
        <p className="py-6 text-center text-mute">Cargando…</p>
      ) : list.length === 0 ? (
        <p className="py-6 text-center text-mute">Ningún cliente coincide.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => assign(c)}
                disabled={busyId !== null}
                className="flex w-full items-center gap-3 rounded-2xl bg-ink-3 p-3 text-left transition hover:ring-1 hover:ring-volt disabled:opacity-60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display text-xl text-volt">{c.full_name[0]}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{c.full_name}</span>
                <span className="text-sm text-volt">{busyId === c.id ? "…" : "Asignar"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
