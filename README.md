# 🎄 Christmas Magic - Ultimate Christmas Website

A beautiful, interactive Christmas website with multiple features including card creation, advent calendar, personality quiz, sock hanging game, gift exchange generator, and festive games.

## Features

### ✉️ Card Maker
- Create custom Christmas cards with templates
- Add decorations and customize colors
- Adjustable text size
- Download or email cards
- Track total cards created and daily stats

### 🎁 Advent Calendar
- 24 doors with daily surprises
- Facts, jokes, traditions, and messages
- Progress tracking
- Opens one door per day

### 🎭 Personality Quiz
- Discover your Christmas character
- Share results as images
- Multiple character types (Santa, Elf, Snowman, Reindeer)

### 🧦 Sock Hanging
- Hang socks on a global map
- Real-time feed of all socks
- Country rankings
- Share your sock with custom images
- Interactive Leaflet map with geolocation
- Filter and search functionality

### 🎁 Gift Exchange Generator
- Secret Santa pair generator
- Add multiple participants
- Random pairing algorithm

### 🎮 Games
- **Christmas Trivia**: Test your knowledge
- **Memory Game**: Match Christmas symbols
- **Word Search**: Find Christmas words

### 🎵 Additional Features
- Christmas countdown timer
- Animated snow background
- Sound effects toggle
- Music player (optional)
- Mobile-optimized with swipe navigation
- Stats tracking across all features

## Technologies Used

- **HTML5**: Semantic structure
- **CSS3**: Modern styling with glassmorphism, animations, responsive design
- **JavaScript**: Interactive functionality, localStorage, Canvas API
- **Leaflet.js**: Interactive maps
- **html2canvas**: Image generation for sharing

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### Simple Deployment (Static Hosting)

1. **Upload all files** to your hosting service:
   - `index.html`
   - `styles.css`
   - `script.js`

2. **No build process required** - works directly in browser

3. **Recommended hosting services**:
   - GitHub Pages
   - Netlify
   - Vercel
   - Firebase Hosting
   - Any static file hosting

### GitHub Pages Deployment

```bash
# Clone or upload your files to a GitHub repository
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/christmas-magic.git
git push -u origin main

# Enable GitHub Pages in repository settings
# Select main branch as source
```

### Netlify Deployment

1. Drag and drop the folder containing all files
2. Or connect your GitHub repository
3. Deploy automatically

### Local Development

Simply open `index.html` in a web browser. No server required for basic functionality.

**Note**: Some features (like geolocation) require HTTPS in production.

## File Structure

```
christmas/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # All JavaScript functionality
└── README.md           # This file
```

## Features Details

### Data Persistence
- Uses `localStorage` to save:
  - Opened advent calendar doors
  - User statistics
  - Sock data and rankings
  - Quiz results

### Responsive Design
- Mobile-first approach
- Touch gestures for mobile
- Swipe navigation between sections
- Optimized layouts for all screen sizes

### Performance
- Lazy loading for map
- Optimized animations
- Efficient DOM manipulation
- Error handling throughout

## Customization

### Change Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --christmas-red: #C8102E;
    --christmas-green: #0F5132;
    --christmas-gold: #FFB81C;
}
```

### Add Music
Update the `christmasSongs` array in `script.js` with actual music URLs.

### Modify Content
- Advent calendar content: Edit `adventContent` object
- Quiz questions: Edit `quizQuestions` array
- Quiz results: Edit `quizResults` object

## License

Free to use and modify for personal or commercial projects.

## Contact

Email: dkxlvm22@gmail.com

---

Made with ❤️ and 🎄 for Christmas 2024

