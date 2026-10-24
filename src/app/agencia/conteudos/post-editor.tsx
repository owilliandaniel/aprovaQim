"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ImagePlus, Link2, Play, X } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { buttonPrimary, buttonSecondary, inputClass, labelClass, labelTextClass } from "@/components/ui";
import { postTypeLabel } from "@/lib/labels";
import {
  driveFileId,
  driveThumbnailUrl,
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MEDIA_BUCKET,
  mediaRuleError,
} from "@/lib/media";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/database.types";
import { savePost, sendPosts, setPostMedia, type MediaInput } from "./actions";

type PostType = Enums<"post_type">;

export type EditorPost = {
  id: string;
  clientId: string;
  type: PostType;
  title: string;
  caption: string;
  plannedDate: string;
  status: Enums<"post_status">;
  media: ({ kind: "image"; storagePath: string; url: string } | { kind: "video_link"; externalUrl: string })[];
};

type EditorMedia =
  | { key: string; kind: "image"; storagePath?: string; file?: File; previewUrl: string }
  | { key: string; kind: "video_link"; externalUrl: string };

const typeHints: Record<PostType, string> = {
  feed: "1 imagem ou 1 vídeo.",
  carousel: "De 2 a 10 mídias, na ordem em que vão aparecer.",
  reels: "1 vídeo (link do Google Drive).",
  stories: "Imagens ou vídeos, na ordem dos stories.",
};

const extensionFor = (mime: string) => (mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg");

// Create/edit form: text fields, images uploaded straight to Storage, Drive video links.
export function PostEditor({ clients, post, defaultClientId }: {
  clients: { id: string; name: string }[];
  post?: EditorPost;
  defaultClientId?: string;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [postId, setPostId] = useState(post?.id);
  const [clientId, setClientId] = useState(post?.clientId ?? defaultClientId ?? (clients.length === 1 ? clients[0].id : ""));
  const [type, setType] = useState<PostType>(post?.type ?? "feed");
  const [title, setTitle] = useState(post?.title ?? "");
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [plannedDate, setPlannedDate] = useState(post?.plannedDate ?? "");
  const [items, setItems] = useState<EditorMedia[]>(
    () =>
      post?.media.map((media, index) =>
        media.kind === "image"
          ? { key: media.storagePath, kind: "image", storagePath: media.storagePath, previewUrl: media.url }
          : { key: `video-${index}`, kind: "video_link", externalUrl: media.externalUrl },
      ) ?? [],
  );
  const [driveUrl, setDriveUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "send" | null>(null);

  const status = post?.status ?? "draft";
  const ruleError = mediaRuleError(type, items.map((item) => item.kind));
  const canSend = status !== "pending";

  function addFiles(files: FileList | null) {
    const added: EditorMedia[] = [];
    const problems: string[] = [];
    for (const file of Array.from(files ?? [])) {
      if (!IMAGE_TYPES.includes(file.type)) problems.push(`${file.name}: use JPG, PNG ou WebP.`);
      else if (file.size > MAX_IMAGE_BYTES) problems.push(`${file.name}: maior que 20 MB.`);
      else added.push({ key: crypto.randomUUID(), kind: "image", file, previewUrl: URL.createObjectURL(file) });
    }
    setItems((current) => [...current, ...added]);
    setError(problems.length ? problems.join(" ") : null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function addVideo() {
    if (!driveFileId(driveUrl)) {
      setError("Cole o link de um arquivo do Google Drive (drive.google.com/file/d/...).");
      return;
    }
    setItems((current) => [...current, { key: crypto.randomUUID(), kind: "video_link", externalUrl: driveUrl.trim() }]);
    setDriveUrl("");
    setError(null);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  }

  function remove(index: number) {
    const item = items[index];
    if (item.kind === "image" && item.file) URL.revokeObjectURL(item.previewUrl);
    setItems(items.filter((_, i) => i !== index));
  }

  async function submit(send: boolean) {
    if (!clientId) return setError("Escolha o cliente.");
    if (!title.trim()) return setError("Dê um título ao conteúdo.");
    if (!plannedDate) return setError("Escolha a data de publicação.");
    if (send && ruleError) return setError(ruleError);

    setBusy(send ? "send" : "save");
    setError(null);
    try {
      const saved = await savePost({ id: postId, clientId, type, title, caption, plannedDate });
      if (!saved.ok) throw new Error(saved.error);
      const id = saved.postId;
      setPostId(id);

      // Upload new images straight to Storage; keep paths so a retry doesn't upload twice.
      const supabase = createClient();
      const uploaded = [...items];
      for (const [index, item] of uploaded.entries()) {
        if (item.kind !== "image" || item.storagePath || !item.file) continue;
        const path = `${clientId}/${id}/${crypto.randomUUID()}.${extensionFor(item.file.type)}`;
        const { error: uploadError } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, item.file, { contentType: item.file.type });
        if (uploadError) throw new Error(`Não foi possível enviar ${item.file.name}.`);
        uploaded[index] = { ...item, storagePath: path };
      }
      setItems(uploaded);

      const media: MediaInput[] = uploaded.map((item) =>
        item.kind === "image"
          ? { kind: "image", storagePath: item.storagePath! }
          : { kind: "video_link", externalUrl: item.externalUrl },
      );
      const mediaResult = await setPostMedia(id, media);
      if (!mediaResult.ok) throw new Error(mediaResult.error);

      if (send) {
        const result = await sendPosts([id]);
        if (!result.ok) throw new Error(result.error);
        if (result.sent === 0) throw new Error(result.blocked[0]?.reason ?? "Não foi possível enviar para aprovação.");
      }

      // The list reads fresh data on every visit, so no extra refresh is needed.
      router.push(`/agencia/conteudos?cliente=${clientId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Algo deu errado. Tente novamente.");
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4">
      {status === "approved" && (
        <p className="rounded-lg bg-warn-bg px-3 py-2 text-warn">
          Este conteúdo já foi aprovado. Ao salvar, ele volta para rascunho e precisa ser reenviado ao cliente.
        </p>
      )}
      {status === "pending" && (
        <p className="rounded-lg bg-pale px-3 py-2 text-[#514365]">
          Este conteúdo está com o cliente. As alterações aparecem para ele assim que você salvar.
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="grid gap-3 rounded-2xl border border-line bg-white p-5">
          <label className={labelClass}>
            <span className={labelTextClass}>Cliente</span>
            <select
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              disabled={Boolean(postId)}
              className={inputClass}
            >
              <option value="">Escolha o cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="grid gap-1.5">
            <legend className={`${labelTextClass} mb-1.5`}>Tipo</legend>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {(Object.keys(postTypeLabel) as PostType[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={type === option}
                  onClick={() => setType(option)}
                  className={`min-h-11 rounded-lg px-3 py-2 font-semibold sm:min-h-0 ${
                    type === option ? "bg-brand-dark text-white" : "bg-[#eee9f6] text-[#655a7f] hover:bg-chip"
                  }`}
                >
                  {postTypeLabel[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className={labelClass}>
            <span className={labelTextClass}>Título</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Ex.: Reels – Bastidores"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Data de publicação</span>
            <input type="date" value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={labelTextClass}>Legenda</span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={2200}
              rows={8}
              className={`${inputClass} resize-y`}
            />
            <span className="justify-self-end text-xs text-muted">{caption.length}/2200</span>
          </label>
        </section>

        <section className="grid gap-3 rounded-2xl border border-line bg-white p-5">
          <div>
            <h2 className="font-bold">Mídia</h2>
            <p className="text-[13px] text-muted">{typeHints[type]}</p>
          </div>

          {items.length > 0 && (
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((item, index) => (
                <li key={item.key} className="relative overflow-hidden rounded-lg border border-line bg-pale">
                  <MediaPreview item={item} />
                  <span className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1.5 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="grid grid-cols-3 bg-white">
                    <button type="button" aria-label="Mover para a esquerda" onClick={() => move(index, -1)} disabled={index === 0} className="grid min-h-11 place-items-center text-muted hover:bg-pale disabled:opacity-30 sm:min-h-9">
                      <ChevronLeft size={18} />
                    </button>
                    <button type="button" aria-label="Remover mídia" onClick={() => remove(index)} className="grid min-h-11 place-items-center text-danger hover:bg-danger-bg sm:min-h-9">
                      <X size={18} />
                    </button>
                    <button type="button" aria-label="Mover para a direita" onClick={() => move(index, 1)} disabled={index === items.length - 1} className="grid min-h-11 place-items-center text-muted hover:bg-pale disabled:opacity-30 sm:min-h-9">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <input
            ref={fileInput}
            type="file"
            accept={IMAGE_TYPES.join(",")}
            multiple
            onChange={(event) => addFiles(event.target.files)}
            className="hidden"
          />
          <button type="button" onClick={() => fileInput.current?.click()} className={`${buttonSecondary} border-dashed`}>
            <ImagePlus size={18} /> Adicionar imagens
          </button>

          <div className="grid gap-1.5">
            <div className="flex gap-2">
              <input
                value={driveUrl}
                onChange={(event) => setDriveUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addVideo();
                  }
                }}
                placeholder="Link do vídeo no Google Drive"
                className={inputClass}
              />
              <button type="button" onClick={addVideo} className={buttonSecondary}>
                <Link2 size={16} /> Adicionar
              </button>
            </div>
            <p className="text-xs text-muted">No Drive, compartilhe o vídeo como “Qualquer pessoa com o link”.</p>
          </div>

          {items.length > 0 && ruleError && <p className="text-[13px] text-warn">{ruleError}</p>}
        </section>
      </div>

      <FormMessage error={error} />

      {/* On phones the actions stay pinned to the bottom of the screen. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t border-line bg-canvas/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <button type="button" onClick={() => submit(false)} disabled={busy !== null} className={`${buttonSecondary} flex-1 md:flex-none`}>
          {busy === "save" ? "Salvando..." : canSend ? "Salvar rascunho" : "Salvar alterações"}
        </button>
        {canSend && (
          <button type="button" onClick={() => submit(true)} disabled={busy !== null} className={`${buttonPrimary} flex-1 md:flex-none`}>
            {busy === "send" ? "Enviando..." : status === "draft" ? (
              <>
                <span className="md:hidden">Salvar e enviar</span>
                <span className="hidden md:inline">Salvar e enviar para aprovação</span>
              </>
            ) : (
              "Salvar e reenviar"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function MediaPreview({ item }: { item: EditorMedia }) {
  if (item.kind === "image") {
    return (
      <div className="relative aspect-square">
        <Image src={item.previewUrl} alt="" fill unoptimized sizes="200px" className="object-cover" />
      </div>
    );
  }
  const fileId = driveFileId(item.externalUrl);
  return (
    <div className="relative grid aspect-square place-items-center bg-[#23132e]">
      {fileId && <Image src={driveThumbnailUrl(fileId)} alt="" fill unoptimized sizes="200px" className="object-cover opacity-80" />}
      <span className="relative grid size-10 place-items-center rounded-full bg-[#130b1dba] text-white">
        <Play size={16} fill="currentColor" className="ml-0.5" />
      </span>
      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 text-[11px] text-white">Drive</span>
    </div>
  );
}
