/* Color-by-number pictures. Each letter is a color from COLORS; "." is empty background. */
window.PixelPictures = (function () {
  const COLORS = {
    r: { hex: '#e0312b', name: 'Red' },
    o: { hex: '#f5871f', name: 'Orange' },
    p: { hex: '#c95a12', name: 'Dark orange' },
    y: { hex: '#ffd23f', name: 'Yellow' },
    a: { hex: '#f2a516', name: 'Gold' },
    b: { hex: '#8b4a1f', name: 'Brown' },
    d: { hex: '#5a2e0e', name: 'Dark brown' },
    t: { hex: '#e8b878', name: 'Tan' },
    u: { hex: '#c48a4a', name: 'Crust brown' },
    n: { hex: '#b85c1e', name: 'Pumpkin pie' },
    k: { hex: '#222222', name: 'Black' },
    g: { hex: '#3f9e3a', name: 'Green' },
    w: { hex: '#ffffff', name: 'White' },
    e: { hex: '#d6dde8', name: 'Light gray' },
    s: { hex: '#5aa0e0', name: 'Blue' },
    v: { hex: '#2f6fb0', name: 'Dark blue' },
    f: { hex: '#f6c9a0', name: 'Peach' },
    m: { hex: '#b07040', name: 'Copper' },
    q: { hex: '#7d3c98', name: 'Purple' },
    h: { hex: '#4b5160', name: 'Dark gray' }
  };

  // small = K–2, medium = 3–4, large = 5–6
  const PICTURES = {
    small: [
      { id: 'turkey', name: 'Turkey', emoji: '🦃', rows: [
        '..rooor...', '.royyyor..', 'roybbbyor.', 'roykbkyor.', 'robbabbor.',
        '.bbbrbbb..', '.bbbbbbb..', '..bbbbb...', '...a.a....', '..aa.aa...'] },
      { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', rows: [
        '....dd....', '....d.gg..', '..oooooo..', '.oopoopoo.', 'ooopoopooo',
        'ooopoopooo', 'ooopoopooo', 'ooopoopooo', '.oopoopoo.', '..oooooo..'] },
      { id: 'leaf', name: 'Leaf', emoji: '🍂', rows: [
        '....o.....', '...ooo....', '.o.ooo.o..', '.ooodooo..', 'oooodoooo.',
        '.ooodooo..', '..oodoo...', '...odo....', '....d.....', '....d.....'] },
      { id: 'slice', name: 'Pie Slice', emoji: '🍰', rows: [
        '..........', '......w...', '.....www..', '....wwwww.', '...oowwwot',
        'oooooooott', 'nnnnnnnnnt', 'nnnnnnnnnt', 'uuuuuuuuuu', '..........'] },
      { id: 'pilgrim', name: 'Pilgrim', emoji: '🎩', rows: [
        '...kkkk...', '...kaak...', '.kkkkkkkk.', '..bffffb..', '..fkffkf..',
        '..ffrrff..', '...ffff...', '.wwwwwwww.', 'hhhwwwwhhh', 'hhhhhhhhhh'] },
      { id: 'wampanoag', name: 'Wampanoag Man', emoji: '🪶', rows: [
        '.......w..', '..kkkkkb..', '.kkkkkkkk.', '.kmmmmmmk.', '.kmkmmkmk.',
        '.kmmmmmmk.', '.kmmrrmmk.', '.kkmmmmkk.', 'ttsasasatt', 'tttttttttt'] },
      { id: 'cornucopia', name: 'Cornucopia', emoji: '🧺', rows: [
        '..........', '.....qq.g.', '.....qqrr.', 'b...uuqrrr', 'bu.uutuyyr',
        '.buutuuyya', '.butuuoooa', '..buuooooo', '...buuoooo', '.....uu...'] }
    ],
    medium: [
      { id: 'turkey', name: 'Turkey', emoji: '🦃', rows: [
        '.....rrrrrr.....', '...rroooooorr...', '..rrooyyyyoorr..', '.rrooyybbyyoorr.',
        '.rooyybbbbyyoor.', 'rrooyykbbkyyoorr', 'rooyybbaabbyyoor', 'rooybbbrrbbbyoor',
        '.roybbbrrbbbyor.', '..bbbbbbbbbbbb..', '.bbbbttttttbbbb.', '.bbbbttttttbbbb.',
        '..bbbttttttbbb..', '...bbbbbbbbbb...', '.....a....a.....', '....aaa..aaa....'] },
      { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', rows: [
        '.......dd.......', '.......dd.gg....', '.......ddggg....', '....opoooopo....',
        '..ooopoooopooo..', '.oooopoooopoooo.', '.ooyopoooopoooo.', '.ooyopoooopoooo.',
        '.ooyopoooopoooo.', '.oooopoooopoooo.', '.oooopoooopoooo.', '.oooopoooopoooo.',
        '.oooopoooopoooo.', '..ooopoooopooo..', '....opoooopo....', '................'] },
      { id: 'pie', name: 'Pumpkin Pie', emoji: '🥧', rows: [
        '................', '................', '................', '......wwww......',
        '.....wwwwww.....', '..tttwwwwwwttt..', '.tnnnnnnnnnnnnt.', 'tnnnnnnnnnnnnnnt',
        'tnnnnnnnnnnnnnnt', 'tutututututututu', '.ssssssssssssss.', '..ssssssssssss..',
        '...vvvvvvvvvv...', '................', '................', '................'] },
      { id: 'slice', name: 'Pie Slice', emoji: '🍰', rows: [
        '................', '................', '................', '..........w.....',
        '.........www....', '........wwwww...', '.......wwwewwwtt', '......wweewwwwtt',
        '......owwwwwwott', '...ooooooooooott', 'oooooooooooooott', 'nnnnnnnnnnnnnntt',
        'nnnnnnnnnnnnnntt', 'nnnnnnnnnnnnnntt', 'uuuuuuuuuuuuuuuu', '................'] },
      { id: 'pilgrim', name: 'Pilgrim', emoji: '🎩', rows: [
        '................', '.....kkkkkk.....', '.....kkkkkk.....', '.....kkkkkk.....',
        '.....kaaaak.....', '.....kakkak.....', '..kkkkkkkkkkkk..', '....bffffffb....',
        '....bfkffkfb....', '....bffffffb....', '....bffrrffb....', '.....ffffff.....',
        '...wwwwwwwwww...', '.hhhhwwwwwwhhhh.', 'hhhhhhwwwwhhhhhh', 'hhhhhhhhhhhhhhhh'] },
      { id: 'wampanoag', name: 'Wampanoag Man', emoji: '🪶', rows: [
        '..........w.....', '..........w.....', '.....kkkkkbk....', '....kkkkkkkkk...',
        '...kkkkkkkkkkk..', '...kkmmmmmmmkk..', '...kmmkmmmkmmk..', '...kmmmmmmmmmk..',
        '...kmmmmmmmmmk..', '...kmmmrrrmmmk..', '...kkmmmmmmmkk..', '...kk.mmmmm.kk..',
        '.ttkttsasastktt.', 'tttttttttttttttt', 'tttttttttttttttt', 'tdtdtdtdtdtdtdtd'] },
      { id: 'cornucopia', name: 'Cornucopia', emoji: '🧺', rows: [
        '................', '..........qq....', '.........qqqq.g.', '.........qqqggg.',
        'b.......uuqqrr..', 'bu.....uutuqrrr.', '.bu...uutuuyrrr.', '.buu.uutuuuyyy..',
        '..buuutuuuoyyya.', '..buutuuuoooyya.', '...butuuooooooa.', '....buuuuoooooo.',
        '.....buuuuooooo.', '.......uuuu.....', '................', '................'] }
    ],
    large: [
      { id: 'turkey', name: 'Turkey', emoji: '🦃', rows: [
        '........................', '........................', '........rrrrrrrr........',
        '......rrrrrrrrrrrr......', '.....rrrrobbbborrrr.....', '....rrroobkbbkboorrr....',
        '...rroooobbbbbboooorr...', '..rrroooybbaabbyooorrr..', '..rroooyybbaabbyyooorr..',
        '.rroooyyybbbrbbyyyooorr.', '.rrooyyybbbbrbbbyyyoorr.', '.rrooyybbbbbrbbbbyyoorr.',
        'rroooybbbbbbbbbbbbyooorr', 'rroooybbbbbttbbbbbyooorr', '......bbbttttttbbb......',
        '.....bbbbttttttbbbb.....', '......bbttttttttbb......', '......bbttttttttbb......',
        '......bbbttttttbbb......', '.......bbttttttbb.......', '.........bbttbb.........',
        '.........a....a.........', '.........a....a.........', '........aaa..aaa........'] },
      { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', rows: [
        '........................', '.............d..........', '...........ddd.gg.......',
        '...........dd.ggg.......', '...........ddggggg......', '...........dd.ggg.......',
        '...........dd...........', '..........oooo..........', '.....oooooooooooooo.....',
        '...ooooopoooooopooooo...', '...oyoopoooooooopoooo...', '..oyooopoooooooopooooo..',
        '.ooyooopoooooooopoooooo.', '.ooyooopoooooooopoooooo.', '.ooyooopoooooooopoooooo.',
        '.ooyooopoooooooopoooooo.', '.oooooopoooooooopoooooo.', '.oooooopoooooooopoooooo.',
        '.oooooopoooooooopoooooo.', '..ooooopoooooooopooooo..', '...ooooopoooooopooooo...',
        '...oooooooooooooooooo...', '.....oooooooooooooo.....', '........................'] },
      { id: 'pie', name: 'Pumpkin Pie', emoji: '🥧', rows: [
        '........................', '........................', '........................',
        '........................', '........................', '...........ww...........',
        '..........wwww..........', '..........wwww..........', '.........wewwww.........',
        '........wwwwwwww........', '....ttttweewwwwwtttt....', '..tttnnnnweeewwnnnnttt..',
        '.ttnnnnnnnnnnnnnnnnnntt.', '.tnnnnnnnnnnnnnnnnnnnnt.', '.ttnnnnnnnnnnnnnnnnnntt.',
        '.ttttnnnnnnnnnnnnnntttt.', '.ttttttttnnnnnntttttttt.', '.ututututututututututut.',
        '.ssssssssssssssssssssss.', '..ssssssssssssssssssss..', '...vvvvvvvvvvvvvvvvvv...',
        '........................', '........................', '........................'] },
      { id: 'slice', name: 'Pie Slice', emoji: '🍰', rows: [
        '........................', '........................', '........................',
        '............ww..........', '...........wwww.........', '...........wwww.........',
        '..........wwwwew........', '.........wwwwewww.......', '.........wwwwweww...ttt.',
        '........wwwwweewww..tttu', '........wwwwwweewwootttu', '........wwwwwwwwwwootttu',
        '..........wwwwwwooootttu', '.......oooooooooooootttu', '....ooooooooooooooootttu',
        'ooooooooooooooooooootttu', 'nnnnnnnnnnnnnnnnnnnntttu', 'nnnnnnnnnnnnnnnnnnnntttu',
        'nnnnnnnnnnnnnnnnnnnntttu', 'nnnnnnnnnnnnnnnnnnnntttu', 'nnnnnnnnnnnnnnnnnnnntttu',
        'uuuuuuuuuuuuuuuuuuuuuuuu', '........................', '........................'] },
      { id: 'pilgrim', name: 'Pilgrim', emoji: '🎩', rows: [
        '........................', '........kkkkkkkk........', '........kkkkkkkk........',
        '........kkkkkkkk........', '........kkkkkkkk........', '........kkkkkkkk........',
        '........kaaaaaak........', '........kakkkkak........', '........kaaaaaak........',
        '....kkkkkkkkkkkkkkkk....', '......bffffffffffb......', '......bffkkffkkffb......',
        '......bffkkffkkffb......', '......bffffffffffb......', '......bfffrffrfffb......',
        '.......fffrrrrfff.......', '........ffffffff........', '..........ffff..........',
        '.....wwwwwwwwwwwwww.....', '...hhhwwwwwwwwwwwwhhh...', '..hhhhhhwwwwwwwwhhhhhh..',
        '.hhhhhhhhhwwwwhhhhhhhhh.', 'hhhhhhhhhhhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhhhhhhhhhhh'] },
      { id: 'wampanoag', name: 'Wampanoag Man', emoji: '🪶', rows: [
        '...............kk.......', '...............ww.......', '...............ww.......',
        '.......kkkkkkkkww.......', '......kkkkkkkkkkbk......', '.....kkkkkkkkkkkkkk.....',
        '.....ksasasasasasak.....', '.....kmmmmmmmmmmmmk.....', '.....kmmkkmmmmkkmmk.....',
        '.....kmmkkmmmmkkmmk.....', '.....kmmmmmmmmmmmmk.....', '.....kmmmmmmmmmmmmk.....',
        '.....kmmmmrrrrmmmmk.....', '.....kkmmmmmmmmmmkk.....', '.....kkkmmmmmmmmkkk.....',
        '.....kkk..mmmm..kkk.....', '....kkkk..mmmm..kkkk....', '..tttkkkttmmmmttkkkttt..',
        '.ttttkkktsasasatkkktttt.', 'tttttkkttttssttttkkttttt', 'tttttttttttttttttttttttt',
        'tttttttttttttttttttttttt', 'tttttttttttttttttttttttt', 'tdtdtdtdtdtdtdtdtdtdtdtd'] },
      { id: 'cornucopia', name: 'Cornucopia', emoji: '🧺', rows: [
        '........................', '........................', '..................g.....',
        '...............qqqgg....', '..............qqqqqgg...', '..............qqqqq.....',
        'bb............qqqqrrr...', 'b.u..........uqqqrrrrr..', 'b.uu........uuuqqrrrrr..',
        '.buuu......uutuuqrrrrr..', '.buuuu....uutuuuyyrrr...', '..buuuu..uutuuuyyyyy.a..',
        '..buuuuuuutuuuuyyyyyaaa.', '...buuuuutuuuuoyyyyyaaa.', '...buuuutuuuooooyyyaaa..',
        '....buutuuuoooooooyaa...', '.....butuuooooooooogg...', '......buuuooooooooogg...',
        '.......buuuooooooooo....', '........buuuooooooo.....', '..........uuuu..........',
        '........................', '........................', '........................'] }
    ]
  };

  // Free Draw colors, in palette order.
  const FREE_COLORS = [
    '#e0312b', '#f5871f', '#ffd23f', '#f2a516', '#8fd14f', '#3f9e3a', '#5aa0e0', '#2f6fb0',
    '#9b5de5', '#ff7eb6', '#8b4a1f', '#5a2e0e', '#e8b878', '#ffffff', '#9aa3b0', '#222222'
  ];

  return { COLORS, PICTURES, FREE_COLORS };
})();
