document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================
    // 1. MOBILE MENU TOGGLE (EXISTING UI)
    // =========================================
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });

        // Close menu when clicking links
        document.querySelectorAll('header nav a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    // =========================================
    // 2. HERO ANIMATION (EXISTING UI)
    // =========================================
    function createParticles() {
        const container = document.querySelector('.hero-bg-animation');
        if (!container) return;
        
        // Create 30 particles
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random positioning
            particle.style.left = Math.random() * 100 + '%';
            
            // Random animation timing to feel organic
            particle.style.animationDelay = Math.random() * 12 + 's';
            particle.style.animationDuration = (8 + Math.random() * 8) + 's';
            
            // Random sizes
            const size = (4 + Math.random() * 6) + 'px';
            particle.style.width = size;
            particle.style.height = size;
            
            container.appendChild(particle);
        }
    }
    createParticles();

    // =========================================
    // 3. SCROLL ANIMATIONS (EXISTING UI)
    // =========================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

    // =========================================
    // 4. FAQ ACCORDION (EXISTING UI)
    // =========================================
    document.querySelectorAll('.accordion-header').forEach(button => {
        button.addEventListener('click', () => {
            const item = button.parentElement;
            document.querySelectorAll('.accordion-item').forEach(other => {
                if (other !== item) other.classList.remove('active');
            });
            item.classList.toggle('active');
        });
    });

    // =========================================
    // 5. MODALS (EXISTING UI)
    // =========================================
    const modals = {
        'privacy-modal': document.getElementById('privacy-modal'),
        'terms-modal': document.getElementById('terms-modal')
    };

    document.querySelectorAll('[data-modal-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-modal-target');
            if (modals[targetId]) {
                modals[targetId].classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-modal-close');
            if (modals[targetId]) {
                modals[targetId].classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    });

    Object.values(modals).forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    });

    // =================================================================
    // 6. BACKEND WIRING (REAL API INTEGRATION)
    // =================================================================

    // --- CONFIGURATION ---
    const CONFIG = {
        effectId: 'ai_walking',
        model: 'video-effects',
        toolType: 'video-effects',
        userId: 'DObRu1vyStbUynoQmTcHBlhs55z2'
    };

    // State
    let currentUploadedUrl = null;

    // --- UTILITIES ---

    // Generate nanoid for unique filename
    function generateNanoId(length = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // UI Helper: Show Loading State
    function showLoading() {
        const loader = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const resultImg = document.getElementById('result-final');
        const video = document.getElementById('result-video');
        
        if (loader) loader.classList.remove('hidden'); // Ensure visible
        if (loader) loader.style.display = 'flex';
        
        if (emptyState) emptyState.classList.add('hidden');
        if (resultImg) resultImg.classList.add('hidden');
        if (video) video.style.display = 'none';
        
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) generateBtn.disabled = true;
    }

    // UI Helper: Hide Loading State
    function hideLoading() {
        const loader = document.getElementById('loading-state');
        if (loader) loader.classList.add('hidden');
        if (loader) loader.style.display = 'none';
        
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) generateBtn.disabled = false;
    }

    // UI Helper: Update Status Text
    function updateStatus(text) {
        // Update the loading spinner text
        const statusText = document.querySelector('#loading-state p');
        if (statusText) statusText.textContent = text;

        // Also update button text if generating
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            if (text === 'READY') {
                generateBtn.textContent = 'Generate Walking Video';
                generateBtn.disabled = false;
                generateBtn.classList.remove('btn-secondary');
                generateBtn.classList.add('btn-primary');
            } else if (text === 'UPLOADING...' || text.includes('PROCESSING')) {
                generateBtn.textContent = text;
                generateBtn.disabled = true;
            }
        }
    }

    // UI Helper: Show Error
    function showError(msg) {
        console.error(msg);
        alert('Error: ' + msg);
        hideLoading();
        updateStatus('READY');
    }

    // UI Helper: Show Preview Image
    function showPreview(url) {
        const img = document.getElementById('preview-image');
        const placeholder = document.querySelector('.upload-placeholder');
        
        if (img) {
            img.src = url;
            img.classList.remove('hidden');
        }
        if (placeholder) {
            placeholder.classList.add('hidden');
        }
    }

    // UI Helper: Show Result Media (Handles Video vs Image)
    function showResultMedia(url) {
        const resultImg = document.getElementById('result-final');
        const container = document.getElementById('result-container');
        const downloadBtn = document.getElementById('download-btn');
        const resetBtn = document.getElementById('reset-btn');
        const generateBtn = document.getElementById('generate-btn');

        if (!container) return;

        // Clean up previous video if exists
        let existingVideo = document.getElementById('result-video');
        
        const isVideo = url.toLowerCase().match(/\.(mp4|webm)(\?.*)?$/i);

        if (isVideo) {
            // Hide image
            if (resultImg) resultImg.classList.add('hidden');
            
            // Create or update video element
            if (!existingVideo) {
                existingVideo = document.createElement('video');
                existingVideo.id = 'result-video';
                existingVideo.controls = true;
                existingVideo.autoplay = true;
                existingVideo.loop = true;
                existingVideo.muted = true; // Auto-play usually requires mute
                existingVideo.className = 'w-full h-auto rounded-lg shadow-2xl';
                // Insert before the image or append to container
                if (resultImg) {
                    container.insertBefore(existingVideo, resultImg);
                } else {
                    container.appendChild(existingVideo);
                }
            }
            existingVideo.src = url;
            existingVideo.style.display = 'block';
        } else {
            // Hide video
            if (existingVideo) existingVideo.style.display = 'none';
            
            // Show image
            if (resultImg) {
                resultImg.src = url;
                resultImg.classList.remove('hidden');
            }
        }

        // Show action buttons
        if (downloadBtn) {
            downloadBtn.classList.remove('hidden');
            downloadBtn.dataset.url = url; // Store for download handler
        }
        if (resetBtn) resetBtn.classList.remove('hidden');
        if (generateBtn) generateBtn.classList.add('hidden'); // Hide generate button after success

        // Scroll to result on mobile
        if (window.innerWidth < 768) {
            container.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // --- API FUNCTIONS ---

    // 1. Upload File to CDN
    async function uploadFile(file) {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueId = generateNanoId();
        // Filename is just nanoid.extension (NO "media/" prefix)
        const fileName = uniqueId + '.' + fileExtension;
        
        // Step 1: Get signed URL
        const signedUrlResponse = await fetch(
            'https://api.chromastudio.ai/get-emd-upload-url?fileName=' + encodeURIComponent(fileName),
            { method: 'GET' }
        );
        
        if (!signedUrlResponse.ok) {
            throw new Error('Failed to get signed URL: ' + signedUrlResponse.statusText);
        }
        
        const signedUrl = await signedUrlResponse.text();
        
        // Step 2: PUT file to signed URL
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file: ' + uploadResponse.statusText);
        }
        
        // Step 3: Return download URL
        const downloadUrl = 'https://contents.maxstudio.ai/' + fileName;
        return downloadUrl;
    }

    // 2. Submit Job
    async function submitImageGenJob(imageUrl) {
        // Based on "video-effects" model and "ai_walking", this is a Video Gen job
        const endpoint = 'https://api.chromastudio.ai/video-gen';
        
        const body = {
            imageUrl: [imageUrl], // Video API expects array
            effectId: CONFIG.effectId,
            userId: CONFIG.userId,
            removeWatermark: true,
            model: CONFIG.model,
            isPrivate: true
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-mobile': '?0'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit job: ' + response.statusText);
        }
        
        const data = await response.json();
        return data;
    }

    // 3. Poll Status
    async function pollJobStatus(jobId) {
        const baseUrl = 'https://api.chromastudio.ai/video-gen';
        const POLL_INTERVAL = 2000; // 2 seconds
        const MAX_POLLS = 150; // 5 minutes max (Video takes longer)
        
        let polls = 0;
        
        while (polls < MAX_POLLS) {
            const response = await fetch(
                `${baseUrl}/${CONFIG.userId}/${jobId}/status`,
                {
                    method: 'GET',
                    headers: { 'Accept': 'application/json, text/plain, */*' }
                }
            );
            
            if (!response.ok) throw new Error('Status check failed');
            
            const data = await response.json();
            
            if (data.status === 'completed') {
                return data;
            }
            
            if (data.status === 'failed' || data.status === 'error') {
                throw new Error(data.error || 'Job processing failed');
            }
            
            updateStatus('PROCESSING... (' + (polls * 2) + 's)');
            
            // Wait
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            polls++;
        }
        
        throw new Error('Timeout waiting for video generation');
    }

    // --- EVENT HANDLERS ---

    // Handle File Selection (Auto-Upload)
    async function handleFileSelect(file) {
        if (!file) return;
        
        // Basic validation
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG, PNG)');
            return;
        }

        try {
            // Show local preview immediately (better UX while uploading)
            const reader = new FileReader();
            reader.onload = (e) => showPreview(e.target.result);
            reader.readAsDataURL(file);

            // Start Upload Process
            updateStatus('UPLOADING...');
            // Note: We don't block the UI with a full loader here, just update text
            // But we disable generate until upload finishes
            const generateBtn = document.getElementById('generate-btn');
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Uploading...';
            }

            const uploadedUrl = await uploadFile(file);
            currentUploadedUrl = uploadedUrl;
            
            updateStatus('READY');
            
        } catch (error) {
            showError(error.message);
        }
    }

    // Handle Generate Click
    async function handleGenerate() {
        if (!currentUploadedUrl) {
            alert('Please upload an image first');
            return;
        }

        try {
            showLoading();
            updateStatus('SUBMITTING...');
            
            // 1. Submit
            const jobData = await submitImageGenJob(currentUploadedUrl);
            
            // 2. Poll
            updateStatus('QUEUED...');
            const result = await pollJobStatus(jobData.jobId);
            
            // 3. Extract URL
            // Video API usually returns: { result: [{ video: "url", ... }] } or { result: { video: "url" } }
            const resultItem = Array.isArray(result.result) ? result.result[0] : result.result;
            const finalUrl = resultItem?.video || resultItem?.mediaUrl || resultItem?.image; // Fallback check
            
            if (!finalUrl) {
                throw new Error('API returned success but no media URL found');
            }
            
            hideLoading();
            showResultMedia(finalUrl);
            updateStatus('COMPLETE');

        } catch (error) {
            showError(error.message);
        }
    }

    // --- WIRING DOM ELEMENTS ---

    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Drag & Drop / File Input
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFileSelect(e.target.files[0]);
        });
    }

    if (uploadZone) {
        // Prevent defaults
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Highlights
        uploadZone.addEventListener('dragover', () => uploadZone.classList.add('drag-over'));
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
        uploadZone.addEventListener('drop', (e) => {
            uploadZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            handleFileSelect(file);
        });
        
        // Click to browse
        uploadZone.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    // Generate Button
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }

    // Reset Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentUploadedUrl = null;
            
            // Reset UI
            const previewImg = document.getElementById('preview-image');
            const placeholder = document.querySelector('.upload-placeholder');
            const resultImg = document.getElementById('result-final');
            const video = document.getElementById('result-video');
            const emptyState = document.getElementById('empty-state');
            
            if (previewImg) {
                previewImg.src = '';
                previewImg.classList.add('hidden');
            }
            if (placeholder) placeholder.classList.remove('hidden');
            if (fileInput) fileInput.value = '';
            
            if (resultImg) {
                resultImg.src = '';
                resultImg.classList.add('hidden');
            }
            if (video) video.style.display = 'none';
            if (emptyState) emptyState.classList.remove('hidden');
            
            generateBtn.textContent = 'Generate Walking Video';
            generateBtn.classList.remove('hidden');
            generateBtn.disabled = true; // Disabled until new file
            generateBtn.classList.add('btn-secondary');
            
            resetBtn.classList.add('hidden');
            if (downloadBtn) downloadBtn.classList.add('hidden');
            
            hideLoading();
        });
    }

    // Download Button (Proxy Strategy)
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = downloadBtn.dataset.url;
            if (!url) return;
            
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.disabled = true;
            
            // Helper: Download Blob
            const downloadBlob = (blob, filename) => {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            };

            const getExt = (url, type) => {
                if (type && type.includes('mp4')) return 'mp4';
                if (type && type.includes('webm')) return 'webm';
                if (url.includes('.mp4')) return 'mp4';
                return 'mp4'; // Default for video effect
            };

            try {
                // Strategy 1: ChromaStudio Proxy
                const proxyUrl = 'https://api.chromastudio.ai/download-proxy?url=' + encodeURIComponent(url);
                let response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    console.warn('Proxy failed, trying direct fetch');
                    // Strategy 2: Direct Fetch
                    response = await fetch(url + '?t=' + Date.now(), { mode: 'cors' });
                    if (!response.ok) throw new Error('Download failed');
                }

                const blob = await response.blob();
                const ext = getExt(url, response.headers.get('content-type'));
                downloadBlob(blob, `walking_video_${generateNanoId(8)}.${ext}`);

            } catch (err) {
                console.error(err);
                alert('Browser blocked the automatic download. Please right-click the video and select "Save Video As".');
            } finally {
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }
        });
    }
});