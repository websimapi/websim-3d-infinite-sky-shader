const container = document.querySelector('.container');
const fullscreenButton = document.getElementById('fullscreenButton');
const aspectRatioButtons = document.querySelectorAll('.aspect-ratio-button');

// Aspect ratio handling
const aspectRatios = {
  '16:9': 177.78, // 16/9 * 100
  '4:3': 133.33,  // 4/3 * 100
  '1:1': 100
};

function setAspectRatio(ratio) {
  container.style.maxWidth = `${ratio}vh`;
  // Update active button state
  aspectRatioButtons.forEach(button => {
    button.classList.remove('active');
    if (button.textContent === ratio) {
      button.classList.add('active');
    }
  });
}

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

aspectRatioButtons.forEach(button => {
  button.addEventListener('click', () => {
    const ratio = button.textContent;
    setAspectRatio(ratio);
    container.style.maxWidth = `${aspectRatios[ratio]}vh`;
  });
});

// Handle fullscreen change
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    fullscreenButton.textContent = 'Exit Fullscreen';
  } else {
    fullscreenButton.textContent = 'Fullscreen';
  }
});

// Initialize with 16:9 aspect ratio
setAspectRatio('16:9');