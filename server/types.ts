export type TimelineEntryType = 'timeline' | 'album' | 'loose_photo';

export interface TimelineImage {
  id: string;
  imageUrl: string;
  text?: string;
}

export interface TimelineEntry {
  id: string;
  title: string;
  date: string;
  description?: string;
  images: TimelineImage[];
  rotation: number;
  type?: TimelineEntryType;
}

export interface TreeholeEntry {
  id: string;
  date: string;
  text: string;
  color: string;
  rotation: number;
}

export interface Space {
  id: string;
  name: string;
  avatarImage: string;
  heroImage: string;
  description: string;
  entries: TimelineEntry[];
  treeholeEntries: TreeholeEntry[];
}

export interface CreateSpaceInput {
  name: string;
  avatarImage: string;
  heroImage?: string;
  description?: string;
}
