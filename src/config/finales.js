// The five finale scenes — the moments the whole game exists to tell.
// One per world, played after the flag of the world's LAST level.
//
// DECIDED (Phase 8 gate): text cards over themed scenery, PORTUGUESE
// ONLY — the autobiography keeps its native voice.
//
// PLACEHOLDER TEXT: the lines below are stand-ins. Nuno writes the real
// ones — they're his life. Keep them short: one card, one breath.

export const FINALES = {
  'first-dog': {
    world: 1,
    title: 'O PRIMEIRO CÃO',
    pt: 'Antes de saber andar, já tinha um melhor amigo.',
    sky: '#79c8f2', // soft morning blue
    // the memory itself: sprite from the world-1 pack (tail wagging)
    prop: { sheet: 'w1-dog', frame: 0, anim: 'w1-dog-wag', scale: 1.5 },
  },
  'futbol-champion': {
    world: 2,
    title: 'CAMPEÃO DE FUTEBOL',
    pt: 'Uma bola, um campo, e um miúdo que não parava.',
    sky: '#5c94fc',
  },
  'the-request': {
    world: 3,
    title: 'O PEDIDO',
    pt: 'Algumas perguntas mudam tudo.',
    sky: '#f2a25c', // sunset
  },
  'the-future-home': {
    world: 4,
    title: 'A CASA DO FUTURO',
    pt: 'Quatro paredes à espera de uma vida.',
    sky: '#8ea8d8', // dusk
  },
  'one-year': {
    world: 5,
    title: 'UM ANO',
    pt: 'E de repente, já tinha passado um ano.',
    sky: '#2b2b52', // starry night
  },
};
