export const spriteForJob = (jobName?: string) => {
  const key = (jobName || '').toLowerCase();
  const map: Record<string, string> = {
    novice: '/assets/sprites/novice.png',
    archer: '/assets/sprites/archer.png',
    swordman: '/assets/sprites/swordman.png',
    assassin: '/assets/sprites/assassin.png',
    mage: '/assets/sprites/mage.png',
    swordsman: '/assets/sprites/swordman.png',
    // añade más mappings según tus jobs/clases
  };
  return map[key] ?? `/assets/sprites/${key}.png`;
};

export default spriteForJob;
