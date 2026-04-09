/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  User, 
  Cpu, 
  Hand as HandIcon, 
  Info,
  ChevronRight,
  Heart,
  Diamond,
  Club,
  Spade,
  Volume2,
  VolumeX,
  Volume1,
  Music,
  Upload,
  Pen,
  Check
} from 'lucide-react';
import { Card, Suit, GameStatus, GameState } from './types';
import { createDeck, isValidMove, shuffle } from './utils';

const SUIT_ICONS = {
  hearts: <Heart className="text-red-500 fill-red-500" />,
  diamonds: <Diamond className="text-red-500 fill-red-500" />,
  clubs: <Club className="text-slate-900 fill-slate-900" />,
  spades: <Spade className="text-slate-900 fill-slate-900" />,
};

const SUIT_COLORS = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-slate-900',
  spades: 'text-slate-900',
};

// --- Components ---

interface PlayingCardProps {
  card: Card;
  isFaceUp?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  className?: string;
  key?: string; // Add key to props to satisfy TS
}

const PlayingCard = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  className = "" 
}: PlayingCardProps) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ y: -15, scale: 1.05 }}
      onClick={onClick}
      className={`relative w-24 h-36 sm:w-28 sm:h-40 rounded-xl border-2 bg-white card-shadow flex flex-col items-center justify-center cursor-pointer transition-colors border-slate-200 ${className}`}
    >
      {isFaceUp ? (
        <div className="w-full h-full p-2 flex flex-col justify-between select-none">
          <div className={`flex flex-col items-start leading-none ${SUIT_COLORS[card.suit]}`}>
            <span className="text-lg font-bold">{card.rank}</span>
            <div className="w-4 h-4">{SUIT_ICONS[card.suit]}</div>
          </div>
          <div className="flex justify-center items-center">
            <div className="w-10 h-10 opacity-20">{SUIT_ICONS[card.suit]}</div>
          </div>
          <div className={`flex flex-col items-end leading-none rotate-180 ${SUIT_COLORS[card.suit]}`}>
            <span className="text-lg font-bold">{card.rank}</span>
            <div className="w-4 h-4">{SUIT_ICONS[card.suit]}</div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-indigo-900 rounded-lg border-4 border-indigo-800 flex items-center justify-center">
          <div className="w-16 h-24 border-2 border-white/20 rounded-md flex items-center justify-center">
            <span className="text-white/20 font-serif text-4xl italic">V</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    gameId: 0,
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentTurn: 'player',
    status: 'waiting',
    winner: null,
    activeSuit: null,
  });

  const [message, setMessage] = useState("Welcome to Victor Crazy Eights!");
  const [playerName, setPlayerName] = useState("You");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const penClickAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const playPenClick = () => {
    if (penClickAudioRef.current) {
      penClickAudioRef.current.currentTime = 0;
      penClickAudioRef.current.play().catch(e => console.error("Pen click sound failed:", e));
    }
  };

  const playErrorSound = () => {
    if (errorAudioRef.current) {
      errorAudioRef.current.currentTime = 0;
      errorAudioRef.current.play().catch(e => console.error("Error sound failed:", e));
    }
  };

  // Sync audio element with state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomMusicUrl(url);
      setIsMusicPlaying(true);
      setMessage(`Loaded: ${file.name}`);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Sync audio element with state
  useEffect(() => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Playback failed:", error);
            setIsMusicPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying]);

  const toggleMusic = () => {
    setIsMusicPlaying(prev => !prev);
  };

  // --- Game Actions ---

  const initGame = useCallback(() => {
    const fullDeck = createDeck();
    const pHand = fullDeck.splice(0, 8);
    const aHand = fullDeck.splice(0, 8);
    const firstDiscard = fullDeck.pop()!;
    
    // Try to start music on first game start if not already playing
    if (!isMusicPlaying) {
      setIsMusicPlaying(true);
    }

    setGameState(prev => ({
      gameId: prev.gameId + 1,
      deck: fullDeck,
      discardPile: [firstDiscard],
      playerHand: pHand,
      aiHand: aHand,
      currentTurn: 'player',
      status: 'playing',
      winner: null,
      activeSuit: null,
    }));
    setMessage("Your turn! Match the suit or rank.");
  }, [isMusicPlaying]);

  const drawCard = useCallback((target: 'player' | 'ai') => {
    setGameState(prev => {
      // If deck is empty, try to reshuffle discard pile
      if (prev.deck.length === 0) {
        if (prev.discardPile.length <= 1) {
          setMessage("No cards left to draw! Skipping turn.");
          return { ...prev, currentTurn: prev.currentTurn === 'player' ? 'ai' : 'player' };
        }
        
        // Reshuffle discard pile into deck
        const topCard = prev.discardPile[prev.discardPile.length - 1];
        const cardsToReshuffle = prev.discardPile.slice(0, -1);
        const newDeck = shuffle(cardsToReshuffle);
        const drawnCard = newDeck.pop()!;
        const newHand = target === 'player' ? [...prev.playerHand, drawnCard] : [...prev.aiHand, drawnCard];
        
        setMessage(`${target === 'player' ? 'You' : 'AI'} drew a card after reshuffling.`);
        return {
          ...prev,
          deck: newDeck,
          discardPile: [topCard],
          [target === 'player' ? 'playerHand' : 'aiHand']: newHand,
          currentTurn: target === 'player' ? 'ai' : 'player'
        };
      }

      const newDeck = [...prev.deck];
      const drawnCard = newDeck.pop()!;
      const newHand = target === 'player' ? [...prev.playerHand, drawnCard] : [...prev.aiHand, drawnCard];

      setMessage(`${target === 'player' ? 'You' : 'AI'} drew a card.`);
      return {
        ...prev,
        deck: newDeck,
        [target === 'player' ? 'playerHand' : 'aiHand']: newHand,
        currentTurn: target === 'player' ? 'ai' : 'player'
      };
    });
  }, []);

  const playCard = useCallback((card: Card, target: 'player' | 'ai') => {
    if (target === 'player') {
      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      if (!isValidMove(card, topCard, gameState.activeSuit)) {
        playErrorSound();
        return;
      }
    }

    setGameState(prev => {
      // Guard against stale actions
      if (prev.status !== 'playing' || prev.currentTurn !== target) return prev;

      const newHand = (target === 'player' ? prev.playerHand : prev.aiHand).filter(c => c.id !== card.id);
      const newDiscard = [...prev.discardPile, card];
      
      // Check for win
      if (newHand.length === 0) {
        return {
          ...prev,
          [target === 'player' ? 'playerHand' : 'aiHand']: newHand,
          discardPile: newDiscard,
          status: 'game_over',
          winner: target,
        };
      }

      // Handle 8
      if (card.rank === '8') {
        if (target === 'player') {
          return {
            ...prev,
            playerHand: newHand,
            discardPile: newDiscard,
            status: 'choosing_suit',
          };
        } else {
          // AI chooses a suit (most frequent in its hand)
          const suits = newHand.map(c => c.suit);
          const mostFrequentSuit = [...suits].sort((a,b) =>
              suits.filter(v => v===a).length - suits.filter(v => v===b).length
          ).pop() || 'hearts';
          
          setMessage(`AI played an 8 and chose ${mostFrequentSuit.toUpperCase()}.`);
          return {
            ...prev,
            aiHand: newHand,
            discardPile: newDiscard,
            activeSuit: mostFrequentSuit as Suit,
            currentTurn: 'player'
          };
        }
      }

      setMessage(`${target === 'player' ? 'You' : 'AI'} played ${card.rank} of ${card.suit}.`);
      return {
        ...prev,
        [target === 'player' ? 'playerHand' : 'aiHand']: newHand,
        discardPile: newDiscard,
        activeSuit: null,
        currentTurn: target === 'player' ? 'ai' : 'player'
      };
    });
  }, [playErrorSound, gameState.discardPile, gameState.activeSuit, gameState.status, gameState.currentTurn]);

  const selectSuit = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      activeSuit: suit,
      status: 'playing',
      currentTurn: 'ai'
    }));
    setMessage(`You chose ${suit.toUpperCase()}. AI's turn.`);
  };

  // --- AI Logic ---

  useEffect(() => {
    const currentGameId = gameState.gameId;
    if (gameState.status === 'playing' && gameState.currentTurn === 'ai') {
      const timer = setTimeout(() => {
        // Re-check game state after timeout
        setGameState(prev => {
          if (prev.gameId !== currentGameId || prev.status !== 'playing' || prev.currentTurn !== 'ai') {
            return prev;
          }

          const topCard = prev.discardPile[prev.discardPile.length - 1];
          const validCards = prev.aiHand.filter(c => isValidMove(c, topCard, prev.activeSuit));

          if (validCards.length > 0) {
            // AI strategy: play an 8 if it has no other move, or just the first valid card
            const nonEight = validCards.find(c => c.rank !== '8');
            const cardToPlay = nonEight || validCards[0];
            
            // We need to call playCard logic here but we are inside setGameState
            // Instead of calling playCard, we'll return the new state directly
            // to avoid nested state updates which are problematic in React
            
            const newHand = prev.aiHand.filter(c => c.id !== cardToPlay.id);
            const newDiscard = [...prev.discardPile, cardToPlay];
            
            if (newHand.length === 0) {
              return {
                ...prev,
                aiHand: newHand,
                discardPile: newDiscard,
                status: 'game_over',
                winner: 'ai',
              };
            }

            if (cardToPlay.rank === '8') {
              const suits = newHand.map(c => c.suit);
              const mostFrequentSuit = [...suits].sort((a,b) =>
                  suits.filter(v => v===a).length - suits.filter(v => v===b).length
              ).pop() || 'hearts';
              
              setMessage(`AI played an 8 and chose ${mostFrequentSuit.toUpperCase()}.`);
              return {
                ...prev,
                aiHand: newHand,
                discardPile: newDiscard,
                activeSuit: mostFrequentSuit as Suit,
                currentTurn: 'player'
              };
            }

            setMessage(`AI played ${cardToPlay.rank} of ${cardToPlay.suit}.`);
            return {
              ...prev,
              aiHand: newHand,
              discardPile: newDiscard,
              activeSuit: null,
              currentTurn: 'player'
            };
          } else {
            // No valid moves, AI must draw
            // We'll handle draw logic here too
            if (prev.deck.length === 0) {
              if (prev.discardPile.length <= 1) {
                setMessage("Deck is empty! AI skips turn.");
                return { ...prev, currentTurn: 'player' };
              }
              
              const currentTopCard = prev.discardPile[prev.discardPile.length - 1];
              const cardsToReshuffle = prev.discardPile.slice(0, -1);
              const newDeck = shuffle(cardsToReshuffle);
              const drawnCard = newDeck.pop()!;
              
              setMessage("AI drew a card after reshuffling.");
              return {
                ...prev,
                deck: newDeck,
                discardPile: [currentTopCard],
                aiHand: [...prev.aiHand, drawnCard],
                currentTurn: 'player'
              };
            }

            const newDeck = [...prev.deck];
            const drawnCard = newDeck.pop()!;
            setMessage("AI drew a card.");
            return {
              ...prev,
              deck: newDeck,
              aiHand: [...prev.aiHand, drawnCard],
              currentTurn: 'player'
            };
          }
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.currentTurn, gameState.gameId]);

  // --- Helpers ---

  const topCard = useMemo(() => 
    gameState.discardPile.length > 0 
      ? gameState.discardPile[gameState.discardPile.length - 1] 
      : null
  , [gameState.discardPile]);

  const canPlayerMove = useMemo(() => {
    if (gameState.status !== 'playing' || gameState.currentTurn !== 'player' || !topCard) return false;
    return gameState.playerHand.some(c => isValidMove(c, topCard, gameState.activeSuit));
  }, [gameState.status, gameState.currentTurn, gameState.playerHand, topCard, gameState.activeSuit]);

  // --- Render ---

  return (
    <div className="h-screen w-full flex flex-col felt-texture relative overflow-hidden">
      <audio 
        ref={audioRef}
        src={customMusicUrl || "https://www.mfiles.co.uk/mp3-downloads/erik-satie-gymnopedie-1.mp3"}
        loop
        preload="auto"
        crossOrigin="anonymous"
      />

      <audio 
        ref={penClickAudioRef}
        src="https://www.soundjay.com/buttons/sounds/button-37.mp3"
        preload="auto"
      />

      <audio 
        ref={errorAudioRef}
        src="https://www.soundjay.com/misc/sounds/doorbell-1.mp3"
        preload="auto"
      />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="audio/mp3,audio/mpeg" 
        className="hidden" 
      />

      {gameState.status === 'waiting' ? (
        <div className="h-screen w-full flex flex-col items-center justify-center p-4">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <h1 className="text-6xl sm:text-8xl font-serif italic font-bold mb-4 text-white drop-shadow-lg">
              Victor <span className="text-yellow-400">8</span>
            </h1>
            <p className="text-xl text-emerald-100 mb-6 opacity-80">The ultimate Crazy Eights experience</p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl bg-black/30 backdrop-blur-md rounded-2xl p-6 mb-8 text-left border border-white/10"
            >
              <h2 className="text-xl font-bold text-yellow-400 mb-3 flex items-center gap-2">
                <Info size={20} /> 游戏规则
              </h2>
              <ul className="space-y-2 text-emerald-50 text-sm sm:text-base opacity-90">
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  <span><strong>发牌：</strong> 玩家与 AI 各发 8 张牌。</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  <span><strong>出牌：</strong> 必须在“花色”或“点数”上与弃牌堆顶部的牌匹配。</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  <span><strong>万能 8 点：</strong> 数字“8”是万用牌，可随时打出并指定新花色。</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  <span><strong>摸牌：</strong> 无牌可出时必须摸一张牌；若摸牌堆为空则跳过回合。</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400 font-bold">•</span>
                  <span><strong>获胜：</strong> 最先清空手牌的一方获胜。</span>
                </li>
              </ul>
            </motion.div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={initGame}
                className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-emerald-950 font-bold text-xl rounded-full transition-all transform hover:scale-105 shadow-xl flex items-center gap-3"
              >
                Play Now <ChevronRight />
              </button>
              <div className="flex items-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm border border-white/10">
                {volume === 0 ? <VolumeX size={20} className="text-emerald-300" /> : volume < 0.5 ? <Volume1 size={20} className="text-emerald-300" /> : <Volume2 size={20} className="text-emerald-300" />}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
              </div>
              <button 
                onClick={triggerFileSelect}
                className="px-8 py-4 bg-emerald-700/40 hover:bg-emerald-700/60 text-white font-medium rounded-full transition-all flex items-center gap-3 backdrop-blur-sm border border-emerald-500/30"
              >
                <Upload size={20} />
                Load Your MP3
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <Cpu size={18} className="text-emerald-300" />
                <span className="font-mono text-sm">AI: {gameState.aiHand.length}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                <User size={18} className="text-emerald-300" />
                {isEditingName ? (
                  <input
                    autoFocus
                    className="bg-transparent border-b border-emerald-300 outline-none text-sm font-mono text-white w-20"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onBlur={() => {
                      setIsEditingName(false);
                      playPenClick();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingName(false);
                        playPenClick();
                      }
                    }}
                  />
                ) : (
                  <span className="font-mono text-sm">{playerName}: {gameState.playerHand.length}</span>
                )}
                <button 
                  onClick={() => {
                    setIsEditingName(!isEditingName);
                    playPenClick();
                  }}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors"
                >
                  {isEditingName ? <Check size={14} className="text-emerald-300" /> : <Pen size={14} className="text-emerald-300" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full group/volume">
                {volume === 0 ? <VolumeX size={16} className="text-emerald-300" /> : volume < 0.5 ? <Volume1 size={16} className="text-emerald-300" /> : <Volume2 size={16} className="text-emerald-300" />}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
              </div>
              <div className="hidden sm:block text-emerald-200 font-medium italic">
                {message}
              </div>
              <button 
                onClick={initGame}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Restart Game"
              >
                <RotateCcw size={20} />
              </button>
              <button 
                onClick={triggerFileSelect}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Load Custom MP3"
              >
                <Upload size={20} />
              </button>
            </div>
          </div>

          {/* Main Board */}
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-8">
            
            {/* AI Hand */}
            <div className="flex justify-center -mt-8 sm:-mt-12">
              <div className="flex -space-x-12 sm:-space-x-16">
                {gameState.aiHand.map((card, i) => (
                  <PlayingCard key={card.id} card={card} isFaceUp={false} className="rotate-180" />
                ))}
              </div>
            </div>

            {/* Center Area (Deck & Discard) */}
            <div className="flex items-center justify-center gap-8 sm:gap-16">
              {/* Draw Pile */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-yellow-400/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div 
                  onClick={() => gameState.currentTurn === 'player' && !canPlayerMove && drawCard('player')}
                  className={`relative cursor-pointer transition-transform hover:scale-105 ${
                    gameState.currentTurn === 'player' && !canPlayerMove ? 'ring-4 ring-yellow-400 rounded-xl' : ''
                  }`}
                >
                  <PlayingCard card={gameState.deck[0]} isFaceUp={false} />
                  <div className="absolute -bottom-6 left-0 w-full text-center text-xs font-mono text-emerald-200 uppercase tracking-widest">
                    Deck ({gameState.deck.length})
                  </div>
                </div>
              </div>

              {/* Discard Pile */}
              <div className="relative">
                {topCard && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={topCard.id}
                      initial={{ x: -100, opacity: 0, rotate: -20 }}
                      animate={{ x: 0, opacity: 1, rotate: 0 }}
                      transition={{ type: 'spring', damping: 15 }}
                    >
                      <PlayingCard card={topCard} />
                    </motion.div>
                  </AnimatePresence>
                )}
                
                {gameState.activeSuit && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-yellow-400"
                  >
                    {SUIT_ICONS[gameState.activeSuit]}
                  </motion.div>
                )}
                
                <div className="absolute -bottom-6 left-0 w-full text-center text-xs font-mono text-emerald-200 uppercase tracking-widest">
                  Discard
                </div>
              </div>
            </div>

            {/* Player Hand */}
            <div className="flex flex-col items-center gap-4">
              <div className="sm:hidden text-emerald-200 text-sm font-medium text-center px-4">
                {message}
              </div>
              <div className="flex justify-center flex-wrap gap-2 sm:gap-4 max-w-5xl">
                {gameState.playerHand.map((card) => (
                  <PlayingCard 
                    key={card.id} 
                    card={card} 
                    onClick={() => playCard(card, 'player')}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Suit Picker Modal */}
      <AnimatePresence>
        {gameState.status === 'choosing_suit' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-emerald-900 border-2 border-emerald-700 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full mx-4"
            >
              <h2 className="text-3xl font-serif italic text-white mb-2">Wild Card!</h2>
              <p className="text-emerald-200 mb-8">Choose the new active suit</p>
              <div className="grid grid-cols-2 gap-4">
                {(['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).map((suit) => (
                  <button
                    key={suit}
                    onClick={() => selectSuit(suit)}
                    className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-105 group"
                  >
                    <div className="scale-150 group-hover:scale-175 transition-transform">
                      {SUIT_ICONS[suit]}
                    </div>
                    <span className="text-white font-mono text-sm uppercase tracking-widest">{suit}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState.status === 'game_over' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="text-center p-12"
            >
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/20">
                  <Trophy size={48} className="text-emerald-950" />
                </div>
              </div>
              <h2 className="text-6xl font-serif italic font-bold text-white mb-2">
                {gameState.winner === 'player' ? 'Victory!' : 'Defeat!'}
              </h2>
              <p className="text-xl text-emerald-200 mb-12">
                {gameState.winner === 'player' 
                  ? "You've cleared all your cards. Well played!" 
                  : "The AI outsmarted you this time. Try again?"}
              </p>
              <button 
                onClick={initGame}
                className="px-12 py-4 bg-white text-emerald-950 font-bold text-xl rounded-full transition-all transform hover:scale-105 shadow-xl flex items-center gap-3 mx-auto"
              >
                Play Again <RotateCcw />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Turn Indicator Overlay */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 hidden lg:flex flex-col gap-8 opacity-20 pointer-events-none">
        <div className={`flex items-center gap-4 transition-opacity ${gameState.currentTurn === 'ai' ? 'opacity-100' : 'opacity-30'}`}>
          <div className="w-1 h-12 bg-white rounded-full"></div>
          <span className="text-4xl font-serif italic text-white uppercase tracking-tighter">AI Turn</span>
        </div>
        <div className={`flex items-center gap-4 transition-opacity ${gameState.currentTurn === 'player' ? 'opacity-100' : 'opacity-30'}`}>
          <div className="w-1 h-12 bg-white rounded-full"></div>
          <span className="text-4xl font-serif italic text-white uppercase tracking-tighter">Your Turn</span>
        </div>
      </div>
    </div>
  );
}
