export class WebAudioManager {
    constructor(audioBaseDir = "audio/") {
        this.audioBaseDir = audioBaseDir;
        this.ctx = null;
        this.loops = new Map();             // filename -> Audio element
        this.cameraProxSounds = new Map();  // markerId -> Audio element
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playBeep(frequency, durationMs) {
        this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + durationMs / 1000);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + durationMs / 1000);
    }

    playCalibrationBeeps() {
        // Послідовність сигналів для калібрування: 3 коротких і 1 довгий
        setTimeout(() => this.playBeep(880, 150), 0);
        setTimeout(() => this.playBeep(880, 150), 400);
        setTimeout(() => this.playBeep(880, 150), 800);
        setTimeout(() => this.playBeep(1760, 600), 1200);
    }

    playLoopingSound(filename) {
        if (!filename) return;
        const fullPath = this.audioBaseDir + filename;
        if (this.loops.has(fullPath)) {
            return;
        }

        const audio = new Audio(fullPath);
        audio.loop = true;
        audio.play().catch(e => console.warn("Failed to play audio loop:", fullPath, e));
        this.loops.set(fullPath, audio);
    }

    stopLoopingSound() {
        for (const [fullPath, audio] of this.loops) {
            audio.pause();
        }
        this.loops.clear();
    }

    playCameraProxSound(markerId, filename) {
        if (!filename) return;
        const fullPath = this.audioBaseDir + filename;
        if (this.cameraProxSounds.has(markerId)) {
            return;
        }

        const audio = new Audio(fullPath);
        audio.loop = true;
        audio.play().catch(e => console.warn("Failed to play camera prox sound:", fullPath, e));
        this.cameraProxSounds.set(markerId, audio);
    }

    stopCameraProxSound(markerId) {
        if (this.cameraProxSounds.has(markerId)) {
            const audio = this.cameraProxSounds.get(markerId);
            audio.pause();
            this.cameraProxSounds.delete(markerId);
        }
    }

    stopAllSounds() {
        this.stopLoopingSound();
        for (const [markerId, audio] of this.cameraProxSounds) {
            audio.pause();
        }
        this.cameraProxSounds.clear();
    }
}
