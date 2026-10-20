import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import type { Room } from '../types/room';
import { supabase } from '../lib/supabase';

const INITIAL_ROOMS: Room[] = [
  {
    id: 'room_coxsbazar_01',
    title: "Cox's Bazar Trip",
    category: 'Coastal Trip',
    badge: { label: 'New', type: 'new' },
    photoCount: 142,
    updatedAt: 'Updated 2h ago',
    coverImage:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    altText:
      "Vibrant panoramic view of Cox's Bazar beach at golden sunset with warm reflections on ocean tides.",
    members: [
      {
        id: 'm1',
        name: 'Amina',
        avatar: '',
      },
    ],
    extraMemberCount: 1,
  },
  {
    id: 'room_univ_02',
    title: 'University Memories',
    category: 'Campus & Reunion',
    badge: { label: 'Shared Room', type: 'shared' },
    photoCount: 384,
    updatedAt: 'Updated yesterday',
    coverImage:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    altText:
      'Candid group photograph of university friends laughing together outdoors on a lush green campus lawn.',
    members: [
      {
        id: 'm4',
        name: 'Farzana',
        avatar: '',
      },
    ],
    extraMemberCount: 4,
  },
];

export const HomeScreen: React.FC = () => {
  const { currentUser, logout, updateBiometricConsent, setScreen } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDemoData, setIsDemoData] = useState(false);
  const [activeNav, setActiveNav] = useState<'rooms' | 'gallery' | 'people' | 'review'>('rooms');
  const [showAiBanner, setShowAiBanner] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form states for modals
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRooms = async () => {
      if (!currentUser || !supabase) {
        if (import.meta.env.DEV && isMounted) {
          setRooms(INITIAL_ROOMS);
          setIsDemoData(true);
        }
        return;
      }

      try {
        const { data: memberRooms, error: memberErr } = await supabase
          .from('room_members')
          .select('room_id, role, rooms(id, name, created_at, join_slug, face_clustering_enabled)');

        if (memberErr || !memberRooms || memberRooms.length === 0) {
          if (import.meta.env.DEV && isMounted) {
            setRooms(INITIAL_ROOMS);
            setIsDemoData(true);
          } else if (isMounted) {
            setRooms([]);
            setIsDemoData(false);
          }
        } else if (isMounted) {
          const loaded: Room[] = memberRooms
            .filter((rm: any) => rm.rooms)
            .map((rm: any) => ({
              id: rm.rooms.id,
              title: rm.rooms.name,
              category: 'Shared Album',
              badge: { label: rm.role === 'owner' ? 'Host' : 'Member', type: 'shared' },
              photoCount: 0,
              updatedAt: new Date(rm.rooms.created_at).toLocaleDateString(),
              coverImage:
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
              altText: rm.rooms.name,
              members: [
                {
                  id: currentUser.id,
                  name: currentUser.name,
                  avatar: '',
                },
              ],
              extraMemberCount: 0,
            }));
          setRooms(loaded);
          setIsDemoData(false);
        }
      } catch {
        if (import.meta.env.DEV && isMounted) {
          setRooms(INITIAL_ROOMS);
          setIsDemoData(true);
        }
      }
    };

    fetchRooms();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;

    setCreateError(null);
    setIsSubmitting(true);
    try {
      if (!supabase) {
        if (import.meta.env.DEV) {
          const newRoom: Room = {
            id: 'room_' + Math.random().toString(36).substring(2, 8),
            title: newRoomTitle.trim(),
            category: newRoomCategory.trim() || 'Shared Album',
            badge: { label: 'New', type: 'new' },
            photoCount: 0,
            updatedAt: 'Just now',
            coverImage:
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            altText: newRoomTitle.trim(),
            members: [
              {
                id: currentUser?.id || 'creator',
                name: currentUser?.name || 'Creator',
                avatar: '',
              },
            ],
            extraMemberCount: 0,
          };
          setRooms((prev) => [newRoom, ...prev]);
          setShowCreateModal(false);
          setNewRoomTitle('');
          setNewRoomCategory('');
          setNewRoomPassword('');
          setActionFeedback(`Room "${newRoom.title}" created successfully!`);
          setTimeout(() => setActionFeedback(null), 3500);
        } else {
          setCreateError('Supabase is not configured.');
        }
        return;
      }

      const { data, error } = await supabase.rpc('create_room', {
        room_name: newRoomTitle.trim(),
        passcode: newRoomPassword.trim() || null,
      });

      if (error || !data) {
        setCreateError(error?.message || 'Failed to create room. Please try again.');
        return;
      }

      setShowCreateModal(false);
      const title = newRoomTitle.trim();
      setNewRoomTitle('');
      setNewRoomCategory('');
      setNewRoomPassword('');
      setActionFeedback(`Room "${title}" created successfully!`);
      setTimeout(() => setActionFeedback(null), 3500);

      const { data: memberRooms } = await supabase
        .from('room_members')
        .select('room_id, role, rooms(id, name, created_at, join_slug, face_clustering_enabled)');
      if (memberRooms && memberRooms.length > 0) {
        const loaded: Room[] = memberRooms
          .filter((rm: any) => rm.rooms)
          .map((rm: any) => ({
            id: rm.rooms.id,
            title: rm.rooms.name,
            category: 'Shared Album',
            badge: { label: rm.role === 'owner' ? 'Host' : 'Member', type: 'shared' },
            photoCount: 0,
            updatedAt: new Date(rm.rooms.created_at).toLocaleDateString(),
            coverImage:
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            altText: rm.rooms.name,
            members: [
              {
                id: currentUser?.id || 'creator',
                name: currentUser?.name || 'Creator',
                avatar: '',
              },
            ],
            extraMemberCount: 0,
          }));
        setRooms(loaded);
        setIsDemoData(false);
      }
    } catch (err: any) {
      setCreateError(err?.message || 'An unexpected error occurred while creating room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinError(null);
    setIsSubmitting(true);
    try {
      if (!supabase) {
        if (import.meta.env.DEV) {
          setShowJoinModal(false);
          setJoinCode('');
          setJoinPassword('');
          setActionFeedback(`Joined room successfully! Loading shared memories...`);
          setTimeout(() => setActionFeedback(null), 3500);
        } else {
          setJoinError('Supabase is not configured.');
        }
        return;
      }

      const { data, error } = await supabase.rpc('join_room', {
        slug: joinCode.trim().toLowerCase(),
        passcode: joinPassword.trim() || null,
      });

      if (error || !data) {
        setJoinError(error?.message || 'Unable to join room. Please check the code and passcode.');
        return;
      }

      setShowJoinModal(false);
      setJoinCode('');
      setJoinPassword('');
      setActionFeedback(`Joined room successfully! Loading shared memories...`);
      setTimeout(() => setActionFeedback(null), 3500);

      const { data: memberRooms } = await supabase
        .from('room_members')
        .select('room_id, role, rooms(id, name, created_at, join_slug, face_clustering_enabled)');
      if (memberRooms && memberRooms.length > 0) {
        const loaded: Room[] = memberRooms
          .filter((rm: any) => rm.rooms)
          .map((rm: any) => ({
            id: rm.rooms.id,
            title: rm.rooms.name,
            category: 'Shared Album',
            badge: { label: rm.role === 'owner' ? 'Host' : 'Member', type: 'shared' },
            photoCount: 0,
            updatedAt: new Date(rm.rooms.created_at).toLocaleDateString(),
            coverImage:
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
            altText: rm.rooms.name,
            members: [
              {
                id: currentUser?.id || 'creator',
                name: currentUser?.name || 'Creator',
                avatar: '',
              },
            ],
            extraMemberCount: 0,
          }));
        setRooms(loaded);
        setIsDemoData(false);
      }
    } catch (err: any) {
      setJoinError(err?.message || 'Unable to join room. Please check the code and passcode.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#EDFDF9] text-[#101E1C] font-sans min-h-screen flex flex-col antialiased pb-28 selection:bg-[#005C55] selection:text-white">
      {/* Top App Bar */}
      <header className="bg-[#EDFDF9]/85 backdrop-blur-md text-[#005C55] sticky top-0 z-40 shadow-xs border-b border-[#D6E6E2]/40">
        <div className="flex justify-between items-center w-full px-4 h-14 max-w-lg mx-auto">
          {/* Leading Brand Anchor */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F766E] flex items-center justify-center text-white shadow-xs relative">
              <div className="w-5 h-5 rounded-full border-2 border-white/90 border-dashed flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#FFAB69]" />
              </div>
            </div>
            <span className="text-[20px] font-bold text-[#005C55] tracking-tight">
              Chobi<span className="text-[#0F766E]">Deh</span>
            </span>
          </div>

          {/* Trailing Action Icons */}
          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => alert('Notifications: All background facial grouping tasks up to date.')}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#3E4947] hover:bg-[#E1F1EE] active:scale-95 transition-all focus:outline-none"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#8E4E14]" />
            </button>

            {/* Profile Avatar Button */}
            <button
              type="button"
              aria-label="User Profile"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="relative pl-1 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full ring-2 ring-[#005C55]/20 overflow-hidden bg-[#D6E6E2] flex items-center justify-center">
                <img
                  className="w-full h-full object-cover"
                  alt={currentUser?.name || 'User profile'}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOywiE7V8t1qbeeXpXX6gvjcINY4_kmN-zdjgJvvP1hXImASFvuTOFsRkiHZWFlA3PVsZanagfSZuBuf0KUkaw0hxUedCOLenmHwF-qw2uNb4Z-VeBclVtL0XyAXnmbcSCMUtnwp7VchVrs2ByLde60XhJe1cdhCgAsMywV-uDbPqIwEApa-hT4ExnW1mvbv54XLy2DE6IOmtKkWtXlAAldMBpNKtzedQQ48UCGGM6PzgmAn5oVnuL"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#007952] ring-2 ring-white" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-dock border border-[#E6E1D8] p-4 z-50 animate-fadeIn text-left">
                <div className="pb-3 border-b border-[#E6E1D8]">
                  <p className="text-[14px] font-bold text-[#101E1C] truncate">
                    {currentUser?.name || 'ChobiDeh Member'}
                  </p>
                  <p className="text-[12px] text-[#6E7977] truncate">
                    {currentUser?.email || 'member@example.com'}
                  </p>
                </div>

                <div className="py-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#3E4947]">3-Level Clustering:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        currentUser?.biometricConsent
                          ? 'bg-[#E7F7F4] text-[#0F766E]'
                          : 'bg-[#FFDAD6] text-[#93000A]'
                      }`}
                    >
                      {currentUser?.biometricConsent ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateBiometricConsent(!currentUser?.biometricConsent);
                    }}
                    className="w-full text-left text-[12px] text-[#0F766E] font-medium hover:underline pt-1"
                  >
                    {currentUser?.biometricConsent
                      ? 'Disable Face Clustering'
                      : 'Enable 3-Level Face Clustering'}
                  </button>
                </div>

                <div className="pt-2 border-t border-[#E6E1D8] space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setScreen('profile');
                    }}
                    className="w-full py-1.5 text-center text-[12px] font-bold text-[#005C55] hover:bg-[#E7F7F4] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">account_circle</span>
                    <span>View Full Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full py-1.5 text-center text-[12px] font-bold text-[#BA1A1A] hover:bg-[#FFDAD6]/30 rounded-lg transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="w-full max-w-lg mx-auto px-4 pt-3 flex flex-col gap-5">
        {/* Feedback Alert Toast */}
        {actionFeedback && (
          <div
            role="status"
            className="w-full p-3 bg-[#E7F7F4] border border-[#0F766E]/30 rounded-xl text-[13px] text-[#005C55] font-semibold flex items-center gap-2 animate-fadeIn"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Subtle AI Activity Banner */}
        {showAiBanner && (
          <div className="w-full bg-[#E7F7F4] rounded-xl p-3 flex items-center justify-between shadow-xs border border-[#BDC9C6]/30 transition-all hover:bg-[#E1F1EE]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#005C55]/10 text-[#005C55] flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FFAB69] animate-pulse" />
                  <p className="text-[11px] font-bold text-[#005C55] tracking-wide uppercase">
                    3-LEVEL AI CLUSTERING ACTIVE
                  </p>
                </div>
                <p className="text-[13px] text-[#253331] font-medium truncate">
                  4 anonymous person clusters • 2 uncertain matches to review
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const coxRoom = rooms.find((r) => r.id === 'room_coxsbazar_01');
                  if (coxRoom) setSelectedRoom(coxRoom);
                }}
                className="text-[13px] font-bold text-[#005C55] hover:underline active:scale-95 transition-transform"
              >
                View
              </button>
              <button
                type="button"
                aria-label="Dismiss banner"
                onClick={() => setShowAiBanner(false)}
                className="text-[#3E4947] hover:text-[#101E1C] p-1"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Hero Greeting & Core Room Actions */}
        <section className="flex flex-col gap-3.5 pt-1">
          <div>
            <h1 className="text-[24px] sm:text-[26px] font-bold text-[#253331] tracking-tight">
              Ready for your next memory?
            </h1>
            <p className="text-[14px] text-[#3E4947]">
              All your favorite moments, together.
            </p>
          </div>

          {/* Action Buttons Row (Standardized 48-52px height, 16px semi-bold, rounded-full) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Primary CTA: Create a Room */}
            <button
              type="button"
              onClick={() => setScreen('create-room')}
              className="min-h-[48px] h-[50px] flex items-center justify-center gap-2 bg-[#0F766E] text-white px-4 rounded-full font-semibold text-[15px] sm:text-[16px] shadow-sm hover:bg-[#0D645E] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Create a Room</span>
            </button>

            {/* Secondary CTA: Join a Room */}
            <button
              type="button"
              onClick={() => setScreen('join-room')}
              className="min-h-[48px] h-[50px] flex items-center justify-center gap-2 bg-white text-[#005C55] border border-[#0F766E]/30 px-4 rounded-full font-semibold text-[15px] sm:text-[16px] shadow-xs hover:bg-[#E7F7F4] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">group_add</span>
              <span>Join a Room</span>
            </button>
          </div>
        </section>

        {/* Section 1: "Your Memories" (Shared Rooms) */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#253331]">Your Memories</h2>
              {isDemoData && (
                <span className="text-[11px] font-bold bg-[#FFAB69]/20 text-[#8E4E14] px-2 py-0.5 rounded-full border border-[#FFAB69]/40">
                  Demo data
                </span>
              )}
              <span className="text-[11px] font-bold bg-[#E1F1EE] text-[#3E4947] px-2 py-0.5 rounded-full">
                {rooms.length} active
              </span>
            </div>
            <button
              type="button"
              onClick={() => alert(`Showing all ${rooms.length} active memory rooms.`)}
              className="text-[13px] font-bold text-[#005C55] hover:text-[#0F766E] transition-colors"
            >
              See all ({rooms.length})
            </button>
          </div>

          {/* Shared Rooms List */}
          <div className="flex flex-col gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="relative bg-white rounded-xl overflow-hidden shadow-xs border border-[#BDC9C6]/30 hover:shadow-md transition-shadow group"
              >
                {/* Room Cover Image with Gradient */}
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={room.coverImage}
                    alt={room.altText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#253331]/90 via-[#253331]/30 to-transparent" />

                  {/* Badges overlay Top */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 ${
                        room.badge.type === 'new'
                          ? 'bg-[#8E4E14] text-white'
                          : room.badge.type === 'shared'
                          ? 'bg-[#005C55]/85 backdrop-blur-md text-white'
                          : 'bg-[#EDFDF9]/90 backdrop-blur-md text-[#005C55] border border-[#005C55]/20'
                      }`}
                    >
                      {room.badge.type === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      {room.badge.type === 'shared' && (
                        <span className="material-symbols-outlined text-[13px]">lock_open</span>
                      )}
                      <span>{room.badge.label}</span>
                    </span>

                    <span className="bg-[#253331]/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/20">
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                      <span>{room.photoCount} photos</span>
                    </span>
                  </div>

                  {/* Content overlay Bottom */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-[#FFDCC4] tracking-wide uppercase">
                        {room.category}
                      </p>
                      <h3 className="text-[18px] text-white font-bold tracking-tight">
                        {room.title}
                      </h3>
                    </div>
                    <span className="text-[12px] text-[#D6E6E2] font-medium">{room.updatedAt}</span>
                  </div>
                </div>

                {/* Bottom Room Card Tray: Members & Actions */}
                <div className="p-3 flex items-center justify-between bg-white">
                  {/* Member Avatars Stack */}
                  <div className="flex items-center">
                    <div className="flex -space-x-2 overflow-hidden items-center pr-2">
                      {room.members.map((member) => (
                        <div
                          key={member.id}
                          className="inline-block h-7 w-7 rounded-full ring-2 ring-white overflow-hidden"
                          title={member.name}
                        >
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      {room.extraMemberCount > 0 && (
                        <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-[#D6E6E2] text-[#3E4947] text-[11px] flex items-center justify-center font-bold">
                          +{room.extraMemberCount}
                        </div>
                      )}
                    </div>
                    <span className="text-[12px] text-[#3E4947] font-medium">
                      {room.members.length + room.extraMemberCount} members
                    </span>
                  </div>

                  {/* Quick Action */}
                  <button
                    type="button"
                    onClick={() => setScreen('room-area')}
                    className="flex items-center gap-1 text-[#005C55] hover:text-[#0F766E] text-[13px] font-bold pl-2 focus:outline-none"
                  >
                    <span>Open</span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Recently Added Photos Carousel */}
        <section className="flex flex-col gap-2.5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-[#253331]">Recently Added Moments</h2>
            <span className="text-[12px] text-[#6E7977]">From your active rooms</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {rooms.map((room) => (
              <div
                key={'thumb_' + room.id}
                onClick={() => setSelectedRoom(room)}
                className="shrink-0 w-32 h-32 rounded-xl overflow-hidden relative cursor-pointer group border border-[#E6E1D8]"
              >
                <img
                  src={room.coverImage}
                  alt={room.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />
                <span className="absolute bottom-1.5 left-2 right-2 text-[11px] font-bold text-white truncate">
                  {room.title}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Modal: Create a Room */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-dock border border-[#E6E1D8]">
            <div className="w-12 h-12 rounded-2xl bg-[#E7F7F4] text-[#005C55] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
            </div>
            <h3 className="text-[18px] font-bold text-[#101E1C] mb-1">Create New Shared Room</h3>
            <p className="text-[13px] text-[#3E4947] mb-4">
              Invite friends to a secure, private room. Photos uploaded here will be organized with your permission.
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-3.5">
              {createError && (
                <div className="p-2.5 rounded-xl bg-[#FFDAD6] text-[#93000A] text-[12px] font-medium">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-[12px] font-semibold text-[#101E1C] mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sajek Valley Trek 2026"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#BDC9C6] text-[13px] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#101E1C] mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nature Trip / Family / Event"
                  value={newRoomCategory}
                  onChange={(e) => setNewRoomCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#BDC9C6] text-[13px] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#101E1C] mb-1">
                  Joining Secret / Passcode
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#BDC9C6] text-[13px] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
                />
                <span className="text-[11px] text-[#6E7977] mt-0.5 block">
                  Encrypted on server. Never stored or logged in plaintext.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#BDC9C6] text-[13px] font-semibold text-[#3E4947] hover:bg-[#E1F1EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-full bg-[#0F766E] text-white text-[13px] font-semibold hover:bg-[#005C55] shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Join a Room */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-dock border border-[#E6E1D8]">
            <div className="w-12 h-12 rounded-2xl bg-[#E7F7F4] text-[#005C55] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">group_add</span>
            </div>
            <h3 className="text-[18px] font-bold text-[#101E1C] mb-1">Join a Shared Room</h3>
            <p className="text-[13px] text-[#3E4947] mb-4">
              Enter the unique Room ID and passcode shared by your trip host.
            </p>

            <form onSubmit={handleJoinRoom} className="space-y-3.5">
              {joinError && (
                <div className="p-2.5 rounded-xl bg-[#FFDAD6] text-[#93000A] text-[12px] font-medium">
                  {joinError}
                </div>
              )}
              <div>
                <label className="block text-[12px] font-semibold text-[#101E1C] mb-1">
                  Room ID / Invite Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. COX-8492"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#BDC9C6] text-[13px] uppercase tracking-wider focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#101E1C] mb-1">
                  Room Secret / Passcode
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#BDC9C6] text-[13px] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#BDC9C6] text-[13px] font-semibold text-[#3E4947] hover:bg-[#E1F1EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-full bg-[#0F766E] text-white text-[13px] font-semibold hover:bg-[#005C55] shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Room Detail Preview Drawer */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-dock border border-[#E6E1D8]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D8]">
              <div>
                <span className="text-[11px] font-bold text-[#8E4E14] uppercase tracking-wide">
                  {selectedRoom.category}
                </span>
                <h3 className="text-[20px] font-bold text-[#101E1C]">{selectedRoom.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="w-8 h-8 rounded-full bg-[#E1F1EE] flex items-center justify-center text-[#3E4947]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="my-4">
              <img
                src={selectedRoom.coverImage}
                alt={selectedRoom.title}
                className="w-full h-48 object-cover rounded-xl mb-3 shadow-xs"
              />
              <div className="flex items-center justify-between text-[13px] text-[#3E4947] py-1">
                <span>{selectedRoom.photoCount} photos organized</span>
                <span>{selectedRoom.updatedAt}</span>
              </div>
            </div>

            <div className="bg-[#E7F7F4] rounded-xl p-3 mb-4 text-[13px] text-[#005C55] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>All room media is strictly isolated to authorized members only.</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => alert(`Upload photo action triggered for ${selectedRoom.title}`)}
                className="flex-1 py-3 bg-[#0F766E] text-white rounded-full text-[13px] font-bold hover:bg-[#005C55] shadow-xs flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                <span>Upload Photos</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="py-3 px-5 border border-[#BDC9C6] text-[#3E4947] rounded-full text-[13px] font-semibold hover:bg-[#E1F1EE]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar (Shared Component Anchor) */}
      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 py-2 border-t bg-white/90 backdrop-blur-lg border-[#BDC9C6]/40 shadow-lg">
        <div className="w-full max-w-lg mx-auto flex justify-around items-center">
          {/* Nav Item 1: Rooms (ACTIVE) */}
          <button
            type="button"
            onClick={() => setActiveNav('rooms')}
            className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 active:scale-95 ${
              activeNav === 'rooms' ? 'text-[#005C55] font-bold' : 'text-[#3E4947]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: activeNav === 'rooms' ? "'FILL' 1" : "'FILL' 0" }}
            >
              photo_library
            </span>
            <span className="text-[11px] font-medium mt-0.5">Rooms</span>
          </button>

          {/* Nav Item 2: Gallery */}
          <button
            type="button"
            onClick={() => {
              setActiveNav('gallery');
              alert('Gallery view: Showing curated photo collection for Cox’s Bazar & University memories.');
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 active:scale-95 ${
              activeNav === 'gallery' ? 'text-[#005C55] font-bold' : 'text-[#3E4947]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">grid_view</span>
            <span className="text-[11px] font-medium mt-0.5">Gallery</span>
          </button>

          {/* Nav Item 3: People */}
          <button
            type="button"
            onClick={() => {
              setActiveNav('people');
              alert('People Collections: Face grouping runs on our servers only if you opt in.');
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 active:scale-95 ${
              activeNav === 'people' ? 'text-[#005C55] font-bold' : 'text-[#3E4947]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">group</span>
            <span className="text-[11px] font-medium mt-0.5">People</span>
          </button>

          {/* Nav Item 4: Review */}
          <button
            type="button"
            onClick={() => {
              setActiveNav('review');
              alert('Review & Suggestions: Level 2 contextual photo match review.');
            }}
            className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 active:scale-95 ${
              activeNav === 'review' ? 'text-[#005C55] font-bold' : 'text-[#3E4947]'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">fact_check</span>
            <span className="text-[11px] font-medium mt-0.5">Review</span>
          </button>

          {/* Nav Item 5: Profile */}
          <button
            type="button"
            onClick={() => setScreen('profile')}
            className="flex flex-col items-center justify-center py-1 text-[#3E4947] hover:text-[#005C55] transition-colors duration-150 active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">person</span>
            <span className="text-[11px] font-medium mt-0.5">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
