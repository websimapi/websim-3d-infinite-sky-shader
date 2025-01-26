const container = document.querySelector('.container');
const fullscreenButton = document.getElementById('fullscreenButton');

// Fullscreen handling
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
}

// Event listeners
fullscreenButton.addEventListener('click', toggleFullscreen);

// Handle fullscreen change
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    fullscreenButton.textContent = 'Exit Fullscreen';
  } else {
    fullscreenButton.textContent = 'Fullscreen';
  }
});