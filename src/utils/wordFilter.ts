const BANNED_WORDS = [
  'puta', 'puto', 'caralho', 'porra', 'vigarista', 'fuck', 'shit', 'fdp', 'imbecil',
  'idiota', 'desgraça', 'corno', 'merda', 'bosta', 'pqp', 'filho da puta', 'asshole'
];

export const filterContent = (text: string): string => {
  let filteredText = text;
  // Ordenamos por tamanho para evitar que 'filho da puta' seja filtrado parcialmente como 'puta'
  const sortedBanned = [...BANNED_WORDS].sort((a, b) => b.length - a.length);
  
  sortedBanned.forEach(word => {
    // Regex que procura a palavra ignorando maiúsculas/minúsculas
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '***');
  });
  return filteredText;
};

export const hasOffensiveContent = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some(word => lowerText.includes(word.toLowerCase()));
};