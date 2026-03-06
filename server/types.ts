export type TimelineEntryType = 'timeline' | 'album' | 'loose_photo';
export type SpaceVisibility = 'private' | 'public' | 'friends' | 'custom';

export interface TimelineImage {
  id: string;
  imageUrl: string;
  text?: string;
}

export interface CoverFocus {
  x: number;
  y: number;
}

export interface AvatarFocus {
  x: number;
  y: number;
  scale: number;
}

export interface TimelineEntry {
  id: string;
  title: string;
  date: string;
  description?: string;
  images: TimelineImage[];
  coverFocus?: CoverFocus;
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
  avatarFocus: AvatarFocus;
  heroImage: string;
  description: string;
  visibility?: SpaceVisibility;
  entries: TimelineEntry[];
  treeholeEntries: TreeholeEntry[];
}

export interface CreateSpaceInput {
  name: string;
  avatarImage: string;
  avatarFocus?: AvatarFocus;
  heroImage?: string;
  description?: string;
  visibility?: SpaceVisibility;
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarImage?: string;
}
