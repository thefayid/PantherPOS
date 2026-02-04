
// Deterministic color generator based on string
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Generate a contrasting text color (black or white)
const getContrastColor = (hexcolor: string) => {
    // If a leading # is provided, remove it
    if (hexcolor.slice(0, 1) === '#') {
        hexcolor = hexcolor.slice(1);
    }

    // Convert to RGB value
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    // Get YIQ ratio
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Check contrast
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

export const generatePlaceholder = (text: string, width: number = 500, height: number = 500): string => {
    if (!text) return '';

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    // specific handling for "Test Product" or common short names if needed, but hash works well.
    const bgColor = stringToColor(text);
    const textColor = getContrastColor(bgColor);

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Text (Initials)
    const initials = text
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Text Style
    ctx.fillStyle = textColor;
    ctx.font = `bold ${width / 2.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw Text
    ctx.fillText(initials, width / 2, height / 2);

    return canvas.toDataURL('image/png');
};
