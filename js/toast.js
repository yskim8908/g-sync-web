(function(GSync) {
    'use strict';

    GSync.toast = {
        show(message, type = 'info', duration = 3000) {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `mb-3 p-4 rounded-lg text-white text-sm animate-fade-in-up ${this._getTypeClass(type)}`;
            toast.textContent = message;

            container.appendChild(toast);

            // 자동 제거
            setTimeout(() => {
                toast.style.animation = 'fade-out 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }, duration);

            return toast;
        },

        success(message, duration = 3000) {
            return this.show(message, 'success', duration);
        },

        error(message, duration = 3000) {
            return this.show(message, 'error', duration);
        },

        info(message, duration = 3000) {
            return this.show(message, 'info', duration);
        },

        warning(message, duration = 3000) {
            return this.show(message, 'warning', duration);
        },

        _getTypeClass(type) {
            const classes = {
                'success': 'bg-green-500',
                'error': 'bg-red-500',
                'info': 'bg-blue-500',
                'warning': 'bg-yellow-500'
            };
            return classes[type] || classes['info'];
        }
    };

    // CSS 애니메이션 추가
    if (!document.querySelector('style[data-toast]')) {
        const style = document.createElement('style');
        style.setAttribute('data-toast', 'true');
        style.textContent = `
            @keyframes fade-in-up {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes fade-out {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(20px);
                }
            }

            .animate-fade-in-up {
                animation: fade-in-up 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

})(window.GSync = window.GSync || {});
