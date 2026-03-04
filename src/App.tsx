import React, { useRef, useState } from 'react';
import { Plus, X, Image as ImageIcon, Calendar, ChevronDown, MessageSquare, Clock, Camera, Star, MapPin, Heart, Sparkles, ImagePlus, ChevronRight, ChevronUp, ArrowLeft, Palette, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import {createSpace, deleteSpace, fetchSpaces, saveSpaceSnapshot, updateSpaceMeta, uploadImage} from './lib/api';
import type {Space, TimelineEntry, TreeholeEntry} from './types';

// --- Themes ---
export type ThemeName = 'default' | 'anime' | 'scifi' | 'retro' | 'fantasy';

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
  }
};

export const ThemeContext = React.createContext(THEMES.default);
export const useTheme = () => React.useContext(ThemeContext);

const treeholeColors = ['bg-[#fff0f3]', 'bg-[#fdf4ff]', 'bg-[#f0fdf4]', 'bg-[#fffbeb]', 'bg-[#f0f9ff]'];

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

// --- Main App ---
function SpaceDetail({ space, onBack, onUpdateSpace, themeName, setThemeName }: { space: Space, onBack: () => void, onUpdateSpace: (space: Space) => void, themeName: ThemeName, setThemeName: (theme: ThemeName) => void }) {
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(space.entries);
  const [treeholeEntries, setTreeholeEntries] = useState<TreeholeEntry[]>(space.treeholeEntries);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'album' | 'treehole'>('timeline');
  const [lightboxData, setLightboxData] = useState<{ url: string, text?: string } | null>(null);
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const theme = useTheme();

  // Customizable Hero and Avatar
  const [heroImage, setHeroImage] = useState(space.heroImage);
  const [avatarImage, setAvatarImage] = useState(space.avatarImage);

  React.useEffect(() => {
    setTimelineEntries(space.entries);
    setTreeholeEntries(space.treeholeEntries);
    setHeroImage(space.heroImage);
    setAvatarImage(space.avatarImage);
  }, [space.id, space.entries, space.treeholeEntries, space.heroImage, space.avatarImage]);

  React.useEffect(() => {
    onUpdateSpace({
      id: space.id,
      name: space.name,
      description: space.description,
      entries: timelineEntries,
      treeholeEntries,
      heroImage,
      avatarImage,
    });
  }, [timelineEntries, treeholeEntries, heroImage, avatarImage, onUpdateSpace, space.id, space.name, space.description]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      try {
        const url = await uploadImage(file);
        setter(url);
      } catch (error) {
        const message = error instanceof Error ? error.message : '图片上传失败';
        window.alert(message);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleUploadImage = async (file: File): Promise<string> => uploadImage(file);

  const sortByDateDesc = <T extends {date: string}>(items: T[]): T[] =>
    [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddEntry = (type: 'timeline' | 'album' | 'treehole', data: any) => {
    const newId = Date.now().toString();
    if (type === 'timeline') {
      const { eventId, title, date, description, imageUrl, text } = data;
      if (eventId === 'new') {
        const newEntry: TimelineEntry = {
          id: newId,
          title,
          date,
          description,
          rotation: (Math.random() * 4) - 2,
          images: imageUrl ? [{ id: newId, imageUrl, text }] : [],
          coverFocus: { x: 50, y: 42 },
          type: 'timeline'
        };
        setTimelineEntries(sortByDateDesc([newEntry, ...timelineEntries]));
      } else {
        const updatedEntries = timelineEntries.map(entry => {
          if (entry.id === eventId) {
            return {
              ...entry,
              images: imageUrl ? [...entry.images, { id: newId, imageUrl, text }] : entry.images,
              coverFocus: entry.coverFocus ?? { x: 50, y: 42 },
            };
          }
          return entry;
        });
        setTimelineEntries(updatedEntries);
      }
    } else if (type === 'album') {
      const { eventId, title, date, imageUrl, text } = data;
      
      if (eventId === 'loose') {
        // Loose photo
        const newEntry: TimelineEntry = {
          id: newId,
          title: '',
          date,
          description: '',
          rotation: (Math.random() * 4) - 2,
          images: imageUrl ? [{ id: newId, imageUrl, text }] : [],
          type: 'loose_photo'
        };
        setTimelineEntries(sortByDateDesc([newEntry, ...timelineEntries]));
      } else if (eventId === 'new') {
        const trimmedTitle = title?.trim() || '未命名相册';
        const newEntry: TimelineEntry = {
          id: newId,
          title: trimmedTitle,
          date,
          description: '',
          rotation: (Math.random() * 4) - 2,
          images: imageUrl ? [{ id: newId, imageUrl, text }] : [],
          type: 'album'
        };
        setTimelineEntries(sortByDateDesc([newEntry, ...timelineEntries]));
      } else {
        // Check if album exists by ID
        const updatedEntries = timelineEntries.map(entry => {
          if (entry.id === eventId) {
            return {
              ...entry,
              images: imageUrl ? [...entry.images, { id: newId, imageUrl, text }] : entry.images
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
    if (!window.confirm('确认删除这条记录吗？')) return;
    setTimelineEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const handleEditTimelineEntry = (entry: TimelineEntry) => {
    if (entry.type === 'loose_photo') {
      const nextDate = window.prompt('修改日期', entry.date);
      if (nextDate === null || !nextDate.trim()) return;
      const currentText = entry.images[0]?.text ?? '';
      const nextText = window.prompt('修改照片备注', currentText);
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
    const nextTitle = window.prompt('修改标题', defaultTitle);
    if (nextTitle === null || !nextTitle.trim()) return;
    const nextDate = window.prompt('修改日期', entry.date);
    if (nextDate === null || !nextDate.trim()) return;
    const nextDescription =
      entry.type === 'timeline'
        ? window.prompt('修改描述（可留空）', entry.description ?? '')
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
  };

  const handleDeleteTreeholeEntry = (entryId: string) => {
    if (!window.confirm('确认删除这条树洞留言吗？')) return;
    setTreeholeEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const handleEditTreeholeEntry = (entry: TreeholeEntry) => {
    const nextDate = window.prompt('修改日期', entry.date);
    if (nextDate === null || !nextDate.trim()) return;
    const nextText = window.prompt('修改留言', entry.text);
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
      <div className="fixed top-6 right-6 z-50 flex gap-3">
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
      <div className="relative h-[55vh] w-full flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img src={heroImage} alt="Hero Background" className={`w-full h-full object-cover blur-md scale-105 opacity-70 ${theme.imageFilter}`} />
          <div className={`absolute inset-0 bg-gradient-to-b ${theme.headerBg}`}></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 mt-8">
          <div className="relative group">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className={`w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-[4px] border-white shadow-[0_8px_24px_rgba(244,114,182,0.25)] mb-5 relative z-10 ${theme.cardBg}`}
            >
              <img src={avatarImage} alt="Avatar" className={`w-full h-full object-cover ${theme.imageFilter}`} />
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-300">
                <Camera className="text-white mb-1" size={24} />
                <span className="text-white text-xs font-medium">更换头像</span>
                <input type="file" className="hidden" accept="image/*" disabled={isUploadingImage} onChange={(e) => void handleImageUpload(e, setAvatarImage)} />
              </label>
            </motion.div>
          </div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className={`${theme.fontTitle} text-4xl md:text-5xl font-extrabold mb-3 ${theme.textMain} drop-shadow-sm flex items-center gap-2`}
          >
            {space.name} <Sparkles className={`${theme.accent} animate-pulse`} size={28} />
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className={`${theme.accent} text-sm md:text-base tracking-[0.3em] uppercase mb-5 font-bold`}
          >
            {/* Optional English name or subtitle could go here */}
          </motion.p>
          <motion.p 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className={`${theme.textMuted} leading-relaxed max-w-xl mx-auto font-medium text-base md:text-lg`}
          >
            {space.description.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
          </motion.p>
          
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
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTreeholeEntry(msg.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 text-stone-500 hover:text-red-500 transition-colors"
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

  return (
    <div className="relative flex max-w-5xl mx-auto">
      {/* Floating Time Index (Desktop) */}
      <div className={`hidden lg:flex flex-col fixed left-8 xl:left-16 top-1/2 -translate-y-1/2 h-fit items-start space-y-6 z-20 transition-opacity duration-500 ${isScrolled ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute left-[3px] top-2 bottom-2 w-[1px] bg-pink-100/50 -z-10"></div>
        {groupedEntries.map((g) => (
          <button
            key={g.year}
            onClick={() => scrollToYear(g.year)}
            className={`relative flex items-center justify-start gap-4 group transition-all duration-500 ${
              activeYear === g.year ? 'text-pink-500 scale-110 translate-x-1' : 'text-stone-400 hover:text-pink-300'
            }`}
          >
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              activeYear === g.year 
                ? 'bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.8)] scale-150' 
                : 'bg-stone-200 group-hover:bg-pink-200'
            }`} />
            <span className={`font-serif tracking-widest transition-all duration-500 ${activeYear === g.year ? 'font-bold text-lg' : 'font-medium text-sm'}`}>
              {g.year}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline Content */}
      <div ref={containerRef} className="flex-1 relative max-w-3xl mx-auto w-full">
        {/* Main Vertical Line Background */}
        <div className={`absolute left-[14px] md:left-1/2 top-0 bottom-0 w-[2px] ${theme.cardBorder} md:-translate-x-1/2 rounded-full`}></div>
        {/* Main Vertical Line Progress */}
        <motion.div 
          className={`absolute left-[14px] md:left-1/2 top-0 bottom-0 w-[2px] ${theme.bgAccent} md:-translate-x-1/2 rounded-full origin-top`}
          style={{ scaleY }}
        />
        
        <div className="space-y-16">
          {groupedEntries.map((group) => (
            <div key={group.year} id={`year-${group.year}`} className="relative scroll-mt-32">
              {/* Year Marker */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, type: "spring" }}
                className="flex items-center justify-center mb-10 relative z-10"
              >
                <div className={`${theme.cardBg} backdrop-blur-md px-8 py-2.5 rounded-full border ${theme.cardBorder} shadow-[0_3px_14px_rgba(244,114,182,0.1)] ${theme.accent} font-serif font-bold text-xl tracking-[0.18em] flex items-center justify-center`}>
                  {group.year}
                </div>
              </motion.div>

              <div className="space-y-5">
                {group.entries.map((entry, index) => {
                  const globalIndex = entries.findIndex(e => e.id === entry.id);
                  return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 80, scale: 0.95, rotate: globalIndex % 2 === 0 ? -2 : 2 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                  >
                    <TimelineFolder 
                      entry={entry} 
                      index={globalIndex} 
                      onImageClick={onImageClick}
                      onEditEntry={onEditEntry}
                      onDeleteEntry={onDeleteEntry}
                    />
                  </motion.div>
                )})}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineFolder({
  entry,
  index,
  onImageClick,
  onEditEntry,
  onDeleteEntry,
}: {
  entry: TimelineEntry;
  index: number;
  onImageClick: (url: string, text?: string) => void;
  onEditEntry: (entry: TimelineEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const isEven = index % 2 === 0;
  const coverImage = entry.images.length > 0 ? entry.images[0].imageUrl : 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80';
  const relatedImages = entry.images.slice(1);

  return (
    <div className="relative w-full mb-3">
      <div className={`relative flex flex-col md:flex-row items-start ${isEven ? 'md:flex-row-reverse' : ''}`}>
        <motion.div 
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className={`absolute left-[9px] md:left-1/2 w-[10px] h-[10px] rounded-full ${theme.bgAccent} md:-translate-x-1/2 mt-5 ring-4 ${theme.dotRing} shadow-sm z-10`}
        ></motion.div>

        <div className={`ml-12 md:ml-0 md:w-1/2 ${isEven ? 'md:pl-12' : 'md:pr-12'} py-1 flex ${isEven ? 'justify-start' : 'justify-end'}`}>
          
          {/* Clipping/Note Container */}
          <div className="relative w-full max-w-[19rem] group">
            {/* Washi Tape */}
            <div className={`absolute -top-3 ${isEven ? 'right-8 rotate-[4deg]' : 'left-8 rotate-[-3deg]'} w-16 h-6 ${theme.tape} backdrop-blur-sm z-30 mix-blend-multiply shadow-sm transition-transform duration-300 group-hover:-translate-y-1`}></div>
            
            {/* Main Card (The "Envelope") */}
            <div className={`relative ${theme.cardBg} p-3.5 shadow-sm border ${theme.cardBorder} transition-all duration-300 w-full hover:shadow-md hover:-translate-y-0.5 z-20`}>
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEntry(entry);
                  }}
                  className={`${theme.cardBg} backdrop-blur-sm border ${theme.cardBorder} p-1.5 rounded-full ${theme.textMuted} hover:opacity-80 transition-colors`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEntry(entry.id);
                  }}
                  className={`${theme.cardBg} backdrop-blur-sm border ${theme.cardBorder} p-1.5 rounded-full ${theme.textMuted} hover:text-red-500 transition-colors`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {/* Clickable Header/Cover Area */}
              <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="overflow-hidden relative">
                  <SafeImage
                    src={coverImage}
                    alt={entry.title}
                    className={`w-full h-auto max-h-[190px] object-contain bg-stone-100/70 grayscale-[12%] group-hover:grayscale-0 transition-all duration-500 ${theme.imageFilter}`}
                  />
                  {entry.images.length > 1 && (
                    <div className={`absolute bottom-2 right-2 ${theme.cardBg} backdrop-blur-sm ${theme.textMain} text-[10px] px-2 py-1 font-mono tracking-widest border ${theme.cardBorder}`}>
                      +{entry.images.length - 1}
                    </div>
                  )}
                </div>
                
                <div className="mt-3 text-left relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-mono ${theme.textMuted} text-[9px] tracking-[0.18em] uppercase`}>{entry.date}</span>
                    {entry.images.length > 0 && (
                      <motion.div 
                        animate={{ rotate: isExpanded ? 90 : 0 }} 
                        className={theme.textMuted}
                      >
                        <ChevronRight size={12} />
                      </motion.div>
                    )}
                  </div>
                  <h3 className={`${theme.fontTitle} font-bold ${theme.textMain} text-lg leading-snug line-clamp-1`}>{entry.title}</h3>
                </div>
              </div>

              {/* Description expands inside the card */}
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
              {isExpanded && relatedImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: isEven ? 24 : -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isEven ? 24 : -24 }}
                  transition={{ duration: 0.28 }}
                  className={`hidden md:flex absolute top-2 ${isEven ? '-right-[8.75rem]' : '-left-[8.75rem]'} w-28 flex-col gap-2.5 z-0`}
                >
                  {relatedImages.slice(0, 4).map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => onImageClick(img.imageUrl, img.text)}
                      className={`w-full border ${theme.cardBorder} ${theme.cardBg} shadow-sm overflow-hidden`}
                    >
                      <SafeImage src={img.imageUrl} className={`w-full aspect-[4/5] object-cover ${theme.imageFilter}`} />
                    </button>
                  ))}
                  {relatedImages.length > 4 && (
                    <div className={`text-center text-[11px] ${theme.textMuted} ${theme.cardBg} border ${theme.cardBorder} py-1.5`}>
                      +{relatedImages.length - 4} 张
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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

  if (expandedEntry) {
    return (
      <motion.div
        key={`album-detail-${expandedEntry.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="w-full space-y-4"
      >
        <div className="max-w-3xl mx-auto">
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-xl px-4 py-3 flex items-center justify-between`}>
            <button
              type="button"
              onClick={() => setExpandedAlbumId(null)}
              className={`inline-flex items-center gap-1.5 ${theme.textMain} hover:opacity-80 transition-opacity`}
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">返回剪影照片流</span>
            </button>
            <span className={`${theme.textMuted} text-xs`}>
              {expandedEntry.images.length} 张
            </span>
          </div>
        </div>
        <div className="max-w-3xl mx-auto">
          <AlbumStack
            entry={expandedEntry}
            isExpanded
            onToggle={() => setExpandedAlbumId(null)}
            onImageClick={onImageClick}
            onEditEntry={onEditEntry}
            onDeleteEntry={onDeleteEntry}
          />
        </div>
      </motion.div>
    );
  }

  const columns: TimelineEntry[][] = Array.from({ length: cols }, () => []);
  entries.forEach((entry, i) => {
    columns[i % cols].push(entry);
  });

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
}> = ({ entry, onImageClick, onEditEntry, onDeleteEntry }) => {
  const theme = useTheme();
  const img = entry.images[0];
  
  if (!img) return null;

  return (
    <motion.div 
      layout="position"
      className="relative w-full group mb-6"
      style={{ transform: `rotate(${entry.rotation}deg)` }}
    >
      <div className="absolute top-2 right-2 z-30 flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditEntry(entry);
          }}
          className={`${theme.cardBg} border ${theme.cardBorder} p-1 rounded-full ${theme.textMuted} hover:opacity-80 transition-colors`}
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteEntry(entry.id);
          }}
          className={`${theme.cardBg} border ${theme.cardBorder} p-1 rounded-full ${theme.textMuted} hover:text-red-500 transition-colors`}
        >
          <Trash2 size={12} />
        </button>
      </div>
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
                className={`${theme.cardBg} border ${theme.cardBorder} p-1.5 rounded-full ${theme.textMuted} hover:opacity-80 transition-colors`}
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEntry(entry.id);
                }}
                className={`${theme.cardBg} border ${theme.cardBorder} p-1.5 rounded-full ${theme.textMuted} hover:text-red-500 transition-colors`}
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
                  className={`${theme.textMuted} hover:opacity-80 transition-colors ${theme.cardBg} backdrop-blur-sm p-1.5 rounded-full shadow-sm border ${theme.cardBorder}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEntry(entry.id);
                  }}
                  className={`${theme.textMuted} hover:text-red-500 transition-colors ${theme.cardBg} backdrop-blur-sm p-1.5 rounded-full shadow-sm border ${theme.cardBorder}`}
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
  const [type, setType] = useState<'timeline' | 'album' | 'treehole'>('timeline');
  const [eventId, setEventId] = useState<'new' | string>('new');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [text, setText] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const url = await onUploadImage(file);
      setImageUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : '图片上传失败';
      window.alert(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'timeline') {
      if (eventId === 'new' && (!title.trim() || !date)) return;
      onAdd(type, { eventId, title, date, description, imageUrl, text });
    } else if (type === 'album') {
      if ((eventId === 'new' || eventId === 'loose') && !date) return;
      if (eventId === 'new' && !title.trim()) return;
      onAdd(type, { eventId, title, date, imageUrl, text });
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
              onClick={() => { setType(t); setEventId(t === 'album' ? 'loose' : 'new'); setImageUrl(''); setText(''); }}
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
                <label className="block text-sm font-bold text-stone-500 mb-2 tracking-widest">上传照片 (可选)</label>
                <label className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-pink-200 rounded-xl bg-pink-50/50 hover:bg-pink-50 transition-colors cursor-pointer overflow-hidden group">
                  {imageUrl ? (
                    <div className="relative w-full h-full">
                      <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-medium text-sm">点击更换图片</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-pink-400">
                      <ImagePlus size={28} className="mb-2 opacity-80" />
                      <span className="text-sm font-bold">点击选择本地图片</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" disabled={isUploadingImage} onChange={(e) => void handleImageInput(e)} />
                </label>
              </motion.div>

              {/* Image Text/Remark Field */}
              {imageUrl && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                  <label className="block text-sm font-bold text-stone-500 mb-2 tracking-widest">照片备注 (可选)</label>
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

// --- Portal Component ---
function Portal({
  spaces,
  onSelectSpace,
  onCreateSpace,
  onRenameSpace,
  onDeleteSpace,
}: {
  spaces: Space[];
  onSelectSpace: (id: string) => void;
  onCreateSpace: (name: string, avatar: string) => Promise<void>;
  onRenameSpace: (id: string, name: string) => Promise<void>;
  onDeleteSpace: (id: string) => Promise<void>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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
        window.alert(message);
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
        window.alert(message);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleRenameSpace = async (space: Space) => {
    const nextName = window.prompt('修改空间名称', space.name);
    if (nextName === null || !nextName.trim() || nextName.trim() === space.name) return;

    try {
      await onRenameSpace(space.id, nextName.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : '修改空间名称失败';
      window.alert(message);
    }
  };

  const handleDeleteSpace = async (space: Space) => {
    if (!window.confirm(`确认删除空间「${space.name}」吗？此操作不可撤销。`)) return;

    try {
      await onDeleteSpace(space.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除空间失败';
      window.alert(message);
    }
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
          <h1 className="text-3xl md:text-4xl font-serif text-stone-800 tracking-[0.2em] mb-6">我的手账空间</h1>
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
                      void handleRenameSpace(space);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/85 text-stone-500 hover:text-stone-700 shadow-sm"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteSpace(space);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/85 text-stone-500 hover:text-red-500 shadow-sm"
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
                      <img src={space.avatarImage} alt={space.name} className="w-full h-full object-cover filter contrast-[1.02] transition-transform duration-700 group-hover:scale-105" />
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
    </div>
  );
}

// --- Main App Entry ---
export default function App() {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const stored = localStorage.getItem('journal-theme') as ThemeName | null;
    return stored && stored in THEMES ? stored : 'default';
  });
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  React.useEffect(() => {
    localStorage.setItem('journal-theme', themeName);
  }, [themeName]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchSpaces();
        if (!mounted) return;
        setSpaces(data);
        setBootstrapError(null);
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : '加载空间数据失败';
        setBootstrapError(message);
      } finally {
        if (mounted) setIsBootstrapping(false);
      }
    })();

    return () => {
      mounted = false;
      (Object.values(saveTimersRef.current) as Array<ReturnType<typeof setTimeout>>).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  React.useEffect(() => {
    if (!currentSpaceId) return;
    const exists = spaces.some((space) => space.id === currentSpaceId);
    if (!exists) {
      setCurrentSpaceId(null);
    }
  }, [spaces, currentSpaceId]);

  const handleUpdateSpace = (updatedSpace: Space) => {
    setSpaces((prev) => prev.map((space) => (space.id === updatedSpace.id ? updatedSpace : space)));

    const timerKey = updatedSpace.id;
    const existingTimer = saveTimersRef.current[timerKey];
    if (existingTimer) clearTimeout(existingTimer);

    saveTimersRef.current[timerKey] = setTimeout(async () => {
      try {
        const saved = await saveSpaceSnapshot(updatedSpace);
        setSpaces((prev) => prev.map((space) => (space.id === saved.id ? saved : space)));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to persist space snapshot', error);
      }
    }, 400);
  };

  const handleCreateSpace = async (name: string, avatarImage: string) => {
    const created = await createSpace({
      name,
      avatarImage,
    });
    setSpaces((prev) => [...prev, created]);
  };

  const handleRenameSpace = async (id: string, name: string) => {
    const updated = await updateSpaceMeta(id, {name});
    setSpaces((prev) => prev.map((space) => (space.id === id ? updated : space)));
  };

  const handleDeleteSpace = async (id: string) => {
    await deleteSpace(id);
    setSpaces((prev) => prev.filter((space) => space.id !== id));
    if (currentSpaceId === id) {
      setCurrentSpaceId(null);
    }
  };

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

  return (
    <ThemeContext.Provider value={currentTheme}>
      <div className={`min-h-screen transition-colors duration-500 ${currentTheme.globalBg} ${currentTheme.textMain} ${currentTheme.fontMain}`}>
        <AnimatePresence mode="wait">
          {currentSpaceId === null || !currentSpace ? (
            <motion.div key="portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <Portal 
                spaces={spaces} 
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
      </div>
    </ThemeContext.Provider>
  );
}
