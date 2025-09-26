// Samsung Device Photo Fallback - Add this to fallback.js

/* Samsung Device Detection and Fallbacks */
function isSamsungDevice() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('samsung') || 
         ua.includes('sm-') || 
         ua.includes('galaxy') ||
         (ua.includes('android') && ua.includes('wv')); // Samsung Internet WebView
}

function isSamsungBrowser() {
  return navigator.userAgent.toLowerCase().includes('samsungbrowser');
}

// Enhanced photo processing with Samsung fallbacks
async function processPhotoInputWithFallback(file, previewEl) {
  if (!file) return null;
  
  try {
    // Samsung-specific handling
    if (isSamsungDevice()) {
      console.log('Samsung device detected, using fallback method');
      return await processSamsungPhoto(file, previewEl);
    }
    
    // Standard processing for other devices
    return await processPhotoInput(file, previewEl);
    
  } catch (err) {
    console.error('Photo processing failed, trying Samsung fallback:', err);
    // Fallback to Samsung method even on non-Samsung devices if standard fails
    return await processSamsungPhoto(file, previewEl);
  }
}

async function processSamsungPhoto(file, previewEl) {
  try {
    if (file.size > 10 * 1024 * 1024) {
      showToast('Maks 10MB', 'warning');
      return null;
    }

    // Method 1: Direct canvas approach (works better on Samsung)
    const result = await processSamsungMethod1(file, previewEl);
    if (result) return result;
    
    // Method 2: FileReader with delayed processing
    console.log('Samsung Method 1 failed, trying Method 2');
    return await processSamsungMethod2(file, previewEl);
    
  } catch (err) {
    console.error('All Samsung photo methods failed:', err);
    // Final fallback: store as data URL directly
    return await processSamsungMethod3(file, previewEl);
  }
}

// Samsung Method 1: Direct canvas with immediate processing
async function processSamsungMethod1(file, previewEl) {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = async () => {
      try {
        // Calculate dimensions
        let { width, height } = img;
        const maxSize = 1024;
        
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width *= scale;
          height *= scale;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with specific quality for Samsung
        let quality = 0.8;
        if (file.size > 5 * 1024 * 1024) quality = 0.5;
        else if (file.size > 2 * 1024 * 1024) quality = 0.7;
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          
          const photoId = 'photo_samsung_' + uid();
          
          try {
            // Store in IndexedDB
            await putPhoto(photoId, blob);
            photoCache.set(photoId, blob);
            
            // Create preview
            const url = getObjectURLFor(photoId, blob);
            previewEl.innerHTML = `<img src="${url}" alt="preview" style="max-width:100%; height:auto;">`;
            previewEl.hidden = false;
            
            if (typeof showToast === 'function') {
              showToast('Foto Berhasil Disimpan (Samsung)', 'success');
            }
            
            resolve(photoId);
          } catch (storageErr) {
            console.error('Samsung Method 1 storage failed:', storageErr);
            resolve(null);
          }
        }, 'image/jpeg', quality);
        
      } catch (canvasErr) {
        console.error('Samsung Method 1 canvas failed:', canvasErr);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      console.error('Samsung Method 1 image load failed');
      resolve(null);
    };
    
    // Load image with Samsung-specific handling
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } else {
      resolve(null);
    }
  });
}

// Samsung Method 2: FileReader with delayed processing and retry
async function processSamsungMethod2(file, previewEl) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        // Add delay for Samsung processing
        await new Promise(r => setTimeout(r, 100));
        
        const dataUrl = e.target.result;
        const photoId = 'photo_samsung2_' + uid();
        
        // Convert dataURL to blob
        const blob = dataURLtoBlob(dataUrl);
        if (!blob) {
          resolve(null);
          return;
        }
        
        // Store with retry mechanism
        let attempts = 3;
        while (attempts > 0) {
          try {
            await putPhoto(photoId, blob);
            photoCache.set(photoId, blob);
            break;
          } catch (err) {
            attempts--;
            if (attempts === 0) throw err;
            await new Promise(r => setTimeout(r, 200));
          }
        }
        
        // Create preview
        const url = getObjectURLFor(photoId, blob);
        previewEl.innerHTML = `<img src="${url}" alt="preview" style="max-width:100%; height:auto;">`;
        previewEl.hidden = false;
        
        if (typeof showToast === 'function') {
          showToast('Foto Berhasil Disimpan (Samsung v2)', 'success');
        }
        
        resolve(photoId);
        
      } catch (err) {
        console.error('Samsung Method 2 failed:', err);
        resolve(null);
      }
    };
    
    reader.onerror = () => {
      console.error('Samsung Method 2 FileReader failed');
      resolve(null);
    };
    
    reader.readAsDataURL(file);
  });
}

// Samsung Method 3: Final fallback - store as data URL directly
async function processSamsungMethod3(file, previewEl) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target.result;
        const photoId = 'photo_dataurl_' + uid();
        
        // Store data URL directly as a special blob
        const textBlob = new Blob([dataUrl], { type: 'text/plain' });
        
        await putPhoto(photoId, textBlob);
        
        // Create preview directly from data URL
        previewEl.innerHTML = `<img src="${dataUrl}" alt="preview" style="max-width:100%; height:auto;">`;
        previewEl.hidden = false;
        
        if (typeof showToast === 'function') {
          showToast('Foto Berhasil Disimpan (Fallback)', 'success');
        }
        
        resolve(photoId);
        
      } catch (err) {
        console.error('Samsung Method 3 failed:', err);
        resolve(null);
      }
    };
    
    reader.onerror = () => {
      console.error('Samsung Method 3 FileReader failed');
      resolve(null);
    };
    
    reader.readAsDataURL(file);
  });
}

// Enhanced photo retrieval with Samsung fallback
async function getCachedPhotoWithFallback(id) {
  if (!id) return null;
  
  try {
    // Try standard method first
    const standardResult = await getCachedPhoto(id);
    if (standardResult) return standardResult;
    
    // Samsung fallback - handle data URL storage
    if (id.includes('dataurl')) {
      return await getSamsungDataUrlPhoto(id);
    }
    
    return null;
    
  } catch (err) {
    console.error('getCachedPhotoWithFallback failed:', err);
    return null;
  }
}

async function getSamsungDataUrlPhoto(id) {
  try {
    const textBlob = await getPhoto(id);
    if (!textBlob) return null;
    
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsText(textBlob);
    });
    
    if (!dataUrl) return null;
    
    // Convert back to image blob
    const response = await fetch(dataUrl);
    return await response.blob();
    
  } catch (err) {
    console.error('getSamsungDataUrlPhoto failed:', err);
    return null;
  }
}

// Override the original photo input handlers for Samsung devices
if (isSamsungDevice()) {
  console.log('Samsung device detected - applying photo fallbacks');
  
  // Wait for DOM and override handlers
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      // Override borrow photo handler
      const borrowPhoto = document.getElementById('borrowPhoto');
      if (borrowPhoto) {
        // Remove existing listeners
        const newBorrowPhoto = borrowPhoto.cloneNode(true);
        borrowPhoto.parentNode.replaceChild(newBorrowPhoto, borrowPhoto);
        
        // Add new Samsung-compatible handler
        newBorrowPhoto.addEventListener('change', async (e) => {
          const photoId = await processPhotoInputWithFallback(e.target.files[0], document.getElementById('borrowPreview'));
          e.target.dataset.photoId = photoId || '';
          
          // Scroll behavior (same as original)
          const btn = document.querySelector('#borrowForm button[type="submit"]');
          const img = document.getElementById('borrowPreview')?.querySelector('img');
          const doScroll = () => {
            if (btn) {
              try {
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } catch (err) {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }
            }
          };
          if (img) {
            if (img.complete) doScroll();
            else {
              img.addEventListener('load', doScroll, { once: true });
              setTimeout(doScroll, 500);
            }
          } else {
            setTimeout(doScroll, 200);
          }
        });
      }
      
      // Override return photo handler
      const returnPhoto = document.getElementById('returnPhoto');
      if (returnPhoto) {
        // Remove existing listeners
        const newReturnPhoto = returnPhoto.cloneNode(true);
        returnPhoto.parentNode.replaceChild(newReturnPhoto, returnPhoto);
        
        // Add new Samsung-compatible handler
        newReturnPhoto.addEventListener('change', async (e) => {
          const photoId = await processPhotoInputWithFallback(e.target.files[0], document.getElementById('returnPreview'));
          e.target.dataset.photoId = photoId || '';
          
          // Scroll behavior (same as original)
          const btn = document.querySelector('#returnForm button[type="submit"]');
          const img = document.getElementById('returnPreview')?.querySelector('img');
          const doScroll = () => {
            if (btn) {
              try {
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } catch (err) {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }
            }
          };
          if (img) {
            if (img.complete) doScroll();
            else {
              img.addEventListener('load', doScroll, { once: true });
              setTimeout(doScroll, 500);
            }
          } else {
            setTimeout(doScroll, 200);
          }
        });
      }
      
    }, 1000); // Wait a bit longer for Samsung devices
  });
}

// Samsung-specific UI feedback
if (isSamsungDevice()) {
  // Show Samsung-specific instructions
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const borrowContainer = document.getElementById('borrowPhotoContainer');
      const returnContainer = document.getElementById('returnPhotoContainer');
      
      [borrowContainer, returnContainer].forEach(container => {
        if (container) {
          const placeholder = container.querySelector('.upload-placeholder');
          if (placeholder) {
            const samsungNote = document.createElement('div');
            samsungNote.style.cssText = 'font-size:11px;color:#666;margin-top:4px;text-align:center;';
            samsungNote.textContent = 'Samsung device: Jika foto tidak muncul, coba ambil ulang';
            placeholder.appendChild(samsungNote);
          }
        }
      });
    }, 2000);
  });
}

// Debug logging for Samsung devices
if (isSamsungDevice()) {
  console.log('Samsung device info:', {
    userAgent: navigator.userAgent,
    isSamsungBrowser: isSamsungBrowser(),
    deviceMemory: navigator.deviceMemory,
    connection: navigator.connection?.effectiveType
  });
}
