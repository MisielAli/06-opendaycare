import { requireStaff } from "@/app/lib/auth";
import { FeedPageContent } from "@/components/feed/FeedPageContent";

export default async function FeedPage() {
  await requireStaff("/");

  return <FeedPageContent />;
}
