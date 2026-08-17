import type { PostPhoto } from "@/app/lib/posts";

interface PostPhotoGridProps {
  photos: PostPhoto[];
}

export function PostPhotoGrid({ photos }: PostPhotoGridProps) {
  const isSinglePhoto = photos.length === 1;

  return (
    <div className={`mt-4 overflow-hidden rounded-[14px] ${isSinglePhoto ? "block" : "grid grid-cols-2 gap-1.5"}`}>
      {photos.map((photo) => (
        <div key={photo.id} className={isSinglePhoto ? "aspect-[16/9]" : "aspect-square"}>
          {/* Local object URLs are intentionally not optimized. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.previewUrl} alt={photo.name} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
