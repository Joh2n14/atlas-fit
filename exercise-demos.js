'use strict';

/* Deux poses par mouvement, vues de profil sauf pour les élévations latérales.
 * Chaque tracé relie les mêmes articulations dans les deux poses. */
const EXERCISE_DEMOS = {
  'squat-corps': {
    finish: 'Position basse',
    poses: [
      {head:[127,30], body:'126,41 122,58 119,96', legs:'119,96 121,129 120,162 137,162', arms:'123,55 137,69 155,76'},
      {head:[144,60], body:'139,70 129,83 103,123', legs:'103,123 136,125 120,162 137,162', arms:'132,80 150,84 168,84'}
    ]
  },
  'squat-goblet': {
    finish: 'Position basse',
    poses: [
      {head:[127,30], body:'126,41 122,58 119,96', legs:'119,96 121,129 120,162 137,162', arms:'123,55 130,78 140,63', weight:[141,59]},
      {head:[144,60], body:'139,70 129,83 103,123', legs:'103,123 136,125 120,162 137,162', arms:'132,80 137,102 149,88', weight:[150,84]}
    ]
  },
  'pompes': {
    finish: 'Position basse',
    poses: [
      {head:[190,80], body:'180,88 162,98 113,120', legs:'113,120 75,139 46,154 46,162', arms:'162,98 159,129 157,162'},
      {head:[201,125], body:'190,130 171,135 117,141', legs:'117,141 76,149 46,154 46,162', arms:'171,135 140,143 157,162'}
    ]
  },
  'pompes-inclinees': {
    finish: 'Position basse',
    equipment:'<path d="M149 103H202V164M154 103V164"/>',
    poses: [
      {head:[153,24], body:'148,34 135,51 101,93', legs:'101,93 72,127 47,155 47,162', arms:'135,51 149,76 165,101'},
      {head:[183,66], body:'174,74 156,85 107,116', legs:'107,116 74,137 47,155 47,162', arms:'156,85 134,103 165,101'}
    ]
  },
  'pont-fessier': {
    finish: 'Bassin relevé',
    poses: [
      {head:[47,152], body:'59,155 69,155 119,156', legs:'119,156 152,120 177,162 194,162', arms:'69,155 91,161 114,162'},
      {head:[47,152], body:'59,155 69,155 121,126', legs:'121,126 157,108 177,162 194,162', arms:'69,155 91,161 114,162'}
    ]
  },
  'mollets-corps': {
    finish: 'Sur les pointes',
    poses: [
      {head:[125,30], body:'123,41 120,58 119,96', legs:'119,96 121,130 120,161 138,162', arms:'121,56 123,77 122,99'},
      {head:[130,18], body:'128,29 125,46 124,84', legs:'124,84 126,118 125,150 138,162', arms:'126,44 128,65 127,87'}
    ]
  },
  'curl-halteres': {
    finish: 'Un bras fléchi',
    poses: [
      {head:[126,30], body:'125,41 122,57 121,96', legs:'121,96 126,130 127,161 144,162', arms:'122,55 125,80 128,107', farArms:'118,56 115,80 113,107', weight:[129,108], farWeight:[112,108]},
      {head:[126,30], body:'125,41 122,57 121,96', legs:'121,96 126,130 127,161 144,162', arms:'122,55 125,80 145,62', farArms:'118,56 115,80 113,107', weight:[147,60], farWeight:[112,108]}
    ]
  },
  'elevations-laterales': {
    finish: 'Bras levés sur les côtés',
    poses: [
      {head:[120,29], body:'120,40 120,58 120,97', legs:'120,97 111,130 107,161 98,162', farLegs:'120,97 129,130 133,161 142,162', arms:'108,54 102,78 100,101', farArms:'132,54 138,78 140,101', weight:[100,104], farWeight:[140,104]},
      {head:[120,29], body:'120,40 120,58 120,97', legs:'120,97 111,130 107,161 98,162', farLegs:'120,97 129,130 133,161 142,162', arms:'108,54 87,58 65,61', farArms:'132,54 153,58 175,61', weight:[62,62], farWeight:[178,62]}
    ],
    equipment:'<path d="M108 54h24" stroke="#c6d2e8" stroke-width="8"/>'
  }
};

function exerciseDemoSvg(demo, poseIndex, animated) {
  const pose = demo.poses[poseIndex];
  const finish = demo.poses[1];
  function animation(attribute, start, end) {
    if (!animated || start === end) return '';
    return `<animate attributeName="${attribute}" values="${start};${start};${end};${end};${start}" keyTimes="0;0.1;0.5;0.6;1" dur="3.2s" begin="indefinite" repeatCount="indefinite"/>`;
  }
  function limb(key, color, width) {
    if (!pose[key]) return '';
    return `<polyline points="${pose[key]}" stroke="${color}" stroke-width="${width}">${animation('points', pose[key], finish[key])}</polyline>`;
  }
  function weight(key) {
    if (!pose[key]) return '';
    const [x, y] = pose[key];
    const [endX, endY] = finish[key];
    return `<g transform="translate(${x} ${y})" stroke="#f2bf79" stroke-width="3">
      ${animated && (x !== endX || y !== endY) ? `<animateTransform attributeName="transform" type="translate" values="${x} ${y};${x} ${y};${endX} ${endY};${endX} ${endY};${x} ${y}" keyTimes="0;0.1;0.5;0.6;1" dur="3.2s" begin="indefinite" repeatCount="indefinite"/>` : ''}
      <path d="M-6 0H6M-6 -4v8M6 -4v8"/>
    </g>`;
  }
  const [headX, headY] = pose.head;
  return `<svg viewBox="0 0 240 176" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 164H218" stroke="#586885" stroke-width="2"/>
    <g stroke="#586885" stroke-width="4">${demo.equipment || ''}</g>
    ${limb('farLegs', '#8c9fbb', 6)}
    ${limb('farArms', '#8c9fbb', 6)}
    ${weight('farWeight')}
    ${limb('body', '#c6d2e8', 9)}
    ${limb('legs', '#b9ed93', 7)}
    ${limb('arms', '#b9ed93', 6)}
    <circle cx="${headX}" cy="${headY}" r="10" fill="#c6d2e8">
      ${animation('cx', headX, finish.head[0])}${animation('cy', headY, finish.head[1])}
    </circle>
    ${weight('weight')}
  </svg>`;
}

function exerciseDemo(ex) {
  const demo = EXERCISE_DEMOS[ex.id];
  if (!demo) return '';
  return `<section class="exercise-demo" aria-label="Démonstration du mouvement">
    <div class="exercise-demo-header">
      <h3>Démonstration</h3>
      <button type="button" class="btn small secondary exercise-demo-toggle" data-act="toggle-exercise-demo" aria-pressed="false">Animer le schéma</button>
    </div>
    <div class="exercise-demo-motion">${exerciseDemoSvg(demo, 0, true)}</div>
    <div class="exercise-demo-poses">
      <figure>${exerciseDemoSvg(demo, 0, false)}<figcaption>Position de départ</figcaption></figure>
      <figure>${exerciseDemoSvg(demo, 1, false)}<figcaption>${demo.finish}</figcaption></figure>
    </div>
  </section>`;
}

function toggleExerciseDemo(button) {
  const demo = button.closest('.exercise-demo');
  const playing = button.getAttribute('aria-pressed') === 'true';
  for (const animation of demo.querySelectorAll('animate, animateTransform')) {
    if (playing) animation.endElement();
    else animation.beginElement();
  }
  button.setAttribute('aria-pressed', String(!playing));
}
