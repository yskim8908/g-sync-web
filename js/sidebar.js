(function(GSync) {
    'use strict';

    GSync.sidebar = {
        init() {
            // 사용자 정보 표시
            const user = GSync.state.getUser();
            if (user) {
                document.getElementById('user-name').textContent = user.name || '';
                document.getElementById('user-email').textContent = user.email;
            } else {
                window.location.href = 'index.html';
            }

            // 로그아웃 버튼
            document.getElementById('logout-btn').addEventListener('click', () => {
                if (confirm('로그아웃하시겠습니까?')) {
                    GSync.state.logout();
                    window.location.href = 'index.html';
                }
            });

            // 사업 선택 드롭다운
            const selector = document.getElementById('project-selector');
            selector.addEventListener('change', async () => {
                const projectId = selector.value;
                if (projectId) {
                    GSync.state.setCurrentProjectId(projectId);
                    GSync.sidebar.updateProjectName();
                    GSync.state.emit('project:changed', projectId);
                }
            });

            // 초기 사업 목록 로드
            this.loadProjects();

            // 사업 변경 이벤트 리스너
            GSync.state.on('project:changed', () => {
                this.updateProjectName();
            });
        },

        async loadProjects() {
            try {
                const user = GSync.state.getUser();
                if (!user) return;

                const { collection, getDocs } = window;
                const tasksRef = collection(window._db, `users/${user.id}/tasks`);
                const snapshot = await getDocs(tasksRef);

                const projects = [];
                const names = {};

                snapshot.forEach(doc => {
                    const data = doc.data();
                    projects.push({
                        id: doc.id,
                        fileName: data.fileName,
                        uploadedAt: data.uploadedAt
                    });
                    names[doc.id] = data.fileName;
                });

                // 메모리 캐시 업데이트
                GSync.state._mem.projectList = projects;
                GSync.state._mem.projectNames = names;

                // 드롭다운 업데이트
                this.updateDropdown(projects);

                // 현재 선택된 사업이 없으면 첫 번째 선택
                const currentProjectId = GSync.state.getCurrentProjectId();
                if (!currentProjectId && projects.length > 0) {
                    GSync.state.setCurrentProjectId(projects[0].id);
                }

            } catch (error) {
                console.error('Failed to load projects:', error);
            }
        },

        updateDropdown(projects) {
            const selector = document.getElementById('project-selector');
            const currentValue = selector.value;

            // 기존 옵션 제거 (첫 번째 제외)
            while (selector.options.length > 1) {
                selector.remove(1);
            }

            // 새 옵션 추가
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.fileName || `사업 ${project.id}`;
                selector.appendChild(option);
            });

            // 이전 값 복원
            selector.value = currentValue;
        },

        updateProjectName() {
            const projectId = GSync.state.getCurrentProjectId();
            const nameEl = document.getElementById('current-project-name');

            if (projectId && GSync.state._mem.projectNames[projectId]) {
                nameEl.textContent = `📌 ${GSync.state._mem.projectNames[projectId]}`;
            } else {
                nameEl.textContent = '';
            }
        }
    };

})(window.GSync = window.GSync || {});
