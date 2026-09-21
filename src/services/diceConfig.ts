import { DieConfig } from '../types/music';

export const INITIAL_DICE: DieConfig[] = [
  {
    id: 'key_mode',
    name: 'Key & Mode',
    shortName: 'KEY',
    iconName: 'Music',
    color: '#F59E0B', // Amber
    isLocked: false,
    selectedFaceIndex: 1, // A minor
    faces: [
      { id: 'c_maj', label: 'C Major', sublabel: 'Ionian', description: 'Bright, pure, open pop foundation', value: 'C major', tag: 'Major' },
      { id: 'a_min', label: 'A Minor', sublabel: 'Aeolian', description: 'Classic emotional, introspective bedroom mood', value: 'A minor', tag: 'Minor' },
      { id: 'g_maj', label: 'G Major', sublabel: 'Ionian', description: 'Uplifting, warm acoustic singer-songwriter vibe', value: 'G major', tag: 'Major' },
      { id: 'e_min', label: 'E Minor', sublabel: 'Aeolian', description: 'Driving, moody indie rock & dark pop', value: 'E minor', tag: 'Minor' },
      { id: 'd_dorian', label: 'D Dorian', sublabel: 'Dorian', description: 'Funky, jazzy minor with bright natural 6th', value: 'D Dorian', tag: 'Modal' },
      { id: 'f_lydian', label: 'F Lydian', sublabel: 'Lydian', description: 'Dreamy, ethereal filmic with sharp 4th', value: 'F Lydian', tag: 'Modal' },
      { id: 'bb_min', label: 'Bb Minor', sublabel: 'Aeolian', description: 'Deep, dark, contemporary R&B & hip-hop', value: 'Bb minor', tag: 'Minor' },
      { id: 'cs_min', label: 'C# Minor', sublabel: 'Aeolian', description: 'Dramatic, intense, modern pop tension', value: 'C# minor', tag: 'Minor' },
      { id: 'a_mixo', label: 'A Mixolydian', sublabel: 'Mixolydian', description: 'Bluesy rock groove with flat 7th', value: 'A Mixolydian', tag: 'Modal' },
      { id: 'eb_maj', label: 'Eb Major', sublabel: 'Ionian', description: 'Lush, rich soul & RnB warmth', value: 'Eb major', tag: 'Major' },
      { id: 'b_min', label: 'B Minor', sublabel: 'Aeolian', description: 'Epic, melancholic singer-songwriter anthem', value: 'B minor', tag: 'Minor' },
      { id: 'fs_min', label: 'F# Minor', sublabel: 'Aeolian', description: 'Bitter-sweet acoustic ballad resonance', value: 'F# minor', tag: 'Minor' },
    ],
  },
  {
    id: 'tempo_feel',
    name: 'Tempo & Groove',
    shortName: 'BPM',
    iconName: 'Gauge',
    color: '#EF4444', // Rose/Red
    isLocked: false,
    selectedFaceIndex: 2, // 94 Mid Hip-Hop / Pop
    faces: [
      { id: 'bpm_72', label: '72 BPM', sublabel: 'Slow Ballad', description: 'Spacious emotional ballad, slow breath', value: '72 bpm / straight', tag: 'Slow' },
      { id: 'bpm_86', label: '86 BPM', sublabel: 'Boom-Bap Swing', description: 'Golden era hip-hop headnod pocket', value: '86 bpm / light swing', tag: 'Groove' },
      { id: 'bpm_94', label: '94 BPM', sublabel: 'Mid Hip-Hop / Pop', description: 'Catchy mid-tempo modern radio groove', value: '94 bpm / light swing', tag: 'Pop' },
      { id: 'bpm_102', label: '102 BPM', sublabel: 'Pop Groove', description: 'Bouncy, walking tempo with tight pocket', value: '102 bpm / straight', tag: 'Pop' },
      { id: 'bpm_118', label: '118 BPM', sublabel: 'Four-on-Floor', description: 'Nu-disco, house-pop, infectious pulse', value: '118 bpm / straight', tag: 'Upbeat' },
      { id: 'bpm_128', label: '128 BPM', sublabel: 'Club Dance', description: 'Driving electronic dance club energy', value: '128 bpm / straight', tag: 'Dance' },
      { id: 'bpm_140', label: '140 BPM', sublabel: 'Trap & Drill Energy', description: 'Rapid rolling hats, half-time snare', value: '140 bpm / straight', tag: 'Trap' },
      { id: 'bpm_168', label: '168 BPM', sublabel: 'Indie Double-Time', description: 'Fast indie rock strumming / punk energy', value: '168 bpm / straight', tag: 'Fast' },
      { id: 'bpm_60', label: '60 BPM', sublabel: 'Deep Soul Ballad', description: 'Heavy swing 6/8 or slow neo-soul sway', value: '60 bpm / heavy swing', tag: 'Soul' },
      { id: 'bpm_112', label: '112 BPM', sublabel: 'Funk Pocket', description: 'Tight syncopated funk & disco groove', value: '112 bpm / light swing', tag: 'Funk' },
    ],
  },
  {
    id: 'structure',
    name: 'Song Structure',
    shortName: 'FORM',
    iconName: 'LayoutGrid',
    color: '#8B5CF6', // Purple
    isLocked: false,
    selectedFaceIndex: 0, // 8-bar loop
    faces: [
      { id: 'form_8bar', label: '8-Bar Loop', sublabel: 'Hook / Main Sketch', description: 'Tight 8-bar producer loop ready to arrange', value: '8-bar loop', tag: 'Loop' },
      { id: 'form_16bar', label: '16-Bar Verse-Chorus', sublabel: 'Verse 8 + Chorus 8', description: 'Standard 16-bar transition sketch', value: 'Verse 8 -> Chorus 8', tag: 'Song' },
      { id: 'form_v_pre_c', label: 'Verse-Pre-Chorus', sublabel: '24 Bars Total', description: 'Dynamic build from quiet verse to huge hook', value: 'Verse 8 -> Pre 8 -> Chorus 8', tag: 'Song' },
      { id: 'form_aaba', label: 'AABA Classic', sublabel: '32 Bars Songwriting', description: 'Timeless melodic songwriting architecture', value: 'A 8 -> A 8 -> B 8 -> A 8', tag: 'Standard' },
      { id: 'form_drop', label: 'Drop-Build-Drop', sublabel: '16 Bars Electronic', description: 'Intro buildup, energetic release drop', value: 'Build 8 -> Drop 8', tag: 'EDM' },
      { id: 'form_intro_hook', label: 'Intro-Hook-Break', sublabel: '16 Bars Modern Pop', description: 'Instant hook gratification for viral covers', value: 'Intro 4 -> Hook 8 -> Break 4', tag: 'Modern' },
    ],
  },
  {
    id: 'chords',
    name: 'Chord Progression',
    shortName: 'CHORDS',
    iconName: 'Layers',
    color: '#10B981', // Emerald
    isLocked: false,
    selectedFaceIndex: 1, // vi-IV-I-V emotional
    faces: [
      { id: 'ch_1_5_6_4', label: 'I – V – vi – IV', sublabel: 'The Axis / Pop Anthem', description: 'The most legendary catchy progression in pop history', value: 'I - V - vi - IV', tag: 'Pop' },
      { id: 'ch_6_4_1_5', label: 'vi – IV – I – V', sublabel: 'Emotional Pop / Singer', description: 'Moody, heartfelt minor start resolving to major lift', value: 'vi - IV - I - V', tag: 'Emotional' },
      { id: 'ch_2_5_1', label: 'ii – V – I – VI', sublabel: 'Jazz / Neo-Soul Loop', description: 'Smooth chromatic turnaround with lush extensions', value: 'ii - V - I - VI', tag: 'Soul' },
      { id: 'ch_1_6_7_cin', label: 'i – bVI – bVII – i', sublabel: 'Cinematic Minor', description: 'Dark, epic film score and moody alt-pop drive', value: 'i - bVI - bVII - i', tag: 'Cinematic' },
      { id: 'ch_1_7_4', label: 'I – bVII – IV', sublabel: 'Indie / Classic Rock', description: 'Open, anthemic road-trip indie rock lift', value: 'I - bVII - IV - I', tag: 'Rock' },
      { id: 'ch_1_4_5_dark', label: 'i – iv – v – i', sublabel: 'Dark Minor Blues', description: 'Nocturnal, brooding bedroom melancholy', value: 'i - iv - v - i', tag: 'Dark' },
      { id: 'ch_1_3_4_5', label: 'I – iii – IV – V', sublabel: 'Bright Lift / Uplift', description: 'Sweet nostalgic build into soaring chorus', value: 'I - iii - IV - V', tag: 'Bright' },
      { id: 'ch_pedal', label: 'Pedal Tone Colors', sublabel: 'Static Bass, Moving Chords', description: 'Modern cinematic tension with rich inner voice movement', value: 'Pedal Bass + Changing Colors', tag: 'Modern' },
      { id: 'ch_canon', label: 'I – V – vi – iii – IV', sublabel: 'Canon / Ballad Flow', description: 'Timeless melodic voice leading for piano covers', value: 'I - V - vi - iii - IV - I - IV - V', tag: 'Ballad' },
    ],
  },
  {
    id: 'chord_rhythm',
    name: 'Chord Rhythm',
    shortName: 'RHYTHM',
    iconName: 'Activity',
    color: '#06B6D4', // Cyan
    isLocked: false,
    selectedFaceIndex: 2, // Syncopated Pop Stabs
    faces: [
      { id: 'rh_whole', label: 'Whole-Note Pads', sublabel: 'Sustained & Cinematic', description: 'Lush long chords giving maximum room for vocals', value: 'Whole-note sustained pads', tag: 'Spacious' },
      { id: 'rh_half', label: 'Half-Note Pushes', sublabel: 'Syncopated Anticipation', description: 'Chords hit on beat 1 and & of 2 for forward drive', value: 'Half-note pushed chords', tag: 'Driving' },
      { id: 'rh_stabs', label: 'Syncopated Pop Stabs', sublabel: 'Groovy Keys / Stabs', description: 'Bouncy stabs locking with kick and snare pocket', value: 'Syncopated piano stabs', tag: 'Groovy' },
      { id: 'rh_arp', label: 'Arpeggiated 16ths', sublabel: 'Rolling Piano / Synth', description: 'Flowing continuous arpeggios like Someone Like You', value: 'Rolling 16th arpeggios', tag: 'Ballad' },
      { id: 'rh_offbeat', label: 'Offbeat Reggae / Ska', sublabel: 'The "And" of Beats', description: 'Chops on beats 2 & 4 or all upbeats for light bounce', value: 'Offbeat upbeat skanks', tag: 'Bounce' },
      { id: 'rh_house', label: 'House Gated Chords', sublabel: 'Staccato 16th Gate', description: 'Pumping sidechained dance piano rhythm', value: 'Four-on-floor pumping stabs', tag: 'Dance' },
      { id: 'rh_trap_hits', label: 'Sparse Trap Hits', sublabel: 'Bell & Color Hits', description: 'Minimal downbeat strike with long reverb tail', value: 'Sparse bar-1 hits + accents', tag: 'Trap' },
      { id: 'rh_drone', label: 'Held Drone + Accents', sublabel: 'Low Pedal + High Riffs', description: 'Hypnotic low foundation with glittering high notes', value: 'Drone root + color touches', tag: 'Ambient' },
    ],
  },
  {
    id: 'bass',
    name: 'Bass Line Motion',
    shortName: 'BASS',
    iconName: 'Disc',
    color: '#EC4899', // Pink
    isLocked: false,
    selectedFaceIndex: 2, // Syncopated Pop Pocket
    faces: [
      { id: 'ba_root', label: 'Root-Note Pump', sublabel: 'Eighth-Note Driving', description: 'Consistent driving root pump for rock, synth-pop, and EDM', value: 'Straight 8th root pump', tag: 'Driving' },
      { id: 'ba_walking', label: 'Walking Jazz Bass', sublabel: 'Quarter-Note Transitions', description: 'Smooth chromatic passing tones connecting each chord', value: 'Walking bass with passing notes', tag: 'Jazz' },
      { id: 'ba_pocket', label: 'Syncopated Pop Pocket', sublabel: 'Kick-Locked Groove', description: 'Hangs back in the pocket, accenting kicks and groove', value: 'Syncopated pocket bass', tag: 'Pocket' },
      { id: 'ba_808', label: '808 Sub & Slides', sublabel: 'Deep Gliding Sub', description: 'Rumbling low end with pitch glides and punchy attack', value: '808 sub bass with octave slides', tag: 'Sub' },
      { id: 'ba_ostinato', label: 'Ostinato Riff', sublabel: 'Repeating Bass Motif', description: 'Catchy 2-bar bass motif that carries the entire track', value: 'Repeating melodic bass riff', tag: 'Motif' },
      { id: 'ba_counter', label: 'Counter-Melody Bass', sublabel: 'Active High Register', description: 'Bass acts as a secondary vocal counterpoint', value: 'Melodic counterpoint bass', tag: 'Melodic' },
      { id: 'ba_minimal', label: 'Minimal Whole Notes', sublabel: 'Pure Sub Foundation', description: 'Hits strictly on bar 1, leaves max headroom for singer', value: 'Sustained root notes on 1', tag: 'Minimal' },
      { id: 'ba_octaves', label: 'Disco Octave Jumps', sublabel: 'Low-High Alternation', description: 'Bouncy 16th octave bounce for infectious retro dance', value: 'Octave jumping funk bass', tag: 'Disco' },
    ],
  },
  {
    id: 'drums',
    name: 'Drum Pattern',
    shortName: 'DRUMS',
    iconName: 'Drum',
    color: '#3B82F6', // Blue
    isLocked: false,
    selectedFaceIndex: 1, // Trap hats + snare
    faces: [
      { id: 'dr_boombap', label: 'Boom-Bap Dusty Groove', sublabel: 'Kick-Snare-Hat Sway', description: 'Punchy kick on 1, fat snare on 2 & 4, swung loose hats', value: 'Swung boom-bap kit', tag: 'Hip-Hop' },
      { id: 'dr_trap', label: 'Trap Hats + Crisp Snare', sublabel: 'Rolling Hi-Hats', description: 'Crisp 16th & 32nd triplet hat rolls with hard clap on 3', value: 'Trap rolls + rim clap', tag: 'Trap' },
      { id: 'dr_four_floor', label: 'Four-on-the-Floor', sublabel: 'Kick on Every Beat', description: 'Thumping kick on 1, 2, 3, 4 with offbeat open hats', value: 'Four-on-floor dance pulse', tag: 'Dance' },
      { id: 'dr_breakbeat', label: 'Breakbeat Funk', sublabel: 'Syncopated Ghost Notes', description: 'Funky syncopated kick and snare with ghost notes', value: 'Funk break with ghost snares', tag: 'Funk' },
      { id: 'dr_lofi', label: 'Lo-Fi Dusty Kit', sublabel: 'Muffled Kick & Snap', description: 'Soft round kick, vinyl rim-click, lazy unquantized swing', value: 'Lo-fi filtered kit + shaker', tag: 'Lo-Fi' },
      { id: 'dr_indie', label: 'Indie Rock Kit', sublabel: 'Driving Real Acoustic', description: 'Warm acoustic kick, fat wood snare, open crash accents', value: 'Live acoustic indie drum kit', tag: 'Indie' },
      { id: 'dr_latin', label: 'Latin Clave & Shaker', sublabel: 'Cross-Stick & Shaker', description: '3-2 son clave rimshot with smooth continuous shaker', value: 'Latin clave + dynamic shaker', tag: 'Latin' },
      { id: 'dr_halftime', label: 'Half-Time Anthem Drop', sublabel: 'Massive Snare on 3', description: 'Spacious cinematic half-time feel for vocal climaxes', value: 'Massive half-time stadium snare', tag: 'Anthem' },
      { id: 'dr_minimal', label: 'Minimal Click & Finger Snap', sublabel: 'Acoustic Bedroom', description: 'Intimate finger snaps and quiet metronomic pulse', value: 'Finger snap + wooden click', tag: 'Minimal' },
    ],
  },
];

export const OPTIONAL_DICE: DieConfig[] = [
  {
    id: 'melody_contour',
    name: 'Melody Contour',
    shortName: 'MELODY',
    iconName: 'Sparkles',
    color: '#A855F7',
    isLocked: false,
    selectedFaceIndex: 0,
    isOptional: true,
    enabled: true,
    faces: [
      { id: 'mel_step', label: 'Stepwise Hook', sublabel: 'Scale Motion', description: 'Smooth singable notes moving by 1-2 steps', value: 'Stepwise vocal hook', tag: 'Vocal' },
      { id: 'mel_leap', label: 'Leap & Return', sublabel: 'Dramatic 5th/8ve Jump', description: 'Emotional octave or 5th leap landing smoothly', value: 'Dramatic melodic leaps', tag: 'Dramatic' },
      { id: 'mel_call', label: 'Call & Response', sublabel: 'Question -> Answer', description: 'Short phrase followed by answering phrase', value: 'Call and response motif', tag: 'Catchy' },
      { id: 'mel_penta', label: 'Pentatonic Riff', sublabel: '5-Note Soul Hook', description: 'Universal catchy soul/pop pentatonic phrase', value: 'Pentatonic vocal riff', tag: 'Universal' },
      { id: 'mel_motif', label: 'Motif + Sequence', sublabel: 'Transposed Echo', description: '3-note hook repeated higher or lower across chords', value: 'Motif sequence variation', tag: 'Hook' },
    ],
  },
  {
    id: 'energy',
    name: 'Energy Level',
    shortName: 'ENERGY',
    iconName: 'Flame',
    color: '#F97316',
    isLocked: false,
    selectedFaceIndex: 1,
    isOptional: true,
    enabled: true,
    faces: [
      { id: 'en_intimate', label: 'Intimate Bedroom', sublabel: 'Quiet & Vulnerable', description: 'Soft dynamics, minimal layers, whisper space', value: 'Intimate & vulnerable', tag: 'Soft' },
      { id: 'en_mid', label: 'Mid Groove', sublabel: 'Steady Headnod', description: 'Balanced arrangement that supports singing', value: 'Balanced mid-energy pocket', tag: 'Mid' },
      { id: 'en_anthem', label: 'Anthemic Lift', sublabel: 'Soaring & Big', description: 'Full chords, huge drums, stadium vocal energy', value: 'Anthemic emotional climax', tag: 'Huge' },
      { id: 'en_drive', label: 'High Drive', sublabel: 'Urgent & Fast', description: 'Fast moving notes, continuous pulse', value: 'High energy drive', tag: 'Fast' },
    ],
  },
  {
    id: 'genre_vibe',
    name: 'Genre / Vibe',
    shortName: 'GENRE',
    iconName: 'Radio',
    color: '#14B8A6',
    isLocked: false,
    selectedFaceIndex: 0,
    isOptional: true,
    enabled: true,
    faces: [
      { id: 'g_indiepop', label: 'Indie Bedroom Pop', sublabel: 'Lo-fi Keys & Warmth', description: 'Clairo / Rex Orange County style warm piano and groove', value: 'Indie Bedroom Pop', tag: 'Indie' },
      { id: 'g_altrnb', label: 'Alt R&B / Soul', sublabel: 'Lush Chords & 808', description: 'Frank Ocean / SZA styled soulful piano & deep sub', value: 'Alt R&B Soul', tag: 'R&B' },
      { id: 'g_lofi', label: 'Lo-Fi Chill Hop', sublabel: 'Dusty & Relaxed', description: 'Cozy study beats with vinyl warmth', value: 'Lo-Fi Chill', tag: 'Lo-Fi' },
      { id: 'g_house', label: 'Nu-Disco / House Pop', sublabel: 'Dua Lipa / 4-on-Floor', description: 'Infectious funky bass & bright piano stabs', value: 'House Pop', tag: 'Dance' },
      { id: 'g_cinematic', label: 'Cinematic Piano Ballad', sublabel: 'Adele / Billie Eilish', description: 'Huge emotional dynamics and sweeping reverbs', value: 'Cinematic Ballad', tag: 'Ballad' },
      { id: 'g_singer', label: 'Singer-Songwriter', sublabel: 'Acoustic & Pure', description: 'Ed Sheeran / Taylor Swift intimate acoustic piano', value: 'Acoustic Singer-Songwriter', tag: 'Acoustic' },
    ],
  },
  {
    id: 'time_sig',
    name: 'Time Signature',
    shortName: 'METER',
    iconName: 'Clock',
    color: '#6366F1',
    isLocked: false,
    selectedFaceIndex: 0,
    isOptional: true,
    enabled: false,
    faces: [
      { id: 'ts_4_4', label: '4/4 Common Time', sublabel: 'Standard Meter', description: '4 beats per bar, the universal pop standard', value: '4/4', tag: 'Standard' },
      { id: 'ts_3_4', label: '3/4 Waltz Meter', sublabel: 'Waltz Sway', description: '3 beats per bar, gentle romantic sway', value: '3/4', tag: 'Waltz' },
      { id: 'ts_6_8', label: '6/8 Rolling Ballad', sublabel: 'Triplet Feel', description: '6 eighth notes per bar, Hallelujah / blues anthem', value: '6/8', tag: 'Ballad' },
    ],
  },
  {
    id: 'density',
    name: 'Arrangement Density',
    shortName: 'DENSITY',
    iconName: 'BarChart2',
    color: '#EAB308',
    isLocked: false,
    selectedFaceIndex: 1,
    isOptional: true,
    enabled: false,
    faces: [
      { id: 'den_sparse', label: 'Sparse Piano Only', sublabel: 'Vocal Focus', description: 'Just piano + light sub, 100% focus on singer voice', value: 'Sparse Piano Only', tag: 'Minimal' },
      { id: 'den_trio', label: 'Piano Trio (Keys/Bass/Drums)', sublabel: 'Standard Band', description: 'Complete 3-piece backing band arrangement', value: 'Piano Trio', tag: 'Standard' },
      { id: 'den_full', label: 'Full Production Layers', sublabel: 'Keys + Pad + Lead + Bass + Drums', description: 'Rich studio production with vocal guide and pads', value: 'Full Production', tag: 'Full' },
    ],
  },
  {
    id: 'hook_type',
    name: 'Guide Hook Type',
    shortName: 'HOOK',
    iconName: 'Mic',
    color: '#84CC16',
    isLocked: false,
    selectedFaceIndex: 0,
    isOptional: true,
    enabled: false,
    faces: [
      { id: 'hk_vocal', label: 'Topline Vocal Melody', sublabel: 'Singable Lyrics Guide', description: 'Melody line mimicking a lead vocal to practice singing over', value: 'Topline Vocal Melody', tag: 'Vocal' },
      { id: 'hk_piano', label: 'Piano Riff Hook', sublabel: 'Instrumental Theme', description: 'Iconic keyboard riff playing alongside chords', value: 'Piano Riff', tag: 'Keys' },
      { id: 'hk_synth', label: 'Synth Stab Hook', sublabel: 'Short Catchy Hits', description: 'Punchy 80s/modern synth stabs', value: 'Synth Stab', tag: 'Synth' },
      { id: 'hk_none', label: 'Instrumental Only (No Guide)', sublabel: 'Karaoke Backing', description: 'Pure instrumental backing track with no guide melody', value: 'No Guide Melody', tag: 'Clean' },
    ],
  },
];

export const DEFAULT_DICE = INITIAL_DICE;

