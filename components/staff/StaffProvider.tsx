"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { kids, type Kid, type TempKid } from "@/app/lib/kids";
import { type Post } from "@/app/lib/posts";

interface StaffContextValue {
  kids: Kid[];
  temporaryKids: TempKid[];
  temporaryPosts: Post[];
  lastPublishedPostId: string | null;
  isComposerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
  addTemporaryKid: (kid: TempKid) => void;
  addTemporaryPost: (post: Post) => void;
}

const StaffContext = createContext<StaffContextValue | null>(null);

interface StaffProviderProps {
  children: ReactNode;
}

export function StaffProvider({ children }: StaffProviderProps) {
  const [temporaryKids, setTemporaryKids] = useState<TempKid[]>([]);
  const [temporaryPosts, setTemporaryPosts] = useState<Post[]>([]);
  const [lastPublishedPostId, setLastPublishedPostId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const temporaryPostsRef = useRef(temporaryPosts);

  useEffect(() => {
    temporaryPostsRef.current = temporaryPosts;
  }, [temporaryPosts]);

  useEffect(() => {
    return () => {
      for (const post of temporaryPostsRef.current) {
        for (const photo of post.photos ?? []) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      }
    };
  }, []);

  function openComposer() {
    setIsComposerOpen(true);
  }

  function closeComposer() {
    setIsComposerOpen(false);
  }

  function addTemporaryKid(kid: TempKid) {
    setTemporaryKids((currentKids) => [kid, ...currentKids]);
  }

  function addTemporaryPost(post: Post) {
    setTemporaryPosts((currentPosts) => [post, ...currentPosts]);
    setLastPublishedPostId(post.id);
  }

  return (
    <StaffContext.Provider
      value={{
        kids: [...temporaryKids, ...kids],
        temporaryKids,
        temporaryPosts,
        lastPublishedPostId,
        isComposerOpen,
        openComposer,
        closeComposer,
        addTemporaryKid,
        addTemporaryPost,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);

  if (!context) {
    throw new Error("useStaff must be used within a StaffProvider");
  }

  return context;
}
