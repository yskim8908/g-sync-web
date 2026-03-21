(function(GSync) {
    'use strict';

    GSync.tab_upload = {
        render() {
            const container = document.getElementById('upload-container');
            container.innerHTML = `
                <div class="space-y-6">
                    <!-- 드래그앤드롭 영역 -->
                    <div class="dropzone" id="dropzone">
                        <div class="text-4xl mb-3">📄</div>
                        <p class="text-lg font-semibold text-slate-900 mb-1">파일을 드래그하여 업로드하세요</p>
                        <p class="text-slate-600 text-sm">또는 클릭하여 파일 선택</p>
                        <input type="file" id="file-input" class="hidden" accept=".txt,.docx,.pdf,.xlsx,.xls">
                    </div>

                    <!-- 주의사항 -->
                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4">
                        <p class="text-sm text-amber-700">
                            <strong>📌 지원 형식:</strong> TXT, DOCX, PDF, XLSX, XLS<br>
                            <strong>💾 권장 크기:</strong> 50KB 이하 (대용량 파일은 처리가 느릴 수 있습니다)
                        </p>
                    </div>

                    <!-- 추출 결과 미리보기 -->
                    <div id="preview-area"></div>

                    <!-- 최근 업로드 목록 -->
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900 mb-4">최근 업로드</h3>
                        <div id="upload-list" class="space-y-2"></div>
                    </div>
                </div>
            `;

            this.attachEventListeners();
            this.loadRecentUploads();
        },

        attachEventListeners() {
            const dropzone = document.getElementById('dropzone');
            const fileInput = document.getElementById('file-input');

            // 드래그앤드롭
            dropzone.addEventListener('click', () => fileInput.click());
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFile(files[0]);
                }
            });

            // 파일 선택
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFile(e.target.files[0]);
                }
            });
        },

        async handleFile(file) {
            const user = GSync.state.getUser();
            if (!user) {
                GSync.toast.error('로그인이 필요합니다');
                return;
            }

            // 파일 확장자 확인
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!GSync.config.supportedExtensions.includes(ext)) {
                GSync.toast.error(`지원하지 않는 파일 형식입니다: ${ext}`);
                return;
            }

            // 파일 읽기
            GSync.progress.show('파일을 읽는 중...');

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    // ArrayBuffer → Base64 인코딩 (바이너리 파일 안전 전송)
                    const arrayBuffer = e.target.result;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    let binary = '';
                    for (let i = 0; i < uint8Array.length; i++) {
                        binary += String.fromCharCode(uint8Array[i]);
                    }
                    const fileBase64 = btoa(binary);

                    // extractData API 호출
                    GSync.progress.show('AI가 데이터를 추출 중입니다...');
                    const result = await GSync.api.extractData(
                        user.id,
                        file.name,
                        fileBase64,
                        ext.substring(1)
                    );

                    if (result.success) {
                        const newTaskId = result.uploadId;
                        const currentProjectId = GSync.state.getCurrentProjectId();

                        // 자동 판단: 기존 사업에 병합할지 여부
                        if (currentProjectId && currentProjectId !== newTaskId) {
                            // 기존 사업에 병합 모드
                            GSync.progress.show('데이터를 기존 사업에 병합 중입니다...');

                            const mergeResult = await GSync.api.mergeUploadData(
                                user.id,
                                currentProjectId,  // targetTaskId (유지할 사업)
                                newTaskId          // sourceTaskId (방금 업로드한 파일)
                            );

                            if (mergeResult.success) {
                                // 병합 후 Firestore에서 업데이트된 데이터 조회
                                try {
                                    const { _getDoc: getDoc, _doc: doc } = window;
                                    const updatedTask = await getDoc(doc(window._db, `users/${user.id}/tasks/${currentProjectId}`));
                                    if (updatedTask.exists()) {
                                        const updatedData = updatedTask.data().extractedData;
                                        GSync.state.setSession('extractedData', updatedData);
                                        this.showPreview(updatedData);
                                    }
                                } catch (error) {
                                    console.error('[tab-upload] 병합 후 데이터 조회 실패:', error);
                                }

                                GSync.progress.hide();
                                GSync.toast.success('데이터가 기존 사업에 병합되었습니다');
                            } else {
                                GSync.progress.hide();
                                GSync.toast.error(`병합 실패: ${mergeResult.error}`);
                            }
                        } else {
                            // 새 사업 모드
                            GSync.state.setSession('extractedData', result.data);
                            GSync.state.setSession('uploadId', newTaskId);
                            GSync.state.setSession('extractMeta', result.meta);
                            GSync.state.setCurrentProjectId(newTaskId);

                            GSync.progress.hide();
                            GSync.toast.success(`${file.name} 추출 완료!`);

                            // UI 업데이트
                            this.showPreview(result.data);
                        }

                        this.loadRecentUploads();
                    } else {
                        GSync.progress.hide();
                        GSync.toast.error(`추출 실패: ${result.error}`);
                    }
                } catch (error) {
                    GSync.progress.hide();
                    GSync.toast.error(`오류: ${error.message}`);
                }
            };

            reader.onerror = () => {
                GSync.progress.hide();
                GSync.toast.error('파일을 읽을 수 없습니다');
            };

            reader.readAsArrayBuffer(file);
        },

        showPreview(data) {
            const container = document.getElementById('preview-area');
            if (!data || Object.keys(data).length === 0) {
                container.innerHTML = '';
                return;
            }

            let html = '<div class="bg-green-50 border border-green-200 rounded-lg p-6"><h3 class="font-semibold text-green-900 mb-4">✅ 추출된 데이터</h3>';
            html += '<div class="data-grid">';

            // 각 카테고리의 필드 표시
            Object.entries(data).forEach(([category, fields]) => {
                if (typeof fields === 'object' && fields !== null) {
                    Object.entries(fields).forEach(([field, value]) => {
                        if (value) {
                            const displayValue = typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : String(value).substring(0, 100);
                            html += `
                                <div class="data-card">
                                    <div class="data-card-title">${field}</div>
                                    <div class="data-card-value">${displayValue}</div>
                                </div>
                            `;
                        }
                    });
                }
            });

            html += '</div><p class="text-sm text-green-700 mt-4">💡 데이터 관리 탭에서 상세 편집이 가능합니다</p></div>';
            container.innerHTML = html;
        },

        async loadRecentUploads() {
            try {
                const user = GSync.state.getUser();
                const projectId = GSync.state.getCurrentProjectId();

                if (!user || !projectId) {
                    return;
                }

                // app.html의 module 스크립트에서 window._* 형태로 노출된 Firestore 함수를 가져옴
                const {
                    _collection: collection,
                    _getDocs: getDocs,
                    _orderBy: orderBy,
                    _query: query,
                    _limit: limit,
                    _getDoc: getDoc,
                    _doc: doc
                } = window;
                const taskRef = `users/${user.id}/tasks/${projectId}`;

                // 현재 task 문서 로드
                const taskSnap = await getDoc(doc(window._db, taskRef));

                if (!taskSnap.exists()) {
                    return;
                }

                const taskData = taskSnap.data();
                const listHtml = document.getElementById('upload-list');

                if (taskData.fileName) {
                    listHtml.innerHTML = `
                        <div class="card">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="font-semibold text-slate-900">${taskData.fileName}</p>
                                    <p class="text-sm text-slate-600">
                                        ${taskData.uploadedAt ? new Date(taskData.uploadedAt.toDate()).toLocaleString('ko-KR') : '날짜 없음'}
                                    </p>
                                </div>
                                <div class="text-right">
                                    <span class="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                        ${taskData.status === 'completed' ? '✅ 완료' : '⏳ 처리중'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    listHtml.innerHTML = '<p class="text-slate-600 text-sm">업로드된 파일이 없습니다</p>';
                }
            } catch (error) {
                console.error('Failed to load recent uploads:', error);
            }
        }
    };

})(window.GSync = window.GSync || {});
