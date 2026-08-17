type AvatarVariant =
  | "warm"
  | "blue"
  | "indigo"
  | "meal"
  | "nap"
  | "mood"
  | "photo";

interface AvatarProps {
  variant?: AvatarVariant;
  initial?: string;
  size?: number;
}

const variantClasses: Record<AvatarVariant, string> = {
  warm: "bg-avatar-warm text-white",
  blue: "bg-avatar-blue-bg text-avatar-blue-fg",
  indigo: "bg-avatar-indigo-bg text-avatar-indigo-fg",
  meal: "bg-[#F4DC8E] text-[#9A7B1E]",
  nap: "bg-[#C9B6E8] text-[#7B5FC0]",
  mood: "bg-[#F4B8CC] text-[#C44A7A]",
  photo: "bg-[#FBD8CC] text-[#D9684A]",
};

export function Avatar({ variant = "warm", initial, size = 44 }: AvatarProps) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-display font-semibold ${variantClasses[variant]}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.385),
      }}
    >
      {initial ?? (
        <svg
          width={size * 0.45}
          height={size * 0.45}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      )}
    </div>
  );
}
