(function(GSync) {
    'use strict';

    // 카테고리별 필드 정의
    const CATEGORY_FIELDS = {
        '기본정보': [
            { name: '사업명', type: 'text', required: true },
            { name: '사업영문명', type: 'text' },
            { name: '사업코드', type: 'text' },
            { name: '사업유형', type: 'select', values: ['신규', '기존', '개선'] }
        ],
        '담당정보': [
            { name: '주관부처', type: 'text', required: true },
            { name: '담당부서', type: 'text', required: true },
            { name: '담당자명', type: 'text' },
            { name: '담당자연락처', type: 'text' }
        ],
        '사업상세': [
            { name: '사업목적', type: 'textarea' },
            { name: '추진배경', type: 'textarea' },
            { name: '추진근거', type: 'text' },
            { name: '사업기간_시작', type: 'date' },
            { name: '사업기간_종료', type: 'date' },
            { name: '진행상황', type: 'select', values: ['계획중', '진행중', '완료'] }
        ],
        '재정정보': [
            { name: '총예산액', type: 'number', unit: '원' },
            { name: '예산출처', type: 'select', values: ['국고', '지방비', '기타', '국고+지방비'] },
            { name: '예산분배방식', type: 'select', values: ['일괄', '분기별', '월별'] }
        ],
        '대상지역': [
            { name: '사업대상지역', type: 'textarea' },
            { name: '대상자', type: 'textarea' },
            { name: '지역코드', type: 'text' }
        ],
        '성과목표': [
            { name: '정량목표', type: 'textarea' },
            { name: '정성목표', type: 'textarea' },
            { name: 'KPI', type: 'textarea' }
        ],
        '협력정보': [
            { name: '협력기관', type: 'textarea' },
            { name: 'MOU체결여부', type: 'select', values: ['예', '아니오'] }
        ],
        '기타정보': [
            { name: '유사사업', type: 'textarea' },
            { name: '승인현황', type: 'text' },
            { name: '첨부자료', type: 'textarea' }
        ]
    };

    GSync.tab_manage = {
        currentTab: '기본정보',
        formData: {},

        render() {
            const container = document.getElementById('manage-container');

            // 현재 사업 확인
            const projectId = GSync.state.getCurrentProjectId();
            if (!projectId) {
                container.innerHTML = '<div class="bg-blue-50 border border-blue-200 rounded-lg p-4"><p class="text-blue-700">먼저 사업을 선택해주세요</p></div>';
                return;
            }

            // 카테고리 탭
            const categoryOrder = ['기본정보', '담당정보', '사업상세', '재정정보', '대상지역', '성과목표', '협력정보', '기타정보'];
            const categoryTabs = categoryOrder.map(cat => `
                <button class="category-tab px-4 py-2 font-semibold transition-colors ${cat === this.currentTab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-600 hover:text-slate-900'}" data-category="${cat}">
                    ${GSync.config.categories[cat].icon} ${GSync.config.categories[cat].label}
                </button>
            `).join('');

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- 카테고리 탭 네비게이션 -->
                    <div class="border-b border-slate-200 flex overflow-x-auto">
                        ${categoryTabs}
                    </div>

                    <!-- 폼 영역 -->
                    <div id="form-container" class="bg-white rounded-lg border border-slate-200 p-6 space-y-4"></div>

                    <!-- 저장 버튼 -->
                    <div class="flex gap-2">
                        <button id="save-btn" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            💾 저장
                        </button>
                        <button id="delete-btn" class="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors">
                            🗑️ 삭제
                        </button>
                    </div>
                </div>
            `;

            // 이벤트 리스너
            document.querySelectorAll('.category-tab').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.currentTab = e.target.dataset.category;
                    this.render();
                });
            });

            document.getElementById('save-btn').addEventListener('click', () => this.save());
            document.getElementById('delete-btn').addEventListener('click', () => this.delete());

            // 폼 렌더링
            this.loadFormData();
            this.renderForm();
        },

        loadFormData() {
            // sessionStorage에서 추출된 데이터 로드
            const sessionData = GSync.state.getSession('extractedData');
            if (sessionData) {
                this.formData = JSON.parse(JSON.stringify(sessionData)); // 깊은 복사
            } else {
                // 빈 폼으로 초기화
                this.formData = {};
            }
        },

        renderForm() {
            const container = document.getElementById('form-container');
            const fields = CATEGORY_FIELDS[this.currentTab] || [];

            let html = '';
            fields.forEach(field => {
                const categoryKey = this.currentTab;
                const value = this.formData[categoryKey]?.[field.name] || '';

                if (field.type === 'text') {
                    html += `
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">
                                ${field.name} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                            </label>
                            <input type="text" class="form-field w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-category="${categoryKey}" data-field="${field.name}" value="${value}">
                        </div>
                    `;
                } else if (field.type === 'textarea') {
                    html += `
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">
                                ${field.name} ${field.required ? '<span class="text-red-500">*</span>' : ''}
                            </label>
                            <textarea class="form-field w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3"
                                data-category="${categoryKey}" data-field="${field.name}">${value}</textarea>
                        </div>
                    `;
                } else if (field.type === 'number') {
                    html += `
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">
                                ${field.name} ${field.unit ? `(${field.unit})` : ''}
                            </label>
                            <input type="number" class="form-field w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-category="${categoryKey}" data-field="${field.name}" value="${value}">
                        </div>
                    `;
                } else if (field.type === 'date') {
                    html += `
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">${field.name}</label>
                            <input type="date" class="form-field w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-category="${categoryKey}" data-field="${field.name}" value="${value}">
                        </div>
                    `;
                } else if (field.type === 'select') {
                    const options = field.values.map(v => `<option value="${v}" ${v === value ? 'selected' : ''}>${v}</option>`).join('');
                    html += `
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">${field.name}</label>
                            <select class="form-field w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-category="${categoryKey}" data-field="${field.name}">
                                <option value="">선택...</option>
                                ${options}
                            </select>
                        </div>
                    `;
                }
            });

            container.innerHTML = html || '<p class="text-slate-600">필드가 없습니다</p>';

            // 폼 필드 변경 이벤트
            document.querySelectorAll('.form-field').forEach(field => {
                field.addEventListener('change', (e) => {
                    const category = e.target.dataset.category;
                    const fieldName = e.target.dataset.field;

                    if (!this.formData[category]) {
                        this.formData[category] = {};
                    }
                    this.formData[category][fieldName] = e.target.value;
                });
            });
        },

        async save() {
            let projectId = GSync.state.getCurrentProjectId();
            const user = GSync.state.getUser();

            if (!user) {
                GSync.toast.error('로그인이 필요합니다');
                return;
            }

            // 새 사업인 경우 임시 ID 생성
            if (!projectId) {
                projectId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                GSync.state.setCurrentProjectId(projectId);
            }

            GSync.progress.show('데이터를 저장 중입니다...');

            try {
                const result = await GSync.api.updateUploadData(user.id, projectId, this.formData);

                GSync.progress.hide();

                if (result.success) {
                    GSync.state.setSession('extractedData', this.formData);
                    GSync.state.setSession('uploadId', projectId);
                    GSync.toast.success('데이터가 저장되었습니다');

                    // 사이드바 프로젝트 목록 리로드
                    GSync.sidebar.loadProjects();
                } else {
                    GSync.toast.error(`저장 실패: ${result.error}`);
                }
            } catch (error) {
                GSync.progress.hide();
                GSync.toast.error(`오류: ${error.message}`);
            }
        },

        async delete() {
            const user = GSync.state.getUser();
            const projectId = GSync.state.getCurrentProjectId();

            if (!user || !projectId) {
                GSync.toast.error('필요한 정보가 없습니다');
                return;
            }

            if (!confirm('정말 이 사업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                return;
            }

            GSync.progress.show('삭제 중...');

            try {
                const result = await GSync.api.deleteProjectData(user.id, projectId);

                GSync.progress.hide();

                if (result.success) {
                    GSync.state.setCurrentProjectId(null);
                    GSync.state.clearSession();
                    GSync.toast.success('사업이 삭제되었습니다');

                    // 사업 목록 다시 로드
                    GSync.sidebar.loadProjects();
                    GSync.router.navigateTo('upload');
                } else {
                    GSync.toast.error(`삭제 실패: ${result.error}`);
                }
            } catch (error) {
                GSync.progress.hide();
                GSync.toast.error(`오류: ${error.message}`);
            }
        }
    };

})(window.GSync = window.GSync || {});
