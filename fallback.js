// Simple Samsung Device Photo Fallback - Add this to fallback.js
// This provides gentle fallbacks without overriding existing functions

/* Samsung Device Detection */
function isSamsungDevice() {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('samsung') || 
         ua.includes('sm-') || 
         ua.includes('galaxy') ||
         (ua.includes('android') && ua.includes('wv'));
}

/* Enhanced dataURLtoBlob for Samsung devices */
function samsungDataURLtoBlob(dataurl) {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  } catch(e) {
    console.error('samsungDataURLtoBlob failed', e);
    return null;
  }
}

/* Samsung-specific image resize */
function samsungResizeImage(file, maxW, maxH) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = e => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let { width, height } = img;
          if (width > maxW || height > maxH) {
            const scale = Math.min(maxW / width, maxH / height);
            width *= scale;
            height *= scale;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Samsung-specific quality settings
          let quality = 0.8;
          if (file.size > 5 * 1024 * 1024) quality = 0.5;
          else if (file.size > 2 * 1024 * 1024) quality = 0.6;
          
          // Use setTimeout to help with Samsung timing issues
          setTimeout(() => {
            try {
              const dataURL = canvas.toDataURL('image/jpeg', quality);
              resolve(dataURL);
            } catch (canvasErr) {
              console.error('Samsung canvas toDataURL failed:', canvasErr);
              resolve(null);
            }
          }, 50);
          
        } catch (err) {
          console.error('Samsung image processing failed:', err);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.error('Samsung image load failed');
        resolve(null);
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      console.error('Samsung FileReader failed');
      resolve(null);
    };
    
    reader.readAsDataURL(file);
  });
}

/* Monkey patch existing functions only if Samsung device detected */
if (isSamsungDevice()) {
  console.log('Samsung device detected - applying gentle photo patches');
  
  // Store original functions
  const originalDataURLtoBlob = window.dataURLtoBlob;
  const originalResizeImage = window.resizeImage;
  
  // Patch dataURLtoBlob with retry logic
  window.dataURLtoBlob = function(dataurl) {
    try {
      const result = originalDataURLtoBlob ? originalDataURLtoBlob(dataurl) : samsungDataURLtoBlob(dataurl);
      if (!result) {
        // Samsung fallback
        return samsungDataURLtoBlob(dataurl);
      }
      return result;
    } catch (e) {
      console.log('Using Samsung dataURLtoBlob fallback');
      return samsungDataURLtoBlob(dataurl);
    }
  };
  
  // Patch resizeImage with Samsung-specific handling
  window.resizeImage = function(file, maxW, maxH) {
    return new Promise(async (resolve) => {
      try {
        // Try original method first
        if (originalResizeImage) {
          const result = await originalResizeImage(file, maxW, maxH);
          if (result) {
            resolve(result);
            return;
          }
        }
        
        // Samsung fallback
        console.log('Using Samsung resize fallback');
        const result = await samsungResizeImage(file, maxW || 1024, maxH || 1024);
        resolve(result);
        
      } catch (err) {
        console.error('All resize methods failed:', err);
        // Last resort: try Samsung method
        const fallbackResult = await samsungResizeImage(file, maxW || 1024, maxH || 1024);
        resolve(fallbackResult);
      }
    });
  };
  
  // Add Samsung-specific putPhoto retry
  const originalPutPhoto = window.putPhoto;
  window.putPhoto = async function(id, blob) {
    let attempts = 3;
    while (attempts > 0) {
      try {
        const result = await originalPutPhoto(id, blob);
        return result;
      } catch (err) {
        attempts--;
        if (attempts === 0) throw err;
        console.log(`Samsung putPhoto retry, attempts left: ${attempts}`);
        await new Promise(r => setTimeout(r, 200)); // Wait before retry
      }
    }
  };
  
  // Samsung-specific UI feedback
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      // Add Samsung device indicator
      const header = document.querySelector('.header .subtitle');
      if (header) {
        header.textContent += ' (Samsung Mode)';
      }
      
      // Add helpful hints for Samsung users
      const borrowContainer = document.getElementById('borrowPhotoContainer');
      const returnContainer = document.getElementById('returnPhotoContainer');
      
      [borrowContainer, returnContainer].forEach(container => {
        if (container) {
          const placeholder = container.querySelector('.upload-placeholder small');
          if (placeholder) {
            placeholder.textContent = 'Ketuk untuk ambil foto (Samsung: tunggu sebentar setelah ambil foto)';
          }
        }
      });
    }, 1000);
  });
  
  // Override toast messages for Samsung feedback
  const originalShowToast = window.showToast;
  window.showToast = function(msg, type) {
    if (msg === 'Foto Ditambahkan') {
      originalShowToast('Foto Berhasil Disimpan (Samsung)', type || 'success');
    } else {
      originalShowToast(msg, type);
    }
  };
}

// Samsung-specific error handling improvements
if (isSamsungDevice()) {
  // Catch unhandled photo-related errors
  window.addEventListener('error', function(e) {
    if (e.message && (e.message.includes('canvas') || e.message.includes('blob') || e.message.includes('IndexedDB'))) {
      console.error('Samsung photo error caught:', e.message);
      // Show user-friendly message
      if (typeof showToast === 'function') {
        showToast('Foto gagal diproses, coba ambil ulang', 'warning');
      }
    }
  });
  
  // Additional Samsung debugging
  console.log('Samsung device info:', {
    userAgent: navigator.userAgent.substring(0, 100) + '...',
    deviceMemory: navigator.deviceMemory || 'unknown',
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
  });
}
