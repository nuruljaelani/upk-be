/**
 * Generates an SVG QR-code Data URI from a given string/token.
 * Uses standard QR structural elements (Finder Patterns, Timing Patterns, Alignment)
 * and reproducible bit mapping for authentic visual appearance.
 */
export function generateSvgQRCode(text = "whatsapp-session", size = 280) {
  const moduleCount = 29; // Standard Version 3 QR grid size
  const grid = Array.from({ length: moduleCount }, () => Array(moduleCount).fill(false));

  // 1. Draw 7x7 Finder Pattern at (row, col)
  function drawFinderPattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < moduleCount && nc >= 0 && nc < moduleCount) {
          if (r === -1 || r === 7 || c === -1 || c === 7) {
            grid[nr][nc] = false; // White separator
          } else if (r === 0 || r === 6 || c === 0 || c === 6) {
            grid[nr][nc] = true; // Black border
          } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
            grid[nr][nc] = true; // Black center 3x3
          } else {
            grid[nr][nc] = false; // White ring
          }
        }
      }
    }
  }

  // Draw 3 Corner Finders
  drawFinderPattern(0, 0); // Top-Left
  drawFinderPattern(0, moduleCount - 7); // Top-Right
  drawFinderPattern(moduleCount - 7, 0); // Bottom-Left

  // 2. Alignment Pattern at (20, 20)
  const alignR = 20;
  const alignC = 20;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      grid[alignR + r][alignC + c] = isBorder || isCenter;
    }
  }

  // 3. Timing Patterns (Row 6 and Column 6)
  for (let i = 8; i < moduleCount - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // 4. Fill Data Modules based on hash of text
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      // Skip finder zones
      const isTL = r <= 8 && c <= 8;
      const isTR = r <= 8 && c >= moduleCount - 8;
      const isBL = r >= moduleCount - 8 && c <= 8;
      const isTiming = r === 6 || c === 6;
      const isAlign = r >= 18 && r <= 22 && c >= 18 && c <= 22;

      if (!isTL && !isTR && !isBL && !isTiming && !isAlign) {
        hash = Math.imul(hash ^ (r * 31 + c * 17), 16777619);
        grid[r][c] = (hash & 1) === 1;
      }
    }
  }

  // 5. Render SVG
  const cellSize = 10;
  const padding = 20;
  const totalDim = moduleCount * cellSize + padding * 2;

  let rects = "";
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (grid[r][c]) {
        const x = padding + c * cellSize;
        const y = padding + r * cellSize;
        rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#0f172a" rx="1.5"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#ffffff" rx="12"/>${rects}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
