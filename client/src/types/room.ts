export interface RoomMember {
  id: string;
  name: string;
  avatar: string;
}

export interface Room {
  id: string;
  title: string;
  category: string;
  badge: {
    label: string;
    type: 'new' | 'shared' | 'weekend' | 'custom';
  };
  photoCount: number;
  updatedAt: string;
  coverImage: string;
  altText: string;
  members: RoomMember[];
  extraMemberCount: number;
}

// ==========================================
// Three-Level Photo Matching & Grouping Types
// ==========================================

export type ClusterLevel = 'Level 1: Confident' | 'Level 2: Uncertain' | 'Level 3: Rest';

export type RestPhotoCategory = 'unknown_faces' | 'no_people' | 'other_unassigned';

export interface CandidatePerson {
  clusterId: string;
  name: string;
  similarityScore: number;
}

export interface ReviewSuggestion {
  id: string;
  photoId: string;
  photoUrl: string;
  suggestedPerson: {
    clusterId: string;
    name: string;
    similarityScore: number;
  };
  candidatePeople: CandidatePerson[];
  status: 'pending' | 'confirmed' | 'rejected' | 'corrected';
  resolvedToPerson?: {
    clusterId: string;
    name: string;
  };
}

export interface PhotoItem {
  id: string;
  url: string;
  alt: string;
  aspect: string;
  time: string;
  // Level 1: Multi-person support! A photo can reference multiple people
  assignedPeople: string[];
  clusterLevel: ClusterLevel;
  // Level 3: Rest Photos categorization
  restCategory?: RestPhotoCategory;
  detectedFaceCount: number;
  badge?: string;
}

export interface AssignmentHistoryEntry {
  id: string;
  photoId: string;
  previousPerson?: string;
  newPerson?: string;
  action: 'assign' | 'correct' | 'reject' | 'undo';
  performedAt: string;
}
