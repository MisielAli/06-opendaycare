"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type Kid } from "@/app/lib/kids-shared";
import { type Post } from "@/app/lib/posts";

interface StaffContextValue {
  kids: Kid[];
  temporaryPosts: Post[];
  lastPublishedPostId: string | null;
  isComposerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
  addTemporaryPost: (post: Post) => void;
}

const StaffContext = createContext<StaffContextValue | null>(null);

interface StaffProviderProps {
  kids: Kid[];
  children: ReactNode;
}

export function StaffProvider({ kids, children }: StaffProviderProps) {
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

  function addTemporaryPost(post: Post) {
    setTemporaryPosts((currentPosts) => [post, ...currentPosts]);
    setLastPublishedPostId(post.id);
  }

  return (
    <StaffContext.Provider
      value={{
        kids,
        temporaryPosts,
        lastPublishedPostId,
        isComposerOpen,
        openComposer,
        closeComposer,
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
