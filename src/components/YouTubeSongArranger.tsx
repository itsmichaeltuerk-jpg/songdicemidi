import React, { useState, useEffect } from 'react';
import {
  Search,
  Youtube,
  Sparkles,
  Sliders,
  Play,
  Pause,
  ExternalLink,
  Music2,
  Disc,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Flame,
  Layers,
} from 'lucide-react';
import { YouTubeTrackItem } from '../types/music';
import {
  POPULAR_YOUTUBE_TRACKS,
  searchYouTubeCatalog,
  extractYouTubeVideoId,
} from '../services/youtubeService';
import { VOCAL_RANGES } from '../services/chordParser';
import { audioEngine } from '../services/audioEngine';

interface YouTubeSongArrangerProps {
  onGenerateFromYouTube: (
    track: YouTubeTrackItem,
    coverStyle: string,
    vocalShift: number
  ) => void;
  isGenerating: boolean;
  vocalShift: number;
  setVocalShift: (shift: number) => void;
  onSwitchToManualTab?: () => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: '🔥 All Hits' },
  { id: 'bedroom_pop', label: '🛏️ Bedroom Pop' },
  { id: 'synth_pop', label: '✨ Pop Anthems' },
  { id: 'acoustic', label: '🎸 Acoustic & Folk' },
  { id: 'rock', label: '⚡ Alt & Rock' },
  { id: 'rnb_soul', label: '🎹 Soul & R&B' },
];

export const YouTubeSongArranger: React.FC<YouTubeSongArrangerProps> = ({
  onGenerateFromYouTube,
  isGenerating,
  vocalShift,
  setVocalShift,
  onSwitchToManualTab,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<YouTubeTrackItem>(POPULAR_YOUTUBE_TRACKS[0]);
  const [searchResults, setSearchResults] = useState<YouTubeTrackItem[]>(POPULAR_YOUTUBE_TRACKS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [coverStyle, setCoverStyle] = useState<string>('Acoustic Singer-Songwriter Groove');
  const [showEmbedPlayer, setShowEmbedPlayer] = useState<boolean>(false);
  const [recentPicks, setRecentPicks] = useState<YouTubeTrackItem[]>([
    POPULAR_YOUTUBE_TRACKS[0],
    POPULAR_YOUTUBE_TRACKS[1],
    POPULAR_YOUTUBE_TRACKS[2],
  ]);

  // Real-time search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      if (selectedCategory === 'all') {
        setSearchResults(POPULAR_YOUTUBE_TRACKS);
      } else if (selectedCategory === 'bedroom_pop') {
        setSearchResults(POPULAR_YOUTUBE_TRACKS.filter(t => t.genre?.toLowerCase().includes('bedroom') || t.genre?.toLowerCase().includes('pop')));
      } else if (selectedCategory === 'synth_pop') {
        setSearchResults(POPULAR_YOUTUBE_TRACKS.filter(t => t.genre?.toLowerCase().includes('synth') || t.genre?.toLowerCase().includes('pop')));
      } else if (selectedCategory === 'acoustic') {
        setSearchResults(POPULAR_YOUTUBE_TRACKS.filter(t => t.genre?.toLowerCase().includes('acoustic') || t.genre?.toLowerCase().includes('folk') || t.genre?.toLowerCase().includes('ballad')));
      } else if (selectedCategory === 'rock') {
        setSearchResults(POPULAR_YOUTUBE_TRACKS.filter(t => t.genre?.toLowerCase().includes('rock') || t.genre?.toLowerCase().includes('indie')));
      } else if (selectedCategory === 'rnb_soul') {
        setSearchResults(POPULAR_YOUTUBE_TRACKS.filter(t => t.genre?.toLowerCase().includes('soul') || t.genre?.toLowerCase().includes('r&b') || t.genre?.toLowerCase().includes('jazz')));
      }
      return;
    }

    const results = searchYouTubeCatalog(searchQuery);
    setSearchResults(results);
  }, [searchQuery, selectedCategory]);

  const handleSelectTrack = (track: YouTubeTrackItem) => {
    setSelectedTrack(track);
    // Add to recent picks if not already there
    setRecentPicks((prev) => {
      const filtered = prev.filter((p) => p.id !== track.id);
      return [track, ...filtered].slice(0, 5);
    });

    // Pick a sensible default cover style based on track genre
    const g = (track.genre || '').toLowerCase();
    if (g.includes('disco') || g.includes('funk')) {
      setCoverStyle('Nu-Disco / Funk Pop Groove');
    } else if (g.includes('80s') || g.includes('synth')) {
      setCoverStyle('80s Synth Pop / Glam Pumping');
    } else if (g.includes('rock') || g.includes('indie')) {
      setCoverStyle('Indie Rock Dynamic Anthem');
    } else if (g.includes('ballad') || g.includes('piano')) {
      setCoverStyle('Intimate Rolling Piano Ballad');
    } else if (g.includes('bedroom') || g.includes('chill')) {
      setCoverStyle('Lo-Fi Bedroom Chill Piano');
    } else {
      setCoverStyle('Acoustic Singer-Songwriter Groove');
    }
  };

  const handleGenerate = () => {
    if (!selectedTrack) return;
    onGenerateFromYouTube(selectedTrack, coverStyle, vocalShift);
  };

  const isDirectVideoId = Boolean(extractYouTubeVideoId(selectedTrack?.id || selectedTrack?.youtubeUrl || ''));

  return (
    <section className="w-full bg-gradient-to-b from-[#181A20] via-[#141519] to-[#121316] p-4 sm:p-6 lg:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-extrabold text-red-400 font-mono">
              <Youtube className="w-4 h-4 fill-red-500 text-red-500" />
              YOUTUBE & YOUTUBE MUSIC ARRANGER
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> No Tab Pasting Required
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 font-['Outfit']">
            Search Any YouTube Song & Arrange Instant DAW MIDI
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Search by song title, artist name, or paste a YouTube / YouTube Music URL.
            Gemini analyzes the authentic harmonic structure, chord progression, tempo, and groove,
            then delivers a production-ready 5-track MIDI arrangement (Chords, Bass, Drums, Guide Melody, Pad).
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          id="generate-from-yt-btn"
          onClick={handleGenerate}
          disabled={isGenerating || !selectedTrack}
          className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs sm:text-sm font-black tracking-wide uppercase shadow-xl shadow-amber-500/25 border border-amber-400/60 transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4 fill-zinc-950 animate-bounce" />
          <span>{isGenerating ? 'Arranging From YouTube...' : 'Generate DAW MIDI from Song'}</span>
        </button>
      </div>

      {/* YouTube Search Bar */}
      <div className="space-y-3">
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center gap-2 text-zinc-400 pointer-events-none">
            <Search className="w-4 h-4 text-amber-400" />
            <Youtube className="w-4 h-4 text-red-500 fill-red-500" />
          </div>
          <input
            id="youtube-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search on YouTube (e.g. 'Birds of a Feather', 'Espresso', 'Good Luck Babe', 'Yellow') or paste YouTube link..."
            className="w-full bg-zinc-950/90 border border-white/15 focus:border-amber-400/80 focus:ring-2 focus:ring-amber-500/20 rounded-2xl pl-16 pr-28 py-3.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 font-medium transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 px-2.5 py-1 text-[11px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Genre / Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Section: Left = Active Track Spotlight & Player, Right = Search Results Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Selected YouTube Song Spotlight & Cover Customization */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 sm:p-5 bg-zinc-950/80 rounded-2xl border border-white/10 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 border-b border-white/10">
              <span className="uppercase font-bold text-amber-400 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Selected YouTube Song Reference
              </span>
              <span className="text-zinc-500 text-[11px]">Ready for MIDI Extraction</span>
            </div>

            {/* Song Card Details */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Thumbnail */}
              <div className="relative w-full sm:w-36 h-28 sm:h-28 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 group">
                <img
                  src={selectedTrack.thumbnailUrl}
                  alt={selectedTrack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to placeholder if thumbnail unavailable
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                  <span className="text-[10px] font-mono text-amber-300 font-bold bg-black/60 px-1.5 py-0.5 rounded">
                    {selectedTrack.duration || '3:30'}
                  </span>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px] font-mono font-bold border border-red-500/30 flex items-center gap-1">
                    <Youtube className="w-3 h-3 fill-red-400" />
                    YouTube Audio
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">{selectedTrack.genre}</span>
                </div>
                
                <h3 className="text-base sm:text-lg font-black text-white truncate tracking-tight">
                  {selectedTrack.title}
                </h3>
                <p className="text-xs font-semibold text-zinc-300 truncate">
                  {selectedTrack.artist}
                </p>

                {/* Musical Readout */}
                <div className="flex items-center gap-3 pt-1 text-xs font-mono text-zinc-400">
                  <span>Key: <strong className="text-amber-400">{selectedTrack.estimatedKey || 'Auto'}</strong></span>
                  <span>•</span>
                  <span>Tempo: <strong className="text-amber-400">{selectedTrack.estimatedBpm || 104} BPM</strong></span>
                </div>
              </div>
            </div>

            {/* Authentic Chords Progression Preview */}
            <div className="p-3 bg-zinc-900/90 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                <span className="font-bold text-zinc-200 flex items-center gap-1">
                  <Music2 className="w-3 h-3 text-amber-400" />
                  Authentic Chords Preview:
                </span>
                <span className="text-[10px] text-amber-400">Voice-led into DAW</span>
              </div>
              <p className="text-xs font-mono text-amber-300 font-semibold tracking-wide bg-black/40 p-2 rounded-lg border border-white/5 overflow-x-auto">
                {selectedTrack.chordsSummary || 'D - F#m - G - A (Auto-analyzed)'}
              </p>
              {selectedTrack.description && (
                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                  {selectedTrack.description}
                </p>
              )}
            </div>

            {/* In-App YouTube Audio Reference Player (Optional toggle) */}
            <div>
              <button
                type="button"
                onClick={() => setShowEmbedPlayer(!showEmbedPlayer)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-all py-1 font-mono"
              >
                {showEmbedPlayer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showEmbedPlayer ? 'Hide YouTube Player' : '▶ Listen to Original Track Reference'}</span>
              </button>

              {showEmbedPlayer && isDirectVideoId && (
                <div className="mt-2 rounded-xl overflow-hidden border border-white/10 aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedTrack.id}?autoplay=0&rel=0`}
                    title={selectedTrack.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )}
            </div>

            {/* Performance Style & Singer Transpose Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div>
                <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Arrangement Style
                </label>
                <select
                  value={coverStyle}
                  onChange={(e) => setCoverStyle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                >
                  <option value="Acoustic Singer-Songwriter Groove">Acoustic Fingerpicked (Delilah / Taylor Swift)</option>
                  <option value="Intimate Rolling Piano Ballad">Intimate Rolling Ballad (Adele / Someone Like You)</option>
                  <option value="Nu-Disco / Funk Pop Groove">Nu-Disco / Funk Pop (Espresso / Chic Bass)</option>
                  <option value="Modern Alt R&B 808 Build">Modern Alt R&B 808s (Billie / SZA / Ocean)</option>
                  <option value="80s Synth Pop / Glam Pumping">80s Synth Pop / Glam (Good Luck Babe / Weeknd)</option>
                  <option value="Indie Rock Dynamic Anthem">Indie Rock Dynamic Lift (Radiohead / Coldplay)</option>
                  <option value="Lo-Fi Bedroom Chill Piano">Lo-Fi Bedroom Chill (Dusty, Swung)</option>
                  <option value="Gospel Soul Piano Stabs">Gospel Soul 7ths & 9ths (Sam Smith / Alicia Keys)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
                  <span>Singer Transpose</span>
                  <span className="text-amber-400">{vocalShift >= 0 ? `+${vocalShift}` : vocalShift} semitones</span>
                </label>
                <select
                  value={vocalShift}
                  onChange={(e) => setVocalShift(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                >
                  {VOCAL_RANGES.map((r) => (
                    <option key={r.id} value={r.shift}>
                      {r.name} ({r.shift >= 0 ? `+${r.shift}` : r.shift})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate Trigger Inside Card */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-zinc-950" />
              <span>{isGenerating ? 'Arranging From YouTube...' : `Arrange "${selectedTrack.title}" as MIDI`}</span>
            </button>

          </div>

          {/* Quick Option to switch to manual chord tab if needed */}
          {onSwitchToManualTab && (
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-950/40 rounded-xl border border-white/5 text-xs text-zinc-400">
              <span>Prefer to paste your own chord tab lyrics?</span>
              <button
                type="button"
                onClick={onSwitchToManualTab}
                className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-all flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Switch to Manual Tab Editor</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Search Results & Recommended Hits */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <span className="uppercase font-bold tracking-wider text-zinc-300">
              {searchQuery ? `Search Results (${searchResults.length})` : 'Popular YouTube Songs (Tap to Arrange)'}
            </span>
            <span className="text-[11px] text-zinc-500">Tap any song</span>
          </div>

          {/* List of Song Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
            {searchResults.map((track) => {
              const isSelected = selectedTrack?.id === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-3 group relative ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/15 ring-1 ring-amber-400/40'
                      : 'bg-zinc-950/70 border-white/5 hover:bg-zinc-900 hover:border-white/15'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                    <img
                      src={track.thumbnailUrl}
                      alt={track.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';
                      }}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                        <Check className="w-5 h-5 text-zinc-950 bg-amber-400 rounded-full p-0.5" />
                      </div>
                    )}
                  </div>

                  {/* Song Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {track.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                      {track.artist}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-zinc-500">
                      <span className="text-amber-400 font-semibold">{track.estimatedKey}</span>
                      <span>•</span>
                      <span>{track.estimatedBpm} BPM</span>
                      <span>•</span>
                      <span className="truncate">{track.genre?.split('/')[0]}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
