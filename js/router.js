(function(GSync) {
    'use strict';

    const TAB_CONFIG = {
        'upload': {
            title: '📤 파일 업로드',
            description: '문서를 업로드하면 AI가 데이터를 자동으로 추출합니다'
        },
        'manage': {
            title: '📝 데이터 관리',
            description: '추출된 데이터를 카테고리별로 관리합니다'
        },
        'briefing': {
            title: '🤖 AI 브리핑',
            description: 'AI와 자유형 대화로 사업 관련 질문에 답변받습니다'
        },
        'forms': {
            title: '📋 서식 채우기',
            description: 'Word 문서를 업로드하면 데이터로 자동 채웁니다'
        },
        'download': {
            title: '📥 다운로드',
            description: '채워진 문서를 다운로드합니다'
        }
    };

    GSync.router = {
        currentTab: 'upload',

        init() {
            // 탭 버튼 클릭 이벤트
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.dataset.tab;
                    this.navigateTo(tab);
                });
            });

            // 초기 탭 설정
            this.navigateTo('upload');
        },

        navigateTo(tabName) {
            if (!TAB_CONFIG[tabName]) return;

            // 이전 탭 숨기기
            document.querySelectorAll('.tab-content').forEach(el => {
                el.classList.add('hidden');
            });

            // 새 탭 표시
            const tabEl = document.getElementById(`tab-${tabName}`);
            if (tabEl) {
                tabEl.classList.remove('hidden');
            }

            // 헤더 업데이트
            document.getElementById('tab-title').textContent = TAB_CONFIG[tabName].title;
            document.getElementById('tab-description').textContent = TAB_CONFIG[tabName].description;

            // 네비게이션 버튼 활성화 상태 업데이트
            document.querySelectorAll('.nav-btn').forEach(btn => {
                if (btn.dataset.tab === tabName) {
                    btn.classList.add('bg-slate-800', 'text-blue-400');
                } else {
                    btn.classList.remove('bg-slate-800', 'text-blue-400');
                }
            });

            this.currentTab = tabName;

            // 탭 렌더링 함수 호출
            if (GSync[`tab_${tabName}`] && GSync[`tab_${tabName}`].render) {
                GSync[`tab_${tabName}`].render();
            }
        }
    };

})(window.GSync = window.GSync || {});
