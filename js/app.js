(function(GSync) {
    'use strict';

    GSync.app = {
        init() {
            // 사용자 인증 확인
            const user = GSync.state.getUser();
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            // 모듈 초기화
            GSync.sidebar.init();
            GSync.router.init();

            // 이벤트 리스너
            GSync.state.on('logout', () => {
                window.location.href = 'index.html';
            });

            console.log('✅ G-Sync App initialized successfully');
        }
    };

})(window.GSync = window.GSync || {});
