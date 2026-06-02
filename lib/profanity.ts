const PROFANITY = new Set([
  "fuck", "fucking", "fucker", "fucked", "fucks", "motherfucker", "motherfucking",
  "shit", "shitting", "shitter", "shits", "bullshit",
  "ass", "asshole", "assholes", "asses",
  "bitch", "bitches", "bitching",
  "cunt", "cunts",
  "dick", "dicks", "dickhead", "dickheads",
  "cock", "cocks", "cocksucker",
  "pussy", "pussies",
  "bastard", "bastards",
  "piss", "pissing",
  "whore", "whores",
  "slut", "sluts",
  "nigger", "niggers", "nigga", "niggas",
  "faggot", "faggots", "fag", "fags",
  "retard", "retarded", "retards",
  "twat", "twats",
  "wank", "wanker", "wankers", "wanking",
  "bollocks",
  "arse", "arsehole",
  "chink", "kike", "spic", "spics", "wetback",
]);

export function isProfane(text: string): boolean {
  const words = text.toLowerCase().split(/[\s,.\-_!?@#$%^&*()+=[\]{}|<>/\\]+/);
  return words.some((w) => PROFANITY.has(w));
}
