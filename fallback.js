// fallback.js
// Samsung/Android camera capture fallback
(function() {
    function handleFileInput(input) {
        input.addEventListener('change', async () => {
            if (!input.files || input.files.length === 0) return;

            let file = input.files[0];

            // Retry if file size is 0 (common Samsung bug)
            let retries = 5;
            while (file.size === 0 && retries > 0) {
                await new Promise(r => setTimeout(r, 200));
                retries--;
            }

            // Generate a Blob URL
            const blobURL = URL.createObjectURL(file);

            // Attempt to find the history container (adjust selector to your app)
            const container = document.querySelector('#riwayat-list, .history-list, #borrowed-photos');
            if (container) {
                const img = document.createElement('img');
                img.src = blobURL;
                img.alt = 'Borrowed/Returned Photo';
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
                img.style.margin = '5px';
                container.appendChild(img);
            }

            // Dispatch a custom event for original app.js in case it listens
            const event = new Event('fallback-file-ready', { bubbles: true });
            input.dispatchEvent(event);
        });
    }

    // Observe any dynamically added file inputs
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.tagName === 'INPUT' && node.type === 'file' && node.capture) {
                    handleFileInput(node);
                } else if (node.querySelectorAll) {
                    node.querySelectorAll('input[type="file"][capture]').forEach(handleFileInput);
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Patch existing inputs on page load
    document.querySelectorAll('input[type="file"][capture]').forEach(handleFileInput);
})();
