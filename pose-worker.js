/* Classic worker: Emscripten's importScripts requires a classic worker. */
let detector = null;
let lastTimestamp = -1;
self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === 'init') {
      const { FilesetResolver, PoseLandmarker } = await import('./vendor/vision_bundle.mjs');
      const files = await FilesetResolver.forVisionTasks(new URL('./vendor/wasm', self.location.href).href);
      detector = await PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: new URL('./models/pose_landmarker_lite.task', self.location.href).href, delegate: 'CPU' },
        runningMode: 'VIDEO', numPoses: 2,
        minPoseDetectionConfidence: 0.6, minPosePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6, outputSegmentationMasks: false
      });
      lastTimestamp = -1;
      self.postMessage({ id, ok: true, ready: true });
    } else if (type === 'frame') {
      if (!detector) throw new Error('姿态模型尚未加载');
      const bitmap = data.bitmap;
      const timestamp = Math.max(lastTimestamp + 1, data.timestamp);
      let result;
      try { result = detector.detectForVideo(bitmap, timestamp); }
      finally { bitmap.close(); }
      lastTimestamp = timestamp;
      self.postMessage({ id, ok: true, landmarks: result.landmarks });
    }
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error.message || error) });
  }
};
