# Baby-Nuno FULL SET — canonical character layout (ASSET-WORKFLOW §3):
#   0 idle · 1 run step · 2 jump · 3 fall · 4 hurt · 5 death
#   6 power idle · 7 power run · 8 power jump   (red onesie = POWER)
Add-Type -AssemblyName System.Drawing

$palette = @{
  'O' = '#141210'; 'H' = '#8a5a33'; 'n' = '#a8743f'; 'G' = '#5e3a1f'
  'S' = '#f5c9a0'; 'L' = '#fcdfc0'; 'D' = '#d8a274'
  'W' = '#ffffff'; 'E' = '#101010'; 'b' = '#cfe6f2'
  'C' = '#2e8ee0'; 'u' = '#5db4f0'; 'k' = '#1c62a4'
  'P' = '#e5636e'; '+' = '#ff9eb5'; 'R' = '#c94a56'
  'T' = '#8a4f26'; 'm' = '#5e3517'; 'x' = '#f2a99b'
}
# POWER = same drawing, red onesie (classic palette-swap power-up)
$powerPalette = $palette.Clone()
$powerPalette['C'] = '#e04343'
$powerPalette['u'] = '#f47a6a'
$powerPalette['k'] = '#a52a2a'

# shared head+torso rows (y0-y19) — poses only change legs/face
$headTorso = @(
  '.......OOOOOOOO.........',
  '.....OOnnnnHHHHO........',
  '....OnnnnnHHHHHHO.......',
  '...OnnnnnnHHHHHHHO......',
  '...OnnnnnHHHHHHHHO......',
  '..OnnnnHHHHHGGLLSO......',
  '..OnnnHHHGGLOOOOSSO.....',
  '..OnnHHHGLSOWWEbOSO.....',
  '..OnHHHGSSSOWWEEOSSO....',
  '...OHHGSSSSOWWEEOSSO....',
  '...OHHGSSSSSOOOOSSO.....',
  '....OGSSSSSSSSSR+O......',
  '.....ODSSSSSSSSRPO......',
  '......OODDDDDDDOO.......',
  '........OuCCCCkO........',
  '.......OuuCCCCCkO.......',
  '.......OuCOSSCCkO.......',
  '.......OuCCOOCCkO.......',
  '.......OuCCCCCkkO.......',
  '.......OkCCOOCCkO.......'
)

function New-Pose($legs) { ,@($headTorso + $legs) }
function New-FacePose($faceRows, $legs) {
  # replace eye/mouth rows (y6-y12) on a copy of the base
  $map = @($headTorso + $legs)
  for ($i = 0; $i -lt $faceRows.Count; $i++) { $map[6 + $i] = $faceRows[$i] }
  ,$map
}

$idle = New-Pose @(
  '.......OCCO..OCCO.......',
  '.......OTTO..OTTO.......',
  '.......OTmO..OTmO.......',
  '.......OOOO..OOOO.......'
)
$run = New-Pose @(
  '.....OCCO.....OCCO......',
  '.....OTmO.....OTTO......',
  '......OO......OTmO......',
  '..............OOOO......'
)
# jump: feet tucked up under the body (nothing on the baseline row)
$jump = New-Pose @(
  '.......OTTO..OTTO.......',
  '.......OTmO..OTmO.......',
  '.......OOOO..OOOO.......',
  '........................'
)
# fall: legs spread, reaching for the ground
$fall = New-Pose @(
  '......OCCO....OCCO......',
  '......OTTO....OTTO......',
  '......OTmO....OTmO......',
  '......OOOO....OOOO......'
)
# hurt: eyes squeezed shut, extra blush
$hurt = New-FacePose @(
  '..OnnnHHHGGLSSSSSSO.....',
  '..OnnHHHGLSSSSSSSSO.....',
  '..OnHHHGSSSOOOOOSSO.....',
  '...OHHGSSSSSSxxSSSO.....',
  '...OHHGSSSSSSSSSSSO.....',
  '....OGSSSSSSSSSR+O......',
  '.....ODSSSSSSSSRPO......'
) @(
  '.......OCCO..OCCO.......',
  '.......OTTO..OTTO.......',
  '.......OTmO..OTmO.......',
  '.......OOOO..OOOO.......'
)
# death: X eyes, pacifier dropped, mouth open, legs splayed
$death = New-FacePose @(
  '..OnnnHHHGGLSSSSSSO.....',
  '..OnnHHHGLSESESSSSO.....',
  '..OnHHHGSSSSESSSSSSO....',
  '...OHHGSSSSESESSSSSO....',
  '...OHHGSSSSSSSSSSSO.....',
  '....OGSSSSSSSSSEEO......',
  '.....ODSSSSSSSSSSO......'
) @(
  '......OCCO....OCCO......',
  '......OTTO....OTTO......',
  '......OTmO....OTmO......',
  '......OOOO....OOOO......'
)

$cells = @(
  @{ x = 0;   map = $idle; pal = $palette },
  @{ x = 24;  map = $run;  pal = $palette },
  @{ x = 48;  map = $jump; pal = $palette },
  @{ x = 72;  map = $fall; pal = $palette },
  @{ x = 96;  map = $hurt; pal = $palette },
  @{ x = 120; map = $death; pal = $palette },
  @{ x = 144; map = $idle; pal = $powerPalette },
  @{ x = 168; map = $run;  pal = $powerPalette },
  @{ x = 192; map = $jump; pal = $powerPalette }
)

foreach ($c in $cells) {
  if ($c.map.Count -ne 24) { throw "cell x$($c.x): $($c.map.Count) rows, want 24" }
  for ($i = 0; $i -lt 24; $i++) {
    if ($c.map[$i].Length -ne 24) { throw "cell x$($c.x) row $i has $($c.map[$i].Length) cols" }
  }
}

$sheetPath = "c:\Users\nunom\Documents\Projetos\Super-Nuno\public\assets\packs\world-1\character-nuno.png"
$src = New-Object System.Drawing.Bitmap($sheetPath)
$out = New-Object System.Drawing.Bitmap $src.Width, $src.Height
$g0 = [System.Drawing.Graphics]::FromImage($out)
$g0.DrawImage($src, 0, 0, $src.Width, $src.Height)
$g0.Dispose()

function Set-Cell($bmp, $cellX, $map, $pal) {
  for ($y = 0; $y -lt 24; $y++) {
    for ($x = 0; $x -lt 24; $x++) {
      $ch = $map[$y][$x]
      if ($ch -eq '.') {
        $bmp.SetPixel($cellX + $x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      } else {
        if (-not $pal.ContainsKey([string]$ch)) { throw "unknown palette key '$ch'" }
        $c = [System.Drawing.ColorTranslator]::FromHtml($pal[[string]$ch])
        $bmp.SetPixel($cellX + $x, $y, $c)
      }
    }
  }
}

foreach ($c in $cells) { Set-Cell $out $c.x $c.map $c.pal }

$sp = "C:\Users\nunom\AppData\Local\Temp\claude\c--Users-nunom-Documents-Projetos-Super-Nuno\91dff0c7-cd64-40b3-92e5-23d21e03b365\scratchpad"
$out.Save("$sp\baby-set.png")

# 8x preview of cells 0-8 (216px wide)
$prev = New-Object System.Drawing.Bitmap (216 * 8), (24 * 8)
$g = [System.Drawing.Graphics]::FromImage($prev)
$g.InterpolationMode = 'NearestNeighbor'
$g.PixelOffsetMode = 'Half'
$g.DrawImage($out, (New-Object System.Drawing.Rectangle 0, 0, (216 * 8), (24 * 8)), (New-Object System.Drawing.Rectangle 0, 0, 216, 24), [System.Drawing.GraphicsUnit]::Pixel)
$prev.Save("$sp\baby-set-8x.png")
$g.Dispose(); $prev.Dispose(); $out.Dispose(); $src.Dispose()
'painted full set'
