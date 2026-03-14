(function(GSync) {
    'use strict';

    GSync.config = {
        // Firebase 설정 (GitHub Actions에서 주입됨)
        firebase: {
            apiKey: '__FIREBASE_API_KEY__',
            authDomain: '__FIREBASE_AUTH_DOMAIN__',
            projectId: '__FIREBASE_PROJECT_ID__',
            storageBucket: '__FIREBASE_STORAGE_BUCKET__',
            messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
            appId: '__FIREBASE_APP_ID__'
        },

        // Cloud 설정
        cloud: {
            region: 'asia-northeast1',
            functionUrl: (functionName) => {
                const projectId = GSync.config.firebase.projectId;
                return `https://asia-northeast1-${projectId}.cloudfunctions.net/${functionName}`;
            }
        },

        // 타임아웃 설정
        timeout: {
            extract: 90000,      // 데이터 추출 (90초)
            update: 30000,       // 데이터 업데이트 (30초)
            fill: 90000,         // 서식 채우기 (90초)
            briefing: 160000,    // AI 브리핑 (160초)
            delete: 30000        // 삭제 (30초)
        },

        // UI 설정
        ui: {
            toastDuration: 3000, // 토스트 표시 시간 (3초)
            pageSize: 10         // 페이지네이션 기본값
        },

        // 카테고리 메타데이터
        categories: {
            '기본정보': {
                label: '기본 정보',
                icon: '🏷️',
                description: '사업의 공식 명칭, 코드, 유형'
            },
            '담당정보': {
                label: '담당 기관 및 담당자',
                icon: '👤',
                description: '주관 부처, 담당 부서, 담당자 연락처'
            },
            '사업상세': {
                label: '사업 상세 정보',
                icon: '📄',
                description: '목적, 근거, 기간, 진행 상황'
            },
            '재정정보': {
                label: '재정 정보',
                icon: '💰',
                description: '예산, 출처, 연차별 계획'
            },
            '대상지역': {
                label: '대상 및 지역 정보',
                icon: '🗺️',
                description: '사업 대상자, 지역, GPS 좌표'
            },
            '성과목표': {
                label: '성과 및 목표',
                icon: '📈',
                description: '정량/정성 목표, KPI'
            },
            '협력정보': {
                label: '협력 기관 정보',
                icon: '🤝',
                description: '협력 기관, MOU 체결 여부'
            },
            '기타정보': {
                label: '기타 행정 정보',
                icon: '⚙️',
                description: '유사 사업, 승인 현황, 첨부 자료'
            }
        },

        // 지원 파일 확장자
        supportedExtensions: ['.txt', '.docx', '.pdf', '.xlsx', '.xls']
    };

})(window.GSync = window.GSync || {});
