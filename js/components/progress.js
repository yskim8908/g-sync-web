(function(GSync) {
    'use strict';

    GSync.progress = {
        show(message = '처리 중...') {
            const overlay = document.getElementById('progress-overlay');
            const text = document.getElementById('progress-text');

            if (overlay) {
                text.textContent = message;
                overlay.classList.remove('hidden');
            }
        },

        hide() {
            const overlay = document.getElementById('progress-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
        }
    };

})(window.GSync = window.GSync || {});
