import { Platform } from 'react-native';

export const BACKGROUND_OPTIONS = [
  { id: 'navy', color: '#1B1B3A', type: 'color', label: 'Navy' },
  { id: 'parchment', color: '#F5E6CC', type: 'color', label: 'Parchment' },
  { id: 'burgundy', color: '#4A0E0E', type: 'color', label: 'Burgundy' },
  { id: 'stone', url: 'https://images.unsplash.com/photo-1517867065801-e20f409696b0?q=80&w=1080', type: 'image', label: 'Stone' },
  { id: 'ancient', url: 'https://images.unsplash.com/photo-1524334228333-0f6db392f8a1?q=80&w=1080', type: 'image', label: 'Ancient' },
  { id: 'mountain', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080', type: 'image', label: 'Mountain' },
  { id: 'nebula', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=1080', type: 'image', label: 'Nebula' },
  { id: 'forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1080', type: 'image', label: 'Forest' },
  { id: 'sunset', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1080', type: 'image', label: 'Sunset' },
  { id: 'ocean', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1080', type: 'image', label: 'Ocean' },
  { id: 'stars', url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=1080', type: 'image', label: 'Stars' },
  { id: 'sunrise', url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=1080', type: 'image', label: 'Sunrise' },
  { id: 'snow', url: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=1080', type: 'image', label: 'Snow' },
  { id: 'desert', url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=1080', type: 'image', label: 'Desert' },
  { id: 'autumn', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1080', type: 'image', label: 'Autumn' },
  { id: 'canyon', url: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?q=80&w=1080', type: 'image', label: 'Canyon' },
  { id: 'waterfall', url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1080', type: 'image', label: 'Waterfall' },
  { id: 'meadow', url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=1080', type: 'image', label: 'Meadow' },
  { id: 'lavender', url: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?q=80&w=1080', type: 'image', label: 'Lavender' },
  { id: 'road', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080', type: 'image', label: 'Road' },
  { id: 'wheat', url: 'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?q=80&w=1080', type: 'image', label: 'Wheat' },
  { id: 'garden', url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1080', type: 'image', label: 'Garden' },
  { id: 'cliff', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1080', type: 'image', label: 'Cliff' },
  { id: 'island', url: 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?q=80&w=1080', type: 'image', label: 'Island' },
];

export const FONT_OPTIONS = [
  { id: 'serif', label: 'Serif', family: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  { id: 'sans', label: 'Modern', family: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif' },
  { id: 'condensed', label: 'Compact', family: Platform.OS === 'ios' ? 'AvenirNext-Condensed' : 'sans-serif-condensed' },
  { id: 'light', label: 'Light', family: Platform.OS === 'ios' ? 'Helvetica-Light' : 'sans-serif-light' },
  { id: 'italic', label: 'Elegant', family: Platform.OS === 'ios' ? 'Baskerville-Italic' : 'serif', style: 'italic' },
  { id: 'monospace', label: 'Typewriter', family: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  { id: 'playfair', label: 'Classic', family: Platform.OS === 'ios' ? 'Hoefler Text' : 'serif' },
  { id: 'marker', label: 'Marker', family: Platform.OS === 'ios' ? 'Marker Felt' : 'sans-serif-medium' },
  { id: 'papyrus', label: 'Ancient', family: Platform.OS === 'ios' ? 'Papyrus' : 'serif', style: 'italic' },
  { id: 'noteworthy', label: 'Handwriting', family: Platform.OS === 'ios' ? 'Noteworthy' : 'sans-serif-light' },
];

export const TEXT_COLOR_OPTIONS = [
  { id: 'white', color: '#FFFFFF', label: 'White' },
  { id: 'black', color: '#000000', label: 'Black' },
  { id: 'gold', color: '#D4AF37', label: 'Gold' },
  { id: 'navy', color: '#1B1B3A', label: 'Navy' },
  { id: 'cream', color: '#F5E6CC', label: 'Cream' },
  { id: 'burgundy', color: '#4A0E0E', label: 'Burgundy' },
];
