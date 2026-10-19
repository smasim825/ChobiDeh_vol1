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
