"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  postTypeLabels,
  postTypeStyles,
  type PostAudience,
  type PostPhoto,
  type Post,
  type PostType,
} from "@/app/lib/posts";
import { useStaff } from "@/components/staff/StaffProvider";

const postTypes: PostType[] = [
  "meal",
  "nap",
  "activity",
  "achievement",
  "mood",
  "photo",
  "announcement",
];

type FormErrors = Partial<Record<"audience" | "type" | "content" | "photos", string>>;

export function NewPostModal() {
  const { isComposerOpen, kids, closeComposer, addTemporaryPost } = useStaff();
  const router = useRouter();
  const [audience, setAudience] = useState<PostAudience | null>(null);
  const [type, setType] = useState<PostType | null>(null);
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState<PostPhoto[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstAudienceRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const photo of photosRef.current) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    firstAudienceRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isComposerOpen]);

  if (!isComposerOpen) {
    return null;
  }

  function clearError(key: keyof FormErrors) {
    setErrors((currentErrors) => {
      if (!currentErrors[key]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[key];
      return nextErrors;
    });
  }

  function selectAudience(nextAudience: PostAudience) {
    setAudience(nextAudience);
    clearError("audience");
  }

  function selectType(nextType: PostType) {
    setType(nextType);
    clearError("type");
    if (nextType !== "photo") {
      clearError("photos");
    }
  }

  function updateContent(nextContent: string) {
    setContent(nextContent);
    if (nextContent.trim()) {
      clearError("content");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const nextPhotos: PostPhoto[] = [];
    const nextFileErrors: string[] = [];

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        nextFileErrors.push(`${file.name} no es una imagen.`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        nextFileErrors.push(`${file.name} supera el límite de 10 MB.`);
        continue;
      }

      if (photos.length + nextPhotos.length >= 4) {
        nextFileErrors.push("Podés agregar hasta cuatro imágenes.");
        continue;
      }

      nextPhotos.push({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setPhotos((currentPhotos) => [...currentPhotos, ...nextPhotos]);
    setFileErrors(nextFileErrors);
    if (nextPhotos.length > 0) {
      clearError("photos");
    }
    event.target.value = "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {
      ...(audience ? {} : { audience: "Seleccioná un destinatario." }),
      ...(type ? {} : { type: "Seleccioná un tipo de publicación." }),
      ...(content.trim() ? {} : { content: "Contá cómo le fue hoy." }),
      ...(type === "photo" && photos.length === 0
        ? { photos: "Agregá al menos una imagen para una publicación de foto." }
        : {}),
    };

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !audience || !type) {
      return;
    }

    const firstName = audience.kind === "kid" ? audience.kidName.split(/\s+/)[0] : "Toda la sala";
    const post: Post = {
      id: `temp-post-${crypto.randomUUID()}`,
      type,
      authorName: firstName,
      avatarInitial: audience.kind === "kid" ? firstName.charAt(0) : undefined,
      postedAtLabel: new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date()),
      audienceLabel: audience.kind === "kid" ? `familia de ${firstName}` : "toda la sala",
      content: content.trim(),
      photos,
      likeCount: 0,
      commentCount: 0,
    };

    addTemporaryPost(post);
    setAudience(null);
    setType(null);
    setContent("");
    setPhotos([]);
    setErrors({});
    setFileErrors([]);
    closeComposer();
    router.push("/");
  }

  function removePhoto(photoId: string) {
    setPhotos((currentPhotos) => {
      const photo = currentPhotos.find((currentPhoto) => currentPhoto.id === photoId);
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }

      return currentPhotos.filter((currentPhoto) => currentPhoto.id !== photoId);
    });
  }

  function dismissModal() {
    for (const photo of photosRef.current) {
      URL.revokeObjectURL(photo.previewUrl);
    }

    setAudience(null);
    setType(null);
    setContent("");
    setPhotos([]);
    setErrors({});
    setFileErrors([]);
    closeComposer();
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      dismissModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusableElements?.length) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#3F362E]/45 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          dismissModal();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-post-title"
        onKeyDown={handleKeyDown}
        className="my-auto w-full max-w-[580px] overflow-hidden rounded-[24px] border border-border-soft bg-auth-background shadow-[0_20px_50px_-24px_rgba(63,54,46,.55)]"
      >
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex items-center justify-between border-b border-border-soft px-5 py-5 sm:px-[26px]">
            <button type="button" onClick={dismissModal} className="text-[15px] font-bold text-text-muted">
              Cancelar
            </button>
            <h2 id="new-post-title" className="font-display text-[18px] font-semibold text-foreground">
              Nueva publicación
            </h2>
            <button type="submit" className="text-[15px] font-extrabold text-primary">
              Publicar
            </button>
          </div>

          <div className="space-y-[22px] p-5 sm:p-[26px]">
            <section>
              <h3 className="mb-2.5 text-[12px] font-extrabold tracking-[0.7px] text-text-muted">
                PARA
              </h3>
              <div
                role="group"
                aria-label="Destinatario"
                aria-describedby={errors.audience ? "new-post-audience-error" : undefined}
                className="flex flex-wrap gap-2.5"
              >
                {kids.map((kid) => (
                  <button
                    key={kid.id}
                    ref={kid.id === kids[0]?.id ? firstAudienceRef : undefined}
                    type="button"
                    aria-pressed={audience?.kind === "kid" && audience.kidId === kid.id}
                    onClick={() => selectAudience({ kind: "kid", kidId: kid.id, kidName: kid.name })}
                    className={`flex items-center gap-2 rounded-full border-[1.5px] py-1.5 pr-3.5 pl-1.5 text-[14px] font-bold ${
                      audience?.kind === "kid" && audience.kidId === kid.id
                        ? "border-foreground bg-foreground text-white"
                        : "border-border-soft bg-card text-nav-text"
                    }`}
                  >
                    <span
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
                      style={{ backgroundColor: kid.avatarColor, color: kid.avatarTextColor }}
                    >
                      {kid.name.charAt(0)}
                    </span>
                    {kid.name}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={audience?.kind === "room"}
                  onClick={() => selectAudience({ kind: "room" })}
                  className={`rounded-full border-[1.5px] px-4 py-1.5 text-[14px] font-bold ${
                    audience?.kind === "room"
                      ? "border-foreground bg-foreground text-white"
                      : "border-border-soft bg-card text-nav-text"
                  }`}
                >
                  Toda la sala
                </button>
              </div>
              <FieldError id="new-post-audience-error" message={errors.audience} />
            </section>

            <section>
            <h3 className="mb-2.5 text-[12px] font-extrabold tracking-[0.7px] text-text-muted">
              TIPO
            </h3>
            <div
              role="group"
              aria-label="Tipo de publicación"
              aria-describedby={errors.type ? "new-post-type-error" : undefined}
              className="flex flex-wrap gap-2.5"
            >
              {postTypes.map((postType) => (
                <button
                  key={postType}
                  type="button"
                  aria-pressed={type === postType}
                  onClick={() => selectType(postType)}
                  className={`rounded-full px-4 py-2 text-[13.5px] font-extrabold ${
                    type === postType ? "ring-2 ring-foreground ring-offset-2 ring-offset-auth-background" : ""
                  }`}
                  style={postTypeStyles[postType]}
                >
                  {postTypeLabels[postType]}
                </button>
              ))}
            </div>
            <FieldError id="new-post-type-error" message={errors.type} />
          </section>

            <section>
            <label htmlFor="new-post-content" className="mb-2.5 block text-[12px] font-extrabold tracking-[0.7px] text-text-muted">
              DESCRIPCIÓN
            </label>
            <textarea
              id="new-post-content"
              value={content}
              onChange={(event) => updateContent(event.target.value)}
              placeholder="Contá cómo le fue hoy…"
              aria-invalid={Boolean(errors.content)}
              aria-describedby={errors.content ? "new-post-content-error" : undefined}
              className="min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-auth-input-border bg-white px-4 py-3.5 text-[15px] leading-6 text-foreground outline-none placeholder:text-[#B6A99B] focus:border-primary"
            />
            <FieldError id="new-post-content-error" message={errors.content} />
          </section>

            <section>
            <h3 className="mb-2.5 text-[12px] font-extrabold tracking-[0.7px] text-text-muted">
              FOTOS
            </h3>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative h-24 w-24 overflow-hidden rounded-[14px] border border-border-soft">
                  {/* Local object URLs are intentionally not optimized. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.previewUrl} alt={photo.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    aria-label={`Quitar ${photo.name}`}
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#3F362E]/75 text-[18px] leading-none text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length === 0 ? (
                <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-border-soft bg-photo-bg text-[#CBB89F]">
                  <PhotoIcon />
                </div>
              ) : null}
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-photo-border bg-photo-bg text-photo-fg">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  aria-label="Agregar fotos"
                  className="sr-only"
                />
                <span className="text-[24px] leading-none text-primary-deep">+</span>
                <span className="text-[12px]">Agregar</span>
              </label>
            </div>
            <FieldError id="new-post-photos-error" message={errors.photos} />
            {fileErrors.length > 0 ? (
              <div className="mt-1.5 space-y-1" role="alert">
                {fileErrors.map((message, index) => (
                  <p key={`${message}-${index}`} className="text-[13px] font-bold text-primary">
                    {message}
                  </p>
                ))}
              </div>
            ) : null}
          </section>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1.5 text-[13px] font-bold text-primary">
      {message}
    </p>
  ) : null;
}

function PhotoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}
