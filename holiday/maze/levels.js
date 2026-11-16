/* Turkey Maze levels. Every level is 7 squares wide and 5 tall.
   #  hay bale (wall)     .  path     T  turkey start
   Foods: r red apple, g green apple, y yellow apple, c corn, p pumpkin, o gourd */
window.MazeLevels = [
  { hint: 'Use the ➡️ block to walk to the apple!', rows: [
    '#######',
    '#######',
    '#T..r##',
    '#######',
    '#######'] },
  { hint: 'Walk right, then down to the corn.', rows: [
    '#######',
    '#T..###',
    '###.###',
    '###c###',
    '#######'] },
  { hint: 'Eat the apple on the way to the next one!', rows: [
    '#######',
    '###.y##',
    '###.###',
    '#T.g###',
    '#######'] },
  { hint: 'Zig and zag down the stairs.', rows: [
    '#######',
    '#T.####',
    '##..###',
    '###.p##',
    '#######'] },
  { hint: 'This time the turkey starts by walking left.', rows: [
    '#######',
    '#c..T##',
    '#.#####',
    '#..o###',
    '#######'] },
  { hint: 'That\'s a lot of steps! Try the 🔁 Repeat block.', repeat: true, rows: [
    '#######',
    '#######',
    'T.....r',
    '#######',
    '#######'] },
  { hint: 'Put ➡️ and ⬇️ inside one Repeat block.', repeat: true, rows: [
    'T.#####',
    '#..####',
    '##..###',
    '###..##',
    '####..p'] },
  { hint: 'A big maze! Use Repeat to save blocks.', repeat: true, rows: [
    '#T....#',
    '#####.#',
    '#y....#',
    '#.#####',
    '#...c.#'] },
  { hint: 'Climb the stairs! Repeat ➡️ ⬆️.', repeat: true, rows: [
    '#####.p',
    '####..#',
    '###..##',
    '##..###',
    'T..####'] },
  { hint: 'Try using two Repeat blocks!', repeat: true, rows: [
    'T.....#',
    '#####.#',
    '#####.#',
    '#####.#',
    '#####.c'] },
  { hint: 'Down the stairs to the left!', repeat: true, rows: [
    '####..T',
    '###..##',
    '##..###',
    '#..####',
    'c.#####'] },
  { hint: 'Three apples! Go right, down, then left.', repeat: true, rows: [
    '#######',
    '#T.r.g#',
    '#####.#',
    '#y....#',
    '#######'] },
  { hint: 'Eat one, then turn around for the other!', repeat: true, rows: [
    '#c...y#',
    '###.###',
    '###.###',
    '###.###',
    '###T###'] },
  { hint: 'Find the pattern! Put 4 blocks in the Repeat.', repeat: true, rows: [
    'T..####',
    '##.####',
    '##...##',
    '####.##',
    '####..p'] },
  { hint: 'Twist and turn to the gourd!', repeat: true, rows: [
    'T.....#',
    '#####.#',
    '#o#...#',
    '#.#.###',
    '#...###'] },
  { hint: 'Snake through the field.', repeat: true, rows: [
    'T.r...#',
    '#####.#',
    '#.c...#',
    '#.#####',
    '#....p#'] },
  { hint: 'Watch out for the dead end!', repeat: true, rows: [
    '#######',
    '#T..#r#',
    '###.#.#',
    '#.....#',
    '#c#####'] },
  { hint: 'Over the hill and down again!', repeat: true, rows: [
    '##.g.##',
    '#..#..#',
    '#.###.#',
    '#.###.#',
    'T.###.c'] },
  { hint: 'Visit each field. Some paths are dead ends!', repeat: true, rows: [
    '#y#.#c#',
    '#.#.#.#',
    '#.....#',
    '###.###',
    '###T###'] },
  { hint: 'The Great Turkey Feast! Eat all six foods.', repeat: true, rows: [
    'T.r.#.g',
    '###.#.#',
    'y...#.#',
    '#.###.#',
    '#c.o.p#'] }
];

window.MazeFoods = {
  r: 'apple-red.png', g: 'apple-green.png', y: 'apple-yellow.png',
  c: 'corn.png', p: 'pumpkin.png', o: 'gourd.png'
};
