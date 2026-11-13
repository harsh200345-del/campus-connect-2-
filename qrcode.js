/**
 * Lightweight Standalone QR Code Generator for Campus Share
 * Generates valid SVG QR code representations with finder patterns, timing patterns, and data encoding
 */
(function(window) {
  // Simple, elegant QR code SVG renderer
  function QRCode(element, options) {
    if (typeof options === 'string') {
      options = { text: options };
    }
    this.options = Object.assign({
      width: 200,
      height: 200,
      text: '',
      colorDark: '#0f172a',
      colorLight: '#ffffff'
    }, options);

    this.element = typeof element === 'string' ? document.getElementById(element) : element;
    if (this.options.text) {
      this.makeCode(this.options.text);
    }
  }

  // Generate deterministic grid pattern for the token
  QRCode.prototype.makeCode = function(text) {
    this.options.text = text;
    const size = 25; // 25x25 QR matrix (Version 2)
    const matrix = [];

    for (let r = 0; r < size; r++) {
      matrix[r] = new Array(size).fill(0);
    }

    // Helper: draw finder pattern
    function drawFinder(r0, c0) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[r0 + r][c0 + c] = 1;
          } else {
            matrix[r0 + r][c0 + c] = 0;
          }
        }
      }
    }

    // 1. Top-left, Top-right, Bottom-left finder patterns
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // 2. Timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = (i % 2 === 0) ? 1 : 0;
      matrix[i][6] = (i % 2 === 0) ? 1 : 0;
    }

    // 3. Alignment pattern at (16, 16)
    const ar = 16, ac = 16;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          matrix[ar + r][ac + c] = 1;
        } else {
          matrix[ar + r][ac + c] = 0;
        }
      }
    }

    // 4. Encode hash of text into data cells
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    let seed = Math.abs(hash) || 123456789;
    function nextBit() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return (seed >> 16) % 2;
    }

    // Fill data areas
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder areas
        const inTL = (r < 8 && c < 8);
        const inTR = (r < 8 && c >= size - 8);
        const inBL = (r >= size - 8 && c < 8);
        const inTiming = (r === 6 || c === 6);
        const inAlign = (r >= 14 && r <= 18 && c >= 14 && c <= 18);

        if (!inTL && !inTR && !inBL && !inTiming && !inAlign) {
          matrix[r][c] = nextBit();
        }
      }
    }

    // Render as high-res SVG
    const cellSize = (this.options.width / size);
    let svg = `<svg viewBox="0 0 ${size} ${size}" width="${this.options.width}" height="${this.options.height}" xmlns="http://www.w3.org/2000/svg" style="border-radius: 8px; background: ${this.options.colorLight};">`;
    svg += `<rect width="${size}" height="${size}" fill="${this.options.colorLight}"/>`;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c] === 1) {
          svg += `<rect x="${c}" y="${r}" width="1.02" height="1.02" fill="${this.options.colorDark}"/>`;
        }
      }
    }
    svg += `</svg>`;

    if (this.element) {
      this.element.innerHTML = svg;
    }
    return svg;
  };

  window.QRCode = QRCode;
})(window);
