"use client";

import { postTypeLabels, postTypeStyles, type PostType } from "@/app/lib/posts";
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

export function NewPostModal() {
  const { isComposerOpen, kids } = useStaff();

  if (!isComposerOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#3F362E]/45 p-4 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-post-title"
        className="my-auto w-full max-w-[580px] overflow-hidden rounded-[24px] border border-border-soft bg-auth-background shadow-[0_20px_50px_-24px_rgba(63,54,46,.55)]"
      >
        <div className="flex items-center justify-between border-b border-border-soft px-5 py-5 sm:px-[26px]">
          <button type="button" className="text-[15px] font-bold text-text-muted">
            Cancelar
          </button>
          <h2 id="new-post-title" className="font-display text-[18px] font-semibold text-foreground">
            Nueva publicación
          </h2>
          <button type="button" className="text-[15px] font-extrabold text-primary">
            Publicar
          </button>
        </div>

        <div className="space-y-[22px] p-5 sm:p-[26px]">
          <section>
            <h3 className="mb-2.5 text-[12px] font-extrabold tracking-[0.7px] text-text-muted">
              PARA
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  type="button"
                  className="flex items-center gap-2 rounded-full border-[1.5px] border-border-soft bg-card py-1.5 pr-3.5 pl-1.5 text-[14px] font-bold text-nav-text"
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
                className="rounded-full border-[1.5px] border-border-soft bg-card px-4 py-1.5 text-[14px] font-bold text-nav-text"
              >
                Toda la sala
              </button>
            </div>
          </section>

          <section>
            <h3 className="mb-2.5 text-[12px] font-extrabold tracking-[0.7px] text-text-muted">
              TIPO
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {postTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className="rounded-full px-4 py-2 text-[13.5px] font-extrabold"
                  style={postTypeStyles[type]}
                >
                  {postTypeLabels[type]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label htmlFor="new-post-content" className="mb-2.5 block text-[12px] font-extrabold tracking-[0.7px] text-text-muted">
              DESCRIPCIÓN
            </label>
            <textarea
              id="new-post-content"
              placeholder="Contá cómo le fue hoy…"
              className="min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-auth-input-border bg-white px-4 py-3.5 text-[15px] leading-6 text-foreground outline-none placeholder:text-[#B6A99B] focus:border-primary"
            />
          </section>

          <section>
            <h3 className="mb-2.5 text-[12px] font-extrabold tracking-[0.7px] text-text-muted">
              FOTOS
            </h3>
            <div className="flex gap-3">
              <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-border-soft bg-photo-bg text-[#CBB89F]">
                <PhotoIcon />
              </div>
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-photo-border bg-photo-bg text-photo-fg">
                <input type="file" accept="image/*" className="sr-only" />
                <span className="text-[24px] leading-none text-primary-deep">+</span>
                <span className="text-[12px]">Agregar</span>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
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
