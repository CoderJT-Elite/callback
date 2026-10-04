import fs from 'fs';
import path from 'path';

const FONT_FACE_BLOCK = `
        @font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 400; src: url('assets/fonts/IBMPlexMono-Regular.ttf') format('truetype'); }
        @font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 700; src: url('assets/fonts/IBMPlexMono-Bold.ttf') format('truetype'); }
        @font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 400; src: url('assets/fonts/IBMPlexSans-Regular.ttf') format('truetype'); }
        @font-face { font-family: 'IBM Plex Sans'; font-style: normal; font-weight: 600; src: url('assets/fonts/IBMPlexSans-SemiBold.ttf') format('truetype'); }
        @font-face { font-family: 'Newsreader'; font-style: normal; font-weight: 400; src: url('assets/fonts/Newsreader-Regular.ttf') format('truetype'); }
        @font-face { font-family: 'Newsreader'; font-style: normal; font-weight: 600; src: url('assets/fonts/Newsreader-SemiBold.ttf') format('truetype'); }
`;

const dir = path.resolve(import.meta.dirname, '../compositions');
fs.readdirSync(dir).forEach(file => {
  if (!file.endsWith('.html')) return;
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  if (!content.includes("@font-face { font-family: 'IBM Plex Sans'")) {
    content = content.replace(/<style>/, `<style>${FONT_FACE_BLOCK}`);
    // Also remove the redundant link tag if present
    content = content.replace(/<link rel="stylesheet" href="assets\/fonts\/fonts\.css" \/>\s*/g, '');
    fs.writeFileSync(fp, content, 'utf8');
    console.log('Inlined font-faces into:', file);
  }
});
