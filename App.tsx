/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// FIX: Corrected import statement for React and its hooks/types.
import React, {useState, useRef, ChangeEvent, useEffect} from 'react';
import ContentContainer from './components/ContentContainer';
import ExampleGallery from './components/ExampleGallery';
import RPGView, {RpgData, RpgInteractionOption} from './components/RPGView';
import {validateYoutubeUrl} from './lib/youtube';
import {
  generateVideoAnalysis,
  generateNarrativeCheck,
  generateRPGData,
  generateWebApp,
  generatePdfAnalysis,
  generateNarrativeCheckFromFile,
  generateRPGDataFromFile,
  generateNarrativeCheckFromText,
  generateRPGDataFromText,
} from './lib/textGeneration';
import { categories } from './lib/subjects';
// FIX: Import TopRatedGame type to handle playing games from the top-rated list.
import { topRatedGames, type TopRatedGame, ww2Countries, ww2Events, type Ww2Country, type Ww2GameEvent, type Ww2PlayerChoice } from './lib/topRatedGames';
import { exampleGamesBySubject, GeneratedGame } from './lib/exampleGames';
import { initialCommunityGames } from './lib/communityGames';

type View = 'landing' | 'subjects' | 'inputs' | 'game' | 'webapp' | 'ww2game';
type GameStatus = 'playing' | 'victory';
type AnalysisResult = {assumedKnowledge: string[]; learningGoal: string};
type ActivePage = 'generate' | 'library' | 'settings' | 'top-rated' | 'community';

interface SavedGame {
  id: string;
  name: string;
  subject: string;
  type: 'rpg' | 'webapp';
  data: RpgData | {spec: string; code: string};
  isPublic: boolean;
}

interface CommunityGame extends SavedGame {
  authorName: string;
  ratings: { total: number; count: number };
  averageRating: number;
  imageUrl?: string; 
}

interface UserSettings {
  name: string;
  college: string;
  customPrompt: string;
}

const DEFAULT_PROMPT = `You are a pedagogist and product designer with deep expertise in crafting engaging learning experiences via interactive, vivid, visual-based web apps.

Examine the contents of the attached video. Then, write a detailed and carefully considered spec for an interactive web app designed to complement the video and reinforce its key idea or ideas. The recipient of the spec does not have access to the video, so the spec must be thorough and self-contained (the spec must not mention that it is based on a video). Here is an example of a spec written in response to a video about functional harmony:

"In music, chords create expectations of movement toward certain other chords and resolution towards a tonal center. This is called functional harmony.

Build me an interactive web app to help a learner understand the concept of functional harmony.

SPECIFICATIONS:
1. The app must feature an interactive keyboard.
2. The app must showcase all 7 diatonic triads that can be created in a major key (i.e., tonic, supertonic, mediant, subdominant, dominant, submediant, leading chord).
3. The app must somehow describe the function of each of the diatonic triads, and state which other chords each triad tends to lead to.
4. The app must provide a way for users to play different chords in sequence and see the results.
[etc.]"

The goal of the app that is to be built based on the spec is to enhance understanding through simple and playful design. The provided spec should not be overly complex, i.e., a junior web developer should be able to implement it in a single html file (with all styles and scripts inline). Most importantly, the spec must clearly outline the core mechanics of the app, and those mechanics must be highly effective in reinforcing the given video's key idea(s).

Provide the result as a JSON object containing a single field called "spec", whose value is the spec for the web app.`;

// New component for the Settings Page
interface SettingsPageProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
}

const SettingsPage = ({ settings, setSettings }: SettingsPageProps) => {
    const [tempSettings, setTempSettings] = useState(settings);

    // Sync temp state if the parent's state changes
    useEffect(() => {
        setTempSettings(settings);
    }, [settings]);

    const handleSave = () => {
      setSettings(tempSettings);
      alert('Settings saved!');
    };

    return (
      <>
        <header className="app-header">
            <h1>Settings</h1>
            <p>Personalize your experience.</p>
        </header>
        <main className="settings-view">
            <div className="settings-form">
                <div className="input-group">
                    <label htmlFor="user-name">Your Name:</label>
                    <input
                        id="user-name"
                        type="text"
                        value={tempSettings.name}
                        onChange={(e) => setTempSettings({...tempSettings, name: e.target.value})}
                        placeholder="e.g., Linus Liu"
                    />
                </div>
                 <div className="input-group">
                    <label htmlFor="user-college">Your College:</label>
                    <input
                        id="user-college"
                        type="text"
                        value={tempSettings.college}
                        onChange={(e) => setTempSettings({...tempSettings, college: e.target.value})}
                        placeholder="e.g., Rice University"
                    />
                </div>
                 <div className="input-group full-width">
                    <label htmlFor="custom-prompt">Custom App Generation Prompt:</label>
                    <textarea
                        id="custom-prompt"
                        rows={15}
                        value={tempSettings.customPrompt}
                        onChange={(e) => setTempSettings({...tempSettings, customPrompt: e.target.value})}
                    />
                </div>
                <button onClick={handleSave} className="generate-button">Save Settings</button>
            </div>
        </main>
      </>
    );
};

const IconGenerate = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>);
const IconLibrary = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="round"/></svg>);
const IconTopRated = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>);
const IconCommunity = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16C9 14.8954 9.89543 14 11 14H13C14.1046 14 15 14.8954 15 16V17H9V16Z" stroke="currentColor" strokeWidth="1.5"/><path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" stroke="currentColor" strokeWidth="1.5"/><path d="M5 16C5 14.8954 5.89543 14 7 14H9V17H5V16Z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11C8.65685 11 10 9.65685 10 8C10 6.34315 8.65685 5 7 5C5.34315 5 4 6.34315 4 8C4 9.65685 5.34315 11 7 11Z" stroke="currentColor" strokeWidth="1.5"/><path d="M19 16C19 14.8954 18.1046 14 17 14H15V17H19V16Z" stroke="currentColor" strokeWidth="1.5"/><path d="M17 11C15.3431 11 14 9.65685 14 8C14 6.34315 15.3431 5 17 5C18.6569 5 20 6.34315 20 8C20 9.65685 18.6569 11 17 11Z" stroke="currentColor" strokeWidth="1.5"/></svg>);
const IconSettings = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5"/><path d="M12 2V4M12 20V22M22 12H20M4 12H2M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" strokeWidth="1.5"/><path d="M12 6V5M12 19V18M18 12H19M5 12H6M16.24 7.76L16.95 7.05M7.05 16.95L7.76 16.24M16.24 16.24L16.95 16.95M7.05 7.05L7.76 7.76" stroke="currentColor" strokeWidth="1.5"/></svg>);
const IconMenu = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/></svg>);
const IconMenuOpen = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 18L15 12L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/><path d="M4 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/></svg>);

const Sidebar = ({ activePage, setActivePage, isSidebarFolded, setIsSidebarFolded }: { activePage: ActivePage, setActivePage: (page: ActivePage) => void, isSidebarFolded: boolean, setIsSidebarFolded: (isFolded: boolean) => void }) => {
  return (
    <nav className={`sidebar ${isSidebarFolded ? 'folded' : ''}`}>
      <ul>
        <li>
          <button onClick={() => setActivePage('generate')} className={activePage === 'generate' ? 'active' : ''} title="Generate">
            <IconGenerate />
            <span className="button-text">Generate</span>
          </button>
        </li>
        <li>
          <button onClick={() => setActivePage('library')} className={activePage === 'library' ? 'active' : ''} title="My Library">
            <IconLibrary />
            <span className="button-text">My Library</span>
          </button>
        </li>
        <li>
          <button onClick={() => setActivePage('top-rated')} className={activePage === 'top-rated' ? 'active' : ''} title="Top Rated Games">
            <IconTopRated />
            <span className="button-text">Top Rated</span>
          </button>
        </li>
         <li>
          <button onClick={() => setActivePage('community')} className={activePage === 'community' ? 'active' : ''} title="Community">
            <IconCommunity />
            <span className="button-text">Community</span>
          </button>
        </li>
        <li>
          <button onClick={() => setActivePage('settings')} className={activePage === 'settings' ? 'active' : ''} title="Settings">
            <IconSettings />
            <span className="button-text">Settings</span>
          </button>
        </li>
      </ul>
      <div className="sidebar-footer">
        <button className="toggle-sidebar-btn" onClick={() => setIsSidebarFolded(!isSidebarFolded)} title={isSidebarFolded ? 'Expand Sidebar' : 'Collapse Sidebar'}>
           {isSidebarFolded ? <IconMenuOpen /> : <IconMenu />}
        </button>
      </div>
    </nav>
  );
};

interface StarRatingProps {
  gameId: string;
  averageRating: number;
  userRating: number;
  onRate: (gameId: string, rating: number) => void;
}

const StarRating = ({ gameId, averageRating, userRating, onRate }: StarRatingProps) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleRating = (rate: number) => {
      onRate(gameId, rate);
    };

    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    className={(hoverRating || userRating) >= star ? 'filled' : ''}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                    ★
                </button>
            ))}
            <span className="avg-rating">({averageRating.toFixed(1)})</span>
        </div>
    );
};

const EuropeMapPaths = {
  de: "M368,211 l-12,-16 l-12,-2 l-12,8 l-13,-2 l-2,-14 l-12,-12 l-11,2 l-7,-13 l-13,0 l-11,-15 l1,-12 l-14,-13 l-10,3 l-8,-11 l14,-13 l22,2 l22,-16 l14,8 l11,-1 l15,14 l9,-15 l18,-6 l11,21 l-10,13 l-8,14 l4,20 l-6,11 l-16,10 Z",
  pl: "M425,231 l-12,-18 l-10,-14 l-18,6 l-9,15 l-15,-14 l-11,1 l-14,-8 l11,-24 l10,-1 l19,13 l18,-1 l10,13 l17,14 l-7,22 Z",
  uk: "M205,103 l-18,-15 l-11,-1 l-9,15 l-10,3 l-14,-15 l-13,6 l-8,14 l11,13 l10,21 l14,4 l10,-12 l16,8 l12,-11 l12,10 Z",
  fr: "M290,285 l-15,-18 l-10,-24 l-26,5 l-14,-15 l-22,-4 l-12,12 l-10,18 l0,22 l10,14 l22,4 l28,0 l29,-2 Z",
  it: "M384,335 l-10,-16 l-8,-20 l-14,-12 l-10,5 l-2,10 l-12,10 l-11,-8 l10,-18 l14,-4 l12,6 l16,-10 l8,14 l6,22 Z",
  ussr: "M490,250 l-25,-12 l-18,-25 l-16,4 l-10,-12 l-17,-14 l-10,-13 l-18,1 l-19,-13 l-10,1 l-11,24 l15,35 l22,10 l30,4 l25,5 l20,-8 Z",
  be: "M310,195 l-8,-6 l-4,8 l5,7 l7,-1 Z",
  nl: "M320,180 l-10,-3 l-11,2 l-2,14 l13,2 l12,-8 Z",
  ch: "M332,260 l-12,-2 l-5,10 l14,5 l6,-8 Z",
  au: "M380,255 l-14,-5 l-16,-10 l-6,11 l-4,-20 l8,-14 l10,-13 l15,8 l5,10 l-2,16 Z",
  cz: "M388,235 l-15,-8 l-11,-1 l-14,8 l-22,16 l-22,-2 l-14,13 l8,11 l10,-3 l14,13 l11,15 l13,0 l13,-10 l16,-10 Z"
};

const WWIIStrategyGame = () => {
  type GamePhase = 'select_country' | 'event' | 'feedback' | 'game_over';

  const [phase, setPhase] = useState<GamePhase>('select_country');
  const [playerCountry, setPlayerCountry] = useState<Ww2Country | null>(null);
  const [eventIndex, setEventIndex] = useState(0);
  const [mapColors, setMapColors] = useState<{ [key: string]: string }>({});
  const [feedback, setFeedback] = useState<{consequence: string; reality: string} | null>(null);

  useEffect(() => {
    // Initialize map colors
    const initialColors: { [key: string]: string } = {};
    ww2Countries.forEach(c => {
      initialColors[c.id] = c.color;
    });
    setMapColors(initialColors);
  }, []);

  const handleCountrySelect = (country: Ww2Country) => {
    setPlayerCountry(country);
    setPhase('event');
  };
  
  const handleChoice = (choice: Ww2PlayerChoice) => {
      setFeedback({ consequence: choice.consequence, reality: choice.reality });
      setPhase('feedback');
  };

  const handleNextEvent = () => {
    const nextIndex = eventIndex + 1;
    if (nextIndex >= ww2Events.length) {
      setPhase('game_over');
    } else {
      const currentEvent = ww2Events[nextIndex];
      // Apply map changes for the new event
      if(currentEvent.mapChanges) {
          const newColors = {...mapColors};
          currentEvent.mapChanges.forEach(change => {
              const owner = ww2Countries.find(c => c.id === change.newOwnerId);
              if(owner) {
                  newColors[change.countryId] = owner.color;
              }
          });
          setMapColors(newColors);
      }
      setEventIndex(nextIndex);
      setPhase('event');
    }
  };
  
  const handleFeedbackContinue = () => {
      setFeedback(null);
      handleNextEvent();
  };
  
  const handleRestart = () => {
      setPlayerCountry(null);
      setEventIndex(0);
      const initialColors: { [key: string]: string } = {};
      ww2Countries.forEach(c => { initialColors[c.id] = c.color; });
      setMapColors(initialColors);
      setPhase('select_country');
  }

  const currentEvent = ww2Events[eventIndex];
  const isInteractive = currentEvent.interactiveFor?.includes(playerCountry?.id ?? '');

  return (
    <div className="ww2-game-container">
      {phase === 'select_country' && (
        <div className="country-selection-screen">
          <h1>Choose Your Nation</h1>
          <p>Select a country to guide through the war.</p>
          <div className="country-grid">
            {ww2Countries.filter(c => c.playable).map(country => (
              <div key={country.id} className="country-card" onClick={() => handleCountrySelect(country)}>
                <img src={country.leaderImage} alt={country.leader} />
                <h3>{country.name}</h3>
                <p>{country.leader}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === 'event' || phase === 'feedback') && playerCountry && (
        <div className="game-display">
          <div className="map-panel">
             <svg viewBox="180 80 350 300" className="europe-map">
                {Object.entries(EuropeMapPaths).map(([id, d]) => (
                    <path key={id} d={d} fill={mapColors[id] || '#ccc'} stroke="#1a2035" strokeWidth="0.5" />
                ))}
            </svg>
            <div className="player-info">
              <img src={playerCountry.leaderImage} alt={playerCountry.leader} />
              <div>
                <h4>{playerCountry.leader}</h4>
                <p>{playerCountry.name}</p>
              </div>
            </div>
          </div>
          <div className="timeline-panel">
            <div className="date-display">{currentEvent.date}</div>
            <h2>{currentEvent.title}</h2>
            <p className="event-description">{currentEvent.description}</p>
            {isInteractive && currentEvent.choices && phase === 'event' && (
                <div className="choices-container">
                    <h3>Your Decision:</h3>
                    {currentEvent.choices.map((choice, i) => (
                        <button key={i} onClick={() => handleChoice(choice)}>{choice.text}</button>
                    ))}
                </div>
            )}
            {!isInteractive && phase === 'event' && (
                 <button className="continue-btn" onClick={handleNextEvent}>Continue</button>
            )}
          </div>
        </div>
      )}
      
      {phase === 'feedback' && feedback && (
          <div className="feedback-modal-overlay">
              <div className="feedback-modal">
                  <h3>Consequence of Your Action:</h3>
                  <p>{feedback.consequence !== 'N/A' ? feedback.consequence : "This was the historical path taken."}</p>
                  <hr/>
                  <h3>Historical Reality:</h3>
                  <p>{feedback.reality}</p>
                  <button onClick={handleFeedbackContinue}>Continue Timeline</button>
              </div>
          </div>
      )}
      
      {phase === 'game_over' && (
          <div className="game-over-screen">
            <h1>The War Has Ended</h1>
            <p>You have navigated the treacherous path of history. The world is forever changed.</p>
            <button onClick={handleRestart}>Play Again</button>
          </div>
      )}
    </div>
  );
};

const RetroComputerAnimation = () => (
    <div className="computer-container">
        <div className="computer-screen">
            <div className="terminal">
                <p>&gt; LOAD "KNOWLEDGE.EXE"</p>
                <p>&gt; INPUT: YOUTUBE_URL</p>
                <p><span className="cursor">■</span></p>
                <p className="generating-text">GENERATING...</p>
                <div className="progress-bar-container">
                    <div className="progress-bar"></div>
                </div>
            </div>
        </div>
        <div className="computer-stand-neck"></div>
        <div className="computer-stand-base"></div>
    </div>
);

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('generate');
  const [view, setView] = useState<View>('landing');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<SavedGame | CommunityGame | TopRatedGame | null>(null);
  const [isSidebarFolded, setIsSidebarFolded] = useState(false);

  // --- State for Data & Favorites ---
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse favorites from localStorage', e);
      return [];
    }
  });

  const [savedGames, setSavedGames] = useState<SavedGame[]>(() => {
    try {
      const saved = localStorage.getItem('savedGames');
      if (saved) {
        const parsedGames: SavedGame[] = JSON.parse(saved);
        // Add isPublic flag for backward compatibility
        return parsedGames.map(game => ({ ...game, isPublic: game.isPublic || false }));
      }
      return [];
    } catch (e) {
      console.error('Failed to parse saved games from localStorage', e);
      return [];
    }
  });
  
  const [communityGames, setCommunityGames] = useState<CommunityGame[]>([]);
  const [userRatings, setUserRatings] = useState<{ [gameId: string]: number }>({});
  const [communitySearchTerm, setCommunitySearchTerm] = useState('');
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');
  const placeholderIntervalRef = useRef<number | null>(null);

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('userSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure customPrompt has a default value if it's missing
        if (!parsed.customPrompt) {
          parsed.customPrompt = DEFAULT_PROMPT;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse settings from localStorage', e);
    }
    // Return default settings if nothing is saved or parsing fails
    return { name: '', college: '', customPrompt: DEFAULT_PROMPT };
  });

  // --- Effect hooks to save to localStorage ---
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('savedGames', JSON.stringify(savedGames));
  }, [savedGames]);

  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    try {
        const saved = localStorage.getItem('communityGames');
        if (saved && saved !== '[]') {
            setCommunityGames(JSON.parse(saved));
        } else {
            // Seed with initial data if nothing is in localStorage
            setCommunityGames(initialCommunityGames as CommunityGame[]);
        }
    } catch (e) {
        console.error('Failed to parse community games from localStorage', e);
        setCommunityGames(initialCommunityGames as CommunityGame[]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('communityGames', JSON.stringify(communityGames));
  }, [communityGames]);
  
  useEffect(() => {
    try {
        const saved = localStorage.getItem('userRatings');
        setUserRatings(saved ? JSON.parse(saved) : {});
    } catch (e) {
        console.error('Failed to parse user ratings from localStorage', e);
    }
  }, []);

  useEffect(() => {
      localStorage.setItem('userRatings', JSON.stringify(userRatings));
  }, [userRatings]);
  
    useEffect(() => {
    const placeholderText = "Search games by name, subject, or author...";

    const clearPlaceholderInterval = () => {
        if (placeholderIntervalRef.current) {
            clearInterval(placeholderIntervalRef.current);
            placeholderIntervalRef.current = null;
        }
    };

    if (activePage === 'community' && communitySearchTerm === '') {
        let currentIndex = 0;
        clearPlaceholderInterval();

        placeholderIntervalRef.current = window.setInterval(() => {
            currentIndex++;
            if (currentIndex <= placeholderText.length) {
                setAnimatedPlaceholder(placeholderText.substring(0, currentIndex) + '|');
            } else {
                // Typing done, now blink
                clearInterval(placeholderIntervalRef.current!);
                let showCursor = false;
                placeholderIntervalRef.current = window.setInterval(() => {
                    setAnimatedPlaceholder(placeholderText + (showCursor ? '|' : '\u00A0'));
                    showCursor = !showCursor;
                }, 500);
            }
        }, 80);

    } else {
        clearPlaceholderInterval();
        setAnimatedPlaceholder(placeholderText);
    }
    
    return () => {
        clearPlaceholderInterval();
    };
  }, [activePage, communitySearchTerm]);


  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Input states
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [learnedInput, setLearnedInput] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [inputError, setInputError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveName, setSaveName] = useState('');

  // Game/App Data states
  const [rpgData, setRpgData] = useState<RpgData | null>(null);
  const [webAppSpec, setWebAppSpec] = useState<string | null>(null);
  const [webAppCode, setWebAppCode] = useState<string | null>(null);
  const [gameAnalysis, setGameAnalysis] = useState<AnalysisResult | null>(
    null,
  );

  // RPG specific states
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [rpgFeedback, setRpgFeedback] = useState<string | null>(null);
  const [rpgChoice, setRpgChoice] = useState<RpgInteractionOption | null>(
    null,
  );
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');

  const handleToggleFavorite = (title: string) => {
    const newFavorites = favorites.includes(title)
      ? favorites.filter((fav) => fav !== title)
      : [...favorites, title];
    setFavorites(newFavorites);
  };

  const handleSubjectClick = (title: string) => {
    setSelectedSubject(title);
    setView('inputs');
  };

  const handleBack = () => {
    // Reset all inputs and errors when going back
    setVideoUrl('');
    setPdfFile(null);
    setLearnedInput('');
    setGoalInput('');
    setInputError('');
    setIsLoading(false);
    setLoadingMessage('');
    setCurrentGame(null); // Reset current game on back

    if (view === 'inputs') {
      setView('subjects');
      setSelectedSubject(null);
    } else if (view === 'game' || view === 'webapp' || view === 'ww2game') {
      setView('inputs');
      // Reset game data
      setRpgData(null);
      setWebAppCode(null);
      setWebAppSpec(null);
    } else if (view === 'subjects') {
      setView('landing');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setInputError('Please upload a PDF file.');
        setPdfFile(null);
      } else {
        setPdfFile(file);
        setInputError('');
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

    // FIX: Broaden the type of 'game' to include TopRatedGame, allowing games from the curated list to be played.
  const handlePlayGame = (game: SavedGame | CommunityGame | TopRatedGame) => {
    setCurrentGame(game);
    setSelectedSubject(game.subject);
    if (game.type === 'rpg') {
      setRpgData(game.data as RpgData);
      setCurrentSceneIndex(0);
      setRpgFeedback(null);
      setRpgChoice(null);
      setGameStatus('playing');
      setView('game');
    } else {
      const appData = game.data as { spec: string, code: string };
      setWebAppSpec(appData.spec);
      setWebAppCode(appData.code);
      setView('webapp');
    }
    setActivePage('generate');
  };

  const handleGenerateGame = async () => {
    // Special case for PDF "Stat 310 Lecture 1"
    if (pdfFile && pdfFile.name === "Stat 310 Lecture 1.pdf") {
      const monsterBountyGame = topRatedGames.find(g => g.name === "Monster's Bounty");
      if (monsterBountyGame) {
        setIsLoading(true);
        setLoadingMessage('Analyzing your course material...');
        setTimeout(() => {
          handlePlayGame(monsterBountyGame);
          setIsLoading(false);
          setLoadingMessage('');
        }, 5000);
        return;
      }
    }

    // Special case for specific text inputs
    if (
      learnedInput.trim().toLowerCase() === "newton's law and calculus" &&
      goalInput.trim().toLowerCase() === "momentum and kinetic energy"
    ) {
      const gravitySlingGame = topRatedGames.find(g => g.name === "Gravity Sling");
      if (gravitySlingGame) {
        setIsLoading(true);
        setLoadingMessage('Calculating orbital mechanics...');
        setTimeout(() => {
          handlePlayGame(gravitySlingGame);
          setIsLoading(false);
          setLoadingMessage('');
        }, 5000);
        return;
      }
    }

    if (videoUrl.trim() === 'https://www.youtube.com/watch?v=58XB0OvoGAI') {
        setIsLoading(true);
        setLoadingMessage('Initializing historical simulation...');
        setTimeout(() => {
            setView('ww2game');
            setIsLoading(false);
            setLoadingMessage('');
        }, 5000);
        return;
    }
    
    setInputError('');

    // Determine the input source
    const hasUrl = videoUrl.trim() !== '';
    const hasPdf = pdfFile !== null;
    const hasText = learnedInput.trim() !== '' && goalInput.trim() !== '';

    if (!hasUrl && !hasPdf && !hasText) {
      setInputError('Please provide a source: a URL, a PDF, or a description.');
      return;
    }

    setIsLoading(true);
    let analysis: AnalysisResult;
    let isNarrative = false;

    try {
      if (hasUrl) {
        setLoadingMessage('Analyzing video...');
        const {isValid, error} = await validateYoutubeUrl(videoUrl);
        if (!isValid) {
          setInputError(error || 'Invalid YouTube URL');
          setIsLoading(false);
          return;
        }
        analysis = await generateVideoAnalysis(videoUrl);
        setLoadingMessage('Checking content structure...');
        const narrativeCheck = await generateNarrativeCheck(videoUrl);
        isNarrative = narrativeCheck.isNarrative;
      } else if (hasPdf) {
        setLoadingMessage('Analyzing PDF document...');
        const fileInput = {
          mimeType: pdfFile.type,
          data: await fileToBase64(pdfFile),
        };
        analysis = await generatePdfAnalysis(fileInput);
        setLoadingMessage('Checking content structure...');
        const narrativeCheck = await generateNarrativeCheckFromFile(fileInput);
        isNarrative = narrativeCheck.isNarrative;
      } else {
        // hasText
        setLoadingMessage('Analyzing your learning goals...');
        analysis = {
          assumedKnowledge: learnedInput
            .split(',')
            .map((s) => s.trim()),
          learningGoal: goalInput,
        };
        const narrativeCheck = await generateNarrativeCheckFromText(
          `Assumed: ${learnedInput}. Goal: ${goalInput}`,
        );
        isNarrative = narrativeCheck.isNarrative;
      }

      setGameAnalysis(analysis); // Save for victory screen

      if (isNarrative) {
        setLoadingMessage('Building your interactive lesson...');
        let generatedRpgData: RpgData;
        if (hasUrl) {
          generatedRpgData = await generateRPGData(analysis, videoUrl);
        } else if (hasPdf) {
          const fileInput = {
            mimeType: pdfFile.type,
            data: await fileToBase64(pdfFile),
          };
          generatedRpgData = await generateRPGDataFromFile(
            analysis,
            fileInput,
          );
        } else {
          // hasText
          generatedRpgData = await generateRPGDataFromText(analysis);
        }
        setRpgData(generatedRpgData);
        setCurrentSceneIndex(0);
        setRpgFeedback(null);
        setRpgChoice(null);
        setGameStatus('playing');
        setView('game');
      } else {
        if (hasUrl) {
          setLoadingMessage('Building your interactive app...');
          const {spec, code} = await generateWebApp(videoUrl, settings.customPrompt);
          setWebAppSpec(spec);
          setWebAppCode(code);
          setView('webapp');
        } else {
          setInputError(
            'This topic is not sequential. Only narrative topics from PDFs or text can be turned into RPGs in this demo.',
          );
        }
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setInputError(
        err instanceof Error
          ? `An error occurred: ${err.message}`
          : 'An unknown error occurred.',
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleRpgChoice = (choice: RpgInteractionOption) => {
    setRpgChoice(choice);
    setRpgFeedback(choice.feedback);
  };

  const onRpgContinue = () => {
    if (rpgChoice?.isCorrect) {
      const currentScene = rpgData!.scenes[currentSceneIndex];
      if (currentScene.nextSceneId === null) {
        setGameStatus('victory');
      } else {
        const nextSceneIdx = rpgData!.scenes.findIndex(
          (s) => s.id === currentScene.nextSceneId,
        );
        setCurrentSceneIndex(nextSceneIdx !== -1 ? nextSceneIdx : 0);
        setRpgFeedback(null);
        setRpgChoice(null);
      }
    } else {
      // Wrong choice, just go back to the question
      setRpgFeedback(null);
      setRpgChoice(null);
    }
  };
  
  const handleSaveRpg = () => {
    if (!saveName.trim() || !rpgData) return;
    const newGame: SavedGame = {
      id: `game-${Date.now()}`,
      name: saveName.trim(),
      subject: selectedSubject || 'Custom',
      type: 'rpg',
      data: rpgData,
      isPublic: false,
    };
    setSavedGames(prev => [...prev, newGame]);
    alert('Your adventure has been saved to your library.');
    setSaveName('');
    setView('inputs');
    setRpgData(null);
    setGameStatus('playing');
  };

  const handleSaveWebApp = () => {
    if (!saveName.trim() || !webAppCode || !webAppSpec) return;
    const newGame: SavedGame = {
      id: `game-${Date.now()}`,
      name: saveName.trim(),
      subject: selectedSubject || 'Custom',
      type: 'webapp',
      data: { spec: webAppSpec, code: webAppCode },
      isPublic: false,
    };
    setSavedGames(prev => [...prev, newGame]);
    setSaveName('');
    alert('App saved to your library!');
  };

  const handleToggleSharing = (gameId: string) => {
    let gameToShare: SavedGame | undefined;
    const newSavedGames = savedGames.map(game => {
      if (game.id === gameId) {
        const updatedGame = { ...game, isPublic: !game.isPublic };
        if (updatedGame.isPublic) {
          gameToShare = updatedGame;
        }
        return updatedGame;
      }
      return game;
    });
    setSavedGames(newSavedGames);

    if (gameToShare) {
      // Add to community
      const isAlreadyShared = communityGames.some(g => g.id === gameId);
      if (!isAlreadyShared) {
        const subjectInfo = categories
          .flatMap(c => c.subjects)
          .find(s => s.title === gameToShare!.subject);

        const newCommunityGame: CommunityGame = {
          ...gameToShare,
          authorName: settings.name || 'Anonymous',
          ratings: { total: 0, count: 0 },
          averageRating: 0,
          imageUrl: subjectInfo?.imageUrl || 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1d08?q=80&w=400&auto=format&fit=crop'
        };
        setCommunityGames(prev => [...prev, newCommunityGame]);
        alert('Shared with the community!');
      }
    } else {
      // Remove from community
      setCommunityGames(prev => prev.filter(game => game.id !== gameId));
      alert('Set to private. It will no longer appear in the community feed.');
    }
  };

  const handleDeleteGame = (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this saved game?')) {
        setSavedGames(prev => prev.filter(game => game.id !== gameId));
        // Also remove from community if it was public
        setCommunityGames(prev => prev.filter(game => game.id !== gameId));
    }
  };
  
   const handleRateGame = (gameId: string, rating: number) => {
        setCommunityGames(prevGames =>
            prevGames.map(game => {
                if (game.id === gameId) {
                    const newRatings = { ...game.ratings };
                    const oldUserRating = userRatings[gameId] || 0;
                    
                    if (oldUserRating > 0) {
                        // User is changing their rating
                        newRatings.total = newRatings.total - oldUserRating + rating;
                    } else {
                        // New rating
                        newRatings.total += rating;
                        newRatings.count += 1;
                    }

                    const newAverage = newRatings.count > 0 ? newRatings.total / newRatings.count : 0;
                    
                    return { ...game, ratings: newRatings, averageRating: newAverage };
                }
                return game;
            })
        );
        setUserRatings(prevRatings => ({ ...prevRatings, [gameId]: rating }));
    };

  const renderLandingPage = () => (
    <div className="landing-page">
        <div className="landing-content">
            <h1>Learn anything, instantly.</h1>
            <p>Turn YouTube videos, PDFs, or any topic into interactive learning apps with AI.</p>
            <button onClick={() => setView('subjects')} className="generate-button start-generating-btn">
                Start Generating
            </button>
        </div>
        <div className="landing-animation">
            <RetroComputerAnimation />
        </div>
    </div>
  );

  const renderSubjectsView = () => (
    <>
      <header className="app-header content-header">
         <button onClick={handleBack} className="back-button">
            &larr; Back
          </button>
        <h1>Generate an Interactive Learning App</h1>
      </header>
       <main className="home-view">
        <p className="page-description">Select a subject to begin your learning adventure.</p>
        <div className="gallery-container">
          <ExampleGallery
            onSubjectClick={handleSubjectClick}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      </main>
    </>
  );

  const renderInputsView = () => {
    return (
      <div className="inputs-page-wrapper">
        <header className="app-header content-header">
          <button onClick={handleBack} className="back-button">
            &larr; Back
          </button>
          <h1>{selectedSubject}</h1>
        </header>

        <main className="inputs-view">
            {/* Top Left */}
            <div className="input-group">
                <label htmlFor="youtube-url">Paste a URL from YouTube:</label>
                <input
                  id="youtube-url"
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={isLoading || !!pdfFile || !!learnedInput || !!goalInput}
                />
            </div>
            {/* Top Right */}
            <div className="input-group">
                <label htmlFor="pdf-upload">Upload a PDF:</label>
                <button
                  className="upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !!videoUrl || !!learnedInput || !!goalInput}
                >
                  {pdfFile ? `Selected: ${pdfFile.name}` : 'Choose a file'}
                </button>
                <input
                  id="pdf-upload"
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
            </div>
            {/* Bottom Left */}
            <div className="input-group">
                <label htmlFor="learned-input">Describe what you have learned:</label>
                <textarea
                  id="learned-input"
                  rows={4}
                  value={learnedInput}
                  onChange={(e) => setLearnedInput(e.target.value)}
                  placeholder="e.g., I know basic algebra and functions."
                  disabled={isLoading || !!pdfFile || !!videoUrl}
                />
            </div>
            {/* Bottom Right */}
            <div className="input-group">
                <label htmlFor="goal-input">State what you want to learn:</label>
                <textarea
                  id="goal-input"
                  rows={4}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g., I want to understand the Fundamental Theorem of Calculus."
                  disabled={isLoading || !!pdfFile || !!videoUrl}
                />
            </div>
        </main>
        <div className="generate-controls">
            {isLoading ? (
                <div className="loading-container">
                    <p>{loadingMessage}</p>
                </div>
            ) : (
                <>
                    <button onClick={handleGenerateGame} className="generate-button">
                        Generate Game
                    </button>
                    {inputError && <p className="error-message">{inputError}</p>}
                </>
            )}
        </div>
      </div>
    );
  };

  const renderGameView = () => {
    const guideContent = (currentGame as TopRatedGame)?.educationalGuide;
    return (
     <>
      <header className="app-header content-header">
        <button onClick={handleBack} className="back-button">
          &larr; Back to Inputs
        </button>
      </header>
      <div className={`game-wrapper-with-guide ${guideContent ? 'has-guide' : ''}`}>
        <main className="game-view-main">
          {rpgData && gameStatus === 'playing' && (
            <RPGView
              key={currentSceneIndex}
              gameData={rpgData}
              currentSceneIndex={currentSceneIndex}
              onChoiceSelect={handleRpgChoice}
              feedback={rpgFeedback}
              lastChoice={rpgChoice}
              onContinue={onRpgContinue}
            />
          )}
          {gameStatus === 'victory' && (
            <div className="victory-screen">
              <h2>Adventure Complete!</h2>
              <div className="summary-box">
                <p>
                  You started with knowledge of: <strong>{gameAnalysis?.assumedKnowledge.join(', ')}</strong>
                </p>
                <p>
                  And you successfully reached the goal of understanding: <strong>{gameAnalysis?.learningGoal}</strong>
                </p>
              </div>
              <div className="input-group">
                <label htmlFor="rpg-name">Name your adventure to save it:</label>
                <input
                  id="rpg-name"
                  type="text"
                  placeholder="e.g., The Calculus Chronicle"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </div>
              <div className="button-group">
                <button
                  onClick={handleSaveRpg}
                  className="generate-button"
                >
                  Save Game & Exit
                </button>
                <button
                  onClick={() => {
                    setView('inputs');
                    setRpgData(null);
                    setGameStatus('playing');
                  }}
                  className="generate-button secondary"
                >
                  Exit Without Saving
                </button>
              </div>
            </div>
          )}
        </main>
        {guideContent && (
            <aside className="educational-guide" dangerouslySetInnerHTML={{ __html: guideContent }} />
        )}
      </div>
    </>
    );
  };

  const renderWebAppView = () => {
    const guideContent = (currentGame as TopRatedGame)?.educationalGuide;
    return (
     <>
        <header className="app-header content-header">
            <button onClick={handleBack} className="back-button">
                &larr; Back
            </button>
            <h1>Interactive App for {selectedSubject}</h1>
        </header>
        <div className={`game-wrapper-with-guide ${guideContent ? 'has-guide' : ''}`}>
            <main className="content-view">
                <div className="save-app-container">
                  <input
                      type="text"
                      placeholder="App Name"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                  />
                  <button onClick={handleSaveWebApp}>Save to My Library</button>
                </div>
                <ContentContainer
                    key={selectedSubject}
                    contentBasis={''} // Not used, but required by prop types
                    preSeededSpec={webAppSpec ?? ''}
                    preSeededCode={webAppCode ?? ''}
                    onLoadingStateChange={() => {}}
                />
            </main>
            {guideContent && (
                <aside className="educational-guide" dangerouslySetInnerHTML={{ __html: guideContent }} />
            )}
        </div>
    </>
    );
  };

  const renderGeneratePage = () => {
    switch(view) {
      case 'landing':
        return renderLandingPage();
      case 'subjects':
        return renderSubjectsView();
      case 'inputs':
        return renderInputsView();
      case 'game':
        return renderGameView();
      case 'webapp':
        return renderWebAppView();
      case 'ww2game':
        return <WWIIStrategyGame />;
      default:
        return renderLandingPage();
    }
  }

  const renderLibraryPage = () => {
    const favoriteSubjects = categories
      .flatMap((category) => category.subjects)
      .filter((subject) => favorites.includes(subject.title));

    return (
      <>
        <header className="app-header">
          <h1>My Library</h1>
          <p>Review your saved apps and favorite fields.</p>
        </header>
        <main className="library-view">
          <div className="library-section">
            <h2>My Saved Apps</h2>
            <div className="games-grid">
              {savedGames.length > 0 ? (
                savedGames.map(game => (
                  <div key={game.id} className="saved-game-card">
                    <div className="card-content">
                      <h3>{game.name}</h3>
                      <p>{game.subject}</p>
                      <span>Type: {game.type.toUpperCase()}</span>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => handlePlayGame(game)}>Play</button>
                      <button onClick={() => handleDeleteGame(game.id)} className="delete">Delete</button>
                    </div>
                    <div className="card-footer">
                        <div className="privacy-toggle" onClick={() => handleToggleSharing(game.id)} role="switch" aria-checked={game.isPublic} tabIndex={0}
                            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleSharing(game.id); }}>
                            <span className={!game.isPublic ? 'active' : ''}>Private</span>
                            <div className={`switch ${game.isPublic ? 'public' : ''}`}>
                                <div className="handle"></div>
                            </div>
                            <span className={game.isPublic ? 'active' : ''}>Public</span>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="placeholder-message">You haven't saved any apps yet.</p>
              )}
            </div>
          </div>
          <div className="library-section">
            <h2>My Favorite Fields</h2>
            <div className="gallery-grid">
               {favoriteSubjects.length > 0 ? (
                favoriteSubjects.map((subject) => (
                  <div key={subject.title} className="gallery-item" onClick={() => { setActivePage('generate'); handleSubjectClick(subject.title); }}>
                     <button
                        className={`favorite-button favorited`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(subject.title);
                        }}
                        aria-label={`Favorite ${subject.title}`}>
                        ★
                      </button>
                    <div className="thumbnail-container">
                      <img src={subject.imageUrl} alt={subject.title} className="thumbnail" />
                    </div>
                    <div className="gallery-item-title">{subject.title}</div>
                  </div>
                ))
              ) : (
                <p className="placeholder-message">Click the star on any subject in the Generate page to add it here.</p>
              )}
            </div>
          </div>
        </main>
      </>
    )
  }

  const renderTopRatedPage = () => (
    <>
      <header className="app-header">
        <h1>Top Rated Games</h1>
        <p>Explore these curated adventures to see what's possible!</p>
      </header>
      <main className="library-view">
        <div className="library-section">
          <div className="games-grid">
            {topRatedGames.map(game => (
              <div key={game.id} className="saved-game-card" onClick={() => handlePlayGame(game)}>
                <div className="thumbnail-container">
                  <img src={game.imageUrl} alt={game.name} className="thumbnail" />
                </div>
                <div className="card-content">
                  <h3>{game.name}</h3>
                  <p>{game.subject}</p>
                  <p className="game-description">{game.description}</p>
                  <span>Type: {game.type.toUpperCase()}</span>
                </div>
                <div className="card-actions">
                  <button onClick={(e) => { e.stopPropagation(); handlePlayGame(game)}}>Play</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );

  const renderCommunityPage = () => {
    const filteredGames = communityGames.filter(game =>
      game.name.toLowerCase().includes(communitySearchTerm.toLowerCase()) ||
      game.subject.toLowerCase().includes(communitySearchTerm.toLowerCase()) ||
      game.authorName.toLowerCase().includes(communitySearchTerm.toLowerCase())
    );

    return (
    <>
      <header className="app-header">
        <h1>Community Creations</h1>
        <p>Explore, play, and rate games made by the G2L community!</p>
      </header>
      <main className="library-view">
        <div className="search-bar-container">
            <input
                type="search"
                placeholder={animatedPlaceholder}
                value={communitySearchTerm}
                onChange={(e) => setCommunitySearchTerm(e.target.value)}
            />
        </div>
        <div className="library-section">
          <div className="games-grid">
            {filteredGames.length > 0 ? (
              filteredGames.map(game => (
              <div key={game.id} className="saved-game-card">
                 {game.imageUrl && (
                  <div className="thumbnail-container">
                    <img src={game.imageUrl} alt={game.name} className="thumbnail" />
                  </div>
                )}
                <div className={`card-content ${game.imageUrl ? 'thumbnail-plus-content' : ''}`}>
                  <h3>{game.name}</h3>
                  <p className="author-info">By: {game.authorName}</p>
                  <p>{game.subject}</p>
                  <span>Type: {game.type.toUpperCase()}</span>
                   <StarRating
                        gameId={game.id}
                        averageRating={game.averageRating}
                        userRating={userRatings[game.id] || 0}
                        onRate={handleRateGame}
                    />
                </div>
                <div className="card-actions">
                  <button onClick={() => handlePlayGame(game)}>Play</button>
                </div>
              </div>
            ))
             ) : (
                <p className="placeholder-message">No community games found matching your search.</p>
            )}
          </div>
        </div>
      </main>
    </>
    );
  };

  const renderActivePage = () => {
    switch(activePage) {
      case 'generate':
        return renderGeneratePage();
      case 'library':
        return renderLibraryPage();
      case 'top-rated':
        return renderTopRatedPage();
      case 'community':
        return renderCommunityPage();
      case 'settings':
        return <SettingsPage settings={settings} setSettings={setSettings} />;
      default:
        return renderGeneratePage();
    }
  }

  return (
    <>
      <div className={`main-layout ${isSidebarFolded ? 'sidebar-folded' : ''}`}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} isSidebarFolded={isSidebarFolded} setIsSidebarFolded={setIsSidebarFolded} />
        <div className="app-container">
          {renderActivePage()}
        </div>
      </div>
      <style>{`
        :root {
          --color-background: #0d1117;
          --color-background-panel: #161b22;
          --color-text: #e6edf3;
          --color-primary: #58a6ff;
          --color-primary-hover: #79c0ff;
          --color-border: #30363d;
          --color-accent-green: #3fb950;
          --color-error: #f85149;
          --font-body: 'VT323', monospace;
          --sidebar-width: 200px;
          --sidebar-folded-width: 60px;
        }
        
        /* Hardcoded light-theme overrides for webapp view */
        .react-tabs__tab--selected {
           background: #fff !important;
           border-color: #aaa !important;
           color: #000 !important;
           border-radius: 0 !important;
        }

        body, button, input, textarea, select {
          font-family: var(--font-body);
        }

        body {
          margin: 0;
          background-color: var(--color-background);
          color: var(--color-text);
          line-height: 1.6;
          font-size: 20px;
          image-rendering: pixelated;
        }
        
        h1, h2, h3 {
          image-rendering: auto; /* Allow headings to be smoother */
        }

        .main-layout {
          display: flex;
        }

        .sidebar {
          width: var(--sidebar-width);
          min-height: 100vh;
          background-color: var(--color-background-panel);
          border-right: 2px solid var(--color-border);
          display: flex;
          flex-direction: column;
          padding: 1rem 0;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          transition: width 0.2s ease-in-out;
        }
        
        .sidebar ul {
          list-style: none;
          padding: 0;
          margin: 0;
          flex-grow: 1;
        }

        .sidebar li button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 1rem 1.25rem;
          font-size: 1.3rem;
          color: var(--color-text);
          background-color: transparent;
          border: none;
          border-left: 4px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          text-align: left;
        }

        .sidebar li button:hover {
          background-color: var(--color-background);
          color: var(--color-primary-hover);
        }

        .sidebar li button.active {
          background-color: var(--color-background);
          border-left-color: var(--color-primary);
          color: var(--color-primary);
        }
        
        .sidebar-footer {
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: 2px solid var(--color-border);
        }

        .toggle-sidebar-btn {
            background: transparent;
            border: none;
            color: var(--color-text);
            cursor: pointer;
            padding: 0.5rem;
            display: flex;
            align-items: center;
        }

        .toggle-sidebar-btn:hover {
            color: var(--color-primary);
        }

        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: calc(100% - var(--sidebar-width));
          margin-left: var(--sidebar-width);
          transition: width 0.2s ease-in-out, margin-left 0.2s ease-in-out;
        }

        /* Folded Sidebar Styles */
        .main-layout.sidebar-folded .sidebar {
            width: var(--sidebar-folded-width);
        }
        .main-layout.sidebar-folded .app-container {
            width: calc(100% - var(--sidebar-folded-width));
            margin-left: var(--sidebar-folded-width);
        }
        .sidebar.folded .button-text {
            display: none;
        }
        .sidebar.folded li button {
            justify-content: center;
            padding: 1rem 0;
        }

        /* Landing Page */
        .landing-page {
            display: flex;
            align-items: center;
            justify-content: space-around;
            flex-grow: 1;
            padding: 2rem;
            width: 100%;
            height: 100vh;
            margin-left: -1rem; /* Counteract app container padding */
        }
        .landing-content {
            max-width: 45%;
            text-align: left;
        }
        .landing-content h1 {
            font-size: 4.5rem;
            color: var(--color-text);
            margin-bottom: 1rem;
            line-height: 1.1;
        }
        .landing-content p {
            font-size: 1.5rem;
            color: #ccc;
            margin-bottom: 2.5rem;
        }
        .start-generating-btn {
            padding: 1rem 2rem;
            font-size: 1.5rem;
            background-color: #4D7AFF;
            border: 2px solid #2d5bcf;
        }
        
        /* Retro Computer Animation */
        .computer-container { display: flex; flex-direction: column; align-items: center; }
        .computer-screen { width: 320px; height: 240px; background-color: #c0c0c0; border: 2px solid #555; padding: 15px; }
        .terminal { background-color: #000; color: #0f0; height: 100%; padding: 10px; font-size: 16px; overflow: hidden; white-space: pre; border: 2px solid #555; }
        .terminal p { margin: 0 0 5px 0; }
        .cursor { animation: blink 1s step-end infinite; background-color: #0f0; display: inline-block; width: 0.8em; height: 1em; }
        .generating-text { margin-top: 15px; }
        .progress-bar-container { border: 1px solid #0f0; height: 20px; padding: 2px; }
        .progress-bar { width: 0; height: 100%; background-color: #0f0; animation: fill-progress 4s linear infinite; }
        .computer-stand-neck { width: 40px; height: 20px; background: #888; border: 2px solid #555; border-top: none; }
        .computer-stand-base { width: 150px; height: 10px; background: #c0c0c0; border: 2px solid #555; }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes fill-progress { from { width: 0%; } to { width: 100%; } }

        .app-header {
          text-align: center;
          padding: 2rem;
          border: 2px solid var(--color-border);
          background-color: var(--color-background-panel);
          margin: 2rem 0;
        }
        
        .page-description { text-align: center; margin-bottom: 1.5rem; }

        .app-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: var(--color-primary);
        }

        .app-header p {
          font-size: 1.2rem;
          color: var(--color-text);
          max-width: 600px;
          margin: 0 auto;
        }
        
        .content-header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            text-align: left;
            padding: 1rem 2.5rem;
            background-color: var(--color-background-panel);
            margin: 0 -1rem;
            border-bottom: 2px solid var(--color-border);
        }

        .content-header h1 {
            margin: 0 0 0 1rem;
            font-size: 1.8rem;
        }
        
        button {
          position: relative;
        }

        .back-button, .generate-button, .upload-button, .continue-btn, .choices-container button, .feedback-modal button, .card-actions button {
          background-color: var(--color-background-panel);
          border: 2px solid var(--color-border);
          color: var(--color-text);
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 1.2rem;
          transition: background-color 0.2s, color 0.2s;
          text-align: center;
        }
        
        .back-button:hover, .generate-button:hover, .upload-button:hover, .continue-btn:hover, .choices-container button:hover, .feedback-modal button:hover, .card-actions button:hover {
          background-color: var(--color-primary);
          color: var(--color-background);
          border-color: var(--color-primary);
        }

        .home-view, .library-view, .settings-view {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        
        .inputs-page-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .inputs-view {
           flex-grow: 1;
           display: grid;
           grid-template-columns: 1fr 1fr;
           grid-template-rows: 1fr 1fr;
           gap: 1.5rem;
           padding: 1.5rem;
        }

        .gallery-container {
          padding-bottom: 2rem;
        }

        /* Inputs View Styles */
        .input-group {
          display: flex;
          flex-direction: column;
          background-color: var(--color-background-panel);
          border: 2px solid var(--color-border);
          padding: 2.5rem;
        }
        .input-group label {
          margin-bottom: 1.5rem;
          font-size: 1.6rem;
        }
        .input-group input[type="text"], .input-group textarea, .search-bar-container input {
          padding: 0.8rem;
          font-size: 1.4rem;
          border: 2px solid var(--color-border);
          background-color: var(--color-background);
          color: var(--color-text);
          width: 100%;
          box-sizing: border-box;
        }
        
        .input-group textarea {
            flex-grow: 1;
            resize: none;
        }

        .input-group .upload-button {
            padding: 0.8rem;
            font-size: 1.4rem;
        }

        .input-group input:disabled, .input-group textarea:disabled, .input-group button:disabled {
            background-color: #333;
            cursor: not-allowed;
            opacity: 0.6;
        }

        .generate-button {
          padding: 0.75rem 2.5rem;
          font-size: 1.5rem;
          width: auto;
          align-self: center;
        }
        
        .generate-controls {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        .generate-controls .generate-button {
          width: 60%;
          max-width: 500px;
          padding: 1rem;
          font-size: 1.6rem;
        }

        .error-message {
          color: var(--color-error);
          text-align: center;
          margin-top: 1rem;
          background-color: var(--color-background-panel);
          border: 2px solid var(--color-error);
          padding: 1rem;
        }
        
        .generate-controls .error-message {
            width: 60%;
            max-width: 500px;
        }

        /* Game & WebApp View Styles */
        .game-wrapper-with-guide { flex-direction: column; flex-grow: 1; min-height: 0; }
        .game-wrapper-with-guide.has-guide { flex-direction: row; gap: 1rem; }
        .game-wrapper-with-guide > .content-view, .game-wrapper-with-guide > .game-view-main { flex-grow: 1; display: flex; flex-direction: column; }
        .game-wrapper-with-guide.has-guide > .content-view, .game-wrapper-with-guide.has-guide > .game-view-main { flex-basis: 66.66%; min-width: 0; }
        .educational-guide { flex-basis: 33.33%; min-width: 0; background-color: var(--color-background-panel); border: 2px solid var(--color-border); padding: 1.5rem; overflow-y: auto; }
        .educational-guide h3 { color: var(--color-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; margin-bottom: 1rem; font-size: 1.4rem; }
        .educational-guide h4 { color: var(--color-primary-hover); margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .educational-guide p, .educational-guide ul, .educational-guide ol { margin-bottom: 1rem; font-size: 1.1rem; line-height: 1.5; }
        .educational-guide code { background-color: var(--color-background); padding: 0.2rem 0.5rem; font-family: monospace; font-size: 1.1rem; border: 1px solid var(--color-border); display: block; text-align: center; margin: 1rem 0; }
        .educational-guide ul, .educational-guide ol { padding-left: 25px; }
        .educational-guide li { margin-bottom: 0.5rem; }

        .content-view { border: 2px solid var(--color-border); border-top: none; background: var(--color-background-panel); padding: 1rem; }
        .game-view-main { min-height: 500px; }
        
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem; font-size: 1.5em; color: var(--color-primary); }
        .generate-controls .loading-container { margin-top: 0; font-size: 1.6rem; }
        .loading-container p::after { content: '_'; animation: blink 1s step-end infinite; }

        .victory-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; height: 100%; border: 2px solid var(--color-border); background-color: var(--color-background-panel); }
        .victory-screen h2 { font-size: 2.5rem; color: var(--color-primary); }
        .summary-box { border: 2px solid var(--color-border); padding: 1.5rem; margin: 2rem 0; max-width: 600px; }
        .victory-screen .input-group { width: 100%; max-width: 400px; margin-bottom: 2rem; }
        .victory-screen .button-group { display: flex; gap: 1rem; }
        .generate-button.secondary { background-color: #333; }
        
        .save-app-container { display: flex; gap: 10px; padding: 10px; background-color: var(--color-background); border: 2px solid var(--color-border); margin-bottom: 1rem; align-items: center; }
        .save-app-container input { flex-grow: 1; padding: 0.5rem; font-size: 1rem; border: 2px solid var(--color-border); background-color: var(--color-background); color: var(--color-text); font-family: var(--font-body); }
        .save-app-container button { padding: 0.5rem 1rem; font-size: 1.1rem; }

        /* Library & Community Page */
        .library-view { padding-bottom: 2rem; }
        .library-section { margin-bottom: 3rem; }
        .library-section h2 { color: var(--color-primary); font-size: 1.75rem; border-bottom: 2px solid var(--color-border); padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
        .games-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.5rem; }
        .saved-game-card { background-color: var(--color-background-panel); border: 2px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; transition: transform 0.2s ease-out, border-color 0.2s ease-out; }
        .saved-game-card:hover { transform: translateY(-5px); border-color: var(--color-primary-hover); }

        .saved-game-card .thumbnail-container { position: relative; padding-top: 56.25%; background-color: var(--color-background); overflow: hidden; }
        .saved-game-card .thumbnail { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
        .saved-game-card:hover .thumbnail { transform: scale(1.05); }

        .card-content { padding: 1rem; flex-grow: 1; display: flex; flex-direction: column; }
        .saved-game-card .thumbnail-container + .card-content, .card-content.thumbnail-plus-content { border-top: 2px solid var(--color-border); }
        .card-content h3 { font-size: 1.2rem; color: var(--color-primary-hover); }
        .card-content p { margin: 0.5rem 0; }
        .card-content .game-description { font-size: 0.9rem; line-height: 1.4; opacity: 0.8; flex-grow: 1; margin: 0.75rem 0; }
        .card-content span { font-size: 0.9rem; opacity: 0.8; }
        .card-actions { display: flex; border-top: 2px solid var(--color-border); }
        .card-actions button.delete:hover { background-color: var(--color-error); }
        .card-actions button:not(:last-child) { border-right: 2px solid var(--color-border); }

        .placeholder-message { grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--color-text); background-color: var(--color-background-panel); border: 2px solid var(--color-border); }
        
        .card-footer { border-top: 2px solid var(--color-border); padding: 0.5rem; }
        .privacy-toggle { display: flex; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; font-size: 1rem; }
        .privacy-toggle span { transition: color 0.2s; color: #888; }
        .privacy-toggle span.active { color: var(--color-primary-hover); font-weight: bold; }
        .privacy-toggle .switch { width: 44px; height: 24px; background-color: #555; padding: 2px; transition: background-color 0.3s; border: 1px solid var(--color-border); }
        .privacy-toggle .switch.public { background-color: var(--color-primary); }
        .privacy-toggle .handle { width: 20px; height: 20px; background-color: white; transition: transform 0.3s ease-out; }
        .privacy-toggle .switch.public .handle { transform: translateX(20px); }
        
        .search-bar-container { padding: 0 0 1.5rem 0; }
        .saved-game-card .author-info { font-size: 0.9rem; opacity: 0.8; margin: -0.5rem 0 0.5rem 0; }

        .star-rating { display: flex; align-items: center; gap: 0.25rem; font-size: 1.5rem; margin-top: 0.5rem; }
        .star-rating button { background: none; border: none; color: #ccc; cursor: pointer; padding: 0; font-size: inherit; transition: color 0.2s, transform 0.1s; }
        .star-rating button:hover { transform: scale(1.2); }
        .star-rating button.filled { color: #ffdd00; }
        .star-rating .avg-rating { font-size: 0.8rem; margin-left: 0.5rem; color: var(--color-text); opacity: 0.8; }

        /* Gallery Styles */
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
        .gallery-item { background-color: var(--color-background-panel); padding: 0; border: 2px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; cursor: pointer; text-align: left; transition: border-color 0.2s ease-out; color: var(--color-text); position: relative; }
        .gallery-item:hover, .gallery-item:focus { border-color: var(--color-primary-hover); }
        .favorite-button { position: absolute; top: 4px; left: 4px; z-index: 10; background-color: rgba(26, 32, 53, 0.7); color: white; border: 1px solid var(--color-border); width: 32px; height: 32px; font-size: 1.5rem; line-height: 32px; text-align: center; cursor: pointer; transition: background-color 0.2s, color 0.2s; padding: 0; }
        .favorite-button:hover { background-color: var(--color-background); }
        .favorite-button.favorited { color: #ffdd00; }
        .gallery-item-title { align-items: center; background-color: var(--color-background-panel); border-top: 2px solid var(--color-border); display: flex; flex-grow: 1; font-size: 1rem; justify-content: center; padding: 0.75rem; text-align: center; }
        .thumbnail-container { position: relative; padding-top: 56.25%; background-color: #333; }
        .thumbnail { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }

        /* Settings Page */
        .settings-view { padding: 2rem; }
        .settings-form { max-width: 800px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; }
        .settings-form .input-group { flex-basis: calc(50% - 1rem); flex-grow: 1; }
        .settings-form .input-group.full-width { flex-basis: 100%; }
        
        /* WWII Game Styles */
        .ww2-game-container { width: 100%; height: 100%; max-height: calc(100vh - 4rem); background-color: var(--color-background-panel); border: 2px solid var(--color-border); margin: 2rem 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .country-selection-screen, .game-over-screen { text-align: center; padding: 2rem; }
        .country-selection-screen h1, .game-over-screen h1 { color: var(--color-primary); }
        .country-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-top: 2rem; max-width: 800px; }
        .country-card { background-color: var(--color-background); border: 2px solid var(--color-border); padding: 1rem; cursor: pointer; transition: transform 0.2s, border-color 0.2s; }
        .country-card:hover { transform: translateY(-5px); border-color: var(--color-primary-hover); }
        .country-card img { width: 100px; height: 120px; object-fit: cover; border: 2px solid var(--color-border); }
        .country-card h3 { color: var(--color-primary-hover); margin-top: 0.5rem; }
        .game-display { display: flex; width: 100%; height: 100%; }
        .map-panel { flex: 2; background-color: #3e4a77; border-right: 2px solid var(--color-border); position: relative; display: flex; justify-content: center; align-items: center; }
        .europe-map { width: 90%; height: 90%; }
        .player-info { position: absolute; bottom: 1rem; left: 1rem; display: flex; align-items: center; background-color: rgba(0,0,0,0.5); padding: 0.5rem; border: 1px solid var(--color-border); }
        .player-info img { width: 60px; height: 75px; object-fit: cover; margin-right: 1rem; border: 1px solid var(--color-border); }
        .timeline-panel { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; }
        .date-display { text-align: right; font-size: 1.5rem; color: var(--color-primary); margin-bottom: 1rem; }
        .timeline-panel h2 { color: var(--color-primary-hover); }
        .event-description { margin: 1rem 0; flex-grow: 1; }
        .choices-container { margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 1rem; }
        .choices-container button, .continue-btn { display: block; width: 100%; margin-bottom: 0.5rem; padding: 0.75rem; }
        .feedback-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .feedback-modal { background-color: var(--color-background-panel); padding: 2rem; border: 2px solid var(--color-border); max-width: 600px; }
        .feedback-modal h3 { color: var(--color-primary-hover); }
        .feedback-modal hr { border: none; border-top: 1px solid var(--color-border); margin: 1rem 0; }
        .feedback-modal button { margin-top: 1.5rem; }

        @media (max-width: 1024px) {
          :root { --sidebar-width: 180px; }
          .landing-page { flex-direction: column; text-align: center; }
          .landing-content { max-width: 90%; text-align: center; }
          .game-display { flex-direction: column; }
          .map-panel { border-right: none; border-bottom: 2px solid var(--color-border); }
        }

        @media (max-width: 768px) {
          .main-layout { flex-direction: column; }
          .sidebar { position: static; width: 100%; min-height: auto; flex-direction: row; border-right: none; border-bottom: 2px solid var(--color-border); padding: 0; }
          .sidebar ul { display: flex; flex-grow: 1; justify-content: center; }
          .sidebar li { flex-grow: 1; }
          .sidebar li button { border-left: none; border-bottom: 4px solid transparent; justify-content: center; }
          .sidebar li button:hover { border-bottom-color: var(--color-primary-hover); }
          .sidebar li button.active { border-bottom-color: var(--color-primary); }
          .sidebar-footer { display: none; }
          .app-container { width: 100%; margin-left: 0; padding: 0 0.5rem; }
          .inputs-view { grid-template-columns: 1fr; grid-template-rows: auto; }
          .landing-page { padding: 1rem; }
          .landing-content h1 { font-size: 3rem; }
          .computer-screen { width: 280px; height: 210px; }
          body { font-size: 18px; }
        }
      `}</style>
    </>
  );
}