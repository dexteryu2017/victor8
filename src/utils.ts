import { Card, Suit, Rank } from './types';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank, index) => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        value: index + 1,
      });
    });
  });
  return shuffle(deck);
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const isValidMove = (card: Card, topCard: Card, activeSuit: Suit | null): boolean => {
  // An 8 is always valid
  if (card.rank === '8') return true;

  // If an 8 was played, we must match the activeSuit
  if (activeSuit) {
    return card.suit === activeSuit;
  }

  // Otherwise match suit or rank
  return card.suit === topCard.suit || card.rank === topCard.rank;
};
