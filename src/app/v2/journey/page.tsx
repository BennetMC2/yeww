'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Award, FileText, Image as ImageIcon, Camera, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { ProgressCategory, ProgressEntry } from '@/types';

// Mock milestones for demo
const MOCK_ENTRIES: ProgressEntry[] = [
  {
    id: 'demo-milestone-1',
    type: 'milestone',
    category: 'general',
    date: new Date().toISOString(),
    content: '7-day sleep streak! Averaged 7.5h for a full week.',
  },
  {
    id: 'demo-note-1',
    type: 'note',
    category: 'general',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    content: 'Feeling more energized this week. The evening walks are really helping with sleep quality.',
  },
  {
    id: 'demo-milestone-2',
    type: 'milestone',
    category: 'general',
    date: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    content: 'HRV hit personal best: 62ms!',
  },
  {
    id: 'demo-photo-1',
    type: 'photo',
    category: 'body',
    date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    content: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    note: 'Morning workout at the park. 30 min jog + stretching.',
  },
  {
    id: 'demo-milestone-3',
    type: 'milestone',
    category: 'general',
    date: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    content: 'Started health journey with Longevity Guide!',
  },
];

export default function JourneyPage() {
  const router = useRouter();
  const { profile, progress, addProgressEntry, isLoading, homeDataCache } = useApp();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProgressCategory>('general');
  const [noteText, setNoteText] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Skip onboarding check for v2 preview

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

  // Create mock profile for preview if not onboarded
  const displayProfile = profile || {
    name: 'Demo User',
    healthScore: 72,
    checkInStreak: 5,
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
        setShowPhotoModal(true);
        setShowAddMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhoto = () => {
    if (previewImage) {
      addProgressEntry({
        type: 'photo',
        category: selectedCategory,
        content: previewImage,
        note: photoCaption || undefined,
      });
      setPreviewImage(null);
      setPhotoCaption('');
      setSelectedCategory('general');
      setShowPhotoModal(false);
    }
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      addProgressEntry({
        type: 'note',
        category: 'general',
        content: noteText.trim(),
      });
      setNoteText('');
      setShowNoteModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const categories: { value: ProgressCategory; label: string }[] = [
    { value: 'general', label: 'General' },
    { value: 'body', label: 'Body' },
    { value: 'skin', label: 'Skin' },
  ];

  // Calculate health score change - use mock positive change for demo
  const scoreTrend = homeDataCache?.scoreTrend;
  const scoreChange = scoreTrend?.change || 8; // Default to +8% for demo

  // Show empty state when user has no real entries
  const hasRealEntries = progress.entries.length > 0;

  return (
    <div className="px-6 pb-6 space-y-5">
      {/* Health Score Trend - Premium Card */}
      <div
        className="rounded-[24px] p-5 animate-fade-in"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
          boxShadow: '0 4px 24px rgba(224, 122, 95, 0.12), 0 1px 3px rgba(45, 42, 38, 0.08)',
        }}
      >
        <h3 className="text-[13px] font-semibold text-[#8A8580] mb-4">
          Health Score Over Time
        </h3>
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[42px] font-extrabold text-[#2D2A26] leading-none tracking-tight">{displayProfile.healthScore}</p>
            <p className="text-[13px] text-[#8A8580] mt-1">current score</p>
          </div>
          <div
            className={`text-right px-3 py-2 rounded-xl ${
              scoreChange > 0
                ? 'bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9]'
                : 'bg-gradient-to-r from-[#FFEBEE] to-[#FFCDD2]'
            }`}
          >
            <p className={`text-[18px] font-bold ${scoreChange > 0 ? 'text-[#2E7D32]' : 'text-[#C62828]'}`}>
              {scoreChange > 0 ? '+' : ''}{scoreChange}%
            </p>
            <p className="text-[11px] text-[#6B6560]">vs last week</p>
          </div>
        </div>
        {/* Premium trend visualization */}
        <div className="h-20 flex items-end gap-1.5 relative">
          {/* Background gradient */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-[#F5EDE4]/50 to-transparent" />
          {[65, 68, 64, 70, 72, 69, displayProfile.healthScore].map((score, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-lg relative overflow-hidden"
              style={{
                height: `${(score / 100) * 100}%`,
                background: i === 6
                  ? 'linear-gradient(180deg, #E07A5F 0%, #D36B4F 100%)'
                  : 'linear-gradient(180deg, #FFE8DC 0%, #FFD4C4 100%)',
                boxShadow: i === 6 ? '0 4px 12px rgba(224, 122, 95, 0.3)' : 'none',
                animation: 'slideInUp 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
                animationDelay: `${i * 50}ms`,
                opacity: 0,
                transform: 'translateY(100%)',
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-[#B5AFA8]">7 days ago</span>
          <span className="text-[11px] text-[#B5AFA8]">Today</span>
        </div>
      </div>

      {/* Milestones & Timeline */}
      <div className="flex items-center justify-between animate-on-load animate-fade-in stagger-1">
        <h3 className="text-[13px] font-semibold text-[#8A8580]">
          Your Journey
        </h3>
        <button
          onClick={() => setShowAddMenu(true)}
          className="w-9 h-9 rounded-[12px] text-white flex items-center justify-center transition-all hover:-translate-y-0.5 active:scale-[0.95]"
          style={{
            background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
            boxShadow: '0 4px 12px rgba(224, 122, 95, 0.3)',
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {hasRealEntries ? (
        <div className="space-y-3">
          {progress.entries.map((entry, index) => (
            <div
              key={entry.id}
              className="rounded-[20px] p-4 animate-on-load animate-slide-in-right transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                animationDelay: `${200 + index * 100}ms`,
                animationFillMode: 'forwards',
              }}
            >
              <div className="flex gap-3">
                <div
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: entry.type === 'milestone'
                      ? 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)'
                      : 'linear-gradient(135deg, #F5EDE4 0%, #EBE3DA 100%)',
                  }}
                >
                  {entry.type === 'photo' && <ImageIcon className="w-5 h-5 text-[#8A8580]" />}
                  {entry.type === 'note' && <FileText className="w-5 h-5 text-[#8A8580]" />}
                  {entry.type === 'milestone' && <Award className="w-5 h-5 text-[#E07A5F]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#B5AFA8] mb-1.5">
                    {formatDate(entry.date)}
                    {entry.category !== 'general' && (
                      <span
                        className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                        style={{ background: 'rgba(224, 122, 95, 0.1)', color: '#E07A5F' }}
                      >
                        {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                      </span>
                    )}
                  </p>
                  {entry.type === 'photo' && (
                    <div>
                      <div className="rounded-[14px] overflow-hidden bg-[#F5EDE4] mb-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.content}
                          alt="Progress photo"
                          className="w-full h-36 object-cover"
                        />
                      </div>
                      {entry.note && (
                        <p className="text-[14px] text-[#2D2A26] leading-relaxed">{entry.note}</p>
                      )}
                    </div>
                  )}
                  {entry.type === 'note' && (
                    <p className="text-[14px] text-[#2D2A26] leading-relaxed">{entry.content}</p>
                  )}
                  {entry.type === 'milestone' && (
                    <p className="text-[14px] text-[#2D2A26] font-semibold">{entry.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-[24px] p-6 animate-on-load animate-scale-in stagger-1"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
            boxShadow: '0 4px 24px rgba(224, 122, 95, 0.12), 0 1px 3px rgba(45, 42, 38, 0.08)',
          }}
        >
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-[20px] flex items-center justify-center animate-bounce-in"
              style={{
                background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)',
                boxShadow: '0 4px 12px rgba(224, 122, 95, 0.2)',
              }}
            >
              <Award className="w-8 h-8 text-[#E07A5F]" />
            </div>
            <h3 className="text-[18px] font-bold text-[#2D2A26] mb-2">Your journey starts here</h3>
            <p className="text-[14px] text-[#8A8580] leading-relaxed">
              Every expert was once a beginner. Let&apos;s build your health story together.
            </p>
          </div>

          {/* Motivational points */}
          <div className="space-y-3 mb-6">
            {[
              { num: 1, title: 'Consistency beats perfection', desc: 'Small daily actions compound into big results over time.' },
              { num: 2, title: 'Your data tells a story', desc: 'The more you track, the smarter your insights become.' },
              { num: 3, title: 'We\'re in this together', desc: 'I\'ll learn your patterns and help you optimize for longevity.' },
            ].map((item, i) => (
              <div
                key={item.num}
                className="flex items-start gap-3 p-3.5 rounded-[16px] animate-on-load animate-slide-in-right"
                style={{
                  background: 'linear-gradient(135deg, #FAF6F1 0%, #F5EDE4 100%)',
                  animationDelay: `${300 + i * 100}ms`,
                  animationFillMode: 'forwards',
                }}
              >
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-[#E07A5F]"
                  style={{ background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)' }}
                >
                  {item.num}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#2D2A26]">{item.title}</p>
                  <p className="text-[12px] text-[#8A8580] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAddMenu(true)}
            className="w-full py-3.5 rounded-[16px] text-white text-[14px] font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
              boxShadow: '0 4px 12px rgba(224, 122, 95, 0.3)',
            }}
          >
            Add your first entry
          </button>
        </div>
      )}

      {/* Add Menu Modal */}
      {showAddMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 animate-fade-in" onClick={() => setShowAddMenu(false)}>
          <div
            className="bg-[#FAF6F1] rounded-t-[28px] w-full max-w-[430px] p-6 animate-slide-in-up"
            style={{ boxShadow: '0 -8px 32px rgba(45, 42, 38, 0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-[#D4CCC3] rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-bold text-[#2D2A26]">Add Entry</h3>
              <button
                onClick={() => setShowAddMenu(false)}
                className="w-9 h-9 rounded-[12px] bg-[#F5EDE4] flex items-center justify-center hover:bg-[#EBE3DA] hover:rotate-90 transition-all"
              >
                <X className="w-5 h-5 text-[#8A8580]" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-[18px] transition-all hover:-translate-y-0.5 active:scale-[0.98] text-left animate-on-load animate-slide-in-right"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                  boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  animationDelay: '100ms',
                  animationFillMode: 'forwards',
                }}
              >
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #FFE8DC 0%, #FFD4C4 100%)' }}
                >
                  <Camera className="w-6 h-6 text-[#E07A5F]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#2D2A26]">Add Photo</h4>
                  <p className="text-[13px] text-[#8A8580]">Capture your progress visually</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowNoteModal(true);
                  setShowAddMenu(false);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-[18px] transition-all hover:-translate-y-0.5 active:scale-[0.98] text-left animate-on-load animate-slide-in-right"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDF9F5 100%)',
                  boxShadow: '0 2px 12px rgba(45, 42, 38, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                  animationDelay: '200ms',
                  animationFillMode: 'forwards',
                }}
              >
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #F5EDE4 0%, #EBE3DA 100%)' }}
                >
                  <FileText className="w-6 h-6 text-[#8A8580]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#2D2A26]">Add Note</h4>
                  <p className="text-[13px] text-[#8A8580]">Write a quick reflection</p>
                </div>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && previewImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div
            className="bg-[#FAF6F1] rounded-[24px] w-full max-w-[400px] overflow-hidden animate-scale-in"
            style={{ boxShadow: '0 8px 32px rgba(45, 42, 38, 0.3)' }}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage} alt="Preview" className="w-full h-52 object-cover" />
              <button
                onClick={() => { setShowPhotoModal(false); setPreviewImage(null); }}
                className="absolute top-3 right-3 w-9 h-9 rounded-[12px] bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 hover:rotate-90 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#8A8580] mb-2.5">Category</label>
                <div className="flex gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-4 py-2 rounded-[12px] text-[13px] font-semibold transition-all hover:-translate-y-0.5 active:scale-[0.95] ${
                        selectedCategory === cat.value ? 'text-white' : 'bg-[#F5EDE4] text-[#8A8580]'
                      }`}
                      style={selectedCategory === cat.value ? {
                        background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
                        boxShadow: '0 4px 12px rgba(224, 122, 95, 0.3)',
                      } : {}}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <input
                placeholder="Add a caption (optional)"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#F5EDE4] text-[#2D2A26] text-[14px] placeholder-[#B5AFA8] rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/20"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPhotoModal(false); setPreviewImage(null); }}
                  className="flex-1 py-3.5 rounded-[14px] bg-[#F5EDE4] text-[#2D2A26] font-semibold hover:bg-[#EBE3DA] active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPhoto}
                  className="flex-1 py-3.5 rounded-[14px] text-white font-semibold active:scale-[0.98] transition-all hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
                    boxShadow: '0 4px 12px rgba(224, 122, 95, 0.3)',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div
            className="bg-[#FAF6F1] rounded-[24px] w-full max-w-[400px] p-6 animate-scale-in"
            style={{ boxShadow: '0 8px 32px rgba(45, 42, 38, 0.3)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-bold text-[#2D2A26]">Add Note</h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="w-9 h-9 rounded-[12px] bg-[#F5EDE4] flex items-center justify-center hover:bg-[#EBE3DA] hover:rotate-90 transition-all"
              >
                <X className="w-5 h-5 text-[#8A8580]" />
              </button>
            </div>
            <textarea
              placeholder="What's on your mind?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3.5 bg-[#F5EDE4] text-[#2D2A26] text-[14px] placeholder-[#B5AFA8] rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/20 resize-none"
              autoFocus
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 py-3.5 rounded-[14px] bg-[#F5EDE4] text-[#2D2A26] font-semibold hover:bg-[#EBE3DA] active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="flex-1 py-3.5 rounded-[14px] text-white font-semibold disabled:opacity-40 active:scale-[0.98] transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #E07A5F 0%, #D36B4F 100%)',
                  boxShadow: noteText.trim() ? '0 4px 12px rgba(224, 122, 95, 0.3)' : 'none',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
