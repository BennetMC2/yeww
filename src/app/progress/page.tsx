'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Image as ImageIcon, FileText, Award, X, Camera } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useApp } from '@/contexts/AppContext';
import { ProgressCategory } from '@/types';

export default function ProgressPage() {
  const router = useRouter();
  const { profile, progress, addProgressEntry, isLoading } = useApp();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProgressCategory>('general');
  const [noteText, setNoteText] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!isLoading && !profile?.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [isLoading, profile, router]);

  if (isLoading || !profile?.onboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F1]">
        <p className="text-[#B5AFA8]">Loading...</p>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F1] pb-20">
      <Header />

      <main className="flex-1 px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#2D2A26]">Progress</h1>
          <button
            onClick={() => setShowAddMenu(true)}
            className="w-10 h-10 rounded-full bg-[#E07A5F] text-white flex items-center justify-center hover:bg-[#D36B4F] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline */}
        {progress.entries.length > 0 ? (
          <div className="space-y-4">
            {progress.entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-2xl p-3">
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${entry.type === 'milestone' ? 'bg-[#FFE8DC]' : 'bg-[#F5EDE4]'}`}>
                    {entry.type === 'photo' && <ImageIcon className="w-5 h-5 text-[#8A8580]" />}
                    {entry.type === 'note' && <FileText className="w-5 h-5 text-[#8A8580]" />}
                    {entry.type === 'milestone' && <Award className="w-5 h-5 text-[#E07A5F]" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#8A8580] mb-1">
                      {formatDate(entry.date)}
                      {entry.category !== 'general' && (
                        <span className="ml-2 text-[#E07A5F]">
                          {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                        </span>
                      )}
                    </p>

                    {entry.type === 'photo' && (
                      <div>
                        <div className="rounded-xl overflow-hidden bg-[#F5EDE4] mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={entry.content}
                            alt="Progress photo"
                            className="w-full h-48 object-cover"
                          />
                        </div>
                        {entry.note && (
                          <p className="text-sm text-[#2D2A26]">{entry.note}</p>
                        )}
                      </div>
                    )}

                    {entry.type === 'note' && (
                      <p className="text-sm text-[#2D2A26]">{entry.content}</p>
                    )}

                    {entry.type === 'milestone' && (
                      <p className="text-sm text-[#2D2A26] font-medium">{entry.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5EDE4] flex items-center justify-center">
              <Award className="w-8 h-8 text-[#8A8580]" />
            </div>
            <h3 className="font-semibold text-[#2D2A26] mb-2">Your journey starts here</h3>
            <p className="text-[#8A8580] mb-6">Add a photo or note to mark the beginning.</p>
            <button
              onClick={() => setShowAddMenu(true)}
              className="px-6 py-3.5 rounded-full bg-[#E07A5F] text-white font-medium hover:bg-[#D36B4F] transition-colors"
            >
              Add first entry
            </button>
          </div>
        )}
      </main>

      {/* Add Menu Modal */}
      {showAddMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowAddMenu(false)}>
          <div
            className="bg-[#FAF6F1] rounded-t-3xl w-full max-w-[430px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#2D2A26]">Add Entry</h3>
              <button
                onClick={() => setShowAddMenu(false)}
                className="p-2 rounded-full hover:bg-[#F5EDE4] transition-colors"
              >
                <X className="w-5 h-5 text-[#8A8580]" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#F5EDE4] hover:bg-[#EBE3DA] transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#E07A5F]" />
                </div>
                <div>
                  <h4 className="font-medium text-[#2D2A26]">Add Photo</h4>
                  <p className="text-sm text-[#8A8580]">Capture your progress visually</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowNoteModal(true);
                  setShowAddMenu(false);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#F5EDE4] hover:bg-[#EBE3DA] transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#E07A5F]" />
                </div>
                <div>
                  <h4 className="font-medium text-[#2D2A26]">Add Note</h4>
                  <p className="text-sm text-[#8A8580]">Write a quick reflection</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF6F1] rounded-2xl w-full max-w-[400px] overflow-hidden">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-64 object-cover"
              />
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setPreviewImage(null);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8A8580] mb-2">Category</label>
                <div className="flex gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.value ? 'bg-[#E07A5F] text-white' : 'bg-[#F5EDE4] text-[#8A8580] hover:bg-[#EBE3DA]'}`}
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
                className="w-full px-5 py-4 bg-[#F5EDE4] text-[#2D2A26] placeholder-[#B5AFA8] rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#E07A5F]/30 focus:bg-white transition-all duration-300 text-lg"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPhotoModal(false);
                    setPreviewImage(null);
                  }}
                  className="flex-1 px-6 py-3.5 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPhoto}
                  className="flex-1 px-6 py-3.5 rounded-full bg-[#E07A5F] text-white font-medium hover:bg-[#D36B4F] transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF6F1] rounded-2xl w-full max-w-[400px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#2D2A26]">Add Note</h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-2 rounded-full hover:bg-[#F5EDE4] transition-colors"
              >
                <X className="w-5 h-5 text-[#8A8580]" />
              </button>
            </div>

            <textarea
              placeholder="What's on your mind?"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-[#F5EDE4] text-[#2D2A26] placeholder-[#B5AFA8] rounded-xl border-2 border-transparent focus:outline-none focus:border-[#E07A5F]/30 focus:bg-white transition-all duration-200 resize-none"
              autoFocus
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 px-6 py-3.5 rounded-full bg-[#F5EDE4] text-[#2D2A26] font-medium hover:bg-[#EBE3DA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="flex-1 px-6 py-3.5 rounded-full bg-[#E07A5F] text-white font-medium hover:bg-[#D36B4F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
