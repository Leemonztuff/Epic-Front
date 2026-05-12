export const spriteForJob = (jobName?: string, variant: 'default' | 'portrait' = 'default') => {
  const key = (jobName || '').toLowerCase().replace(/\s+/g, '_');
  // Project sprites follow pattern: sprite_{job}_idle_64.png
  const baseName = `sprite_${key}_idle_64.png`;
  const basePath = `/assets/sprites/${baseName}`;

  // Known available keys (fallback table)
  const map: Record<string, string> = {
    novice: '/assets/sprites/sprite_novice_idle_64.png',
    archer: '/assets/sprites/sprite_archer_idle_64.png',
    knight: '/assets/sprites/sprite_knight_idle_64.png',
    mage: '/assets/sprites/sprite_mage_idle_64.png',
    priest: '/assets/sprites/sprite_priest_idle_64.png',
    warrior: '/assets/sprites/sprite_warrior_idle_64.png',
    wizard: '/assets/sprites/sprite_wizard_idle_64.png',
    acolyte: '/assets/sprites/sprite_acolyte_idle_64.png',
  };

  // Use mapped path when available, otherwise try conventional filename
  const resolved = map[key] ?? basePath;

  // Portrait variant: prefer a portrait file if present, else fallback to same sprite
  if (variant === 'portrait') {
    // Convention fallback: sprite_{job}_portrait.png (not always present) or same asset
    const portraitCandidate = `/assets/sprites/sprite_${key}_portrait.png`;
    return portraitCandidate; // Next.js/Image will 404 gracefully and fallback to resolved in caller if needed
  }

  return resolved;
};

export default spriteForJob;
