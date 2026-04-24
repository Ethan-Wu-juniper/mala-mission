export const ADJECTIVES = [
  "可愛",
  "帥氣",
  "優雅",
  "神秘",
  "活潑",
  "安靜",
  "勇敢",
  "聰明",
  "溫柔",
  "調皮",
  "慵懶",
  "驕傲",
  "害羞",
  "熱情",
  "冷酷",
  "機靈",
  "憂鬱",
  "歡樂",
  "迷糊",
  "狡猾",
] as const;

export const ANIMALS = [
  "狐狸",
  "小狗",
  "貓咪",
  "兔子",
  "熊貓",
  "綿羊",
  "駿馬",
  "黃牛",
  "鴨子",
  "白鵝",
  "麻雀",
  "老鼠",
  "猴子",
  "老虎",
  "麋鹿",
  "大象",
  "狼犬",
  "獅子",
  "松鼠",
  "海豹",
] as const;

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickNicknames(n: number): string[] {
  if (n > ADJECTIVES.length) {
    throw new Error(`最多只能 ${ADJECTIVES.length} 人`);
  }
  const adjs = shuffle(ADJECTIVES);
  const animals = shuffle(ANIMALS);
  return Array.from({ length: n }, (_, i) => `${adjs[i]}${animals[i]}`);
}
