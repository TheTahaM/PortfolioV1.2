// Optimized Scroll Animation with Fixed Canvas Scaling and High Resolution

class ScrollAnimationApp {
    constructor() {
        // Configuration
        this.config = {
            totalFrames: 143,
            imageDirectory: './not4k/',
            imageFormat: 'webp',
            preloadBatch: 20,
            scrollThrottle: 16, // ~60fps
            mobileFrameSkip: this.isMobile() ? 2 : 1, // Skip every 2nd frame on mobile
        };

        // State management
        this.state = {
            imagesLoaded: 0,
            currentFrame: 1,
            isLoading: true,
            scrollProgress: 0,
            lastFrameTime: 0,
            fps: 0,
            frameCount: 0,
            reducedMotion: false,
            showPerformanceStats: false,
            connectionSpeed: 'unknown',
            errorCount: 0,
            animationStarted: false,
        };

        // Caches and maps
        this.imageCache = new Map();
        this.preloadQueue = [];
        this.loadingPromises = new Map();
        
        // DOM elements
        this.elements = {};
        
        // Performance monitoring
        this.performanceObserver = null;
        this.lastScrollTime = 0;
        this.lastScrollPosition = 0;
        
        this.init();
    }

    // Initialize the application
    async init() {
        this.setupDOMElements();
        this.detectCapabilities();
        this.setupEventListeners();
        this.setupCanvas();
        
        // Show loading screen initially
        this.showLoadingScreen();
        
        // Start loading process with fallback
        setTimeout(() => {
            this.startImageLoading();
        }, 500);

        // Fallback to start animation even if images fail to load
        setTimeout(() => {
            if (!this.state.animationStarted) {
                console.log('Starting animation with fallback after timeout');
                this.startAnimationFallback();
            }
        }, 5000); // Reduced timeout to 5 seconds
    }

    // Setup DOM element references
    setupDOMElements() {
        this.elements = {
            canvas: document.getElementById('animationCanvas'),
            loadingScreen: document.getElementById('loadingScreen'),
            progressFill: document.getElementById('progressFill'),
            loadedCount: document.getElementById('loadedCount'),
            totalCount: document.getElementById('totalCount'),
            connectionInfo: document.getElementById('connectionInfo'),
            overlayText: document.getElementById('overlayText'),
            endMessage: document.getElementById('endMessage'),
            performanceStats: document.getElementById('performanceStats'),
            currentFrame: document.getElementById('currentFrame'),
            fps: document.getElementById('fps'),
            scrollPercent: document.getElementById('scrollPercent'),
            errorModal: document.getElementById('errorModal'),
            modalClose: document.getElementById('modalClose'),
            retryButton: document.getElementById('retryButton'),
            continueButton: document.getElementById('continueButton'),
            errorMessage: document.getElementById('errorMessage'),
            reducedMotionToggle: document.getElementById('reducedMotionToggle'),
            performanceToggle: document.getElementById('performanceToggle'),
            motionText: document.getElementById('motionText'),
            perfText: document.getElementById('perfText'),
            navToggle: document.getElementById('navToggle'),
            accessibilityControls: document.getElementById('accessibilityControls'),
        };

        // Set total count
        if (this.elements.totalCount) {
            this.elements.totalCount.textContent = this.config.totalFrames;
        }

        // Ensure accessibility controls are visible
        if (this.elements.accessibilityControls) {
            this.elements.accessibilityControls.style.display = 'flex';
        }
    }

    // Show loading screen
    showLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.remove('hidden');
            this.elements.loadingScreen.style.display = 'flex';
        }
    }

    // Detect device capabilities and connection
    detectCapabilities() {
        // Check for reduced motion preference
        this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Detect connection speed (simplified)
        if (navigator.connection) {
            const connection = navigator.connection;
            this.state.connectionSpeed = connection.effectiveType || 'unknown';
            if (this.elements.connectionInfo) {
                this.elements.connectionInfo.textContent = `Connection: ${this.state.connectionSpeed}`;
            }
            
            // Adjust settings based on connection
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.config.preloadBatch = 10;
                this.config.mobileFrameSkip = 3;
            }
        } else {
            if (this.elements.connectionInfo) {
                this.elements.connectionInfo.textContent = 'Connection: Testing fallback mode';
            }
        }
    }

    // Setup canvas with proper scaling and high DPI support
    setupCanvas() {
        this.ctx = this.elements.canvas.getContext('2d', {
            alpha: false,
            desynchronized: true,
            powerPreference: 'high-performance'
        });

        this.resizeCanvas();
        
        // Enable high-quality image smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Create initial demo frame
        this.drawDemoFrame();
    }

    // Draw demo frame when images aren't available
    drawDemoFrame() {
        const canvas = this.elements.canvas;
        const ctx = this.ctx;
        
        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
        
        // Create animated gradient background based on current frame
        const gradient = ctx.createLinearGradient(0, 0, canvas.width / 2, canvas.height / 2);
        const hue = (this.state.currentFrame * 2) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 30%, 15%)`);
        gradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
        
        // Draw demo content
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Taha's Pen Demo`, 
            canvas.width / 4, 
            canvas.height / 4 - 40);
            
        ctx.font = '24px Arial';
        ctx.fillText(`Frame ${this.state.currentFrame} of ${this.config.totalFrames}`, 
            canvas.width / 4, 
            canvas.height / 4 + 20);
        
        // Draw frame indicator bar
        const barWidth = 400;
        const barHeight = 40;
        const barX = (canvas.width / 2 - barWidth) / 2;
        const barY = canvas.height / 4 + 80;
        
        // Background bar
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        

        // here 
        // Progress bar
        ctx.fillStyle = '##FFFFFF';
        const progressWidth = (this.state.currentFrame / this.config.totalFrames) * barWidth;
        ctx.fillRect(barX, barY, progressWidth, barHeight);
        
        // Add some animated elements
        const time = Date.now() * 0.001;
        ctx.fillStyle = `hsl(${(hue + 180) % 360}, 60%, 50%)`;
        for (let i = 0; i < 5; i++) {
            const x = (canvas.width / 4) + Math.sin(time + i) * 100;
            const y = (canvas.height / 2) + Math.cos(time * 1.5 + i) * 50;
            const size = 5 + Math.sin(time * 2 + i) * 3;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Resize canvas with proper high DPI scaling
    resizeCanvas() {
        const canvas = this.elements.canvas;
        
        // Set canvas size to fill screen
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Set canvas resolution for high DPI displays
        canvas.width = width * 2;  // Fixed high resolution as requested
        canvas.height = height * 2; // Fixed high resolution as requested
        
        // Set CSS size to fill screen
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        // Scale context to ensure proper drawing
        this.ctx.scale(2, 2);
        
        // Enable high-quality image smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    // Setup event listeners
    setupEventListeners() {
        // Passive scroll listener for performance
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), this.config.scrollThrottle), { passive: true });
        
        // Resize listener
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
        
        // Modal and button listeners
        if (this.elements.modalClose) {
            this.elements.modalClose.addEventListener('click', () => this.hideModal());
        }
        if (this.elements.retryButton) {
            this.elements.retryButton.addEventListener('click', () => this.retryLoading());
        }
        if (this.elements.continueButton) {
            this.elements.continueButton.addEventListener('click', () => this.hideModal());
        }
        
        // Accessibility controls
        if (this.elements.reducedMotionToggle) {
            this.elements.reducedMotionToggle.addEventListener('click', () => this.toggleReducedMotion());
        }
        if (this.elements.performanceToggle) {
            this.elements.performanceToggle.addEventListener('click', () => this.togglePerformanceStats());
        }
        
        // Mobile navigation toggle
        if (this.elements.navToggle) {
            this.elements.navToggle.addEventListener('click', () => this.toggleMobileNav());
        }
        
        // Reduced motion media query listener
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addEventListener('change', (e) => {
            this.state.reducedMotion = e.matches;
            this.updateMotionUI();
        });

        // Visibility change for performance optimization
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimation();
            } else {
                this.resumeAnimation();
            }
        });
    }

    // User-provided startImageLoading method with batch loading
    async startImageLoading() {
        try {
            console.log('Starting to load images from not4k folder...');
            
            // Load images in batches for better performance
            const batchSize = this.config.preloadBatch;
            const totalBatches = Math.ceil(this.config.totalFrames / batchSize);
            
            for (let batch = 0; batch < totalBatches; batch++) {
                const startFrame = batch * batchSize + 1;
                const endFrame = Math.min(startFrame + batchSize - 1, this.config.totalFrames);
                
                console.log(`Loading batch ${batch + 1}/${totalBatches}: frames ${startFrame}-${endFrame}`);
                
                // Load images in parallel within each batch
                const batchPromises = [];
                for (let frame = startFrame; frame <= endFrame; frame++) {
                    batchPromises.push(this.loadImage(frame));
                }
                
                // Wait for current batch to complete
                await Promise.allSettled(batchPromises);
                
                // Small delay between batches to prevent overwhelming the browser
                if (batch < totalBatches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            
            console.log(`Finished loading ${this.state.imagesLoaded} images`);
            this.state.isLoading = false;
            this.startAnimation();
            
        } catch (error) {
            console.error('Error during loading:', error);
            this.startAnimationFallback();
        }
    }

    // Load individual image with error handling
    async loadImage(frameNumber) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const fileName = frameNumber.toString().padStart(4, '0') + '.webp';
            const imagePath = this.config.imageDirectory + fileName;
            
            img.onload = () => {
                this.imageCache.set(frameNumber, img);
                this.state.imagesLoaded++;
                this.updateLoadingProgress();
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load image: ${imagePath}`);
                this.state.errorCount++;
                this.state.imagesLoaded++; // Count as loaded for progress
                this.updateLoadingProgress();
                reject(new Error(`Failed to load ${imagePath}`));
            };
            
            // Set source after event listeners to avoid race conditions
            img.src = imagePath;
        });
    }

    // Update loading progress
    updateLoadingProgress() {
        const progress = (this.state.imagesLoaded / this.config.totalFrames) * 100;
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = progress + '%';
        }
        if (this.elements.loadedCount) {
            this.elements.loadedCount.textContent = this.state.imagesLoaded;
        }
        
        // Show error info if errors occurred
        if (this.state.errorCount > 0 && this.elements.connectionInfo) {
            this.elements.connectionInfo.textContent = `${this.state.errorCount} images failed to load - using demo mode`;
            this.elements.connectionInfo.style.color = '#2da6b2';
        }
        
        // Auto-start animation when loading completes (even with errors)
        if (this.state.imagesLoaded >= this.config.totalFrames && !this.state.animationStarted) {
            setTimeout(() => {
                this.startAnimation();
            }, 1000);
        }
    }

    // Start the animation
    startAnimation() {
        console.log('Starting animation...');
        this.state.animationStarted = true;
        this.hideLoadingScreen();
        this.drawCurrentFrame();
        this.startPerformanceMonitoring();
        this.startAnimationLoop(); // Start animation loop for demo mode
    }

    // Start animation with fallback (no images)
    startAnimationFallback() {
        console.log('Starting animation fallback...');
        this.state.animationStarted = true;
        this.hideLoadingScreen();
        this.drawCurrentFrame();
        this.startPerformanceMonitoring();
        this.startAnimationLoop(); // Start animation loop for demo mode
    }

    // Start animation loop for demo mode
    startAnimationLoop() {
        const animate = () => {
            if (!this.isPaused && this.state.animationStarted) {
                this.drawCurrentFrame();
            }
            requestAnimationFrame(animate);
        };
        animate();
    }

    // Hide loading screen
    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.classList.add('hidden');
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    // Handle scroll events - FIXED to work properly
    handleScroll() {
        if (this.state.reducedMotion || !this.state.animationStarted) return;
        
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
        
        this.state.scrollProgress = scrollProgress;
        
        // Calculate frame number based on scroll progress
        let frameNumber = Math.max(1, Math.ceil(scrollProgress * this.config.totalFrames));
        frameNumber = Math.min(frameNumber, this.config.totalFrames);
        
        // Apply frame skipping for mobile
        if (this.isMobile() && this.config.mobileFrameSkip > 1) {
            frameNumber = Math.ceil(frameNumber / this.config.mobileFrameSkip) * this.config.mobileFrameSkip;
            frameNumber = Math.min(frameNumber, this.config.totalFrames);
        }
        
        // Update frame if changed
        if (frameNumber !== this.state.currentFrame) {
            this.state.currentFrame = frameNumber;
            this.drawCurrentFrame();
        }
        
        // Update overlay text opacity
        this.updateOverlayOpacity(scrollProgress);
        // Update navigation brand opacity - NEW LINE
this.updateNavBrandOpacity(scrollProgress);


        // Show end message
        this.updateEndMessage(scrollProgress);
        
        // Update performance stats
        this.updatePerformanceStats();


    }

    // Draw current frame
    drawCurrentFrame() {
        if (this.imageCache.has(this.state.currentFrame)) {
            this.drawFrame(this.imageCache.get(this.state.currentFrame));
        } else {
            // Always draw demo frame if no image available
            this.drawDemoFrame();
        }
    }

    // Draw specific frame with proper scaling to fill canvas
    drawFrame(img) {
        const canvas = this.elements.canvas;
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
        
        // Calculate dimensions for covering the entire canvas while maintaining aspect ratio
        const canvasWidth = canvas.width / 2;  // Account for scale factor
        const canvasHeight = canvas.height / 2; // Account for scale factor
        
        const canvasAspect = canvasWidth / canvasHeight;
        const imgAspect = img.width / img.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        // Cover the entire canvas (similar to CSS object-fit: cover)
        if (canvasAspect > imgAspect) {
            // Canvas is wider than image - fit to width
            drawWidth = canvasWidth;
            drawHeight = (img.height * canvasWidth) / img.width;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        } else {
            // Canvas is taller than image - fit to height
            drawHeight = canvasHeight;
            drawWidth = (img.width * canvasHeight) / img.height;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        }
        
        // Draw image to fill the canvas
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Update overlay text opacity
    updateOverlayOpacity(progress) {
        const fadeStart = 0;
        const fadeEnd = 0.3;
        let opacity = 1;
        
        if (progress > fadeStart) {
            opacity = Math.max(0, 1 - (progress - fadeStart) / (fadeEnd - fadeStart));
        }
        
        if (this.elements.overlayText) {
            this.elements.overlayText.style.opacity = opacity;
        }
    }

    // Update end message visibility
    updateEndMessage(progress) {
        if (!this.elements.endMessage) return;
        
        if (progress > 0.8) {
            this.elements.endMessage.classList.add('visible');
        } else {
            this.elements.endMessage.classList.remove('visible');
        }
    }

    // Start performance monitoring
    startPerformanceMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const updateFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.state.fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        updateFPS();
    }

    // Update performance stats display
    updatePerformanceStats() {
        if (!this.state.showPerformanceStats) return;
        
        if (this.elements.currentFrame) {
            this.elements.currentFrame.textContent = this.state.currentFrame;
        }
        if (this.elements.fps) {
            this.elements.fps.textContent = this.state.fps;
        }
        if (this.elements.scrollPercent) {
            this.elements.scrollPercent.textContent = Math.round(this.state.scrollProgress * 100);
        }
    }

    // Handle window resize
    handleResize() {
        this.resizeCanvas();
        this.drawCurrentFrame();
    }

    // Utility functions
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Error handling
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
        }
        if (this.elements.errorModal) {
            this.elements.errorModal.classList.remove('hidden');
        }
    }

    hideModal() {
        if (this.elements.errorModal) {
            this.elements.errorModal.classList.add('hidden');
        }
    }

    retryLoading() {
        this.hideModal();
        this.state.errorCount = 0;
        this.state.imagesLoaded = 0;
        this.state.animationStarted = false;
        this.imageCache.clear();
        this.loadingPromises.clear();
        this.showLoadingScreen();
        this.startImageLoading();
    }

    // Accessibility functions
    toggleReducedMotion() {
        this.state.reducedMotion = !this.state.reducedMotion;
        this.updateMotionUI();
    }

    updateMotionUI() {
        if (this.elements.motionText) {
            this.elements.motionText.textContent = this.state.reducedMotion ? 'Enable Animation' : 'Disable Animation';
        }
        
        if (this.state.reducedMotion) {
            if (this.elements.canvas) {
                this.elements.canvas.style.opacity = '0.3';
            }
            if (this.elements.overlayText) {
                this.elements.overlayText.style.opacity = '1';
            }
        } else {
            if (this.elements.canvas) {
                this.elements.canvas.style.opacity = '1';
            }
            this.handleScroll(); // Update current state
        }
    }

    togglePerformanceStats() {
        this.state.showPerformanceStats = !this.state.showPerformanceStats;
        
        if (this.elements.perfText) {
            this.elements.perfText.textContent = this.state.showPerformanceStats ? 'Hide Stats' : 'Show Stats';
        }
        
        if (this.elements.performanceStats) {
            if (this.state.showPerformanceStats) {
                this.elements.performanceStats.classList.add('visible');
            } else {
                this.elements.performanceStats.classList.remove('visible');
            }
        }
    }

    toggleMobileNav() {
        const navMenuMobile = document.querySelector('.nav-menu-mobile');
        if (navMenuMobile) {
            navMenuMobile.classList.toggle('active');
        }
    }

    pauseAnimation() {
        this.isPaused = true;
    }

    resumeAnimation() {
        this.isPaused = false;
        this.drawCurrentFrame();
    }

    // Update navigation brand opacity - FADE IN starting from frame 47
updateNavBrandOpacity(progress) {
    const fadeInStart = 0.328671; // Frame 47 out of 143 frames (47/143)
    const fadeInEnd = 0.5; // Complete fade-in by 50% scroll (around frame 72)
    const navBrand = document.querySelector('.nav-brand');
    
    if (!navBrand) return;
    
    if (progress >= fadeInStart) {
        if (progress >= fadeInEnd) {
            navBrand.classList.add('fade-in');
        } else {
            // Smooth fade-in between fadeInStart and fadeInEnd
            const opacity = (progress - fadeInStart) / (fadeInEnd - fadeInStart);
            navBrand.style.opacity = opacity;
        }
    } else {
        navBrand.classList.remove('fade-in');
        navBrand.style.opacity = '0';
    }
}

}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.scrollAnimationApp = new ScrollAnimationApp();
});

// Handle page unload for cleanup
window.addEventListener('beforeunload', () => {
    if (window.scrollAnimationApp) {
        window.scrollAnimationApp.imageCache.clear();
    }
});