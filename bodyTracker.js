// Initialize webcam and pose detection
async function initBodyTracking() {
  const video = document.getElementById('webcam');
  const poseCanvas = document.getElementById('pose-canvas');
  const ctx = poseCanvas.getContext('2d');

  // Set canvas size
  function resizeCanvas() {
    poseCanvas.width = window.innerWidth;
    poseCanvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Setup webcam
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480
      }
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error("Error accessing webcam:", err);
    return;
  }

  // Load pose detection model
  await tf.setBackend('webgl');
  const model = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  );

  // Animation function for pose detection
  async function detectPose() {
    if (video.readyState === 4) {
      const poses = await model.estimatePoses(video);
      
      // Clear previous frame
      ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
      
      if (poses.length > 0) {
        const pose = poses[0];
        
        // Draw keypoints
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        pose.keypoints.forEach(keypoint => {
          if (keypoint.score > 0.3) {
            const x = keypoint.x * (poseCanvas.width / video.width);
            const y = keypoint.y * (poseCanvas.height / video.height);
            
            // Draw point
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
        });

        // Draw skeleton
        const connections = [
          ['nose', 'left_eye'], ['left_eye', 'left_ear'], ['nose', 'right_eye'],
          ['right_eye', 'right_ear'], ['left_shoulder', 'right_shoulder'],
          ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
          ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
          ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
          ['left_hip', 'right_hip'], ['left_hip', 'left_knee'],
          ['left_knee', 'left_ankle'], ['right_hip', 'right_knee'],
          ['right_knee', 'right_ankle']
        ];

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;

        connections.forEach(([p1, p2]) => {
          const point1 = pose.keypoints.find(p => p.name === p1);
          const point2 = pose.keypoints.find(p => p.name === p2);

          if (point1 && point2 && point1.score > 0.3 && point2.score > 0.3) {
            const x1 = point1.x * (poseCanvas.width / video.width);
            const y1 = point1.y * (poseCanvas.height / video.height);
            const x2 = point2.x * (poseCanvas.width / video.width);
            const y2 = point2.y * (poseCanvas.height / video.height);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        });
      }
    }
    requestAnimationFrame(detectPose);
  }

  detectPose();
}

// Start body tracking
initBodyTracking().catch(console.error);