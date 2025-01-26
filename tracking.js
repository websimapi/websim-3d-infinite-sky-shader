let detector;
let poses;
const video = document.getElementById('webcam');
const poseCanvas = document.getElementById('pose-canvas');
const ctx = poseCanvas.getContext('2d');

// Initialize pose detection
async function initPoseDetection() {
  const detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER, 
    enableSmoothing: true,
    multiPoseMaxDimension: 256
  };
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    detectorConfig
  );
}

// Setup webcam
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 640,  
      height: 480,
      facingMode: 'user'
    },
    audio: false
  });
  video.srcObject = stream;
  
  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      poseCanvas.width = video.width;
      poseCanvas.height = video.height;
      video.play();
      resolve(video);
    };
  });
}

// Draw pose keypoints and skeleton
function drawPose(pose) {
  ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
  
  // Draw keypoints
  pose.keypoints.forEach(keypoint => {
    if (keypoint.score > 0.3) {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'aqua';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
  
  // Draw skeleton
  const connections = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
  ctx.lineWidth = 4;
  connections.forEach(([i, j]) => {
    const kp1 = pose.keypoints[i];
    const kp2 = pose.keypoints[j];
    
    if (kp1.score > 0.3 && kp2.score > 0.3) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.strokeStyle = 'aqua';
      ctx.stroke();
      
      // Add white outline
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.stroke();
    }
  });
}

// Main detection loop
async function detectPose() {
  if (detector && video.readyState === 4) {
    try {
      poses = await detector.estimatePoses(video, {
        maxPoses: 1,
        flipHorizontal: false
      });
      
      if (poses.length > 0) {
        drawPose(poses[0]);
        // Emit pose data for the main scene
        window.dispatchEvent(new CustomEvent('poseUpdated', {
          detail: poses[0]
        }));
      }
    } catch (error) {
      console.error('Error in pose detection:', error);
    }
  }
  requestAnimationFrame(detectPose);
}

// Initialize everything
async function init() {
  try {
    await setupCamera();
    await initPoseDetection();
    detectPose();
  } catch (error) {
    console.error('Error initializing:', error);
  }
}

init();