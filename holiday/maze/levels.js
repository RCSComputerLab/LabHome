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
    '#...c.#'] }
];

window.MazeFoods = {
  r: 'apple-red.png', g: 'apple-green.png', y: 'apple-yellow.png',
  c: 'corn.png', p: 'pumpkin.png', o: 'gourd.png'
};
