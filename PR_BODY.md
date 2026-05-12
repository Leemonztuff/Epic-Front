feat(ui): Character detail styled UI

Resumen
- Añade la pantalla de detalle de personaje estilizada con breakout del sprite, marco decorativo, panel de stats, slots de equipamiento y barra de evolución.
- Componentes reutilizables: `Frame`, `EvolutionBar`. Mapeo de sprites actualizado y utilidad `.pixelated`.
- Placeholders creados para assets faltantes; reemplazar antes de merge.
- Snapshot test inicial incluido (genera snapshot localmente).

Checklist (antes de merge)
- [ ] Reemplazar placeholders en `public/assets/` por los PNG finales.
- [ ] Ejecutar tests y actualizar snapshot: `npm run test -- -u`.
- [ ] Revisar visual en `npm run dev`.
- [ ] Revisar accesibilidad básica.
- [ ] Confirmar paths de sprites en la BD.

Instrucciones rápidas
1. Reemplaza los placeholders en `public/assets/`.
2. Ejecuta `npm run test -- -u` para generar snapshots y commitea.
3. Crea PR draft desde `feat/character-detail-styled` hacia `main`.
[TITLE] feat(ui): Character detail styled UI

Resumen
- Añade la pantalla de detalle de personaje estilizada con breakout del sprite, marco decorativo, panel de stats, slots de equipamiento y barra de evolución.
- Componentes reutilizables: Frame y EvolutionBar. Mapeo de sprites actualizado y utilidad .pixelated.
- Placeholders creados para assets faltantes; reemplazar antes de merge.
- Snapshot test inicial incluido (genera snapshot localmente).

Archivos clave
- components/views/CharacterDetailStyled.tsx
- components/views/CharacterDetailStyled.module.css
- components/ui/Frame.tsx
- components/ui/EvolutionBar.tsx
- lib/spriteMap.ts
- app/globals.css
- __tests__/CharacterDetailStyled.test.tsx
- Placeholders en public/assets/

Checklist (antes de merge)
- [ ] Reemplazar placeholders en public/assets/
- [ ] Ejecutar tests y actualizar snapshot: npm run test -- -u
- [ ] Revisar visual en npm run dev
- [ ] Revisar accesibilidad básica
- [ ] Confirmar paths de sprites en la BD

Instrucciones para QA
1. Ejecutar `npm run dev` y navegar a la ruta de detalle.
2. Confirmar que el sprite sobresale por la parte superior del marco.
3. Confirmar estilos `.pixelated` aplicados en sprites.
4. Sustituir placeholders y volver a comprobar.

