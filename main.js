const { app, BrowserWindow, dialog, screen } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
//Fait par Maxence LEBRUN pour la société P'tit Prix
//Merci de faire en sorte de ne pas supprimer ces crédits
//
// Pour éviter que l'app se ferme automatiquement
let mainWindow = null;

// Charger la configuration depuis config.json
const defaultVideoUrl = "https://ptitprix.fr/video.mp4";
let videoUrl = defaultVideoUrl;
let defaultDisplayIndex = null;

try {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  
  if (config.videoUrl && typeof config.videoUrl === 'string') {
    videoUrl = config.videoUrl;
  }
  
  if (typeof config.defaultDisplayIndex === 'number') {
    defaultDisplayIndex = config.defaultDisplayIndex;
  }
} catch (error) {
  console.warn("Impossible de lire le fichier config.json ou configuration incomplète.");
}

app.whenReady().then(() => {
  // Obtenir les informations des écrans
  const displays = screen.getAllDisplays();
  
  // Déterminer l'index de l'écran à utiliser
  let selectedDisplayIndex = defaultDisplayIndex;
  
  if (selectedDisplayIndex === null || selectedDisplayIndex < 0 || selectedDisplayIndex >= displays.length) {
    // Demander à l'utilisateur de choisir un écran si aucun n'est défini dans config.json ou si l'index est invalide
    const displayOptions = displays.map((d, i) => `Écran ${i + 1}: ${d.size.width}x${d.size.height}`).join('\n');
    selectedDisplayIndex = parseInt(dialog.showMessageBoxSync({
      type: 'question',
      buttons: displays.map((_, i) => `Écran ${i + 1}`),
      title: 'Choix de l\'écran pour affichage des annonces P\'tit Prix',
      message: `Sur quel écran voulez-vous afficher la vidéo ?\n\n${displayOptions}`,
    }));
    
    if (isNaN(selectedDisplayIndex) || selectedDisplayIndex < 0 || selectedDisplayIndex >= displays.length) {
      app.quit();  // Quitter si la sélection est invalide
      return;
    }
  }

  const selectedDisplay = displays[selectedDisplayIndex];

  // Créer la fenêtre sur l'écran sélectionné
  mainWindow = new BrowserWindow({
    x: selectedDisplay.bounds.x,
    y: selectedDisplay.bounds.y,
    width: selectedDisplay.size.width,
    height: selectedDisplay.size.height,
    frame: false, // Plein écran sans bordure
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  // Charger le fichier HTML contenant le lecteur vidéo
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  // Transmettre l'URL de la vidéo au rendu
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('load-video', videoUrl);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
