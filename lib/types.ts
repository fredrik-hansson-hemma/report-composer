export interface Report {
  id: string;
  title: string;
  content: BlockNoteBlock[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
}

// Simplified BlockNote block shape used in the store
export interface BlockNoteBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content: unknown[];
  children: BlockNoteBlock[];
}
