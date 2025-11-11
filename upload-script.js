// Upload functionality for country pages - Server-based version with grid layout and modal
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const filesDisplay = document.getElementById('filesDisplay');
    
    // Get or create user ID (stored in localStorage)
    let userId = localStorage.getItem('webnarrative_userId');
    if (!userId) {
        userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('webnarrative_userId', userId);
    }
    
    const countryInfo = resolveCountryInfo();
    if (!countryInfo) {
        showMissingCountryState();
        return;
    }

    const countrySlug = countryInfo.slug;

    updatePageMetadata(countryInfo);
    
    // Create modal structure
    createModal();
    
    // Load existing files from server
    loadFiles();
    
    fileInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        uploadFiles(files);
        // Clear the input
        fileInput.value = '';
    });
    
    function updatePageMetadata(info) {
        const flag = info.flag ? info.flag + ' ' : '';
        document.title = `${info.name} - Upload Files`;
        const titleEl = document.getElementById('countryTitle') || document.querySelector('.title');
        if (titleEl) {
            titleEl.textContent = `${flag}${info.name}`;
        }
        document.body.dataset.countrySlug = info.slug;
    }

    function resolveCountryInfo() {
        const slugFromDataset = document.body.dataset.countrySlug;
        if (slugFromDataset && window.countryBySlug && window.countryBySlug[slugFromDataset]) {
            return window.countryBySlug[slugFromDataset];
        }

        const slugFromPath = getCountrySlugFromPath();
        if (slugFromPath && window.countryBySlug && window.countryBySlug[slugFromPath]) {
            return window.countryBySlug[slugFromPath];
        }

        if (window.countrySlugByName) {
            const title = document.title.split(' - ')[0];
            const slug = window.countrySlugByName[title];
            if (slug && window.countryBySlug && window.countryBySlug[slug]) {
                return window.countryBySlug[slug];
            }
        }

        return null;
    }

    function getCountrySlugFromPath() {
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const countryIndex = pathSegments.indexOf('country');

        if (countryIndex > -1 && pathSegments.length > countryIndex + 1) {
            return decodeURIComponent(pathSegments[countryIndex + 1]).toLowerCase();
        }

        const params = new URLSearchParams(window.location.search);
        const slug = params.get('country');
        return slug ? slug.toLowerCase() : null;
    }

    function showMissingCountryState() {
        const uploadSection = document.querySelector('.upload-section');
        if (uploadSection) {
            uploadSection.style.display = 'none';
        }
        if (fileInput) {
            fileInput.disabled = true;
        }
        if (filesDisplay) {
            filesDisplay.innerHTML = '<p class="error-message">We could not find this country. Please return to the world map and try again.</p>';
        }
        document.title = 'Country Not Found';
    }
    
    function createModal() {
        const modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-image-container">
                    <span class="modal-close">&times;</span>
                    <button class="modal-delete-btn" id="modalDeleteBtn" style="display: none;">🗑️ Delete</button>
                    <img class="modal-image" id="modalImage" src="" alt="Image">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal handlers
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Delete button handler
        document.getElementById('modalDeleteBtn').addEventListener('click', deleteFile);
    }
    
    let currentFileData = null;
    
    function openModal(fileData) {
        currentFileData = fileData;
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const modalDeleteBtn = document.getElementById('modalDeleteBtn');
        
        if (fileData.type && fileData.type.startsWith('image/')) {
            // Encode the filename part of the path
            const pathParts = fileData.path.split('/');
            const filename = pathParts[pathParts.length - 1];
            const encodedPath = pathParts.slice(0, -1).join('/') + '/' + encodeURIComponent(filename);
            modalImage.src = encodedPath;
            modalImage.onerror = function() {
                console.error('Failed to load image:', encodedPath);
                console.error('File data:', fileData);
                // Try original path
                if (this.src !== fileData.path) {
                    this.src = fileData.path;
                }
            };
            
            // Show/hide delete button based on permissions
            const canEditCaption = fileData.canEditCaption === true;
            if (canEditCaption) {
                modalDeleteBtn.style.display = 'block';
            } else {
                modalDeleteBtn.style.display = 'none';
            }
            
            modal.classList.add('active');
        }
    }
    
    function closeModal() {
        const modal = document.getElementById('imageModal');
        modal.classList.remove('active');
        currentFileData = null;
    }
    
    async function deleteFile() {
        if (!currentFileData) return;
        
        const canEditCaption = currentFileData.canEditCaption === true;
        if (!canEditCaption) {
            showErrorMessage('Only the file uploader can delete files.');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/files/${countrySlug}/delete/${currentFileData.id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-ID': userId
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                closeModal();
                // Reload files to remove the deleted file
                await loadFiles();
                showSuccessMessage('File deleted successfully!');
            } else {
                showErrorMessage('Failed to delete: ' + result.error);
            }
        } catch (error) {
            console.error('Delete error:', error);
            showErrorMessage('Failed to delete: ' + error.message);
        }
    }
    
    async function uploadFiles(files) {
        try {
            // Show uploading indicator
            showUploadingIndicator();
            
            const formData = new FormData();
            
            files.forEach((file) => {
                formData.append('files', file);
            });
            
            const response = await fetch(`/api/upload/${countrySlug}`, {
                method: 'POST',
                headers: {
                    'X-User-ID': userId
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Reload files to show the new uploads
                loadFiles();
                showSuccessMessage(`${result.message}`);
            } else {
                showErrorMessage('Upload failed: ' + result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            showErrorMessage('Upload failed: ' + error.message);
        } finally {
            hideUploadingIndicator();
        }
    }
    
    async function loadFiles() {
        try {
            console.log('Loading files for country:', countrySlug);
            
            const response = await fetch(`/api/files/${countrySlug}`, {
                headers: {
                    'X-User-ID': userId
                }
            });
            
            const contentType = response.headers.get('content-type') || '';
            const responseText = await response.text();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, message: ${responseText.substring(0, 200)}`);
            }
            
            if (!contentType.includes('application/json')) {
                throw new Error(`Expected JSON but got: ${contentType}. Response: ${responseText.substring(0, 100)}`);
            }
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', responseText.substring(0, 500));
                throw new Error(`Failed to parse JSON response: ${parseError.message}`);
            }
            
            if (!result.success) {
                throw new Error(result.error || 'Unknown error from server');
            }
            
            if (result.files && result.files.length > 0) {
                // Remove "no files" message
                const noFilesMsg = filesDisplay.querySelector('.no-files');
                if (noFilesMsg) {
                    noFilesMsg.remove();
                }
                
                // Clear existing files (in case of reload)
                filesDisplay.innerHTML = '';
                
                // Create grid container
                const grid = document.createElement('div');
                grid.className = 'files-grid';
                
                // Separate images from other files
                const images = [];
                const otherFiles = [];
                
                result.files.forEach(fileData => {
                    if (fileData.type && fileData.type.startsWith('image/')) {
                        images.push(fileData);
                    } else {
                        otherFiles.push(fileData);
                    }
                });
                
                // Display images in grid
                images.forEach(fileData => {
                    const item = createImageThumbnail(fileData);
                    grid.appendChild(item);
                });
                
                // Display other files
                otherFiles.forEach(fileData => {
                    const item = createNonImageItem(fileData);
                    grid.appendChild(item);
                });
                
                filesDisplay.appendChild(grid);
            } else {
                // Show "no files" message if empty
                if (!filesDisplay.querySelector('.no-files')) {
                    filesDisplay.innerHTML = '<p class="no-files">No files uploaded yet. Click "Upload File" to get started!</p>';
                }
            }
        } catch (error) {
            console.error('Load files error:', error);
            showErrorMessage('Failed to load files: ' + error.message);
        }
    }
    
    function createImageThumbnail(fileData) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item image-item';
        fileItem.setAttribute('data-file-id', fileData.id);
        
        const img = document.createElement('img');
        img.className = 'file-preview-thumbnail';
        // Encode the filename part of the path
        const pathParts = fileData.path.split('/');
        const filename = pathParts[pathParts.length - 1];
        const encodedPath = pathParts.slice(0, -1).join('/') + '/' + encodeURIComponent(filename);
        img.src = encodedPath;
        img.alt = 'Image';
        img.loading = 'lazy';
        
        // Add error handling for failed image loads
        img.onerror = function() {
            console.error('Failed to load thumbnail:', encodedPath);
            console.error('File data:', fileData);
            // Try original path
            if (this.src !== fileData.path) {
                this.src = fileData.path;
            } else {
                this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect width="150" height="150" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3EImage not found%3C/text%3E%3C/svg%3E';
                this.style.opacity = '0.5';
            }
        };
        
        fileItem.appendChild(img);
        
        // Add click handler to open modal
        fileItem.addEventListener('click', () => {
            openModal(fileData);
        });
        
        return fileItem;
    }
    
    function createNonImageItem(fileData) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item non-image';
        
        const fileIcon = getFileIcon(fileData.type);
        const fileSize = formatFileSize(fileData.size);
        
        fileItem.innerHTML = `
            <div class="file-icon">${fileIcon}</div>
            <div class="file-info">
                <p class="file-name">File</p>
                <p class="file-size">${fileSize}</p>
            </div>
            <a href="${fileData.path}" target="_blank" class="file-download" download="${fileData.filename}">⬇️</a>
        `;
        
        return fileItem;
    }
    
    function getFileIcon(fileType) {
        if (!fileType) return '📁';
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('text')) return '📄';
        if (fileType.includes('video')) return '🎥';
        if (fileType.includes('audio')) return '🎵';
        return '📁';
    }
    
    function formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showUploadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'uploading-indicator';
        indicator.className = 'uploading-indicator';
        indicator.textContent = 'Uploading...';
        document.querySelector('.upload-section').appendChild(indicator);
    }
    
    function hideUploadingIndicator() {
        const indicator = document.getElementById('uploading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    function showSuccessMessage(message) {
        const msg = document.createElement('div');
        msg.className = 'success-message';
        msg.textContent = message;
        document.querySelector('.upload-section').appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }
    
    function showErrorMessage(message) {
        const msg = document.createElement('div');
        msg.className = 'error-message';
        msg.textContent = message;
        document.querySelector('.upload-section').appendChild(msg);
        setTimeout(() => msg.remove(), 5000);
    }
});
