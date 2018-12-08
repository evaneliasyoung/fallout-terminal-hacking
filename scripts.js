/**
* @author    Evan Young
* @copyright Evan Young 2018
* @file      Fallout terminal hacking simluator
*/
/* global $, localStorage */
/* eslint-disable no-extend-native */

const W = 53
const H = 22
const TABLE = $('table tbody')
const TYPE_TIMEOUT = 500
const TYPE_DELAY = 80
const GAME_MODES = ['fo3', 'fnv', 'fo4', 'fo76']
if (!localStorage.audioEnabled) { localStorage.audioEnabled = false }
if (!localStorage.crtEnabled) { localStorage.crtEnabled = false }
var canType = true
var gameData = {
  set attempts (v) {
    this._attempts = v
    if (this.attempts === 0) {
      loseGame()
    } else { drawAttempts() }
  },
  get attempts () { return this._attempts },
  set score (v) {
    this._score = v
    drawScore()
  },
  get score () { return this._score },
  set gutter (v) {
    this._gutter = v.slice(0, 16)
    drawGutter()
  },
  get past () { return this._past },
  set past (v) {
    this._past = v
    this.gutter = []
  },
  get gutter () { return this._gutter },
  set entry (v) {
    this._entry = v.substr(0, 12)
    if (this.entry !== '') { playKeys(this.entry.length) }
    drawEntry()
  },
  get entry () { return this._entry },
  set startHex (v) {
    this._startHex = v
    drawHex()
  },
  get startHex () { return this._startHex },
  set difficulty (v) {
    localStorage.difficulty = v.clamp(4, 9)
    this.wordBank = this.diffBank.choose(this.numWords)
  },
  get difficulty () {
    if (!localStorage.difficulty) { localStorage.difficulty = 4 }
    return parseInt(localStorage.difficulty)
  },
  get diffBank () { return window.allWords[this.difficulty - 4] },
  get wordBank () { return this._wordBank },
  set wordBank (v) {
    this._wordBank = v
    this._winWord = this.wordBank.choose()
  },
  get numWords () { return this.difficulty <= 8 ? 16 : 12 },
  get winWord () { return this._winWord },
  set mode (v) {
    if (GAME_MODES.includes(v)) {
      localStorage.mode = v
    } else {
      localStorage.mode = 'fo4'
    }
    changeMode()
  },
  get mode () {
    if (!localStorage.mode) { localStorage.mode = 'fo4' }
    return localStorage.mode
  }
}
var junkBank = ['!', '"', '#', '$', '%', '&', `'`, '(', ')', '*', '+', ',', '-', '.', '/', '[', '\\', ']', '^', '_', '{', '|', '}']
var scrMap = []

// <region> Prototype
Math.randomRange = function (mn, mx) {
  return Math.round(Math.random() * (mx - mn) + mn)
}
Array.prototype.choose = function (amt = 1) {
  if (amt === 1) {
    return this[Math.randomRange(0, this.length - 1)]
  }
  let ret = new Set()
  while (ret.size < amt) {
    ret.add(this[Math.randomRange(0, this.length - 1)])
  }
  return Array.from(ret)
}
Number.prototype.toHex = function () {
  return `0x${this.toString(16).toUpperCase().padStart(4, '0')}`
}
String.prototype.countMatches = function (s) {
  let tot = 0
  for (let i = 0; i < this.length; i++) {
    if (this[i] === s[i]) { tot++ }
  }
  return tot
}
Number.prototype.clamp = function (mn, mx) {
  return (this < mn) ? mn : (this > mx) ? mx : this.valueOf()
}
// </region>

// <region> Other
function playKey () {
  Array.from($('#sound-keyboard audio')).choose().play()
}
function playKeys (amt) {
  if (localStorage.audioEnabled === 'false' || !canType) { return }
  while (amt-- > 0) {
    setTimeout(playKey, amt * TYPE_DELAY)
    canType = false
  }
  setTimeout(() => { canType = true }, TYPE_TIMEOUT)
}
function playOtherKey (t) {
  if (localStorage.audioEnabled === 'false') { return }
  console.log(t)
  $(`#sound-${t}`).get(0).play()
}
// </region>

// <region> DOM Generation
function clearTable () {
  TABLE.html('')
  scrMap = []
}

function fillTable () {
  let ind = 0
  for (let y = 0; y < H; y++) {
    TABLE.append(`<tr>${'<td></td>'.repeat(W)}</tr>`)
  }
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 17; j++) {
      for (let k = 0; k < 12; k++) {
        let cell = $('tr')[j + 5].children[k + 7 + (i * 20)]
        cell.dataset.ind = ind++
        scrMap.push(cell)
      }
    }
  }
}
// </region>

// <region> Section Draw
function drawHex () {
  for (let i = 0; i < 17; i++) {
    drawText((gameData.startHex + (i * 12)).toHex(), i + 5)
    drawText((gameData.startHex + ((i + 17) * 12)).toHex(), i + 5, 20)
  }
}

function drawText (txt, r, xOff = 0, delay = 0) {
  for (let i = 0; i < txt.length; i++) {
    window.setTimeout(() => {
      TABLE.find('tr').eq(r).find('td').eq(i + xOff).html(txt[i])
    }, i * delay)
  }
}

function drawHeaders () {
  drawText(' '.repeat(W), 0)
  drawText(' '.repeat(W), 1)
  if (gameData.mode === 'fo4' || gameData.mode === 'fo76') {
    drawText('Welcome to ROBCO Industries (TM) Termlink', 0)
    drawText('Password Required', 1)
  } else if (gameData.mode === 'fnv' || gameData.mode === 'fo3') {
    drawText('ROBCO INDUSTRIES (TM) TERMLINK PROTOCOL', 0)
    drawText('ENTER PASSWORD NOW', 1)
  }
}

function drawAttempts () {
  drawText(' '.repeat(30), 3)
  if (gameData.mode === 'fo4' || gameData.mode === 'fo76') {
    drawText(`Attempts Remaining: ${'■'.repeat(gameData.attempts)}${' '.repeat(4 - gameData.attempts)}`, 3)
  } else if (gameData.mode === 'fnv' || gameData.mode === 'fo3') {
    drawText(`${gameData.attempts} ATTEMPT(S) LEFT: ${'■'.repeat(gameData.attempts)}${' '.repeat(4 - gameData.attempts)}`, 3)
  }
}

function drawScore () {
  if (gameData.mode === 'fo4' || gameData.mode === 'fo76') {
    drawText(`${gameData.score} Point(s)`, 3, W - 12 - gameData.score.toString().length)
  } else if (gameData.mode === 'fnv' || gameData.mode === 'fo3') {
    drawText(`${gameData.score} POINT(S)`, 3, W - 12 - gameData.score.toString().length)
  }
}

function drawGutter () {
  for (let i = 0; i < 16; i++) {
    drawText(' '.repeat(13), 20 - i, 40)
  }
  for (let i = 0; i < gameData.gutter.length; i++) {
    if (gameData.mode === 'fo4' || gameData.mode === 'fo76') {
      drawText(gameData.gutter[i].padEnd(13, ' '), 20 - i, 40)
    } else if (gameData.mode === 'fnv' || gameData.mode === 'fo3') {
      if (i > 14) { continue }
      drawText(gameData.gutter[i].padEnd(13, ' '), 19 - i, 40)
    }
  }
}

function drawEntry () {
  drawText(`>${gameData.entry.padEnd(12, ' ')}`, 21, 40, gameData.entry.length === 0 ? 0 : 0)
  $('.blinking').removeClass('blinking')
  setTimeout(() => {
    TABLE.find('tr').eq(21).find('td').eq(41 + gameData.entry.length).addClass('blinking')
  }, 0 * gameData.entry.length)
}

function drawAll (getScr = false) {
  drawHeaders()
  drawHex()
  drawAttempts()
  drawScore()
  if (getScr) { getScreenData() }
  findClosures()
  drawGutter()
  drawEntry()
}
// </region>

// <region> Game
function findClosures () {
  let closureNum = 0
  for (let s of getTableSplit()) {
    for (let li of s) {
      let tx = li.map(e => e.innerText).join('')
      const reg1 = /\([^A-Za-z]*\)/g
      const reg2 = /\[[^A-Za-z]*\]/g
      const reg3 = /\{[^A-Za-z]*\}/g
      const reg4 = /<[^A-Za-z]*>/g
      for (let reg of [reg1, reg2, reg3, reg4]) {
        let res
        while ((res = reg.exec(tx)) !== null) {
          let ind = res.index
          let end = ind + res[0].length - 1
          let sel = li.slice(ind, end + 1)
          $(li[ind]).addClass('closure-cap')
          $(li[end]).addClass('closure-cap')
          $(sel).attr('data-closure', closureNum++)
        }
      }
    }
  }
  $('.closure-cap').hover((ev) => {
    $(`[data-closure="${ev.target.dataset.closure}"]`).toggleClass('hovered')
    if (ev.type === 'mouseenter') {
      gameData.entry = $(`[data-closure="${ev.target.dataset.closure}"]`).text()
    }
  })
  $('.closure-cap').click((ev) => {
    useClosure(ev)
  })
}

function getScreenData () {
  let ret = new Array(12 * 17 * 2).fill(0)
  let wordCount = 0
  while (wordCount < gameData.wordBank.length) {
    ret = new Array(12 * 17 * 2).fill(0)
    wordCount = 0
    clearTable()
    fillTable()
    for (let i = 0; i < ret.length; i++) {
      if (ret[i] !== 0) { continue }
      if (Math.random() > 0.95 && wordCount < gameData.wordBank.length && i + gameData.difficulty < ret.length) {
        for (let j = 0; j < gameData.wordBank[wordCount].length; j++) {
          scrMap[i].dataset.word = gameData.wordBank[wordCount]
          scrMap[i].classList.add('word')
          scrMap[i++].innerText = gameData.wordBank[wordCount][j]
        }
        $(`[data-word="${gameData.wordBank[wordCount]}"]`).hover((ev) => {
          $(`[data-word="${ev.target.dataset.word}"]`).toggleClass('hovered')
          if (ev.type === 'mouseenter') {
            gameData.entry = $(`[data-word="${ev.target.dataset.word}"]`).text()
          }
        })
        $(`[data-word="${gameData.wordBank[wordCount]}"]`).click((ev) => {
          makeGuess(ev.target.dataset.word)
        })
        wordCount++
      }
      scrMap[i].innerText = junkBank.choose()
      scrMap[i].classList.add('content')
    }
  }

  return ret
}

function getTableSplit () {
  let ret = []
  for (let i = 0; i < 2; i++) {
    let side = []
    for (let j = 0; j < 17; j++) {
      side.push(scrMap.slice(12 * j + (12 * 17 * i), 12 * (j + 1) + (12 * 17 * i)))
    }
    ret.push(side)
  }
  return ret
}

function loseGame () {
  if (gameData.mode === 'fo4' || gameData.mode === 'fo76') {
    $('td').off().removeClass()
    if (gameData.gutter[0] !== '>Init lockout') { gameData.gutter = ['>Init lockout', ...gameData.gutter] }
  } else {
    clearTable()
    fillTable()
    drawText('TERMINAL LOCKED', 10, 19)
    drawText('PLEASE CONTACT AN ADMINISTRATOR', 12, 11)
  }
}

function makeGuess (w) {
  if (gameData.past.includes(w) || gameData.attempts === 0) { return 0 }
  playOtherKey('kenter')
  if (w === gameData.winWord) {
    if (gameData.mode === 'fo4' || gameData.mode === 'fo76') {
      gameData.gutter = ['>Entry clear', `>${w}`, ...gameData.gutter]
    } else {
      gameData.gutter = ['>is accessed.', '>while system', '>Please wait', '>Exact match!', `>${w}`, ...gameData.gutter]
    }
    gameData.score++
    playOtherKey('passgood')
    setTimeout(newGame, 2500)
  } else {
    playOtherKey('passbad')
    if (--gameData.attempts === 0) { return }
    if (gameData.mode === 'fo4' || gameData.mode === 'fo76') {
      gameData.gutter = [`>Likeness=${w.countMatches(gameData.winWord)}`, `>Entry denied`, `>${w}`, ...gameData.gutter]
    } else if (gameData.mode === 'fnv' || gameData.mode === 'fo3') {
      gameData.gutter = [`>${w.countMatches(gameData.winWord)}/${gameData.difficulty} correct.`, `>Entry denied`, `>${w}`, ...gameData.gutter]
    }
  }
  gameData.past.push(w)
}

function removeDud () {
  if (gameData.wordBank.length === 1) { return 0 }
  let dud
  do {
    dud = gameData.wordBank.choose()
  } while (gameData.winWord === dud)

  $(`[data-word="${dud}"]`).removeClass('word')
  $(`[data-word="${dud}"]`).addClass('content')
  $(`[data-word="${dud}"]`).text('.')
  $(`[data-word="${dud}"]`).attr('data-word', null)
  gameData.wordBank.splice(gameData.wordBank.indexOf(dud), 1)
}

function useClosure (ev) {
  let e = ev.target
  let closureNum = e.dataset.closure
  if (!closureNum) { return }
  let closureText = $(`[data-closure="${closureNum}"]`).text()
  playOtherKey('kenter')

  $(`[data-closure="${closureNum}"]`).removeClass('hovered')
  $(`[data-closure="${closureNum}"]`).attr('data-closure', null)
  if (Math.randomRange(0, 3) === 0) {
    gameData.attempts = 4
    if (gameData.mode === 'fo4' || gameData.mode === 'fo76') {
      gameData.gutter = ['>Tries Reset.', `>${closureText}`, ...gameData.gutter]
    } else if (gameData.mode === 'fnv' || gameData.mode === 'fo3') {
      gameData.gutter = ['>replenished.', '>Allowance', `>${closureText}`, ...gameData.gutter]
    }
  } else {
    removeDud()
    gameData.gutter = ['>Dud Removed.', `>${closureText}`, ...gameData.gutter]
  }
}
// </region>

// <region> Load
function changeMode () {
  $('html').attr('data-mode', gameData.mode)
  if (gameData.attempts === 0) {
    loseGame()
  } else {
    drawAll()
  }
}
function changeCRT () {
  $('#scanlines, #scrollers').remove()
  if (localStorage.crtEnabled === 'true') {
    $('body').append(`<div id="scrollers"></div><div id="scanlines"></div>`)
  }
}
function glowText () {
  if ($('#scrollers')[0] === undefined) { return }
  let mn = $('#scrollers').offset().top
  let mx = $('#scrollers').height() + mn
  $('td').css('text-shadow', '').filter((i, e) => {
    let ps = $(e).offset().top
    if (ps >= mn && ps <= mx) { return 1 }
  }).css('text-shadow', `${$('td').eq(0).css('color')} 0px 0px 5px`)
}
function newGame () {
  gameData.attempts = 4
  gameData.past = []
  gameData.entry = ''
  gameData.startHex = Math.randomRange(0, 65139)
  gameData.wordBank = gameData.diffBank.choose(gameData.numWords)

  drawAll(true)
}

clearTable()
fillTable()

gameData.score = 0
$('html').attr('data-mode', gameData.mode)
$('#modeChange').text(gameData.mode.toUpperCase())
$('#diffChange').text(gameData.difficulty)
$('#audioToggle').click(() => {
  localStorage.audioEnabled = localStorage.audioEnabled === 'true' ? 'false' : 'true'
})
$('#rstChange').click(() => {
  clearTable()
  fillTable()
  gameData.score = 0
  newGame()
  new window.Audio('sound/button.ogg').play()
})
$('#modeChange').click(() => {
  let ind = GAME_MODES.indexOf(gameData.mode) + 1
  ind %= GAME_MODES.length
  $('#modeChange').text(GAME_MODES[ind].toUpperCase())
  gameData.mode = GAME_MODES[ind]
  playOtherKey('button')
})
$('#diffChange').click(() => {
  gameData.difficulty = (gameData.difficulty - 3) % 6 + 4
  $('#diffChange').text(gameData.difficulty)
  newGame()
  playOtherKey('button')
})
$('#crtToggle').click(() => {
  localStorage.crtEnabled = localStorage.crtEnabled === 'true' ? 'false' : 'true'
  changeCRT()
  playOtherKey('button')
})
window.setInterval(glowText, 1000 / 20)
changeCRT()
newGame()
// </region>
