export const ANIMALS = [
  "小貓",
  "小狗",
  "小兔",
  "小熊",
  "小豬",
  "小羊",
  "小馬",
  "小牛",
  "小雞",
  "小鴨",
  "小鵝",
  "小鳥",
  "小鼠",
  "小猴",
  "小虎",
  "小狐",
  "小鹿",
  "小象",
  "小狼",
  "小獅",
] as const;

export function pickAnimals(n: number): string[] {
  if (n > ANIMALS.length) {
    throw new Error(`最多只能 ${ANIMALS.length} 人`);
  }
  const pool = [...ANIMALS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
