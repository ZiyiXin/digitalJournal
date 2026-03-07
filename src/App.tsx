import React, { useCallback, useRef, useState } from 'react';
import {
  Plus,
  X,
  Image as ImageIcon,
  Calendar,
  ChevronDown,
  MessageSquare,
  Clock,
  Camera,
  Star,
  MapPin,
  Heart,
  Sparkles,
  ImagePlus,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ArrowLeft,
  Palette,
  Pencil,
  Trash2,
  Move,
  Users,
  Database,
  Images,
  HardDrive,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import {
  createSpace,
  deleteSpace,
  fetchAdminDashboard,
  fetchMe,
  fetchSpaces,
  isApiError,
  login,
  logout,
  changePassword,
  register,
  saveSpaceSnapshot,
  updateSpaceMeta,
  uploadImage,
} from './lib/api';
import type {AdminDashboardStats, AvatarFocus, Space, TimelineEntry, TreeholeEntry, User} from './types';

// --- Themes ---
export type ThemeName = 'default' | 'anime' | 'scifi' | 'retro' | 'fantasy' | 'cinema';

export const THEMES = {
  default: {
    name: 'default',
    globalBg: 'bg-[#F9F8F6]',
    headerBg: 'from-stone-200/50 to-[#F9F8F6]',
    textMain: 'text-stone-800',
    textMuted: 'text-stone-500',
    accent: 'text-pink-400',
    borderAccent: 'border-pink-400',
    bgAccent: 'bg-pink-400',
    cardBg: 'bg-white',
    cardBorder: 'border-stone-200/60',
    cardShadow: 'shadow-sm',
    radius: 'rounded-sm',
    fontMain: 'font-sans',
    fontTitle: 'font-serif',
    imageFilter: '',
    navInactive: 'text-stone-400 hover:text-stone-600',
    button: 'bg-pink-400 hover:bg-pink-500 text-white',
    dotRing: 'ring-[#fffcfc]',
    tape: 'bg-stone-200/60',
  },
  anime: {
    name: 'anime',
    globalBg: 'bg-[#FFF0F5]', // LavenderBlush
    headerBg: 'from-[#FFE4E1] to-[#FFF0F5]',
    textMain: 'text-[#5D4037]', // Warm brown for readability
    textMuted: 'text-[#8D6E63]',
    accent: 'text-[#FF69B4]', // HotPink
    borderAccent: 'border-[#FF69B4]',
    bgAccent: 'bg-[#FF69B4]',
    cardBg: 'bg-white/90 backdrop-blur-sm',
    cardBorder: 'border-[#FFB6C1] border-2', // LightPink
    cardShadow: 'shadow-[0_8px_16px_rgba(255,182,193,0.3)]',
    radius: 'rounded-2xl',
    fontMain: 'font-sans font-medium',
    fontTitle: 'font-sans font-black tracking-tight',
    imageFilter: 'saturate-110 contrast-105',
    navInactive: 'text-[#D7CCC8] hover:text-[#8D6E63]',
    button: 'bg-[#FF69B4] hover:bg-[#FF1493] text-white shadow-md',
    dotRing: 'ring-[#FFF0F5]',
    tape: 'bg-[#FFB6C1]/60',
  },
  scifi: {
    name: 'scifi',
    globalBg: 'bg-[#0B0F19]',
    headerBg: 'from-[#111827] to-[#0B0F19]',
    textMain: 'text-cyan-50',
    textMuted: 'text-cyan-400/60',
    accent: 'text-cyan-400',
    borderAccent: 'border-cyan-400',
    bgAccent: 'bg-cyan-400',
    cardBg: 'bg-[#111827]/80 backdrop-blur-md',
    cardBorder: 'border-cyan-500/30 border',
    cardShadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
    radius: 'rounded-none',
    fontMain: 'font-mono',
    fontTitle: 'font-mono uppercase tracking-widest',
    imageFilter: 'contrast-125 saturate-50 hue-rotate-15',
    navInactive: 'text-slate-600 hover:text-cyan-200',
    button: 'bg-cyan-500/20 border border-cyan-400 hover:bg-cyan-500/40 text-cyan-300',
    dotRing: 'ring-[#0B0F19]',
    tape: 'bg-cyan-500/20',
  },
  retro: {
    name: 'retro',
    globalBg: 'bg-[#E6D5B8]',
    headerBg: 'from-[#D4C3A3] to-[#E6D5B8]',
    textMain: 'text-[#4A3B32]',
    textMuted: 'text-[#7A6B62]',
    accent: 'text-[#8B4513]',
    borderAccent: 'border-[#8B4513]',
    bgAccent: 'bg-[#8B4513]',
    cardBg: 'bg-[#F4EBD9]',
    cardBorder: 'border-[#C1A68D] border border-dashed',
    cardShadow: 'shadow-[2px_2px_0px_rgba(139,69,19,0.2)]',
    radius: 'rounded-sm',
    fontMain: 'font-serif',
    fontTitle: 'font-serif italic',
    imageFilter: 'sepia-[.6] contrast-90 brightness-95',
    navInactive: 'text-[#A89F91] hover:text-[#4A3B32]',
    button: 'bg-[#8B4513] hover:bg-[#5C2E0B] text-[#F4EBD9]',
    dotRing: 'ring-[#E6D5B8]',
    tape: 'bg-[#C1A68D]/60',
  },
  fantasy: {
    name: 'fantasy',
    globalBg: 'bg-[#0F0C29]',
    headerBg: 'from-[#302b63] to-[#0F0C29]',
    textMain: 'text-purple-50',
    textMuted: 'text-purple-300/70',
    accent: 'text-fuchsia-400',
    borderAccent: 'border-fuchsia-400',
    bgAccent: 'bg-fuchsia-400',
    cardBg: 'bg-white/5 backdrop-blur-xl',
    cardBorder: 'border-fuchsia-500/20 border',
    cardShadow: 'shadow-[0_8px_32px_rgba(192,38,211,0.2)]',
    radius: 'rounded-3xl',
    fontMain: 'font-sans',
    fontTitle: 'font-serif tracking-widest',
    imageFilter: 'saturate-150 hue-rotate-[-10deg]',
    navInactive: 'text-purple-400/50 hover:text-purple-200',
    button: 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white border-none',
    dotRing: 'ring-[#0F0C29]',
    tape: 'bg-fuchsia-500/20',
  },
  cinema: {
    name: 'cinema',
    globalBg: 'bg-[#09111A]',
    headerBg: 'from-[#20354B]/70 via-[#09111A]/90 to-[#09111A]',
    textMain: 'text-[#F5EBDD]',
    textMuted: 'text-[#A7B5C4]',
    accent: 'text-[#FF9A62]',
    borderAccent: 'border-[#FF9A62]',
    bgAccent: 'bg-[#FF9A62]',
    cardBg: 'bg-[#111B26]/78 backdrop-blur-xl',
    cardBorder: 'border-[#304252] border',
    cardShadow: 'shadow-[0_18px_44px_rgba(0,0,0,0.38)]',
    radius: 'rounded-[2rem]',
    fontMain: 'font-sans',
    fontTitle: 'font-serif tracking-[0.08em]',
    imageFilter: 'contrast-110 saturate-90 brightness-[0.95]',
    navInactive: 'text-[#6E8093] hover:text-[#E9D8C4]',
    button: 'bg-gradient-to-r from-[#FF9A62] to-[#F4C96B] hover:from-[#FFAE78] hover:to-[#FFD98D] text-[#111827]',
    dotRing: 'ring-[#09111A]',
    tape: 'bg-[#FFD8B5]/15',
  }
};

export const ThemeContext = React.createContext(THEMES.default);
export const useTheme = () => React.useContext(ThemeContext);
const NoticeContext = React.createContext<(message: string) => void>(() => {});
const useNotice = () => React.useContext(NoticeContext);

const treeholeColors = ['bg-[#fff0f3]', 'bg-[#fdf4ff]', 'bg-[#f0fdf4]', 'bg-[#fffbeb]', 'bg-[#f0f9ff]'];
const MAX_ENTRY_UPLOAD_IMAGES = 10;
const MAX_IMAGES_PER_TIMELINE_OR_ALBUM = 30;
const DEFAULT_AVATAR_FOCUS: AvatarFocus = { x: 50, y: 50, scale: 1 };
const AVATAR_SCALE_MIN = 1;
const AVATAR_SCALE_MAX = 3;
const TIMELINE_COVER_FALLBACK = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80';
const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const normalizeAvatarFocus = (focus?: Partial<AvatarFocus>): AvatarFocus => ({
  x: clampValue(Number.isFinite(focus?.x ?? NaN) ? (focus?.x as number) : DEFAULT_AVATAR_FOCUS.x, 0, 100),
  y: clampValue(Number.isFinite(focus?.y ?? NaN) ? (focus?.y as number) : DEFAULT_AVATAR_FOCUS.y, 0, 100),
  scale: clampValue(Number.isFinite(focus?.scale ?? NaN) ? (focus?.scale as number) : DEFAULT_AVATAR_FOCUS.scale, AVATAR_SCALE_MIN, AVATAR_SCALE_MAX),
});
const isCinemaTheme = (theme: {name: string}) => theme.name === 'cinema';

function useCoverImageRatio(coverImage: string) {
  const [coverRatio, setCoverRatio] = useState(1);

  React.useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (!active) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setCoverRatio(img.naturalWidth / img.naturalHeight);
      } else {
        setCoverRatio(1);
      }
    };
    img.onerror = () => {
      if (active) setCoverRatio(1);
    };
    img.src = coverImage;
    return () => {
      active = false;
    };
  }, [coverImage]);

  return coverRatio;
}

function getPasswordStrength(input: string): {label: string; score: number} {
  let score = 0;
  if (input.length >= 8) score += 1;
  if (input.length >= 12) score += 1;
  if (/[a-z]/.test(input)) score += 1;
  if (/[A-Z]/.test(input)) score += 1;
  if (/\d/.test(input)) score += 1;
  if (/[^A-Za-z0-9]/.test(input)) score += 1;

  if (score <= 2) return {label: '弱', score: 1};
  if (score <= 4) return {label: '中', score: 2};
  return {label: '强', score: 3};
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let normalized = value;
  let unitIndex = 0;
  while (normalized >= 1024 && unitIndex < units.length - 1) {
    normalized /= 1024;
    unitIndex += 1;
  }

  const fractionDigits = normalized >= 100 ? 0 : normalized >= 10 ? 1 : 2;
  return `${normalized.toFixed(fractionDigits)} ${units[unitIndex]}`;
}

function formatPercent(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const fractionDigits = safeValue >= 100 ? 1 : safeValue >= 10 ? 1 : 2;
  return `${safeValue.toFixed(fractionDigits)}%`;
}

// --- Safe Image Component ---
function SafeImage({
  src,
  alt,
  className,
  onClick,
  style,
}: {
  src?: string,
  alt?: string,
  className?: string,
  onClick?: () => void,
  style?: React.CSSProperties,
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  if (error || !src) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-pink-50 text-pink-300 font-bold tracking-widest ${className}`} 
        onClick={onClick}
        style={style}
      >
        <Heart size={24} className="mb-2 opacity-60" />
        <span className="text-sm font-serif">Love</span>
      </div>
    );
  }
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${className} ${loaded ? '' : 'animate-pulse bg-pink-50'}`} 
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)} 
      referrerPolicy="no-referrer" 
      onClick={onClick} 
      style={style}
      draggable={false}
    />
  );
}

// --- Hooks ---
function useMasonryCols() {
  const [cols, setCols] = useState(3);
  React.useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setCols(2);
      else if (window.innerWidth < 1024) setCols(3);
      else setCols(4);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return cols;
}

type TextPromptDialogState = {
  title: string;
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  inputType?: 'text' | 'date';
  confirmText?: string;
  allowEmpty?: boolean;
};

type ConfirmDialogState = {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
};

type NoticeItem = {
  id: number;
  message: string;
};

// --- Main App ---
function SpaceDetail({ space, onBack, onUpdateSpace, themeName, setThemeName }: { space: Space, onBack: () => void, onUpdateSpace: (space: Space) => void, themeName: ThemeName, setThemeName: (theme: ThemeName) => void }) {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(space.entries);
  const [treeholeEntries, setTreeholeEntries] = useState<TreeholeEntry[]>(space.treeholeEntries);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'album' | 'treehole'>('timeline');
  const [lightboxData, setLightboxData] = useState<{ url: string, text?: string } | null>(null);
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const hasMountedRef = useRef(false);
  const theme = useTheme();

  // Customizable Hero and Avatar
  const [heroImage, setHeroImage] = useState(space.heroImage);
  const [avatarImage, setAvatarImage] = useState(space.avatarImage);
  const [avatarFocus, setAvatarFocus] = useState<AvatarFocus>(normalizeAvatarFocus(space.avatarFocus));
  const [isAvatarAdjustOpen, setIsAvatarAdjustOpen] = useState(false);
  const [avatarFocusDraft, setAvatarFocusDraft] = useState<AvatarFocus>(normalizeAvatarFocus(space.avatarFocus));
  const avatarDragRef = useRef<{
    source: 'mouse' | 'touch';
    touchId?: number;
    startX: number;
    startY: number;
    startFocus: AvatarFocus;
  } | null>(null);
  const avatarPreviewRef = useRef<HTMLDivElement | null>(null);
  const [spaceDescription, setSpaceDescription] = useState(space.description);
  const [textPromptDialog, setTextPromptDialog] = useState<TextPromptDialogState | null>(null);
  const textPromptResolverRef = useRef<((value: string | null) => void) | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null);
  const notify = useNotice();

  const openTextPrompt = useCallback((config: Omit<TextPromptDialogState, 'value'> & { defaultValue: string }) => (
    new Promise<string | null>((resolve) => {
      if (textPromptResolverRef.current) textPromptResolverRef.current(null);
      textPromptResolverRef.current = resolve;
      setTextPromptDialog({
        title: config.title,
        label: config.label,
        value: config.defaultValue,
        placeholder: config.placeholder,
        multiline: config.multiline,
        inputType: config.inputType,
        confirmText: config.confirmText,
        allowEmpty: config.allowEmpty,
      });
    })
  ), []);

  const closeTextPrompt = useCallback((value: string | null) => {
    const resolver = textPromptResolverRef.current;
    textPromptResolverRef.current = null;
    setTextPromptDialog(null);
    resolver?.(value);
  }, []);

  const openConfirmDialog = useCallback((config: ConfirmDialogState) => (
    new Promise<boolean>((resolve) => {
      if (confirmResolverRef.current) confirmResolverRef.current(false);
      confirmResolverRef.current = resolve;
      setConfirmDialog(config);
    })
  ), []);

  const closeConfirmDialog = useCallback((confirmed: boolean) => {
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setConfirmDialog(null);
    resolver?.(confirmed);
  }, []);

  React.useEffect(() => () => {
    if (textPromptResolverRef.current) textPromptResolverRef.current(null);
    if (confirmResolverRef.current) confirmResolverRef.current(false);
  }, []);

  React.useEffect(() => {
    setTimelineEntries(space.entries);
    setTreeholeEntries(space.treeholeEntries);
    setHeroImage(space.heroImage);
    setAvatarImage(space.avatarImage);
    const incomingAvatarFocus = normalizeAvatarFocus(space.avatarFocus);
    setAvatarFocus(incomingAvatarFocus);
    setAvatarFocusDraft(incomingAvatarFocus);
    setSpaceDescription(space.description);
  }, [space.id]);

  React.useEffect(() => {
    setIsAvatarAdjustOpen(false);
  }, [space.id]);

  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    onUpdateSpace({
      id: space.id,
      name: space.name,
      description: spaceDescription,
      entries: timelineEntries,
      treeholeEntries,
      heroImage,
      avatarImage,
      avatarFocus,
    });
  }, [timelineEntries, treeholeEntries, heroImage, avatarImage, avatarFocus, onUpdateSpace, space.id, space.name, spaceDescription]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      try {
        const url = await uploadImage(file);
        setter(url);
      } catch (error) {
        const message = error instanceof Error ? error.message : '图片上传失败';
        notify(message);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const openAvatarAdjuster = () => {
    setAvatarFocusDraft(avatarFocus);
    setIsAvatarAdjustOpen(true);
  };

  const updateAvatarDrag = (clientX: number, clientY: number) => {
    const dragState = avatarDragRef.current;
    const preview = avatarPreviewRef.current;
    if (!dragState || !preview) return;

    const rect = preview.getBoundingClientRect();
    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;
    const pxToPercent = 100 / Math.max(rect.width, 1);
    const scaleFactor = Math.max(dragState.startFocus.scale, AVATAR_SCALE_MIN);

    setAvatarFocusDraft({
      ...dragState.startFocus,
      x: clampValue(dragState.startFocus.x - (deltaX * pxToPercent) / scaleFactor, 0, 100),
      y: clampValue(dragState.startFocus.y - (deltaY * pxToPercent) / scaleFactor, 0, 100),
    });
  };

  const handleAvatarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    avatarDragRef.current = {
      source: 'mouse',
      startX: e.clientX,
      startY: e.clientY,
      startFocus: avatarFocusDraft,
    };
  };

  const handleAvatarTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    avatarDragRef.current = {
      source: 'touch',
      touchId: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      startFocus: avatarFocusDraft,
    };
  };

  const handleAvatarDragStop = () => {
    avatarDragRef.current = null;
  };

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!avatarDragRef.current || avatarDragRef.current.source !== 'mouse') return;
      updateAvatarDrag(event.clientX, event.clientY);
    };

    const handleMouseUp = () => {
      if (!avatarDragRef.current || avatarDragRef.current.source !== 'mouse') return;
      handleAvatarDragStop();
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!avatarDragRef.current || avatarDragRef.current.source !== 'touch') return;
      const currentTouch = Array.from(event.touches).find((touch) => touch.identifier === avatarDragRef.current?.touchId);
      if (!currentTouch) return;
      event.preventDefault();
      updateAvatarDrag(currentTouch.clientX, currentTouch.clientY);
    };

    const handleTouchEnd = () => {
      if (!avatarDragRef.current || avatarDragRef.current.source !== 'touch') return;
      handleAvatarDragStop();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const handleAvatarScaleChange = (value: string) => {
    const nextScale = clampValue(Number(value), AVATAR_SCALE_MIN, AVATAR_SCALE_MAX);
    setAvatarFocusDraft((prev) => ({ ...prev, scale: nextScale }));
  };

  const handleUploadImage = async (file: File): Promise<string> => uploadImage(file);

  const sortByDateDesc = <T extends {date: string}>(items: T[]): T[] =>
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddEntry = (type: 'timeline' | 'album' | 'treehole', data: any) => {
    const newId = Date.now().toString();
    const imageUrls = Array.isArray(data.imageUrls)
      ? data.imageUrls
          .filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0)
          .slice(0, MAX_ENTRY_UPLOAD_IMAGES)
      : typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0
        ? [data.imageUrl]
        : [];
    const createImages = (baseId: string, text?: string) =>
      imageUrls.map((url, idx) => ({ id: `${baseId}-${idx}`, imageUrl: url, text }));
    const appendImagesWithLimit = (
      existingImages: TimelineEntry['images'],
      incomingImages: TimelineEntry['images'],
      scopeLabel: string,
    ) => {
      const remaining = MAX_IMAGES_PER_TIMELINE_OR_ALBUM - existingImages.length;
      if (remaining <= 0) {
        notify(`${scopeLabel}最多支持 ${MAX_IMAGES_PER_TIMELINE_OR_ALBUM} 张照片，当前已达上限。`);
        return existingImages;
      }
      if (incomingImages.length > remaining) {
        notify(`${scopeLabel}最多支持 ${MAX_IMAGES_PER_TIMELINE_OR_ALBUM} 张照片，本次仅添加前 ${remaining} 张。`);
      }
      return [...existingImages, ...incomingImages.slice(0, remaining)];
    };

    if (type === 'timeline') {
      const { eventId, title, date, description, text } = data;
      if (eventId === 'new') {
        const incomingImages = createImages(`${newId}-img`, text).slice(0, MAX_IMAGES_PER_TIMELINE_OR_ALBUM);
        const newEntry: TimelineEntry = {
          id: newId,
          title,
          date,
          description,
          rotation: (Math.random() * 4) - 2,
          images: incomingImages,
          coverFocus: { x: 50, y: 42 },
          type: 'timeline'
        };
        setTimelineEntries(sortByDateDesc([newEntry, ...timelineEntries]));
      } else {
        const updatedEntries = timelineEntries.map(entry => {
          if (entry.id === eventId) {
            const incomingImages = createImages(`${newId}-img`, text);
            return {
              ...entry,
              images: appendImagesWithLimit(entry.images, incomingImages, '单个时间轴事件'),
              coverFocus: entry.coverFocus ?? { x: 50, y: 42 },
            };
          }
          return entry;
        });
        setTimelineEntries(updatedEntries);
      }
    } else if (type === 'album') {
      const { eventId, title, date, text } = data;
      
      if (eventId === 'loose') {
        if (imageUrls.length > 0) {
          const looseEntries: TimelineEntry[] = imageUrls.map((url, idx) => {
            const looseId = `${newId}-${idx}`;
            return {
              id: looseId,
              title: '',
              date,
              description: '',
              rotation: (Math.random() * 4) - 2,
              images: [{ id: `${looseId}-img`, imageUrl: url, text }],
              type: 'loose_photo',
            };
          });
          setTimelineEntries(sortByDateDesc([...looseEntries, ...timelineEntries]));
        } else {
          const newEntry: TimelineEntry = {
            id: newId,
            title: '',
            date,
            description: '',
            rotation: (Math.random() * 4) - 2,
            images: [],
            type: 'loose_photo'
          };
          setTimelineEntries(sortByDateDesc([newEntry, ...timelineEntries]));
        }
      } else if (eventId === 'new') {
        const trimmedTitle = title?.trim() || '未命名相册';
        const incomingImages = createImages(`${newId}-img`, text).slice(0, MAX_IMAGES_PER_TIMELINE_OR_ALBUM);
        const newEntry: TimelineEntry = {
          id: newId,
          title: trimmedTitle,
          date,
          description: '',
          rotation: (Math.random() * 4) - 2,
          images: incomingImages,
          type: 'album'
        };
        setTimelineEntries(sortByDateDesc([newEntry, ...timelineEntries]));
      } else {
        // Check if album exists by ID
        const updatedEntries = timelineEntries.map(entry => {
          if (entry.id === eventId) {
            const incomingImages = createImages(`${newId}-img`, text);
            return {
              ...entry,
              images: appendImagesWithLimit(entry.images, incomingImages, '单个相册'),
            };
          }
          return entry;
        });
        setTimelineEntries(updatedEntries);
      }
    } else if (type === 'treehole') {
      const color = treeholeColors[Math.floor(Math.random() * treeholeColors.length)];
      const rotation = (Math.random() * 4) - 2;
      setTreeholeEntries(sortByDateDesc([{ id: newId, color, rotation, ...data }, ...treeholeEntries]));
    }
    setIsModalOpen(false);
    setActiveTab(type === 'timeline' ? 'timeline' : type === 'album' ? 'album' : 'treehole');
  };

  const handleDeleteTimelineEntry = (entryId: string) => {
    void (async () => {
      const shouldDelete = await openConfirmDialog({
        title: '确认删除',
        message: '确认删除这条记录吗？',
        confirmText: '删除',
        danger: true,
      });
      if (!shouldDelete) return;
      setTimelineEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    })();
  };

  const handleEditTimelineEntry = (entry: TimelineEntry) => {
    void (async () => {
      if (entry.type === 'loose_photo') {
        const nextDate = await openTextPrompt({
          title: '修改日期',
          label: '日期',
          defaultValue: entry.date,
          inputType: 'date',
        });
        if (nextDate === null || !nextDate.trim()) return;

        const currentText = entry.images[0]?.text ?? '';
        const nextText = await openTextPrompt({
          title: '修改照片备注',
          label: '照片备注（可留空）',
          defaultValue: currentText,
          multiline: true,
          allowEmpty: true,
        });
        if (nextText === null) return;

        setTimelineEntries((prev) =>
          sortByDateDesc(
            prev.map((item) =>
              item.id === entry.id
                ? {
                    ...item,
                    date: nextDate.trim(),
                    images:
                      item.images.length > 0
                        ? [{...item.images[0], text: nextText.trim()}, ...item.images.slice(1)]
                        : item.images,
                  }
                : item,
            ),
          ),
        );
        return;
      }

      const defaultTitle = entry.type === 'album' ? entry.title || '未命名相册' : entry.title;
      const nextTitle = await openTextPrompt({
        title: '修改标题',
        label: entry.type === 'album' ? '相册标题' : '事件标题',
        defaultValue: defaultTitle,
      });
      if (nextTitle === null || !nextTitle.trim()) return;

      const nextDate = await openTextPrompt({
        title: '修改日期',
        label: '日期',
        defaultValue: entry.date,
        inputType: 'date',
      });
      if (nextDate === null || !nextDate.trim()) return;

      const nextDescription =
        entry.type === 'timeline'
          ? await openTextPrompt({
              title: '修改描述',
              label: '事件描述（可留空）',
              defaultValue: entry.description ?? '',
              multiline: true,
              allowEmpty: true,
            })
          : entry.description ?? '';
      if (entry.type === 'timeline' && nextDescription === null) return;

      setTimelineEntries((prev) =>
        sortByDateDesc(
          prev.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  title: nextTitle.trim(),
                  date: nextDate.trim(),
                  description: entry.type === 'timeline' ? nextDescription?.trim() ?? '' : item.description,
                }
              : item,
          ),
        ),
      );
    })();
  };

  const handleDeleteTreeholeEntry = (entryId: string) => {
    void (async () => {
      const shouldDelete = await openConfirmDialog({
        title: '确认删除',
        message: '确认删除这条树洞留言吗？',
        confirmText: '删除',
        danger: true,
      });
      if (!shouldDelete) return;
      setTreeholeEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    })();
  };

  const handleEditTreeholeEntry = (entry: TreeholeEntry) => {
    void (async () => {
      const nextDate = await openTextPrompt({
        title: '修改日期',
        label: '日期',
        defaultValue: entry.date,
        inputType: 'date',
      });
      if (nextDate === null || !nextDate.trim()) return;

      const nextText = await openTextPrompt({
        title: '修改留言',
        label: '树洞留言',
        defaultValue: entry.text,
        multiline: true,
      });
      if (nextText === null || !nextText.trim()) return;

      setTreeholeEntries((prev) =>
        sortByDateDesc(
          prev.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  date: nextDate.trim(),
                  text: nextText.trim(),
                }
              : item,
          ),
        ),
      );
    })();
  };

  const handleRenameCurrentSpace = () => {
    void (async () => {
      const nextName = await openTextPrompt({
        title: '修改空间名称',
        label: '空间名称',
        defaultValue: space.name,
      });
      if (nextName === null) return;

      const trimmedName = nextName.trim();
      if (!trimmedName || trimmedName === space.name) return;

      onUpdateSpace({
        id: space.id,
        name: trimmedName,
        description: spaceDescription,
        entries: timelineEntries,
        treeholeEntries,
        heroImage,
        avatarImage,
        avatarFocus,
      });
    })();
  };

  const handleTextPromptConfirm = () => {
    if (!textPromptDialog) return;
    if (!textPromptDialog.allowEmpty && !textPromptDialog.value.trim()) return;
    closeTextPrompt(textPromptDialog.value);
  };

  const handleEditDescription = () => {
    void (async () => {
      const nextDescription = await openTextPrompt({
        title: '修改简介',
        label: '简介内容',
        defaultValue: spaceDescription,
        multiline: true,
        confirmText: '保存',
      });
      if (nextDescription === null) return;
      const trimmedDescription = nextDescription.replace(/\r\n/g, '\n').trim();
      if (!trimmedDescription) return;
      setSpaceDescription(trimmedDescription);
    })();
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 selection:bg-pink-100 selection:text-pink-600 ${theme.globalBg} ${theme.textMain} ${theme.fontMain}`}>
      {/* Back Button */}
      <button 
        onClick={onBack}
        className={`fixed top-6 left-6 z-50 ${theme.cardBg} backdrop-blur-md p-3 rounded-full cursor-pointer hover:opacity-80 transition-all shadow-sm group border ${theme.cardBorder}`}
      >
        <ArrowLeft className={`${theme.textMuted} group-hover:-translate-x-1 transition-transform`} size={20} />
      </button>

      {/* Theme Selector */}
      <div className="fixed top-20 right-6 z-50 flex gap-3">
        <div className="relative group">
          <button className={`flex items-center gap-2 ${theme.cardBg} backdrop-blur-md px-4 py-3 rounded-full cursor-pointer hover:opacity-80 transition-all shadow-sm border ${theme.cardBorder}`}>
            <Palette className={theme.accent} size={20} />
            <span className={`text-sm font-medium ${theme.textMain} capitalize hidden md:inline`}>{theme.name}</span>
          </button>
          
          <div className={`absolute right-0 top-full mt-2 w-40 ${theme.cardBg} backdrop-blur-xl border ${theme.cardBorder} rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 overflow-hidden`}>
            {(Object.keys(THEMES) as ThemeName[]).map((t) => (
              <button
                key={t}
                onClick={() => setThemeName(t)}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-black/5 ${themeName === t ? theme.accent : theme.textMuted} capitalize`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className={`flex items-center justify-center w-12 h-12 ${theme.cardBg} backdrop-blur-md rounded-full cursor-pointer hover:opacity-80 transition-all shadow-sm border ${theme.cardBorder} group`}>
          <ImagePlus className={`${theme.accent} group-hover:scale-110 transition-transform`} size={20} />
          <input type="file" className="hidden" accept="image/*" disabled={isUploadingImage} onChange={(e) => void handleImageUpload(e, setHeroImage)} />
        </label>
      </div>

      {/* Hero Area */}
      <div className="relative min-h-[55vh] w-full flex flex-col items-center justify-start pt-12 md:pt-16 pb-10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src={heroImage} alt="Hero Background" className={`w-full h-full object-cover blur-md scale-105 opacity-70 ${theme.imageFilter}`} />
          <div className={`absolute inset-0 bg-gradient-to-b ${theme.headerBg}`}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <div className="relative group">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className={`w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-[4px] border-white shadow-[0_8px_24px_rgba(244,114,182,0.25)] mb-5 relative z-10 ${theme.cardBg}`}
            >
              <img
                src={avatarImage}
                alt="Avatar"
                className={`w-full h-full object-cover ${theme.imageFilter}`}
                style={{
                  objectPosition: `${avatarFocus.x}% ${avatarFocus.y}%`,
                  transformOrigin: `${avatarFocus.x}% ${avatarFocus.y}%`,
                  transform: `scale(${avatarFocus.scale})`,
                }}
              />
              <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-300">
                <Camera className="text-white mb-1" size={20} />
                <span className="text-white text-xs font-medium">更换头像</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={isUploadingImage}
                  onChange={(e) =>
                    void handleImageUpload(e, (url) => {
                      setAvatarImage(url);
                      setAvatarFocus(DEFAULT_AVATAR_FOCUS);
                      setAvatarFocusDraft(DEFAULT_AVATAR_FOCUS);
                    })
                  }
                />
              </label>
            </motion.div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openAvatarAdjuster();
              }}
              aria-label="调整头像位置"
              className={`absolute -right-11 md:-right-12 top-1/2 -translate-y-1/2 z-30 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full ${theme.cardBg} border ${theme.cardBorder} ${theme.accent} shadow-sm invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 hover:opacity-80 transition-all duration-200`}
            >
              <Move size={14} />
            </button>
          </div>

          <div className="mb-3 flex justify-center">
            <div className="group relative w-fit pr-10 md:pr-12">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className={`${theme.fontTitle} text-4xl md:text-5xl font-extrabold ${theme.textMain} drop-shadow-sm flex items-center gap-2`}
              >
                {space.name} <Sparkles className={`${theme.accent} animate-pulse`} size={28} />
              </motion.h1>
              <button
                type="button"
                onClick={handleRenameCurrentSpace}
                aria-label="修改空间名称"
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full ${theme.cardBg} border ${theme.cardBorder} ${theme.accent} shadow-sm invisible opacity-0 pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:visible focus-visible:opacity-100 focus-visible:pointer-events-auto hover:opacity-80 transition-all duration-200`}
              >
                <Pencil size={14} />
              </button>
            </div>
          </div>
          <motion.p 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className={`${theme.accent} text-sm md:text-base tracking-[0.3em] uppercase mb-5 font-bold`}
          >
            {/* Optional English name or subtitle could go here */}
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="group relative w-full max-w-xl mx-auto pr-10 md:pr-12"
          >
            <button
              type="button"
              onClick={handleEditDescription}
              aria-label="修改简介"
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full ${theme.cardBg} border ${theme.cardBorder} ${theme.accent} shadow-sm invisible opacity-0 pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:visible focus-visible:opacity-100 focus-visible:pointer-events-auto hover:opacity-80 transition-all duration-200`}
            >
              <Pencil size={14} />
            </button>
            <p className={`${theme.textMuted} leading-relaxed font-medium text-base md:text-lg whitespace-pre-line px-2 md:px-3`}>
              {spaceDescription}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            className={`flex flex-wrap justify-center gap-6 md:gap-10 mt-6 ${theme.textMuted} font-medium text-sm md:text-base ${theme.cardBg} backdrop-blur-md px-8 py-3 rounded-full border ${theme.cardBorder} shadow-sm`}
          >
            <div className="flex items-center gap-2"><Calendar size={16} className={theme.accent} /><span className="tracking-wider">1997.10.14</span></div>
            <div className="flex items-center gap-2"><Star size={16} className={theme.accent} /><span className="tracking-wider">天秤座</span></div>
            <div className="flex items-center gap-2"><MapPin size={16} className={theme.accent} /><span className="tracking-wider">重庆市</span></div>
          </motion.div>
        </div>
      </div>

      {/* Tabs Navigation - Sticky with Backdrop Blur */}
      <div className={`sticky top-0 z-30 ${theme.cardBg} backdrop-blur-md border-b ${theme.cardBorder} shadow-sm`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-center pt-4">
            {['timeline', 'album', 'treehole'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 w-24 flex flex-col items-center text-lg font-bold transition-colors relative ${
                  activeTab === tab ? theme.accent : theme.navInactive
                }`}
              >
                <span>
                  {tab === 'timeline' ? '轨迹' : tab === 'album' ? '剪影' : '心声'}
                </span>
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className={`absolute bottom-[-1px] w-[2em] h-[3px] ${theme.bgAccent} rounded-t-full`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-32 min-h-[50vh]">
        <AnimatePresence mode="wait">
          {/* Timeline View (Event Folders) */}
          {activeTab === 'timeline' && (
            <motion.div 
              key="timeline" 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
              className="w-full"
            >
              <TimelineView 
                entries={timelineEntries.filter(e => e.type !== 'album' && e.type !== 'loose_photo')} 
                onImageClick={(url, text) => setLightboxData({ url, text })}
                onEditEntry={handleEditTimelineEntry}
                onDeleteEntry={handleDeleteTimelineEntry}
              />
            </motion.div>
          )}

          {/* Album View (Masonry) */}
          {activeTab === 'album' && (
            <AlbumMasonry 
              entries={timelineEntries.filter(e => e.images.length > 0)} 
              expandedAlbumId={expandedAlbumId}
              setExpandedAlbumId={setExpandedAlbumId}
              onImageClick={(url, text) => setLightboxData({ url, text })}
              onEditEntry={handleEditTimelineEntry}
              onDeleteEntry={handleDeleteTimelineEntry}
            />
          )}

          {/* Treehole View */}
          {activeTab === 'treehole' && (
            <motion.div 
              key="treehole" 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 pt-4"
            >
              {treeholeEntries.map((msg, i) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.9, rotate: msg.rotation - 5 }} animate={{ opacity: 1, scale: 1, rotate: msg.rotation }} transition={{ duration: 0.5, delay: (i % 10) * 0.1, type: "spring" }}
                  className={`${msg.color} p-8 rounded-3xl shadow-[0_4px_20px_rgba(244,114,182,0.06)] hover:shadow-[0_8px_30px_rgba(244,114,182,0.12)] transition-shadow duration-300 relative border border-white`}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditTreeholeEntry(msg)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/70 ${theme.accent} hover:opacity-80 transition-colors`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTreeholeEntry(msg.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/70 ${theme.accent} hover:opacity-80 transition-colors`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-6 bg-white/80 backdrop-blur-sm shadow-[0_2px_5px_rgba(0,0,0,0.05)] rotate-[-2deg] rounded-sm"></div>
                  <p className="font-medium text-stone-700 text-lg leading-relaxed mb-8 mt-2 whitespace-pre-wrap">{msg.text}</p>
                  <div className="text-right flex items-center justify-end gap-1">
                    <Heart size={12} className="text-pink-300 fill-pink-300 opacity-70" />
                    <span className="text-stone-500 text-xs tracking-widest font-medium opacity-80">{msg.date}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05, rotate: 90 }} whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-pink-400 text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(244,114,182,0.4)] hover:bg-pink-500 transition-all duration-300"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>

      {/* Smart Publish Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <AddEntryModal
            onClose={() => setIsModalOpen(false)}
            onAdd={handleAddEntry}
            existingEvents={timelineEntries}
            onUploadImage={handleUploadImage}
          />
        )}
      </AnimatePresence>

      {/* Avatar Adjust Modal */}
      <AnimatePresence>
        {isAvatarAdjustOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-md"
            onClick={() => setIsAvatarAdjustOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className={`w-full max-w-sm rounded-3xl border ${theme.cardBorder} ${theme.cardBg} p-6 shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`${theme.textMain} ${theme.fontTitle} text-xl font-bold mb-4`}>调整头像位置</h3>
              <div
                ref={avatarPreviewRef}
                className={`mx-auto w-56 h-56 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-grab active:cursor-grabbing touch-none ${theme.cardBg}`}
                onMouseDown={handleAvatarMouseDown}
                onTouchStart={handleAvatarTouchStart}
              >
                <img
                  src={avatarImage}
                  alt="Avatar Preview"
                  className={`w-full h-full object-cover select-none pointer-events-none ${theme.imageFilter}`}
                  draggable={false}
                  style={{
                    objectPosition: `${avatarFocusDraft.x}% ${avatarFocusDraft.y}%`,
                    transformOrigin: `${avatarFocusDraft.x}% ${avatarFocusDraft.y}%`,
                    transform: `scale(${avatarFocusDraft.scale})`,
                  }}
                />
              </div>
              <p className={`${theme.textMuted} text-sm text-center mt-3`}>拖拽头像调整位置，滑杆调整缩放</p>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={theme.textMuted}>缩放</span>
                  <span className={theme.accent}>{avatarFocusDraft.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={AVATAR_SCALE_MIN}
                  max={AVATAR_SCALE_MAX}
                  step={0.01}
                  value={avatarFocusDraft.scale}
                  onInput={(e) => handleAvatarScaleChange((e.target as HTMLInputElement).value)}
                  onChange={(e) => handleAvatarScaleChange(e.target.value)}
                  className="w-full accent-pink-400"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFocusDraft(avatarFocus);
                    setIsAvatarAdjustOpen(false);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full border ${theme.cardBorder} ${theme.textMuted} hover:opacity-80 transition-colors`}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFocus(normalizeAvatarFocus(avatarFocusDraft));
                    setIsAvatarAdjustOpen(false);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full text-white ${theme.bgAccent} hover:opacity-90 transition-opacity`}
                >
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TextPromptModal
        isOpen={textPromptDialog !== null}
        title={textPromptDialog?.title ?? ''}
        label={textPromptDialog?.label ?? ''}
        value={textPromptDialog?.value ?? ''}
        placeholder={textPromptDialog?.placeholder}
        multiline={textPromptDialog?.multiline}
        inputType={textPromptDialog?.inputType}
        confirmText={textPromptDialog?.confirmText}
        allowEmpty={textPromptDialog?.allowEmpty}
        onChange={(nextValue) =>
          setTextPromptDialog((prev) => (prev ? {...prev, value: nextValue} : prev))
        }
        onCancel={() => closeTextPrompt(null)}
        onConfirm={handleTextPromptConfirm}
      />

      <ConfirmActionModal
        isOpen={confirmDialog !== null}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        confirmText={confirmDialog?.confirmText}
        danger={confirmDialog?.danger}
        onCancel={() => closeConfirmDialog(false)}
        onConfirm={() => closeConfirmDialog(true)}
      />

      {/* Lightbox with Text */}
      <AnimatePresence>
        {lightboxData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-stone-900/95 backdrop-blur-md p-4 md:p-12 cursor-zoom-out"
            onClick={() => setLightboxData(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative max-w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image/text area
            >
              <SafeImage 
                src={lightboxData.url} 
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10" 
              />
              {lightboxData.text && (
                <div className="mt-6 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl max-w-2xl text-center border border-white/20">
                  <p className="text-white font-medium text-lg leading-relaxed">{lightboxData.text}</p>
                </div>
              )}
            </motion.div>
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 p-3 rounded-full backdrop-blur-sm">
              <X size={24} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Subcomponents ---

type TimelineFolderProps = {
  entry: TimelineEntry;
  index: number;
  onImageClick: (url: string, text?: string) => void;
  onEditEntry: (entry: TimelineEntry) => void;
  onDeleteEntry: (entryId: string) => void;
};

function TimelineView({
  entries,
  onImageClick,
  onEditEntry,
  onDeleteEntry,
}: {
  entries: TimelineEntry[];
  onImageClick: (url: string, text?: string) => void;
  onEditEntry: (entry: TimelineEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}) {
  const theme = useTheme();
  const cinemaMode = isCinemaTheme(theme);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const groupedEntries = React.useMemo(() => {
    const groups: Record<string, TimelineEntry[]> = {};
    entries.forEach(entry => {
      const year = new Date(entry.date).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(entry);
    });
    return Object.keys(groups).sort((a, b) => Number(b) - Number(a)).map(year => ({
      year,
      entries: groups[year]
    }));
  }, [entries]);

  const [activeYear, setActiveYear] = useState(groupedEntries[0]?.year);

  React.useEffect(() => {
    const handleScroll = () => {
      const yearElements = groupedEntries.map(g => ({
        year: g.year,
        el: document.getElementById(`year-${g.year}`)
      }));
      
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      
      let currentYear = activeYear;
      for (const { year, el } of yearElements) {
        if (el && el.offsetTop <= scrollPosition) {
          currentYear = year;
        }
      }
      if (currentYear !== activeYear) {
        setActiveYear(currentYear);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [groupedEntries, activeYear]);

  const scrollToYear = (year: string) => {
    const el = document.getElementById(`year-${year}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setIsScrolled(rect.top < window.innerHeight * 0.5);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const timelineShellClass = cinemaMode ? 'timeline-cinema-shell max-w-[75rem] gap-4 xl:gap-6' : 'max-w-5xl';
  const railBackgroundClass = cinemaMode ? 'w-px bg-white/10 shadow-[0_0_26px_rgba(255,154,98,0.14)]' : `w-[2px] ${theme.cardBorder}`;
  const railProgressClass = cinemaMode
    ? 'w-[3px] bg-gradient-to-b from-[#FF9A62] via-[#F4C96B] to-[#86D7F2] shadow-[0_0_28px_rgba(255,154,98,0.45)]'
    : `w-[2px] ${theme.bgAccent}`;

  return (
    <div className={`relative mx-auto flex w-full ${timelineShellClass}`}>
      <div
        className={`hidden lg:flex flex-col fixed top-1/2 -translate-y-1/2 h-fit items-start z-20 transition-opacity duration-500 ${
          cinemaMode
            ? `left-4 xl:left-10 rounded-[28px] border border-white/10 bg-[#0E1823]/72 px-2.5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.34)] backdrop-blur-xl ${isScrolled ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
            : `left-8 xl:left-16 space-y-6 ${isScrolled ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`
        }`}
      >
        {cinemaMode ? (
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(255,154,98,0.15),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
        ) : (
          <div className="absolute left-[3px] top-2 bottom-2 w-[1px] bg-pink-100/50 -z-10"></div>
        )}
        <div className={`relative flex flex-col ${cinemaMode ? 'gap-2' : 'space-y-6'}`}>
          {groupedEntries.map((g) => (
            <button
              key={g.year}
              onClick={() => scrollToYear(g.year)}
              className={`relative flex items-center justify-start group transition-all duration-500 ${
                cinemaMode
                  ? `gap-3 rounded-full px-3 py-2 ${
                      activeYear === g.year
                        ? 'translate-x-1 bg-white/8 text-[#FFE4CC]'
                        : 'text-[#6E8093] hover:text-[#FFD5B1]'
                    }`
                  : `gap-4 ${activeYear === g.year ? 'text-pink-500 scale-110 translate-x-1' : 'text-stone-400 hover:text-pink-300'}`
              }`}
            >
              <div
                className={`rounded-full transition-all duration-500 ${
                  cinemaMode
                    ? activeYear === g.year
                      ? 'h-2.5 w-2.5 bg-[#FF9A62] shadow-[0_0_12px_rgba(255,154,98,0.8)]'
                      : 'h-2 w-2 bg-white/25 group-hover:bg-[#FFD5B1]'
                    : activeYear === g.year
                      ? 'w-2 h-2 bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.8)] scale-150'
                      : 'w-2 h-2 bg-stone-200 group-hover:bg-pink-200'
                }`}
              />
              <span
                className={`transition-all duration-500 ${
                  cinemaMode
                    ? activeYear === g.year
                      ? 'font-serif text-base tracking-[0.18em]'
                      : 'font-medium text-sm tracking-[0.18em]'
                    : `font-serif tracking-widest ${activeYear === g.year ? 'font-bold text-lg' : 'font-medium text-sm'}`
                }`}
              >
                {g.year}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className={`relative mx-auto w-full flex-1 ${cinemaMode ? 'max-w-[70rem]' : 'max-w-3xl'}`}>
        {cinemaMode && (
          <>
            <div className="pointer-events-none absolute inset-x-[18%] top-8 bottom-8 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,154,98,0.12),transparent_62%)] blur-3xl" />
            <div className="pointer-events-none absolute left-[14px] md:left-1/2 top-0 bottom-0 w-[92px] md:w-[180px] -translate-x-1/2 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,154,98,0.1),transparent_65%)] blur-[52px]" />
          </>
        )}
        <div className={`absolute left-[14px] md:left-1/2 top-0 bottom-0 ${railBackgroundClass} md:-translate-x-1/2 rounded-full`}></div>
        <motion.div
          className={`absolute left-[14px] md:left-1/2 top-0 bottom-0 ${railProgressClass} md:-translate-x-1/2 rounded-full origin-top`}
          style={{ scaleY }}
        />
        
        <div className={cinemaMode ? 'space-y-4' : 'space-y-7'}>
          {groupedEntries.map((group) => (
            <div key={group.year} id={`year-${group.year}`} className="relative scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, type: "spring" }}
                className={`relative z-10 flex items-center justify-center ${cinemaMode ? 'mb-3' : 'mb-4'}`}
              >
                {cinemaMode ? (
                  <div className="relative flex items-center gap-4 px-2 py-1">
                    <span className="text-[10px] uppercase tracking-[0.42em] text-[#8BA0B4]">Archive</span>
                    <span className="font-serif text-xl tracking-[0.26em] text-[#FFE4CC] [text-shadow:0_0_10px_rgba(255,154,98,0.25)]">
                      {group.year}
                    </span>
                  </div>
                ) : (
                  <div className={`${theme.cardBg} backdrop-blur-md px-8 py-2.5 rounded-full border ${theme.cardBorder} shadow-[0_3px_14px_rgba(244,114,182,0.1)] ${theme.accent} font-serif font-bold text-xl tracking-[0.18em] flex items-center justify-center`}>
                    {group.year}
                  </div>
                )}
              </motion.div>

              <div className={cinemaMode ? 'space-y-2.5' : 'space-y-2'}>
                {group.entries.map((entry) => {
                  const globalIndex = entries.findIndex(e => e.id === entry.id);
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: cinemaMode ? 34 : 56, scale: 0.95, rotate: globalIndex % 2 === 0 ? -2 : 2 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: cinemaMode ? 0.62 : 0.8, type: "spring", bounce: cinemaMode ? 0.28 : 0.4 }}
                    >
                      <TimelineFolder 
                        entry={entry} 
                        index={globalIndex} 
                        onImageClick={onImageClick}
                        onEditEntry={onEditEntry}
                        onDeleteEntry={onDeleteEntry}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineFolder(props: TimelineFolderProps) {
  const theme = useTheme();
  if (isCinemaTheme(theme)) {
    return <TimelineFolderCinema {...props} />;
  }
  return <TimelineFolderClassic {...props} />;
}

function TimelineFolderClassic({
  entry,
  index,
  onImageClick,
  onEditEntry,
  onDeleteEntry,
}: TimelineFolderProps) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const isEven = index % 2 === 0;
  const coverImage = entry.images.length > 0 ? entry.images[0].imageUrl : TIMELINE_COVER_FALLBACK;
  const expandedImages = entry.images;
  const ExpandArrowIcon = isExpanded ? (isEven ? ChevronRight : ChevronLeft) : ChevronDown;
  const coverRatio = useCoverImageRatio(coverImage);

  const cardWidth = React.useMemo(() => {
    const ratio = Number.isFinite(coverRatio) && coverRatio > 0 ? coverRatio : 1;
    const imageWidth =
      ratio >= 1
        ? Math.min(276, 172 + (ratio - 1) * 74)
        : Math.max(124, 172 * ratio);
    return Math.round(Math.min(296, Math.max(156, imageWidth + 24)));
  }, [coverRatio]);

  return (
    <div className="relative w-full mb-0.5">
      <div className={`relative flex flex-col md:flex-row items-start ${isEven ? 'md:flex-row-reverse' : ''}`}>
        <motion.div 
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className={`absolute left-[9px] md:left-1/2 w-[9px] h-[9px] rounded-full ${theme.bgAccent} md:-translate-x-1/2 mt-4 ring-4 ${theme.dotRing} shadow-sm z-10`}
        ></motion.div>

        <div className={`ml-12 md:ml-0 md:w-1/2 ${isEven ? 'md:pl-9' : 'md:pr-9'} py-0.5 flex ${isEven ? 'justify-start' : 'justify-end'}`}>
          <div
            className="relative w-full group"
            style={{ width: `${cardWidth}px`, maxWidth: 'calc(100vw - 4.75rem)' }}
          >
            <div className={`absolute -top-2.5 ${isEven ? 'right-7 rotate-[4deg]' : 'left-7 rotate-[-3deg]'} w-14 h-5 ${theme.tape} backdrop-blur-sm z-30 mix-blend-multiply shadow-sm transition-transform duration-300 group-hover:-translate-y-1`}></div>
            
            <div className={`relative ${theme.cardBg} p-3 shadow-sm border ${theme.cardBorder} transition-all duration-300 w-full hover:shadow-md hover:-translate-y-0.5 z-20`}>
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEntry(entry);
                  }}
                  className={`${theme.cardBg} backdrop-blur-sm border ${theme.cardBorder} p-1.5 rounded-full ${theme.accent} hover:opacity-80 transition-colors`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEntry(entry.id);
                  }}
                  className={`${theme.cardBg} backdrop-blur-sm border ${theme.cardBorder} p-1.5 rounded-full ${theme.accent} hover:opacity-80 transition-colors`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="overflow-hidden relative">
                  <SafeImage
                    src={coverImage}
                    alt={entry.title}
                    className={`w-full h-auto grayscale-[12%] group-hover:grayscale-0 transition-all duration-500 ${theme.imageFilter}`}
                  />
                  {entry.images.length > 1 && (
                    <div className={`absolute bottom-2 right-2 ${theme.cardBg} backdrop-blur-sm ${theme.textMain} text-[10px] px-2 py-1 font-mono tracking-widest border ${theme.cardBorder}`}>
                      +{entry.images.length - 1}
                    </div>
                  )}
                </div>
                
                <div className="mt-2.5 text-left relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-mono ${theme.textMuted} text-[9px] tracking-[0.18em] uppercase`}>{entry.date}</span>
                    {entry.images.length > 0 && (
                      <motion.div
                        key={isExpanded ? `${entry.id}-${isEven ? 'expanded-right' : 'expanded-left'}` : `${entry.id}-collapsed`}
                        initial={{ opacity: 0.45, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={theme.textMuted}
                      >
                        <ExpandArrowIcon size={12} />
                      </motion.div>
                    )}
                  </div>
                  <h3 className={`${theme.fontTitle} font-bold ${theme.textMain} text-lg leading-snug line-clamp-1`}>{entry.title}</h3>
                </div>
              </div>

              <AnimatePresence>
                {entry.description && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <div className={`pt-3 mt-2 border-t ${theme.cardBorder}`}>
                      <p className={`${theme.textMuted} font-serif leading-relaxed text-[13px] text-left whitespace-pre-line ${isExpanded ? '' : 'line-clamp-2'}`}>{entry.description}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            <AnimatePresence>
              {isExpanded && expandedImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: isEven ? 22 : -22, y: 8 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: isEven ? 22 : -22, y: 8 }}
                  transition={{ duration: 0.28 }}
                  className={`hide-scrollbar mt-2.5 flex max-h-[23rem] w-full flex-col gap-2 overflow-y-auto pr-1 md:mt-0 md:absolute md:top-2 md:w-32 md:z-0 ${
                    isEven ? 'md:left-[calc(100%+0.65rem)]' : 'md:right-[calc(100%+0.65rem)]'
                  }`}
                >
                  {expandedImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => onImageClick(img.imageUrl, img.text)}
                      className={`group/photo relative w-full shrink-0 border ${theme.cardBorder} ${theme.cardBg} shadow-sm overflow-hidden`}
                    >
                      <SafeImage src={img.imageUrl} className={`w-full aspect-[4/5] object-cover ${theme.imageFilter}`} />
                      {img.text?.trim() && (
                        <>
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-200 group-hover/photo:opacity-100" />
                          <p className="pointer-events-none absolute inset-x-2 bottom-1.5 text-left text-[10px] leading-tight text-white opacity-0 transition-opacity duration-200 line-clamp-3 group-hover/photo:opacity-100">
                            {img.text}
                          </p>
                        </>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineFolderCinema({
  entry,
  index,
  onImageClick,
  onEditEntry,
  onDeleteEntry,
}: TimelineFolderProps) {
  const theme = useTheme();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const isEven = index % 2 === 0;
  const hasImages = entry.images.length > 0;
  const activeImage = hasImages ? entry.images[activeImageIndex] ?? entry.images[0] : null;
  const coverFocus = entry.coverFocus ?? { x: 50, y: 42 };
  const previewImages = entry.images.slice(0, 4);
  const previewImageUrl = activeImage?.imageUrl ?? entry.images[0]?.imageUrl ?? TIMELINE_COVER_FALLBACK;
  const previewFrameRatio = useCoverImageRatio(previewImageUrl);
  const cardLaneClass = isEven ? 'md:col-start-3 md:justify-self-start' : 'md:col-start-1 md:justify-self-end';
  const eventSummary = entry.description?.trim() ?? '';
  const frameSummary = activeImage?.text?.trim() ?? '';
  const safePreviewRatio = Number.isFinite(previewFrameRatio) && previewFrameRatio > 0 ? previewFrameRatio : 1;
  const visualPreviewRatio = React.useMemo(
    () => Math.min(1.35, Math.max(0.82, safePreviewRatio)),
    [safePreviewRatio],
  );
  const previewWidth = React.useMemo(() => {
    if (visualPreviewRatio >= 1.2) return '12.75rem';
    if (visualPreviewRatio >= 0.98) return '11.75rem';
    return '10.75rem';
  }, [visualPreviewRatio]);
  const previewGridStyle = {
    '--timeline-preview-width': previewWidth,
  } as React.CSSProperties;
  const previewFrameStyle = { aspectRatio: `${visualPreviewRatio}` } as React.CSSProperties;
  const cardMaxWidthClass =
    visualPreviewRatio >= 1.2 ? 'max-w-[30.5rem]' :
    visualPreviewRatio >= 0.95 ? 'max-w-[29.5rem]' :
    'max-w-[28rem]';
  const previewObjectPosition = activeImageIndex === 0 ? `${coverFocus.x}% ${coverFocus.y}%` : '50% 50%';

  React.useEffect(() => {
    setActiveImageIndex(0);
  }, [entry.id]);

  return (
    <div className="relative w-full">
      <div className="relative grid gap-2.5 pl-10 md:grid-cols-[minmax(0,1fr)_74px_minmax(0,1fr)] md:pl-0">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.48, delay: 0.12, type: "spring" }}
          className="absolute left-[8px] top-10 z-20 md:left-1/2 md:-translate-x-1/2"
        >
          <span className="cinema-orb absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF9A62]/28 blur-xl"></span>
          <span className={`relative block h-3.5 w-3.5 rounded-full ${theme.bgAccent} ring-4 ${theme.dotRing} shadow-[0_0_18px_rgba(255,154,98,0.52)]`}></span>
        </motion.div>

        <div className={`min-w-0 ${cardLaneClass}`}>
          <div className={`w-full ${cardMaxWidthClass}`}>
            <div className="relative group">
              <div className={`timeline-cinema-card relative overflow-hidden rounded-[28px] border ${theme.cardBorder} ${theme.cardBg} ${theme.cardShadow}`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,154,98,0.13),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_46%)]" />
                <div className="relative p-3.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.38em] text-[#8AA0B3]">{entry.date}</p>
                      <h3 className={`${theme.fontTitle} mt-1.5 text-[1.45rem] leading-tight text-[#FFF0E0] md:text-[1.7rem]`}>{entry.title}</h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEntry(entry);
                        }}
                        className="rounded-full border border-white/10 bg-white/8 p-2 text-[#FFD8BF] transition-colors hover:bg-white/14"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEntry(entry.id);
                        }}
                        className="rounded-full border border-white/10 bg-white/8 p-2 text-[#FFD8BF] transition-colors hover:bg-white/14"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div
                    className="mt-2.5 grid grid-cols-1 gap-2.5 sm:items-start sm:[grid-template-columns:var(--timeline-preview-width)_minmax(0,1fr)]"
                    style={previewGridStyle}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (activeImage) onImageClick(activeImage.imageUrl, activeImage.text);
                      }}
                      className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0C1520] shadow-[0_14px_30px_rgba(0,0,0,0.24)] transition-[aspect-ratio] duration-300"
                      style={previewFrameStyle}
                    >
                      {hasImages ? (
                        <>
                          <SafeImage
                            src={previewImageUrl}
                            alt={entry.title}
                            className={`absolute inset-0 h-full w-full scale-110 object-cover blur-xl opacity-50 ${theme.imageFilter}`}
                            style={{ objectPosition: previewObjectPosition }}
                          />
                          <div className="absolute inset-0 bg-black/24" />
                          <SafeImage
                            src={previewImageUrl}
                            alt={entry.title}
                            className={`relative z-10 h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.02] ${theme.imageFilter}`}
                            style={{ objectPosition: previewObjectPosition }}
                          />
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,rgba(255,154,98,0.16),transparent_40%),linear-gradient(180deg,#0D1823,#0A1118)] text-[#FFE4CC]">
                          <Images size={30} className="opacity-80" />
                          <span className="text-xs uppercase tracking-[0.34em] text-[#A7B5C4]">No Photo Yet</span>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/12 bg-black/35 px-2.5 py-1 text-[10px] tracking-[0.16em] text-[#FFE4CC] backdrop-blur-md">
                          {hasImages ? `${entry.images.length} 张照片` : '文字档案'}
                        </span>
                      </div>
                    </button>

                    <div className="flex min-w-0 flex-col gap-2.5">
                      {eventSummary && (
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.28em] text-[#7E93A6]">Event</p>
                          <p className="mt-1 text-[14px] leading-6 text-[#A7B5C4] line-clamp-3">
                            {eventSummary}
                          </p>
                        </div>
                      )}

                      {previewImages.length > 1 && (
                        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
                          {previewImages.map((img, previewIndex) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => setActiveImageIndex(previewIndex)}
                              className={`relative shrink-0 overflow-hidden rounded-[16px] border transition-all duration-300 ${
                                previewIndex === activeImageIndex
                                  ? 'border-[#FF9A62] bg-[#182433] shadow-[0_0_0_1px_rgba(255,154,98,0.28)]'
                                  : 'border-white/10 bg-[#101923] hover:border-white/30'
                              }`}
                            >
                              <SafeImage src={img.imageUrl} className={`h-14 w-14 object-cover ${theme.imageFilter}`} />
                            </button>
                          ))}
                        </div>
                      )}

                      {frameSummary && (
                        <div className="min-w-0 border-t border-white/10 pt-2">
                          <p className="text-[10px] uppercase tracking-[0.28em] text-[#7E93A6]">Photo Note</p>
                          <p className="mt-1 text-[13px] leading-5 text-[#DCCCBD] line-clamp-3">
                            {frameSummary}
                          </p>
                        </div>
                      )}

                      {!eventSummary && !frameSummary && (
                        <p className="text-sm leading-6 text-[#6E8093]">
                          这条记录还没有补充描述。
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function AlbumMasonry({
  entries,
  expandedAlbumId,
  setExpandedAlbumId,
  onImageClick,
  onEditEntry,
  onDeleteEntry,
}: {
  entries: TimelineEntry[];
  expandedAlbumId: string | null;
  setExpandedAlbumId: (id: string | null) => void;
  onImageClick: (url: string, text?: string) => void;
  onEditEntry: (entry: TimelineEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}) {
  const theme = useTheme();
  const cols = useMasonryCols();
  const expandedEntry = React.useMemo(
    () =>
      expandedAlbumId
        ? entries.find((entry) => String(entry.id) === String(expandedAlbumId) && entry.type !== 'loose_photo') ??
          null
        : null,
    [entries, expandedAlbumId],
  );

  React.useEffect(() => {
    if (expandedAlbumId && !expandedEntry) {
      setExpandedAlbumId(null);
    }
  }, [expandedAlbumId, expandedEntry, setExpandedAlbumId]);

  const buildColumns = React.useCallback(
    (items: TimelineEntry[]) => {
      const nextColumns: TimelineEntry[][] = Array.from({ length: cols }, () => []);
      items.forEach((entry, i) => {
        nextColumns[i % cols].push(entry);
      });
      return nextColumns;
    },
    [cols],
  );

  if (expandedEntry) {
    const detailEntries: TimelineEntry[] = expandedEntry.images.map((img, idx) => ({
      id: `${expandedEntry.id}-detail-${img.id}-${idx}`,
      title: expandedEntry.title,
      date: expandedEntry.date,
      description: expandedEntry.description,
      images: [img],
      rotation: ((idx % 5) - 2) * 1.1 + expandedEntry.rotation * 0.2,
      type: 'loose_photo',
    }));
    const detailColumns = buildColumns(detailEntries);

    return (
      <motion.div
        key={`album-detail-${expandedEntry.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <button
            type="button"
            onClick={() => setExpandedAlbumId(null)}
            className={`inline-flex items-center gap-1.5 ${theme.textMain} hover:opacity-80 transition-opacity`}
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">返回剪影照片流</span>
          </button>
          <span className={`${theme.textMuted} text-xs`}>
            {expandedEntry.title || '未命名相册'} · {expandedEntry.images.length} 张
          </span>
        </div>

        <div className="flex gap-4 md:gap-6 items-start">
          {detailColumns.map((col, colIndex) => (
            <div key={colIndex} className="flex-1 flex flex-col gap-6 md:gap-8">
              {col.map((entry) => (
                <LoosePhotoPolaroid
                  key={entry.id}
                  entry={entry}
                  onImageClick={onImageClick}
                  onEditEntry={onEditEntry}
                  onDeleteEntry={onDeleteEntry}
                  hideActions
                />
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const columns = buildColumns(entries);

  return (
    <motion.div 
      key="album" 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
      className="flex gap-4 md:gap-6 items-start"
    >
      {columns.map((col, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col gap-6 md:gap-8">
          {col.map((entry) => (
            entry.type === 'loose_photo' ? (
              <LoosePhotoPolaroid
                key={entry.id}
                entry={entry}
                onImageClick={onImageClick}
                onEditEntry={onEditEntry}
                onDeleteEntry={onDeleteEntry}
              />
            ) : (
              <AlbumStack 
                key={entry.id} 
                entry={entry} 
                isExpanded={false}
                onToggle={() => setExpandedAlbumId(entry.id)}
                onImageClick={onImageClick}
                onEditEntry={onEditEntry}
                onDeleteEntry={onDeleteEntry}
              />
            )
          ))}
        </div>
      ))}
    </motion.div>
  );
}

const LoosePhotoPolaroid: React.FC<{
  entry: TimelineEntry;
  onImageClick: (url: string, text?: string) => void;
  onEditEntry: (entry: TimelineEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  hideActions?: boolean;
}> = ({ entry, onImageClick, onEditEntry, onDeleteEntry, hideActions = false }) => {
  const theme = useTheme();
  const img = entry.images[0];
  
  if (!img) return null;

  return (
    <motion.div 
      layout="position"
      className="relative w-full group mb-6"
      style={{ transform: `rotate(${entry.rotation}deg)` }}
    >
      {!hideActions && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditEntry(entry);
            }}
            className={`${theme.cardBg} border ${theme.cardBorder} p-1 rounded-full ${theme.accent} hover:opacity-80 transition-colors`}
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteEntry(entry.id);
            }}
            className={`${theme.cardBg} border ${theme.cardBorder} p-1 rounded-full ${theme.accent} hover:opacity-80 transition-colors`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
      <div 
        className={`relative z-20 shadow-sm rounded-sm overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md cursor-zoom-in border ${theme.cardBorder}`}
        onClick={() => onImageClick(img.imageUrl, img.text)}
      >
        <SafeImage src={img.imageUrl} className={`w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 ${theme.imageFilter}`} />
      </div>
      
      {img.text && (
        <div className="pt-3 text-center">
          <p className={`${theme.textMuted} text-sm font-serif font-medium px-2 leading-relaxed text-center`}>
            {img.text}
          </p>
        </div>
      )}
    </motion.div>
  );
};

const AlbumStack: React.FC<{
  entry: TimelineEntry;
  onImageClick: (url: string, text?: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  onEditEntry: (entry: TimelineEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}> = ({ entry, onImageClick, isExpanded, onToggle, onEditEntry, onDeleteEntry }) => {
  const theme = useTheme();

  return (
    <motion.div layout="position" className="relative flex flex-col w-full mb-6">
      <AnimatePresence mode="popLayout" initial={false}>
        {!isExpanded ? (
          <motion.div 
            key="collapsed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative cursor-pointer group w-full"
            onClick={onToggle}
            style={{ transform: `rotate(${entry.rotation}deg)` }}
          >
            <div className="absolute top-2 right-2 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditEntry(entry);
                }}
                className={`${theme.cardBg} border ${theme.cardBorder} p-1.5 rounded-full ${theme.accent} hover:opacity-80 transition-colors`}
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEntry(entry.id);
                }}
                className={`${theme.cardBg} border ${theme.cardBorder} p-1.5 rounded-full ${theme.accent} hover:opacity-80 transition-colors`}
              >
                <Trash2 size={12} />
              </button>
            </div>
            {/* Photo Pile Effect (Background layers) */}
            {entry.images.slice(1, 4).map((img, i) => (
              <div 
                key={img.id}
                className="absolute inset-0 shadow-sm rounded-sm overflow-hidden border border-stone-200/40 transition-transform duration-300"
                style={{ 
                  transform: `rotate(${i % 2 === 0 ? 3 + i : -3 - i}deg) translate(${2 + i * 2}px, ${2 + i * 2}px)`,
                  zIndex: 10 - i
                }}
              >
                <SafeImage src={img.imageUrl} className="w-full h-full object-cover opacity-70 grayscale-[30%]" />
              </div>
            ))}
            
            {/* Top Photo */}
            <div className={`relative z-20 shadow-md rounded-sm overflow-hidden group-hover:-translate-y-1 transition-transform duration-300 border ${theme.cardBorder}`}>
              <SafeImage src={entry.images[0].imageUrl} className={`w-full h-auto object-cover ${theme.imageFilter}`} />
              
              {/* Overlay Info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className={`text-white ${theme.fontTitle} font-bold text-lg tracking-wider drop-shadow-md`}>{entry.title}</h3>
                <p className="text-white/90 text-xs font-medium mt-1 flex items-center gap-1 drop-shadow-md">
                  <Camera size={12} /> {entry.images.length} 张照片
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={`relative flex flex-col gap-6 p-4 rounded-xl ${theme.cardBg} border ${theme.cardBorder} overflow-hidden`}
          >
            {/* Connecting Line */}
            <div className={`absolute left-8 top-16 bottom-10 w-px border-l-2 border-dashed ${theme.cardBorder} z-0`}></div>

            {/* Header */}
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className={`${theme.textMain} ${theme.fontTitle} font-bold text-lg tracking-wider`}>{entry.title}</h3>
                <p className={`${theme.textMuted} text-xs font-medium mt-1`}>{entry.date}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEntry(entry);
                  }}
                  className={`${theme.accent} hover:opacity-80 transition-colors ${theme.cardBg} backdrop-blur-sm p-1.5 rounded-full shadow-sm border ${theme.cardBorder}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEntry(entry.id);
                  }}
                  className={`${theme.accent} hover:opacity-80 transition-colors ${theme.cardBg} backdrop-blur-sm p-1.5 rounded-full shadow-sm border ${theme.cardBorder}`}
                >
                  <Trash2 size={14} />
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggle(); }}
                  className={`${theme.textMuted} hover:opacity-80 transition-colors ${theme.cardBg} backdrop-blur-sm p-1.5 rounded-full shadow-sm border ${theme.cardBorder}`}
                >
                  <ChevronUp size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Photos */}
            <div className="relative z-10 flex flex-col gap-8 mt-2">
              {entry.images.map((img, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={img.id} 
                  className="relative group flex flex-col"
                  style={{ transform: `rotate(${idx % 2 === 0 ? -1 : 1}deg)` }}
                >
                  <div 
                    className={`overflow-hidden rounded-sm shadow-sm cursor-zoom-in border ${theme.cardBorder} ${theme.cardBg}`}
                    onClick={() => onImageClick(img.imageUrl, img.text)}
                  >
                    <SafeImage src={img.imageUrl} className={`w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 ${theme.imageFilter}`} />
                  </div>
                  {img.text && (
                    <p className={`${theme.textMuted} text-sm mt-3 font-serif font-medium px-2 leading-relaxed text-center`}>
                      {img.text}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddEntryModal({
  onClose,
  onAdd,
  existingEvents,
  onUploadImage,
}: {
  onClose: () => void;
  onAdd: (type: 'timeline' | 'album' | 'treehole', data: any) => void;
  existingEvents: TimelineEntry[];
  onUploadImage: (file: File) => Promise<string>;
}) {
  const theme = useTheme();
  const notify = useNotice();
  const [type, setType] = useState<'timeline' | 'album' | 'treehole'>('timeline');
  const [eventId, setEventId] = useState<'new' | string>('new');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;
    const filesToUpload = selectedFiles.slice(0, MAX_ENTRY_UPLOAD_IMAGES);

    setIsUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const url = await onUploadImage(file);
        uploadedUrls.push(url);
      }
      setImageUrls(uploadedUrls);
      if (selectedFiles.length > MAX_ENTRY_UPLOAD_IMAGES) {
        notify(`一次最多上传 ${MAX_ENTRY_UPLOAD_IMAGES} 张，已保留前 ${MAX_ENTRY_UPLOAD_IMAGES} 张。`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '图片上传失败';
      notify(message);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'timeline') {
      if (eventId === 'new' && (!title.trim() || !date)) return;
      onAdd(type, { eventId, title, date, description, imageUrls, text });
    } else if (type === 'album') {
      if ((eventId === 'new' || eventId === 'loose') && !date) return;
      if (eventId === 'new' && !title.trim()) return;
      onAdd(type, { eventId, title, date, imageUrls, text });
    } else if (type === 'treehole') {
      if (!text.trim()) return;
      onAdd('treehole', { date, text });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`relative w-full max-w-lg ${theme.cardBg} rounded-[2.5rem] shadow-2xl border ${theme.cardBorder} p-6 md:p-8 overflow-hidden max-h-[90vh] overflow-y-auto`}
      >
        <button type="button" onClick={onClose} className={`absolute top-6 right-6 ${theme.textMuted} hover:opacity-80 transition-colors bg-black/5 p-2 rounded-full`}>
          <X size={20} strokeWidth={3} />
        </button>

        <h2 className={`font-bold text-2xl ${theme.textMain} mb-6 flex items-center gap-2 ${theme.fontTitle}`}>
          记录新瞬间 <Sparkles className={theme.accent} size={20} />
        </h2>

        {/* Type Selector */}
        <div className="flex gap-2 p-1.5 bg-black/5 rounded-2xl mb-8">
          {(['timeline', 'album', 'treehole'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setType(t); setEventId(t === 'album' ? 'loose' : 'new'); setImageUrls([]); setText(''); }}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                type === t ? `${theme.cardBg} ${theme.accent} shadow-sm` : `${theme.textMuted} hover:opacity-80`
              }`}
            >
              {t === 'timeline' && <Clock size={16} strokeWidth={2.5} />}
              {t === 'album' && <ImageIcon size={16} strokeWidth={2.5} />}
              {t === 'treehole' && <MessageSquare size={16} strokeWidth={2.5} />}
              {t === 'timeline' ? '事件档案' : t === 'album' ? '相册直传' : '树洞'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Timeline Specific Fields */}
          {type === 'timeline' && (
            <>
              {/* Event Selection */}
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className={`block text-sm font-bold ${theme.textMuted} mb-2 tracking-widest`}>归属事件</label>
                <div className="relative">
                  <Star className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.accent}`} size={18} />
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className={`w-full pl-12 pr-10 py-3 bg-transparent border ${theme.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-sans ${theme.textMain} font-bold appearance-none`}
                  >
                    <option value="new">+ 创建新事件</option>
                    {existingEvents.filter(e => e.type !== 'album' && e.type !== 'loose_photo').map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                </div>
              </motion.div>

              {/* New Event Fields */}
              <AnimatePresence>
                {eventId === 'new' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className={`space-y-6 bg-black/5 p-4 rounded-2xl border ${theme.cardBorder} mt-4`}
                  >
                    <div>
                      <label className={`block text-sm font-bold ${theme.textMuted} mb-2 tracking-widest`}>事件名称</label>
                      <input
                        type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="例如：卿卿日常开播"
                        className={`w-full px-4 py-3 bg-transparent border ${theme.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-sans ${theme.textMain} font-bold`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold ${theme.textMuted} mb-2 tracking-widest`}>发生日期</label>
                      <div className="relative">
                        <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.accent}`} size={18} />
                        <input
                          type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 bg-transparent border ${theme.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-sans ${theme.textMain} font-bold`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-bold ${theme.textMuted} mb-2 tracking-widest`}>事件描述 (可选)</label>
                      <textarea
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="简单描述一下这个事件..."
                        rows={2}
                        className={`w-full p-4 bg-transparent border ${theme.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-sans ${theme.textMain} font-medium resize-none`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Album Specific Fields */}
          {type === 'album' && (
            <>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className={`block text-sm font-bold ${theme.textMuted} mb-2 tracking-widest`}>归属相册</label>
                <div className="relative">
                  <Star className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.accent}`} size={18} />
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className={`w-full pl-12 pr-10 py-3 bg-transparent border ${theme.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-sans ${theme.textMain} font-bold appearance-none`}
                  >
                    <option value="loose">散落照片 (不归入任何相册)</option>
                    <option value="new">+ 新建相册</option>
                    {existingEvents.filter(e => e.type === 'album').map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={18} />
                </div>
              </motion.div>

              <AnimatePresence>
                {eventId === 'new' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                    <label className={`block text-sm font-bold ${theme.textMuted} mb-2 tracking-widest`}>相册名称</label>
                    <div className="relative">
                      <Star className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.accent}`} size={18} />
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例如：周末随拍"
                        className={`w-full pl-12 pr-4 py-3 bg-transparent border ${theme.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-sans ${theme.textMain} font-bold`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {(eventId === 'new' || eventId === 'loose') && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                    <label className={`block text-sm font-bold ${theme.textMuted} mb-2 tracking-widest`}>日期</label>
                    <div className="relative">
                      <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.accent}`} size={18} />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 bg-transparent border ${theme.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 transition-all font-sans ${theme.textMain} font-bold`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Shared Image Upload for Timeline and Album */}
          {(type === 'timeline' || type === 'album') && (
            <>
              {/* Local Image Upload Field */}
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                <label className="block text-sm font-bold text-stone-500 mb-2 tracking-widest">上传照片 (可选，单次最多 10 张；单个事件/相册最多 30 张)</label>
                <label className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-pink-200 rounded-xl bg-pink-50/50 hover:bg-pink-50 transition-colors cursor-pointer overflow-hidden group">
                  {imageUrls.length > 0 ? (
                    <div className="relative w-full h-full p-2">
                      <div className="grid h-full grid-cols-5 gap-1">
                        {imageUrls.slice(0, 10).map((url, idx) => (
                          <img key={`${url}-${idx}`} src={url} className="h-full w-full rounded-md object-cover" alt={`Preview ${idx + 1}`} />
                        ))}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-medium text-sm">点击重新选择图片</span>
                      </div>
                      <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white">
                        {imageUrls.length} / {MAX_ENTRY_UPLOAD_IMAGES}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-pink-400">
                      <ImagePlus size={28} className="mb-2 opacity-80" />
                      <span className="text-sm font-bold">点击选择本地图片（可多选）</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" multiple disabled={isUploadingImage} onChange={(e) => void handleImageInput(e)} />
                </label>
              </motion.div>

              {/* Image Text/Remark Field */}
              {imageUrls.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                  <label className="block text-sm font-bold text-stone-500 mb-2 tracking-widest">照片备注 (可选，批量上传会应用到全部照片)</label>
                  <textarea
                    value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="写一句简短的描述..."
                    rows={2}
                    className="w-full p-4 bg-[#fffcfc] border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300/50 focus:border-pink-300 transition-all font-sans text-stone-700 font-medium resize-none"
                  />
                </motion.div>
              )}
            </>
          )}

          {/* Treehole Specific Fields */}
          {type === 'treehole' && (
            <>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-bold text-stone-500 mb-2 tracking-widest">日期</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400" size={18} />
                  <input
                    type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#fffcfc] border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300/50 focus:border-pink-300 transition-all font-sans text-stone-700 font-bold"
                  />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-bold text-stone-500 mb-2 tracking-widest">树洞留言</label>
                <textarea
                  required value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="写下你想记录的瞬间..."
                  rows={4}
                  className="w-full p-4 bg-[#fffcfc] border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300/50 focus:border-pink-300 transition-all font-sans text-stone-700 font-medium resize-none"
                />
              </motion.div>
            </>
          )}

          <button
            type="submit"
            disabled={isUploadingImage}
            className="w-full py-4 bg-pink-400 text-white rounded-xl hover:bg-pink-500 transition-colors duration-300 font-bold tracking-widest mt-4 shadow-[0_8px_20px_rgba(244,114,182,0.3)] text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {type === 'timeline' ? '保存至档案' : type === 'album' ? '保存至相册' : '投入树洞'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function TextPromptModal({
  isOpen,
  title,
  label,
  value,
  placeholder,
  multiline = false,
  inputType = 'text',
  confirmText = '确定',
  allowEmpty = false,
  onChange,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  inputType?: 'text' | 'date';
  confirmText?: string;
  allowEmpty?: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select?.();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const isConfirmDisabled = !allowEmpty && !value.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            className={`relative w-full max-w-2xl rounded-3xl ${theme.cardBg} border ${theme.cardBorder} shadow-2xl p-6 md:p-8`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`${theme.textMain} ${theme.fontTitle} text-2xl font-bold mb-6`}>{title}</h3>
            <label className={`block text-sm font-semibold mb-2 ${theme.textMuted}`}>{label}</label>
            {multiline ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                placeholder={placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isConfirmDisabled) {
                    e.preventDefault();
                    onConfirm();
                  }
                }}
                className={`w-full resize-none rounded-2xl border ${theme.cardBorder} bg-transparent px-4 py-3 ${theme.textMain} focus:outline-none focus:ring-2 focus:ring-black/10`}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={inputType}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                  }
                  if (e.key === 'Enter' && !isConfirmDisabled) {
                    e.preventDefault();
                    onConfirm();
                  }
                }}
                className={`w-full rounded-2xl border ${theme.cardBorder} bg-transparent px-4 py-3 ${theme.textMain} focus:outline-none focus:ring-2 focus:ring-black/10`}
              />
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className={`px-6 py-2.5 rounded-full border ${theme.cardBorder} ${theme.textMuted} hover:opacity-80 transition-colors`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isConfirmDisabled}
                className={`px-6 py-2.5 rounded-full ${theme.button} disabled:opacity-45 disabled:cursor-not-allowed transition-colors`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmText = '确定',
  danger = false,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const theme = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            className={`relative w-full max-w-xl rounded-3xl ${theme.cardBg} border ${theme.cardBorder} shadow-2xl p-6 md:p-8`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`${theme.textMain} ${theme.fontTitle} text-2xl font-bold mb-4`}>{title}</h3>
            <p className={`${theme.textMuted} text-base leading-relaxed`}>{message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className={`px-6 py-2.5 rounded-full border ${theme.cardBorder} ${theme.textMuted} hover:opacity-80 transition-colors`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-6 py-2.5 rounded-full text-white transition-colors ${danger ? 'bg-rose-500 hover:bg-rose-600' : theme.bgAccent}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChangePasswordModal({
  isOpen,
  currentPassword,
  newPassword,
  confirmPassword,
  errorMessage,
  isSubmitting,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onCancel,
  onSubmit,
}: {
  isOpen: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const theme = useTheme();
  const currentInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      currentInputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const strength = getPasswordStrength(newPassword);
  const hasMinLength = newPassword.length >= 8;
  const matchesConfirm = newPassword.length > 0 && newPassword === confirmPassword;
  const differsFromCurrent = newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword;

  const isConfirmDisabled =
    isSubmitting ||
    !currentPassword ||
    !newPassword ||
    !confirmPassword ||
    !hasMinLength ||
    !matchesConfirm ||
    !differsFromCurrent;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 md:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={isSubmitting ? undefined : onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            className={`relative w-full max-w-xl rounded-3xl ${theme.cardBg} border ${theme.cardBorder} shadow-2xl p-6 md:p-8`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`${theme.textMain} ${theme.fontTitle} text-2xl font-bold mb-5`}>修改密码</h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.textMuted}`}>当前密码</label>
                <input
                  ref={currentInputRef}
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => onCurrentPasswordChange(e.target.value)}
                  className={`w-full rounded-2xl border ${theme.cardBorder} bg-transparent px-4 py-3 ${theme.textMain} focus:outline-none focus:ring-2 focus:ring-black/10`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.textMuted}`}>新密码</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => onNewPasswordChange(e.target.value)}
                  className={`w-full rounded-2xl border ${theme.cardBorder} bg-transparent px-4 py-3 ${theme.textMain} focus:outline-none focus:ring-2 focus:ring-black/10`}
                />
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex w-24 gap-1">
                    <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 1 ? 'bg-rose-400' : 'bg-stone-300'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 2 ? 'bg-amber-400' : 'bg-stone-300'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${strength.score >= 3 ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  </div>
                  <span className={`text-xs ${theme.textMuted}`}>强度：{strength.label}</span>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme.textMuted}`}>确认新密码</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && !isSubmitting) {
                      e.preventDefault();
                      onCancel();
                    }
                    if (e.key === 'Enter' && !isConfirmDisabled) {
                      e.preventDefault();
                      onSubmit();
                    }
                  }}
                  className={`w-full rounded-2xl border ${theme.cardBorder} bg-transparent px-4 py-3 ${theme.textMain} focus:outline-none focus:ring-2 focus:ring-black/10`}
                />
              </div>

              {!hasMinLength && newPassword.length > 0 && (
                <p className="text-xs text-rose-500">新密码长度至少 8 位</p>
              )}
              {!differsFromCurrent && newPassword.length > 0 && currentPassword.length > 0 && (
                <p className="text-xs text-rose-500">新密码不能与当前密码相同</p>
              )}
              {!matchesConfirm && confirmPassword.length > 0 && (
                <p className="text-xs text-rose-500">两次输入的新密码不一致</p>
              )}
              {errorMessage && <p className="text-sm text-rose-500">{errorMessage}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onCancel}
                className={`px-6 py-2.5 rounded-full border ${theme.cardBorder} ${theme.textMuted} hover:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isConfirmDisabled}
                className={`px-6 py-2.5 rounded-full ${theme.button} disabled:opacity-45 disabled:cursor-not-allowed transition-colors`}
              >
                {isSubmitting ? '提交中...' : '确认修改'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NoticeStack({
  notices,
  onDismiss,
}: {
  notices: NoticeItem[];
  onDismiss: (id: number) => void;
}) {
  const theme = useTheme();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[140] flex w-[min(92vw,420px)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {notices.map((notice) => (
          <motion.button
            key={notice.id}
            type="button"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            onClick={() => onDismiss(notice.id)}
            className={`pointer-events-auto w-full rounded-2xl border ${theme.cardBorder} ${theme.cardBg} px-4 py-3 text-left shadow-xl backdrop-blur-md`}
          >
            <p className={`${theme.textMain} text-sm font-medium leading-relaxed`}>{notice.message}</p>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AdminDashboardPanel({
  isOpen,
  data,
  isLoading,
  errorMessage,
  onRefresh,
  onClose,
}: {
  isOpen: boolean;
  data: AdminDashboardStats | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const theme = useTheme();

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const usagePercent = Math.max(0, data?.usagePercent ?? 0);
  const usageBarPercent = Math.min(usagePercent, 100);
  const usageColorClass = usagePercent >= 95 ? 'bg-rose-500' : usagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  const generatedAtText = data ? new Date(data.generatedAt).toLocaleString('zh-CN', {hour12: false}) : '-';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          className="fixed inset-0 z-[160] bg-black/45 backdrop-blur-sm p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{opacity: 0, y: 18, scale: 0.98}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 12, scale: 0.98}}
            transition={{duration: 0.2}}
            onClick={(event) => event.stopPropagation()}
            className={`mx-auto flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border ${theme.cardBorder} ${theme.cardBg} shadow-2xl`}
          >
            <div className={`flex items-center justify-between border-b px-5 py-4 md:px-7 ${theme.cardBorder}`}>
              <div>
                <p className={`text-[11px] uppercase tracking-[0.25em] ${theme.textMuted}`}>Admin</p>
                <h2 className={`mt-1 text-xl font-semibold ${theme.textMain}`}>后台管理面板</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRefresh}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${theme.cardBorder} ${theme.textMain} hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50`}
                  disabled={isLoading}
                >
                  <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                  刷新
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${theme.cardBorder} ${theme.textMain} hover:opacity-80`}
                  aria-label="关闭管理面板"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-5 py-5 md:px-7 md:py-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className={`text-sm ${theme.textMuted}`}>最近更新时间：{generatedAtText}</p>
                {usagePercent >= 90 && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-xs text-rose-600">
                    <AlertTriangle size={13} />
                    容量占用接近上限，请及时扩容
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {errorMessage}
                </div>
              )}

              {!data && isLoading && (
                <div className={`rounded-2xl border ${theme.cardBorder} px-4 py-10 text-center text-sm ${theme.textMuted}`}>
                  正在加载管理数据...
                </div>
              )}

              {data && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className={`rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-4`}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className={`text-xs uppercase tracking-[0.2em] ${theme.textMuted}`}>用户总数</p>
                        <Users size={16} className={theme.accent} />
                      </div>
                      <p className={`text-2xl font-semibold ${theme.textMain}`}>{data.userCount}</p>
                    </div>
                    <div className={`rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-4`}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className={`text-xs uppercase tracking-[0.2em] ${theme.textMuted}`}>空间数量</p>
                        <Database size={16} className={theme.accent} />
                      </div>
                      <p className={`text-2xl font-semibold ${theme.textMain}`}>{data.spaceCount}</p>
                    </div>
                    <div className={`rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-4`}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className={`text-xs uppercase tracking-[0.2em] ${theme.textMuted}`}>照片文件</p>
                        <Images size={16} className={theme.accent} />
                      </div>
                      <p className={`text-2xl font-semibold ${theme.textMain}`}>{data.photoFileCount}</p>
                    </div>
                    <div className={`rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-4`}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className={`text-xs uppercase tracking-[0.2em] ${theme.textMuted}`}>已用容量</p>
                        <HardDrive size={16} className={theme.accent} />
                      </div>
                      <p className={`text-2xl font-semibold ${theme.textMain}`}>{formatBytes(data.usedBytes)}</p>
                    </div>
                  </div>

                  <div className={`rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-4`}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className={`text-sm font-semibold ${theme.textMain}`}>容量使用情况</p>
                      <span className={`text-xs ${theme.textMuted}`}>{formatPercent(usagePercent)}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-stone-200/80">
                      <div className={`h-full ${usageColorClass}`} style={{width: `${usageBarPercent}%`}} />
                    </div>
                    <div className={`mt-2 flex flex-wrap gap-3 text-xs ${theme.textMuted}`}>
                      <span>总容量：{formatBytes(data.capacityBytes)}</span>
                      <span>剩余：{formatBytes(data.remainingBytes)}</span>
                      <span>已用：{formatBytes(data.usedBytes)}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">已关联照片</p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-700">{data.referencedExistingPhotoCount}</p>
                      <p className="mt-1 text-xs text-emerald-600">数据库记录且文件存在</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-600">孤立文件</p>
                      <p className="mt-2 text-2xl font-semibold text-amber-700">{data.orphanPhotoFileCount}</p>
                      <p className="mt-1 text-xs text-amber-600">磁盘存在但未被记录引用</p>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-rose-600">缺失文件</p>
                      <p className="mt-2 text-2xl font-semibold text-rose-700">{data.missingPhotoFileCount}</p>
                      <p className="mt-1 text-xs text-rose-600">数据库引用但文件丢失</p>
                    </div>
                  </div>

                  <div className={`rounded-2xl border ${theme.cardBorder} ${theme.cardBg} p-4`}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className={`text-sm font-semibold ${theme.textMain}`}>按用户存储分布</p>
                      <span className={`text-xs ${theme.textMuted}`}>共 {data.perUser.length} 个账号节点</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className={`border-b ${theme.cardBorder}`}>
                            <th className={`px-2 py-2 text-xs font-medium uppercase tracking-[0.15em] ${theme.textMuted}`}>用户</th>
                            <th className={`px-2 py-2 text-xs font-medium uppercase tracking-[0.15em] ${theme.textMuted}`}>空间</th>
                            <th className={`px-2 py-2 text-xs font-medium uppercase tracking-[0.15em] ${theme.textMuted}`}>照片文件</th>
                            <th className={`px-2 py-2 text-xs font-medium uppercase tracking-[0.15em] ${theme.textMuted}`}>已引用</th>
                            <th className={`px-2 py-2 text-xs font-medium uppercase tracking-[0.15em] ${theme.textMuted}`}>使用容量</th>
                            <th className={`px-2 py-2 text-xs font-medium uppercase tracking-[0.15em] ${theme.textMuted}`}>占比</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.perUser.map((item) => (
                            <tr key={item.userId} className={`border-b last:border-b-0 ${theme.cardBorder}`}>
                              <td className="px-2 py-2 align-top">
                                <div className={`font-medium ${theme.textMain}`}>{item.nickname}</div>
                                <div className={`text-xs ${theme.textMuted}`}>{item.email === '-' ? '未登记邮箱' : item.email}</div>
                              </td>
                              <td className={`px-2 py-2 ${theme.textMain}`}>{item.spaceCount}</td>
                              <td className={`px-2 py-2 ${theme.textMain}`}>{item.photoFileCount}</td>
                              <td className={`px-2 py-2 ${theme.textMain}`}>{item.referencedPhotoCount}</td>
                              <td className={`px-2 py-2 ${theme.textMain}`}>{formatBytes(item.storageBytes)}</td>
                              <td className={`px-2 py-2 ${theme.textMain}`}>{formatPercent(item.storageSharePercent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className={`text-xs ${theme.textMuted}`}>
                    引用照片总数：{data.photoReferenceCount}（去重后）。
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Portal Component ---
function Portal({
  spaces,
  portalTitle,
  onUpdatePortalTitle,
  onSelectSpace,
  onCreateSpace,
  onRenameSpace,
  onDeleteSpace,
}: {
  spaces: Space[];
  portalTitle: string;
  onUpdatePortalTitle: (title: string) => void;
  onSelectSpace: (id: string) => void;
  onCreateSpace: (name: string, avatar: string) => Promise<void>;
  onRenameSpace: (id: string, name: string) => Promise<void>;
  onDeleteSpace: (id: string) => Promise<void>;
}) {
  const theme = useTheme();
  const notify = useNotice();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Space | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Space | null>(null);
  const [isEditingPortalTitle, setIsEditingPortalTitle] = useState(false);
  const [portalTitleDraft, setPortalTitleDraft] = useState(portalTitle);

  React.useEffect(() => {
    if (!isEditingPortalTitle) {
      setPortalTitleDraft(portalTitle);
    }
  }, [portalTitle, isEditingPortalTitle]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newAvatar) {
      setIsSubmitting(true);
      try {
        await onCreateSpace(newName, newAvatar);
        setIsCreating(false);
        setNewName('');
        setNewAvatar('');
      } catch (error) {
        const message = error instanceof Error ? error.message : '创建空间失败';
        notify(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      try {
        const url = await uploadImage(file);
        setNewAvatar(url);
      } catch (error) {
        const message = error instanceof Error ? error.message : '头像上传失败';
        notify(message);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleRenameSpace = async (space: Space) => {
    const trimmedName = renameDraft.trim();
    if (!trimmedName || trimmedName === space.name) {
      setRenameTarget(null);
      return;
    }

    try {
      await onRenameSpace(space.id, trimmedName);
      setRenameTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '修改空间名称失败';
      notify(message);
    }
  };

  const handleDeleteSpace = async (space: Space) => {
    try {
      await onDeleteSpace(space.id);
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除空间失败';
      notify(message);
    }
  };

  const handleSavePortalTitle = () => {
    const trimmedTitle = portalTitleDraft.trim();
    if (!trimmedTitle) {
      notify('标题不能为空');
      return;
    }
    if (trimmedTitle !== portalTitle) {
      onUpdatePortalTitle(trimmedTitle);
    }
    setIsEditingPortalTitle(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] relative overflow-hidden flex flex-col items-center justify-center py-20 selection:bg-stone-200">
      {/* Massive Background Typography */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[18vw] font-serif text-stone-200/40 whitespace-nowrap pointer-events-none tracking-tighter font-bold select-none">
        ARCHIVE
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <div className="group relative inline-flex items-center justify-center pr-10 md:pr-12 mb-6">
            <h1 className="text-3xl md:text-4xl font-serif text-stone-800 tracking-[0.2em]">{portalTitle}</h1>
            <button
              type="button"
              onClick={() => {
                setPortalTitleDraft(portalTitle);
                setIsEditingPortalTitle(true);
              }}
              aria-label="修改空间页标题"
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full ${theme.cardBg} border ${theme.cardBorder} ${theme.accent} shadow-sm invisible opacity-0 pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:visible focus-visible:opacity-100 focus-visible:pointer-events-auto hover:opacity-80 transition-all duration-200`}
            >
              <Pencil size={14} />
            </button>
          </div>
          <div className="w-12 h-[1px] bg-stone-400 mx-auto"></div>
        </motion.div>

        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
          {spaces.map((space, index) => {
            // Pseudo-random rotation and vertical offset for the "handmade disorder" feel
            const rotation = index % 2 === 0 ? (index % 3 === 0 ? -3 : 2) : (index % 3 === 0 ? 4 : -2);
            const translateY = index % 2 !== 0 ? 'translate-y-8 md:translate-y-16' : '';

            return (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.8, ease: "easeOut" }}
                className={`relative group cursor-pointer ${translateY} perspective-[1500px]`}
                onClick={() => onSelectSpace(space.id)}
                style={{ rotate: `${rotation}deg` }}
                whileHover={{ scale: 1.05, rotate: 0, zIndex: 50, transition: { duration: 0.4 } }}
              >
                <div className="absolute top-2 right-2 z-40 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameTarget(space);
                      setRenameDraft(space.name);
                    }}
                    className={`w-7 h-7 flex items-center justify-center rounded-full bg-white/85 ${theme.accent} hover:opacity-80 shadow-sm transition-colors`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(space);
                    }}
                    className={`w-7 h-7 flex items-center justify-center rounded-full bg-white/85 ${theme.accent} hover:opacity-80 shadow-sm transition-colors`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {/* Book Back Cover & Pages Edge */}
                <div className="absolute inset-0 bg-[#EFECE4] shadow-md border border-stone-300/60 rounded-r-md rounded-l-sm transition-all duration-700 z-0 flex justify-end overflow-hidden">
                  {/* Simulated pages edge */}
                  <div className="w-3 h-full bg-[repeating-linear-gradient(to_bottom,#d6d3c9_0px,#d6d3c9_1px,transparent_1px,transparent_3px)] opacity-60 border-l border-stone-300/30"></div>
                </div>

                {/* Layer 3: Artbook Cover (Top) */}
                <div className="relative z-10 w-[288px] h-[416px] bg-[#EAE7DF] p-5 shadow-[5px_5px_15px_rgba(0,0,0,0.1)] border border-stone-300/60 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] origin-left group-hover:-rotate-y-[15deg] group-hover:shadow-[20px_10px_30px_rgba(0,0,0,0.2)] flex flex-col rounded-r-sm rounded-l-sm">
                  
                  {/* Book spine shadow effect on the left */}
                  <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/[0.06] to-transparent"></div>
                  <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-stone-300/40"></div>
                  
                  {/* Inner shadow for the opening effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                  {/* Content Wrapper (shifted right to account for spine) */}
                  <div className="flex flex-col h-full pl-4">
                    {/* Top Label */}
                    <div className="flex justify-between items-center mb-4 mt-1">
                      <span className="font-mono text-[10px] text-stone-500 tracking-widest uppercase">Vol. {String(index + 1).padStart(2, '0')}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400/60"></div>
                    </div>

                    {/* Tipped-in Photo */}
                    <div className="relative w-full flex-1 bg-stone-200 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden">
                      <img
                        src={space.avatarImage}
                        alt={space.name}
                        className="w-full h-full object-cover filter contrast-[1.02] transition-transform duration-700"
                        style={{
                          objectPosition: `${space.avatarFocus.x}% ${space.avatarFocus.y}%`,
                          transformOrigin: `${space.avatarFocus.x}% ${space.avatarFocus.y}%`,
                          transform: `scale(${space.avatarFocus.scale})`,
                        }}
                      />
                    </div>
                    
                    {/* Title Area */}
                    <div className="mt-5 mb-1 flex flex-col">
                      <h2 className="font-serif text-2xl text-stone-800 tracking-widest leading-none uppercase truncate">{space.name}</h2>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] font-mono text-stone-500 tracking-[0.2em] uppercase">Archive</span>
                        <span className="text-stone-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0">
                          &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Create New Space Button */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: spaces.length * 0.15, duration: 0.8 }}
            className={`relative group cursor-pointer ${spaces.length % 2 !== 0 ? 'translate-y-8 md:translate-y-16' : ''}`}
            onClick={() => setIsCreating(true)}
            style={{ rotate: '1deg' }}
            whileHover={{ scale: 1.02, rotate: 0, zIndex: 50 }}
          >
            {/* Background dashed layer for thickness */}
            <div className="absolute inset-0 border border-stone-300/60 border-dashed rounded-sm transition-all duration-500 group-hover:rotate-[4deg] group-hover:translate-x-4 group-hover:translate-y-2 z-0 origin-bottom-left"></div>
            
            {/* Main dashed layer */}
            <div className="relative z-10 w-[288px] h-[416px] border border-stone-300 border-dashed flex flex-col items-center justify-center transition-all duration-500 group-hover:border-stone-400 bg-[#F4F1EA] group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]">
              <div className="w-12 h-12 rounded-full border border-stone-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:border-stone-400">
                <Plus className="text-stone-400 group-hover:text-stone-600 transition-colors" size={24} />
              </div>
              <span className="text-stone-400 font-serif tracking-widest text-sm group-hover:text-stone-600 transition-colors">NEW CHAPTER</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#F4F1EA] rounded-none border border-stone-200 p-10 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsCreating(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-800 transition-colors"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
              
              <h2 className="text-2xl font-serif text-stone-800 mb-8 text-center tracking-widest">开启新篇章</h2>
              
              <form onSubmit={handleCreate} className="space-y-8">
                <div>
                  <label className="block text-xs font-serif tracking-widest text-stone-500 mb-3 uppercase">Name</label>
                  <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-0 py-2 bg-transparent border-b border-stone-300 focus:outline-none focus:border-stone-800 transition-colors font-serif text-lg text-stone-800 placeholder:text-stone-300"
                    placeholder="角色名称..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif tracking-widest text-stone-500 mb-3 uppercase">Portrait</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-48 border border-stone-300 border-dashed cursor-pointer bg-stone-50/50 hover:bg-stone-100/50 transition-colors overflow-hidden relative">
                      {newAvatar ? (
                        <img src={newAvatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-6 h-6 text-stone-400 mb-3" strokeWidth={1.5} />
                          <p className="text-xs font-serif tracking-widest text-stone-400">UPLOAD PHOTO</p>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" disabled={isUploadingAvatar} onChange={(e) => void handleImageUpload(e)} required={!newAvatar} />
                    </label>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || isUploadingAvatar}
                  className="w-full py-4 bg-stone-800 text-[#F4F1EA] font-serif text-sm tracking-[0.2em] hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CREATE
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TextPromptModal
        isOpen={isEditingPortalTitle}
        title="修改空间页标题"
        label="标题"
        value={portalTitleDraft}
        onChange={setPortalTitleDraft}
        onCancel={() => setIsEditingPortalTitle(false)}
        onConfirm={handleSavePortalTitle}
      />

      <TextPromptModal
        isOpen={renameTarget !== null}
        title="修改空间名称"
        label="空间名称"
        value={renameDraft}
        onChange={setRenameDraft}
        onCancel={() => setRenameTarget(null)}
        onConfirm={() => {
          if (renameTarget) void handleRenameSpace(renameTarget);
        }}
      />

      <ConfirmActionModal
        isOpen={deleteTarget !== null}
        title="确认删除空间"
        message={deleteTarget ? `确认删除空间「${deleteTarget.name}」吗？此操作不可撤销。` : ''}
        confirmText="删除"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void handleDeleteSpace(deleteTarget);
        }}
      />
    </div>
  );
}

function AuthPanel({
  onLogin,
  onRegister,
  theme,
}: {
  onLogin: (payload: {email: string; password: string}) => Promise<void>;
  onRegister: (payload: {email: string; password: string; nickname: string}) => Promise<void>;
  theme: (typeof THEMES)[ThemeName];
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await onLogin({
          email: email.trim(),
          password: password.trim(),
        });
      } else {
        await onRegister({
          email: email.trim(),
          password: password.trim(),
          nickname: nickname.trim(),
        });
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '认证失败，请重试';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, onLogin, onRegister, email, password, nickname]);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${theme.globalBg} ${theme.textMain}`}>
      <motion.div
        initial={{opacity: 0, y: 14}}
        animate={{opacity: 1, y: 0}}
        className={`w-full max-w-md ${theme.cardBg} ${theme.cardBorder} ${theme.cardShadow} ${theme.radius} border p-8`}
      >
        <div className="mb-6 text-center">
          <p className={`text-xs tracking-[0.2em] uppercase ${theme.textMuted}`}>Digital Journal</p>
          <h1 className={`mt-3 text-3xl ${theme.fontTitle}`}>{mode === 'login' ? '欢迎回来' : '创建账号'}</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={`block text-xs mb-1 tracking-wider uppercase ${theme.textMuted}`}>邮箱</label>
            <input
              type="email"
              autoComplete={mode === 'login' ? 'username' : 'email'}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-stone-300 px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-stone-700"
              placeholder="you@example.com"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className={`block text-xs mb-1 tracking-wider uppercase ${theme.textMuted}`}>昵称</label>
              <input
                type="text"
                autoComplete="nickname"
                required
                maxLength={32}
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                className="w-full border border-stone-300 px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-stone-700"
                placeholder="你的昵称"
              />
            </div>
          )}

          <div>
            <label className={`block text-xs mb-1 tracking-wider uppercase ${theme.textMuted}`}>密码</label>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-stone-300 px-3 py-2 bg-white text-stone-900 focus:outline-none focus:border-stone-700"
              placeholder="至少 8 位"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 ${theme.button} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? '提交中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <button
            type="button"
            className={`ml-2 underline ${theme.accent}`}
            onClick={() => {
              setMode((prev) => (prev === 'login' ? 'register' : 'login'));
              setError(null);
            }}
          >
            {mode === 'login' ? '去注册' : '去登录'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main App Entry ---
export default function App() {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const stored = localStorage.getItem('journal-theme') as ThemeName | null;
    return stored && stored in THEMES ? stored : 'default';
  });
  const [portalTitle, setPortalTitle] = useState(() => localStorage.getItem('journal-portal-title') || '我的手账空间');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingSaveRef = useRef<Record<string, Space>>({});
  const saveInFlightRef = useRef<Record<string, boolean>>({});
  const shouldSaveAgainRef = useRef<Record<string, boolean>>({});
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const noticeTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordDraft, setCurrentPasswordDraft] = useState('');
  const [newPasswordDraft, setNewPasswordDraft] = useState('');
  const [confirmPasswordDraft, setConfirmPasswordDraft] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminDashboardStats | null>(null);
  const [isAdminStatsLoading, setIsAdminStatsLoading] = useState(false);
  const [adminStatsError, setAdminStatsError] = useState<string | null>(null);

  const dismissNotice = useCallback((id: number) => {
    const timer = noticeTimersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete noticeTimersRef.current[id];
    }
    setNotices((prev) => prev.filter((notice) => notice.id !== id));
  }, []);

  const notify = useCallback((message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setNotices((prev) => [...prev, {id, message: trimmed}]);
    const timer = setTimeout(() => {
      setNotices((prev) => prev.filter((notice) => notice.id !== id));
      delete noticeTimersRef.current[id];
    }, 2600);
    noticeTimersRef.current[id] = timer;
  }, []);

  React.useEffect(() => {
    localStorage.setItem('journal-theme', themeName);
  }, [themeName]);

  React.useEffect(() => {
    localStorage.setItem('journal-portal-title', portalTitle);
  }, [portalTitle]);

  React.useEffect(() => () => {
    (Object.values(noticeTimersRef.current) as Array<ReturnType<typeof setTimeout>>).forEach((timer) => clearTimeout(timer));
    noticeTimersRef.current = {};
  }, []);

  const clearSpacePersistenceQueues = useCallback(() => {
    (Object.values(saveTimersRef.current) as Array<ReturnType<typeof setTimeout>>).forEach((timer) => clearTimeout(timer));
    saveTimersRef.current = {};
    pendingSaveRef.current = {};
    saveInFlightRef.current = {};
    shouldSaveAgainRef.current = {};
  }, []);

  const resetChangePasswordDialog = useCallback(() => {
    setCurrentPasswordDraft('');
    setNewPasswordDraft('');
    setConfirmPasswordDraft('');
    setChangePasswordError(null);
    setIsChangingPassword(false);
  }, []);

  const moveToSignedOutState = useCallback(() => {
    setCurrentUser(null);
    setSpaces([]);
    setCurrentSpaceId(null);
    setIsChangePasswordOpen(false);
    setIsAdminPanelOpen(false);
    setAdminStats(null);
    setIsAdminStatsLoading(false);
    setAdminStatsError(null);
    clearSpacePersistenceQueues();
    resetChangePasswordDialog();
  }, [clearSpacePersistenceQueues, resetChangePasswordDialog]);

  const normalizeErrorMessage = useCallback((error: unknown, fallback: string): string => (
    error instanceof Error ? error.message : fallback
  ), []);

  const loadAdminStats = useCallback(async () => {
    setIsAdminStatsLoading(true);
    setAdminStatsError(null);
    try {
      const stats = await fetchAdminDashboard();
      setAdminStats(stats);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        notify('登录状态已失效，请重新登录');
        moveToSignedOutState();
        return;
      }
      setAdminStatsError(normalizeErrorMessage(error, '加载管理面板数据失败'));
    } finally {
      setIsAdminStatsLoading(false);
    }
  }, [moveToSignedOutState, normalizeErrorMessage, notify]);

  const openAdminPanel = useCallback(() => {
    setIsAdminPanelOpen(true);
    void loadAdminStats();
  }, [loadAdminStats]);

  const closeAdminPanel = useCallback(() => {
    setIsAdminPanelOpen(false);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await fetchMe();
        if (!mounted) return;
        setCurrentUser(me);

        const data = await fetchSpaces();
        if (!mounted) return;
        setSpaces(data);
        setBootstrapError(null);
      } catch (error) {
        if (!mounted) return;
        if (isApiError(error) && error.status === 401) {
          moveToSignedOutState();
          setBootstrapError(null);
          return;
        }
        setBootstrapError(normalizeErrorMessage(error, '加载空间数据失败'));
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    })();

    return () => {
      mounted = false;
      clearSpacePersistenceQueues();
    };
  }, [clearSpacePersistenceQueues, moveToSignedOutState, normalizeErrorMessage]);

  const handleLogin = useCallback(async (payload: {email: string; password: string}) => {
    const user = await login(payload);
    const data = await fetchSpaces();
    setCurrentUser(user);
    setSpaces(data);
    setCurrentSpaceId(null);
    setIsAdminPanelOpen(false);
    setAdminStats(null);
    setAdminStatsError(null);
    setBootstrapError(null);
  }, []);

  const handleRegister = useCallback(async (payload: {email: string; password: string; nickname: string}) => {
    const user = await register(payload);
    const data = await fetchSpaces();
    setCurrentUser(user);
    setSpaces(data);
    setCurrentSpaceId(null);
    setIsAdminPanelOpen(false);
    setAdminStats(null);
    setAdminStatsError(null);
    setBootstrapError(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      moveToSignedOutState();
    }
  }, [moveToSignedOutState]);

  const openChangePasswordDialog = useCallback(() => {
    resetChangePasswordDialog();
    setIsChangePasswordOpen(true);
  }, [resetChangePasswordDialog]);

  const closeChangePasswordDialog = useCallback(() => {
    if (isChangingPassword) return;
    setIsChangePasswordOpen(false);
    resetChangePasswordDialog();
  }, [isChangingPassword, resetChangePasswordDialog]);

  const handleSubmitChangePassword = useCallback(async () => {
    const currentPassword = currentPasswordDraft;
    const newPassword = newPasswordDraft;
    const confirmPassword = confirmPasswordDraft;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangePasswordError('请完整填写当前密码、新密码和确认密码');
      return;
    }
    if (newPassword.length < 8) {
      setChangePasswordError('新密码长度至少 8 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('两次输入的新密码不一致');
      return;
    }
    if (newPassword === currentPassword) {
      setChangePasswordError('新密码不能与当前密码相同');
      return;
    }

    setChangePasswordError(null);
    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      setIsChangePasswordOpen(false);
      resetChangePasswordDialog();
      notify('密码已更新');
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        if (error.message === 'Current password is incorrect') {
          setChangePasswordError('当前密码错误');
          return;
        }
        notify('登录状态已失效，请重新登录');
        moveToSignedOutState();
        return;
      }
      setChangePasswordError(normalizeErrorMessage(error, '修改密码失败'));
    } finally {
      setIsChangingPassword(false);
    }
  }, [
    confirmPasswordDraft,
    currentPasswordDraft,
    moveToSignedOutState,
    newPasswordDraft,
    normalizeErrorMessage,
    notify,
    resetChangePasswordDialog,
  ]);

  React.useEffect(() => {
    if (!currentSpaceId) return;
    const exists = spaces.some((space) => space.id === currentSpaceId);
    if (!exists) {
      setCurrentSpaceId(null);
    }
  }, [spaces, currentSpaceId]);

  const flushSpaceSave = useCallback(async (spaceId: string) => {
    if (saveInFlightRef.current[spaceId]) {
      shouldSaveAgainRef.current[spaceId] = true;
      return;
    }

    const snapshot = pendingSaveRef.current[spaceId];
    if (!snapshot) return;

    saveInFlightRef.current[spaceId] = true;
    shouldSaveAgainRef.current[spaceId] = false;
    try {
      await saveSpaceSnapshot(snapshot);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        notify('登录状态已失效，请重新登录');
        moveToSignedOutState();
        return;
      }
      notify(normalizeErrorMessage(error, '保存失败'));
    } finally {
      saveInFlightRef.current[spaceId] = false;
      if (shouldSaveAgainRef.current[spaceId]) {
        shouldSaveAgainRef.current[spaceId] = false;
        void flushSpaceSave(spaceId);
      }
    }
  }, [moveToSignedOutState, normalizeErrorMessage, notify]);

  const handleUpdateSpace = useCallback((updatedSpace: Space) => {
    setSpaces((prev) => prev.map((space) => (space.id === updatedSpace.id ? updatedSpace : space)));
    pendingSaveRef.current[updatedSpace.id] = updatedSpace;

    const existingTimer = saveTimersRef.current[updatedSpace.id];
    if (existingTimer) clearTimeout(existingTimer);

    saveTimersRef.current[updatedSpace.id] = setTimeout(() => {
      void flushSpaceSave(updatedSpace.id);
    }, 400);
  }, [flushSpaceSave]);

  const handleCreateSpace = useCallback(async (name: string, avatarImage: string) => {
    try {
      const created = await createSpace({
        name,
        avatarImage,
      });
      setSpaces((prev) => [...prev, created]);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        notify('登录状态已失效，请重新登录');
        moveToSignedOutState();
        return;
      }
      throw error;
    }
  }, [moveToSignedOutState, notify]);

  const handleRenameSpace = useCallback(async (id: string, name: string) => {
    try {
      const updated = await updateSpaceMeta(id, {name});
      setSpaces((prev) => prev.map((space) => (space.id === id ? updated : space)));
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        notify('登录状态已失效，请重新登录');
        moveToSignedOutState();
        return;
      }
      throw error;
    }
  }, [moveToSignedOutState, notify]);

  const handleDeleteSpace = useCallback(async (id: string) => {
    try {
      await deleteSpace(id);
      setSpaces((prev) => prev.filter((space) => space.id !== id));
      setCurrentSpaceId((prev) => (prev === id ? null : prev));
      delete pendingSaveRef.current[id];
      delete saveInFlightRef.current[id];
      delete shouldSaveAgainRef.current[id];
      const timer = saveTimersRef.current[id];
      if (timer) {
        clearTimeout(timer);
        delete saveTimersRef.current[id];
      }
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        notify('登录状态已失效，请重新登录');
        moveToSignedOutState();
        return;
      }
      throw error;
    }
  }, [moveToSignedOutState, notify]);

  const currentTheme = THEMES[themeName];
  const currentSpace = currentSpaceId ? spaces.find((space) => space.id === currentSpaceId) ?? null : null;

  if (isBootstrapping) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${currentTheme.globalBg} ${currentTheme.textMain}`}>
        正在加载手账空间...
      </div>
    );
  }

  if (bootstrapError) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center ${currentTheme.globalBg} ${currentTheme.textMain}`}>
        <p>加载失败：{bootstrapError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-stone-800 text-white rounded-md"
        >
          重试
        </button>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPanel onLogin={handleLogin} onRegister={handleRegister} theme={currentTheme} />;
  }

  return (
    <ThemeContext.Provider value={currentTheme}>
      <NoticeContext.Provider value={notify}>
        <div className={`min-h-screen transition-colors duration-500 ${currentTheme.globalBg} ${currentTheme.textMain} ${currentTheme.fontMain}`}>
          <div className="fixed right-3 top-3 z-[120] flex items-center gap-2 bg-white/85 px-3 py-1.5 text-xs text-stone-700 shadow-sm border border-stone-200">
            <span className="max-w-[140px] truncate">{currentUser.nickname}</span>
            <button
              type="button"
              onClick={openAdminPanel}
              className="text-stone-600 hover:text-stone-900 underline"
            >
              管理面板
            </button>
            <button
              type="button"
              onClick={openChangePasswordDialog}
              className="text-stone-600 hover:text-stone-900 underline"
            >
              修改密码
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="text-stone-600 hover:text-stone-900 underline"
            >
              退出登录
            </button>
          </div>
          <AnimatePresence mode="wait">
            {currentSpaceId === null || !currentSpace ? (
              <motion.div key="portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <Portal 
                  spaces={spaces} 
                  portalTitle={portalTitle}
                  onUpdatePortalTitle={setPortalTitle}
                  onSelectSpace={setCurrentSpaceId} 
                  onCreateSpace={handleCreateSpace}
                  onRenameSpace={handleRenameSpace}
                  onDeleteSpace={handleDeleteSpace}
                />
              </motion.div>
            ) : (
              <motion.div key="space" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <SpaceDetail 
                  space={currentSpace!} 
                  onBack={() => setCurrentSpaceId(null)} 
                  onUpdateSpace={handleUpdateSpace}
                  themeName={themeName}
                  setThemeName={setThemeName}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <AdminDashboardPanel
            isOpen={isAdminPanelOpen}
            data={adminStats}
            isLoading={isAdminStatsLoading}
            errorMessage={adminStatsError}
            onRefresh={() => void loadAdminStats()}
            onClose={closeAdminPanel}
          />
          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            currentPassword={currentPasswordDraft}
            newPassword={newPasswordDraft}
            confirmPassword={confirmPasswordDraft}
            errorMessage={changePasswordError}
            isSubmitting={isChangingPassword}
            onCurrentPasswordChange={(value) => {
              setCurrentPasswordDraft(value);
              if (changePasswordError) setChangePasswordError(null);
            }}
            onNewPasswordChange={(value) => {
              setNewPasswordDraft(value);
              if (changePasswordError) setChangePasswordError(null);
            }}
            onConfirmPasswordChange={(value) => {
              setConfirmPasswordDraft(value);
              if (changePasswordError) setChangePasswordError(null);
            }}
            onCancel={closeChangePasswordDialog}
            onSubmit={() => void handleSubmitChangePassword()}
          />
          <NoticeStack notices={notices} onDismiss={dismissNotice} />
        </div>
      </NoticeContext.Provider>
    </ThemeContext.Provider>
  );
}
