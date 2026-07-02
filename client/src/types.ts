export type MuseumSource = "met" | "artic";

export interface Artwork {
  source: MuseumSource;
  sourceId: string;
  title: string;
  artist: string;
  date: string;
  yearStart?: number | null;
  yearEnd?: number | null;
  medium: string;
  culture?: string;
  department?: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl: string;
  museumName: string;
  museumUrl: string;
  isPublicDomain: boolean;
  creditLine?: string;
  rights?: string;
}

export interface ArtworkSnapshot {
  source: MuseumSource;
  sourceId: string;
  title: string;
  artist: string;
  date: string;
  medium: string;
  imageUrl: string;
  thumbnailUrl: string;
  museumName: string;
  museumUrl: string;
  isPublicDomain: boolean;
  creditLine: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Favorite {
  _id: string;
  artwork: ArtworkSnapshot;
  createdAt: string;
}

export interface CollectionItem {
  _id?: string;
  artwork: ArtworkSnapshot;
  curatorNote: string;
  position: number;
}

export interface Collection {
  _id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  description: string;
  isPublic: boolean;
  slug: string;
  items: CollectionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    warnings?: string[];
  };
}
