# Supabase Database Setup

## Prerequisites

1. Tener un proyecto de Supabase creado
2. Tener las credenciales del proyecto (URL y anon key)
3. Haber configurado las variables de entorno en `.env.local`

## Quick Setup (3 Steps)

### Step 1: Configurar entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
GEMINI_API_KEY=tu_gemini_api_key
```

### Step 2: Abrir SQL Editor

Ir a: **Supabase Dashboard** → **SQL Editor**

```
https://supabase.com/dashboard/project/TU_PROYECTO/sql-editor
```

### Step 3: Ejecutar los 3 archivos (en orden)

Copiar y ejecutar cada archivo completo (EN ORDEN):

1. **01-schema.sql** → Click "New query" → Paste → Run (Ctrl+Enter)
2. **02-functions.sql** → New query → Paste → Run
3. **04-seed.sql** → New query → Run

#### 2.2 Ejecutar `03-functions.sql`
- `rpc_initialize_player` - Inicializa jugador con 3 personajes
- `rpc_pull_gacha` - Sistema de gacha
- `rpc_evolve_unit` - Evolución de personajes
- `rpc_regen_energy` - Regeneración de energía
- `rpc_deduct_energy` - Deducir energía para batallas
- `rpc_refill_energy_with_gems` - Comprar energía con gemas
- `rpc_complete_stage` - Completar etapa
- `rpc_award_unit_exp` - Dar EXP a personajes
- `rpc_learn_skill` - Aprender habilidades
- `rpc_equip_skill` - Equipar habilidades
- `rpc_add_currency` - Añadir moneda
- `rpc_claim_daily_reward` - Reclamar recompensas diarias
- `rpc_train_unit` - Entrenar personajes

#### 2.3 Ejecutar `04-seed.sql`
- Configuración del juego (`game_configs`)
- Jobs (Novice, Swordman, Knight, Mage, Wizard, etc.)
- Habilidades base
- Cartas
- Armas
- Job Cores

### 3. Verificar instalación

Ejecutar esta query en SQL Editor para verificar:

```sql
-- Ver tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Ver funciones RPC
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;

-- Ver datos seed
SELECT COUNT(*) as jobs_count FROM jobs;
SELECT COUNT(*) as skills_count FROM skills;
SELECT COUNT(*) as weapons_count FROM weapons;
SELECT COUNT(*) as cards_count FROM cards;
```

Deberías ver:
- 13+ tablas
- 13+ funciones RPC
- 10+ jobs
- 20+ skills
- 15+ armas
- 20+ cartas

## Uso en la App

### Primer uso (Onboarding)

1. El usuario se registra/inicia sesión
2. El sistema detecta que no tiene perfil
3. Ejecuta automáticamente `rpc_initialize_player`
4. El jugador recibe:
   - 3 personajes Novice (physical, ranged, magic)
   - 1000 monedas
   - 100 gemas
   - 30 energía

### Estructura de datos del jugador

```
players
├── id (UUID) - linked to auth.users
├── username
├── currency (zeny)
├── premium_currency (gemas)
├── energy / max_energy
├── level / exp

units (personajes del jugador)
├── player_id -> players.id
├── name
├── level / exp
├── base_stats (HP, ATK, DEF, MATK, MDEF, AGI)
├── growth_rates
├── affinity (physical, magic, support, ranged)
├── current_job_id
├── equipped_*

party (slots de equipo, 3 posiciones)
├── player_id -> players.id
├── slot_index (0, 1, 2)
├── unit_id -> units.id

inventory (obtenidos del gacha)
├── player_id -> players.id
├── item_id (referencia a skills/cards/weapons/job_cores)
├── item_type

campaign_progress
├── player_id -> players.id
├── stage_id
├── stars
├── best_turns
├── clear_count
```

## Troubleshooting

### "El servicio de inicialización no está disponible"

**Causa**: La función `rpc_initialize_player` no está desplegada.

**Solución**: Ejecutar `03-functions.sql` en el SQL Editor de Supabase.

### No aparecen personajes

**Causa**: El onboarding no se ejecutó correctamente.

**Solución**: 
1. Verificar que el usuario esté autenticado
2. Llamar manualmente al onboarding desde la consola:
```js
import { OnboardingService } from '@/lib/services/onboarding-service';
await OnboardingService.initializePlayer('TuNombre', 3);
```

### Sin energía para batalla

**Causa**: La energía está en 0 y no se regenera.

**Solución**: 
1. Verificar que `rpc_regen_energy` existe
2. Ejecutar manualmente:
```sql
SELECT rpc_regen_energy();
-- o desde la app:
await supabase.rpc('rpc_regen_energy');
```

### Error de permisos (RLS)

**Causa**: Las políticas RLS bloquean el acceso.

**Solución**: Verificar que las políticas están creadas (ejecutar `01-schema.sql` completo).

## Scripts Adicionales

Si necesitas restablecer la base de datos:

```bash
# Reset completo (cuidado: borra todo)
# Ejecutar en SQL Editor:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Luego volver a ejecutar `01-schema.sql`, `03-functions.sql`, `04-seed.sql`.