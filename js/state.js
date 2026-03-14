(function(GSync) {
    'use strict';

    const STORAGE_KEYS = {
        USER: 'gsync_user',
        CURRENT_PROJECT: 'gsync_current_project',
        SESSION: 'gsync_session'
    };

    GSync.state = {
        // 이벤트 리스너 저장소
        _listeners: {},

        // 메모리 캐시
        _mem: {
            projectList: [],
            projectNames: {}
        },

        // 사용자 정보 조회
        getUser() {
            const stored = localStorage.getItem(STORAGE_KEYS.USER);
            return stored ? JSON.parse(stored) : null;
        },

        // 사용자 정보 저장
        setUser(user) {
            if (user) {
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
            } else {
                localStorage.removeItem(STORAGE_KEYS.USER);
            }
            this.emit('user:changed', user);
        },

        // 현재 사업 ID 조회
        getCurrentProjectId() {
            return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT);
        },

        // 현재 사업 ID 저장
        setCurrentProjectId(projectId) {
            if (projectId) {
                localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, projectId);
            } else {
                localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
            }
            this.emit('project:changed', projectId);
        },

        // 세션 데이터 조회
        getSession(key) {
            const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
            const session = stored ? JSON.parse(stored) : {};
            return key ? session[key] : session;
        },

        // 세션 데이터 저장
        setSession(key, value) {
            const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
            const session = stored ? JSON.parse(stored) : {};
            session[key] = value;
            sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        },

        // 세션 데이터 삭제
        clearSession(key) {
            if (key) {
                const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
                const session = stored ? JSON.parse(stored) : {};
                delete session[key];
                sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            } else {
                sessionStorage.removeItem(STORAGE_KEYS.SESSION);
            }
        },

        // 로그아웃 (모든 상태 초기화)
        logout() {
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT);
            sessionStorage.removeItem(STORAGE_KEYS.SESSION);
            this._mem = { projectList: [], projectNames: {} };
            this.emit('logout');
        },

        // 이벤트 리스너 등록
        on(event, callback) {
            if (!this._listeners[event]) {
                this._listeners[event] = [];
            }
            this._listeners[event].push(callback);
        },

        // 이벤트 리스너 제거
        off(event, callback) {
            if (this._listeners[event]) {
                this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
            }
        },

        // 이벤트 발생
        emit(event, data) {
            if (this._listeners[event]) {
                this._listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (e) {
                        console.error(`Error in event listener for ${event}:`, e);
                    }
                });
            }
        }
    };

})(window.GSync = window.GSync || {});
