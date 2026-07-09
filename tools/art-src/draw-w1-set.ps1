# World-1 art set (Phase 9 Stage A) — all sheets for the world-1 pack:
#   w1.png        18x18 x8: giftQ, giftUsed, milk, pacifier,
#                           calcada-top, calcada-fill, braga-top, braga-fill
#   w1-enemy.png  24x24 x3: wind-up toy walk1, walk2, squashed
#   w1-dog.png    24x24 x2: puppy sit, tail-wag
#   w1-skyline.png 24x24 x4: Lisbon silhouette (bridge + Belem tower)
Add-Type -AssemblyName System.Drawing

function New-Sheet($w, $h) { New-Object System.Drawing.Bitmap $w, $h }

# PS hash literals are case-INsensitive; pixel palettes need 'B' and 'b'
# to be different keys — so build ordinal (case-sensitive) tables.
function New-Pal($pairs) {
  $d = [hashtable]::new(0, [System.StringComparer]::Ordinal)
  for ($i = 0; $i -lt $pairs.Count; $i += 2) { $d[$pairs[$i]] = $pairs[$i + 1] }
  return $d
}
function Set-Px($bmp, $x, $y, $hex) {
  $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
  $bmp.SetPixel($x, $y, $c)
}
function Paint-Map($bmp, $cellX, $size, $map, $pal) {
  if ($map.Count -ne $size) { throw "map rows $($map.Count) != $size" }
  for ($y = 0; $y -lt $size; $y++) {
    if ($map[$y].Length -ne $size) { throw "row $y cols $($map[$y].Length) != $size" }
    for ($x = 0; $x -lt $size; $x++) {
      $ch = $map[$y][$x]
      if ($ch -eq '.') { continue }
      if (-not $pal.ContainsKey([string]$ch)) { throw "unknown key '$ch'" }
      Set-Px $bmp ($cellX + $x) $y $pal[[string]$ch]
    }
  }
}

$out = "c:\Users\nunom\Documents\Projetos\Super-Nuno\public\assets\packs\world-1"
$sp = "C:\Users\nunom\AppData\Local\Temp\claude\c--Users-nunom-Documents-Projetos-Super-Nuno\91dff0c7-cd64-40b3-92e5-23d21e03b365\scratchpad"

# ============================================================ w1.png (18px)
$w1 = New-Sheet (18 * 8) 18

# --- cells 4-7: calcada + braga terrain, PROCEDURAL (3x3 cobbles, offset
# rows like real pavement; a diagonal of dark basalt = the wave motif)
function Draw-Cobbles($bmp, $cellX, $light, $base, $gap, $accent, $topEdge) {
  for ($y = 0; $y -lt 18; $y++) {
    for ($x = 0; $x -lt 18; $x++) { Set-Px $bmp ($cellX + $x) $y $gap }
  }
  for ($row = 0; $row -lt 6; $row++) {
    $offset = if ($row % 2) { 2 } else { 0 }
    for ($col = -1; $col -lt 7; $col++) {
      $sx = $col * 3 + $offset
      $sy = $row * 3
      # basalt accent along a soft diagonal (the calcada wave)
      $isAccent = ((($col + $row) % 5) -eq 0)
      $stone = if ($isAccent -and $accent) { $accent } else { $base }
      $hi = if ($isAccent -and $accent) { $accent } else { $light }
      for ($dy = 0; $dy -lt 2; $dy++) {
        for ($dx = 0; $dx -lt 2; $dx++) {
          $px = $sx + $dx; $py = $sy + $dy
          if ($px -ge 0 -and $px -lt 18 -and $py -lt 18) {
            $c = if ($dy -eq 0 -and $dx -eq 0) { $hi } else { $stone }
            Set-Px $bmp ($cellX + $px) $py $c
          }
        }
      }
    }
  }
  if ($topEdge) {
    for ($x = 0; $x -lt 18; $x++) { Set-Px $bmp ($cellX + $x) 0 $topEdge }
  }
}
# calcada: limestone white + basalt wave, sunlit top edge
Draw-Cobbles $w1 (18 * 4) '#f2eedd' '#ddd8c4' '#b9b4a0' '#4e4e5a' '#fcf8ea'
# calcada fill: same stone, dimmer, no accent (below the surface)
Draw-Cobbles $w1 (18 * 5) '#c9c4b0' '#b5b09c' '#948f7c' $null $null
# braga granite: cool grey with moss-green accent stones
Draw-Cobbles $w1 (18 * 6) '#cfd4d2' '#b4bcba' '#8e9694' '#5e7a5a' '#e0e6e4'
# braga fill
Draw-Cobbles $w1 (18 * 7) '#a8aeac' '#959c9a' '#767d7b' $null $null

# --- cell 0: gift-box ? block (red, cream ribbon, gold ?)
$giftPal = New-Pal @(
  'O', '#3a1616', 'R', '#d5484f', 'r', '#a83238', 'H', '#ef6d6d',
  'C', '#ffe9b8', 'c', '#e0c489', 'Q', '#ffd23e'
)
$giftQ = @(
  '..................',
  '..................',
  '......OO..OO......',
  '.....OCCOOCCO.....',
  '.....OCCCCCCO.....',
  '..OOOOOCCCCOOOOO..',
  '..OHRRRRCCRRRRRO..',
  '..ORRRRRCCRRRRrO..',
  '..OCCCCCCCCCCCCO..',
  '..ORRRRRCCRRRRrO..',
  '..ORRQQRCCRQQRrO..',
  '..ORQQQQCCQQQQrO..',
  '..ORRQQRCCRQQRrO..',
  '..ORRRRRCCRRRRrO..',
  '..ORRRRRCCRRRRrO..',
  '..OrRRRRCCRRRRrO..',
  '..OrrrrrCCrrrrrO..',
  '..OOOOOOOOOOOOOO..'
)
Paint-Map $w1 0 18 $giftQ $giftPal
# --- cell 1: opened gift (lid ajar, grey inside = used)
$giftUsed = @(
  '..................',
  '..................',
  '..................',
  '..................',
  '..OOOOOOOOOOOOOO..',
  '..OccccccccccccO..',
  '..OcOOOOOOOOOOcO..',
  '..OcOOOOOOOOOOcO..',
  '..OrRRRRCCRRRRrO..',
  '..ORRRRRCCRRRRrO..',
  '..OCCCCCCCCCCCCO..',
  '..ORRRRRCCRRRRrO..',
  '..ORRRRRCCRRRRrO..',
  '..ORRRRRCCRRRRrO..',
  '..ORRRRRCCRRRRrO..',
  '..OrRRRRCCRRRRrO..',
  '..OrrrrrCCrrrrrO..',
  '..OOOOOOOOOOOOOO..'
)
Paint-Map $w1 18 18 $giftUsed $giftPal

# --- cell 2: milk bottle (grow item)
$milkPal = New-Pal @(
  'O', '#2c3644', 'W', '#fbfbf6', 'w', '#e4e6de', 's', '#c8ccc4',
  'B', '#5b9bd5', 'b', '#3d719f'
)
$milk = @(
  '......OOOOOO......',
  '......OBBBbO......',
  '......OBBBbO......',
  '......OwWWsO......',
  '......OwWWsO......',
  '.....OwWWWWsO.....',
  '....OwWWWWWWsO....',
  '...OwWWWWWWWWsO...',
  '...OwWWWWWWWWsO...',
  '...OwWWWWWWWWsO...',
  '...OwWWWWWWWWsO...',
  '...OwWWWWWWWWsO...',
  '...OwWWWWWWWWsO...',
  '...OwWWWWWWWWsO...',
  '...OwWWWWWWWWsO...',
  '...OswWWWWWWssO...',
  '....OOOOOOOOOO....',
  '..................'
)
Paint-Map $w1 36 18 $milk $milkPal

# --- cell 3: pacifier (power item)
$paciPal = New-Pal @(
  'O', '#4a1f2e', 'P', '#ff8db0', 'p', '#de6a92', 'W', '#ffd7e4', 'T', '#ffb8cd'
)
$paci = @(
  '..................',
  '.......OOOO.......',
  '......OTTTTO......',
  '......OTTTTO......',
  '.....OOTTTTOO.....',
  '....OPPWPPPPPO....',
  '...OPPWWPPPPPpO...',
  '...OPWWPPPPPPpO...',
  '...OPPPPPPPPPpO...',
  '...OPPPPPPPPPpO...',
  '....OPPPPPPPpO....',
  '.....OOPPPPOO.....',
  '......OOOOOO......',
  '.....OPP..PPO.....',
  '....OP......PO....',
  '....OP......PO....',
  '.....OPPPPPPO.....',
  '......OOOOOO......'
)
Paint-Map $w1 54 18 $paci $paciPal

$w1.Save("$out\w1.png")
$w1.Dispose()

# ====================================================== w1-enemy.png (24px)
$enemyPal = New-Pal @(
  'O', '#1d1a24', 'T', '#3fb0c0', 't', '#2a7f8e', 'n', '#7fd4de',
  'C', '#f2e3c2', 'c', '#d6c193', 'K', '#c8cdd6', 'k', '#8c93a2',
  'E', '#101010', 'W', '#ffffff', 'R', '#e05555'
)
# wind-up toy, facing LEFT (walkers start walking left)
$toy1 = @(
  '........................',
  '........................',
  '.......OOOOOO...........',
  '......OCCCCCCO..........',
  '.....OCCWECCCCO.........',
  '.....OCCWECCCCO.........',
  '.....OCCCCCCCCO.........',
  '......OCCRRCCO..........',
  '.....OOOOOOOOOO.........',
  '....OTnTTTTTTTOOOO......',
  '....OTnTTTTTTTOKKO......',
  '....OTnTTTTTTTOOKKO.....',
  '....OTTTTTTTTTOKKO......',
  '....OTTTTTTTTTOOOO......',
  '....OtTTTTTTTtO.........',
  '....OtttttttttO.........',
  '.....OOOOOOOOO..........',
  '.....OKKO..OKKO.........',
  '.....OKKO..OKKO.........',
  '.....OkkO..OkkO.........',
  '.....OOOO..OOOO.........',
  '........................',
  '........................',
  '........................'
)
$toy2 = @(
  '........................',
  '........................',
  '.......OOOOOO...........',
  '......OCCCCCCO..........',
  '.....OCCWECCCCO.........',
  '.....OCCWECCCCO.........',
  '.....OCCCCCCCCO.........',
  '......OCCRRCCO..........',
  '.....OOOOOOOOOO.........',
  '....OTnTTTTTTTOOOO......',
  '....OTnTTTTTTTOKKO......',
  '....OTnTTTTTTTOOKKO.....',
  '....OTTTTTTTTTOKKO......',
  '....OTTTTTTTTTOOOO......',
  '....OtTTTTTTTtO.........',
  '....OtttttttttO.........',
  '.....OOOOOOOOO..........',
  '...OKKO......OKKO.......',
  '...OKKO......OKKO.......',
  '...OkkO......OkkO.......',
  '...OOOO......OOOO.......',
  '........................',
  '........................',
  '........................'
)
$toySquash = @(
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '....OOOOOOOOOOOO........',
  '...OCCWECCCCRRCOOOO.....',
  '...OTnTTTTTTTTTOKKO.....',
  '...OtttttttttttOOOO.....',
  '....OOOOOOOOOOOO........',
  '....OKKO....OKKO........',
  '....OkkO....OkkO........',
  '....OOOO....OOOO........',
  '........................',
  '........................'
)
$enemy = New-Sheet (24 * 3) 24
Paint-Map $enemy 0 24 $toy1 $enemyPal
Paint-Map $enemy 24 24 $toy2 $enemyPal
Paint-Map $enemy 48 24 $toySquash $enemyPal
$enemy.Save("$out\w1-enemy.png")
$enemy.Dispose()

# ======================================================== w1-dog.png (24px)
$dogPal = New-Pal @(
  'O', '#241812', 'B', '#a8764a', 'b', '#8a5a33', 'L', '#c9975f',
  'E', '#141414', 'W', '#ffffff', 'N', '#3a2a20', 'P', '#e8a0a8'
)
# puppy sitting, facing LEFT (toward arriving Nuno)
$dog1 = @(
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '.....OO.....OO..........',
  '....ObbO...ObbO.........',
  '....ObBBOOOBBbO.........',
  '....OBBBBBBBBBO.........',
  '...OBEWBBBBWEBO.........',
  '...OBEEBBBBEEBO.........',
  '...OBBBBNNBBBBO.........',
  '....OBBBNNBBBO..........',
  '....OLBBBBBBLO..........',
  '.....OOBBBBOO...........',
  '......OBBBBBOO..........',
  '.....OBBBBBBBBO....OO...',
  '....OBBBBBBBBBO...ObO...',
  '....OBBBBBBBBBBO..ObO...',
  '....OBBBBBBBBBBOOObO....',
  '....OBBOBBBBOBBObbO.....',
  '....OLLO.OLLOOOOO.......',
  '....OOOO.OOOO...........',
  '........................'
)
# tail up (wag frame)
$dog2 = @(
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '.....OO.....OO..........',
  '....ObbO...ObbO.........',
  '....ObBBOOOBBbO.........',
  '....OBBBBBBBBBO.........',
  '...OBEWBBBBWEBO.........',
  '...OBEEBBBBEEBO.........',
  '...OBBBBNNBBBBO.........',
  '....OBBBNNBBBO....Ob....',
  '....OLBBBBBBLO....ObO...',
  '.....OOBBBBOO.....ObO...',
  '......OBBBBBOO....bO....',
  '.....OBBBBBBBBO..ObO....',
  '....OBBBBBBBBBO.ObO.....',
  '....OBBBBBBBBBBOOO......',
  '....OBBBBBBBBBBO........',
  '....OBBOBBBBOBBO........',
  '....OLLO.OLLO...........',
  '....OOOO.OOOO...........',
  '........................'
)
$dog = New-Sheet (24 * 2) 24
Paint-Map $dog 0 24 $dog1 $dogPal
Paint-Map $dog 24 24 $dog2 $dogPal
$dog.Save("$out\w1-dog.png")
$dog.Dispose()

# ===================================================== w1-skyline.png (24px)
# Lisbon silhouette strip, 4 cells: bridge tower / bridge deck+cables /
# Torre de Belem / low city roofs. Single dark tone, sits behind gameplay.
$skyPal = New-Pal @('S', '#2e3f6e', 's', '#3d5288')
$sky0 = @(  # 25 de Abril tower
  '........................',
  '..........ss............',
  '..........SS............',
  '..........SS............',
  '.........sSSs...........',
  '.........SSSS...........',
  '........sSSSSs..........',
  '.........SSSS...........',
  '.........SSSS...........',
  '........sSSSSs..........',
  '........SS..SS..........',
  '........SS..SS..........',
  '........SS..SS..........',
  '........SS..SS..........',
  '........SS..SS..........',
  '.......sSS..SSs.........',
  '.......SSS..SSS.........',
  '.......SSS..SSS.........',
  '.......SSS..SSS.........',
  '......sSSS..SSSs........',
  '......SSSS..SSSS........',
  '......SSSS..SSSS........',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS'
)
$sky1 = @(  # cables sweeping down to the deck
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  's.......................',
  'Ss......................',
  '.Ss.....................',
  '..Ss....................',
  '...Ss...................',
  '....Ss..................',
  '.....Ss.................',
  '......Sss...............',
  '.......SSss.............',
  '.........SSss...........',
  '...........SSsss........',
  '..............SSSsss....',
  '.................SSSSsss',
  '........................',
  '........................',
  '........................',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  '........................'
)
$sky2 = @(  # Torre de Belem: crown turrets + body
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '......s..s..s..s........',
  '......S..S..S..S........',
  '......SSSSSSSSSS........',
  '......SSSSSSSSSS........',
  '.......SSSSSSSS.........',
  '.......SSSSSSSS.........',
  '.......SSSSSSSS.........',
  '.......SSSSSSSS.........',
  '......SSSSSSSSSS........',
  '......SSSSSSSSSS........',
  '.....SSSSSSSSSSSS.......',
  '.....SSSSSSSSSSSS.......',
  '.....SSSSSSSSSSSS.......',
  '....SSSSSSSSSSSSSS......',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  '........................'
)
$sky3 = @(  # low alfama roofs
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '.....ss.................',
  '....sSSs......ss........',
  '...sSSSSs....sSSs.......',
  '..SSSSSSSS..sSSSSs......',
  '.SSSSSSSSSSSSSSSSSS.....',
  'SSSSSSSSSSSSSSSSSSSSss..',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
  '........................'
)
$skyline = New-Sheet (24 * 4) 24
Paint-Map $skyline 0 24 $sky0 $skyPal
Paint-Map $skyline 24 24 $sky1 $skyPal
Paint-Map $skyline 48 24 $sky2 $skyPal
Paint-Map $skyline 72 24 $sky3 $skyPal
$skyline.Save("$out\w1-skyline.png")
$skyline.Dispose()

# ------------------------------------------------------------- previews
function Save-Preview($srcPath, $dest, $zoom) {
  $img = [System.Drawing.Image]::FromFile($srcPath)
  $prev = New-Object System.Drawing.Bitmap ($img.Width * $zoom), ($img.Height * $zoom)
  $g = [System.Drawing.Graphics]::FromImage($prev)
  $g.InterpolationMode = 'NearestNeighbor'
  $g.PixelOffsetMode = 'Half'
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $prev.Width, $prev.Height),
    (New-Object System.Drawing.Rectangle 0, 0, $img.Width, $img.Height),
    [System.Drawing.GraphicsUnit]::Pixel)
  $prev.Save($dest)
  $g.Dispose(); $prev.Dispose(); $img.Dispose()
}
Save-Preview "$out\w1.png" "$sp\w1-prev.png" 8
Save-Preview "$out\w1-enemy.png" "$sp\w1-enemy-prev.png" 8
Save-Preview "$out\w1-dog.png" "$sp\w1-dog-prev.png" 8
Save-Preview "$out\w1-skyline.png" "$sp\w1-skyline-prev.png" 6
'painted world-1 set'
