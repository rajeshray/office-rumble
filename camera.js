export function cropSquare(width, height, zoom = 1) {
  // Match object-fit:cover in the square preview, including its zoom.
  const size = Math.min(width, height) / zoom;
  return { x: (width-size)/2, y: (height-size)/2, size };
}
export function createCamera({ dialog, video, status, capture, retry, zoom, onCapture, mediaDevices = navigator.mediaDevices }) {
  let stream = null, generation = 0, player = 0, noticeTimer = null;
  function stop() {
    clearTimeout(noticeTimer);
    generation++;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;video.srcObject = null;capture.disabled = true;
  }
  async function start() {
    stop();const request = generation;
    status.hidden = false;status.textContent = 'Starting camera…';retry.hidden = true;
    if (!mediaDevices?.getUserMedia) {
      status.textContent = 'Camera access is unavailable here. Open this page directly in Chrome or Edge, then try again.';retry.hidden = false;return;
    }
    try {
      noticeTimer = setTimeout(() => {
        if (request === generation && dialog.open) status.textContent = 'Waiting for camera permission. Check your browser’s camera prompt. If this preview cannot show it, open this page directly in Chrome or Edge.';
      }, 8000);
      const incoming = await mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, audio: false });
      if (request !== generation || !dialog.open) { incoming.getTracks().forEach(track => track.stop());return; }
      stream = incoming;video.srcObject = stream;
      await video.play();
      if (request !== generation || !dialog.open) return;
      if (!video.videoWidth || !video.videoHeight) throw new Error('No camera frames');
      clearTimeout(noticeTimer);
      status.hidden = true;capture.disabled = false;
      stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
        if (request !== generation) return;
        stop();status.hidden = false;status.textContent = 'Camera disconnected. Reconnect it and try again.';retry.hidden = false;
      }, { once: true }));
    } catch (error) {
      if (request !== generation || !dialog.open) return;
      stop();status.hidden = false;retry.hidden = false;
      const messages = {
        NotAllowedError: 'Camera access was declined. Allow the camera in your browser’s site settings, then try again. You can also close this and play with the cartoon faces.',
        NotFoundError: 'No camera found. Connect a webcam and try again, or play with the cartoon faces.',
        NotReadableError: 'The camera is busy. Close other apps using it, then try again.',
        SecurityError: 'Open the game at localhost or an HTTPS address to use the camera.',
      };
      status.textContent = messages[error.name] || 'Could not start the camera. Try again, or close this to play with cartoon faces.';
    }
  }
  function takePhoto() {
    if (capture.disabled || !stream || !video.videoWidth) return;
    const crop = cropSquare(video.videoWidth, video.videoHeight, Number(zoom.value));
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;
    const c=canvas.getContext('2d');
    // Only pixels inside the on-screen circle become the fighter's face.
    c.beginPath();c.arc(160,160,160,0,Math.PI*2);c.clip();c.translate(320,0);c.scale(-1,1);
    const guideFraction=.84;
    const size=crop.size*guideFraction;
    c.drawImage(video,crop.x+(crop.size-size)/2,crop.y+(crop.size-size)/2,size,size,0,0,320,320);
    const target=player;stop();dialog.close();onCapture(target,canvas);
  }
  capture.addEventListener('click',takePhoto);retry.addEventListener('click',start);
  dialog.addEventListener('close',stop);dialog.addEventListener('cancel',stop);
  return {
    open(id) { player=id;zoom.value='1';video.style.transform='scale(-1, 1)';dialog.showModal();start(); },
    stop,
    close() { stop();dialog.close(); },
  };
}
