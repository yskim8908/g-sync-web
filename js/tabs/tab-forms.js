(function(GSync) {
    'use strict';

    GSync.tab_forms = {
        currentStep: 1,
        processingFile: null,

        render() {
            const container = document.getElementById('forms-container');

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- 단계별 진행 -->
                    <div class="grid grid-cols-3 gap-4">
                        <div class="text-center">
                            <div class="w-12 h-12 mx-auto rounded-full ${this.currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'} flex items-center justify-center font-bold mb-2">1</div>
                            <p class="text-sm font-semibold ${this.currentStep >= 1 ? 'text-slate-900' : 'text-slate-600'}">서식 업로드</p>
                        </div>
                        <div class="text-center">
                            <div class="w-12 h-12 mx-auto rounded-full ${this.currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'} flex items-center justify-center font-bold mb-2">2</div>
                            <p class="text-sm font-semibold ${this.currentStep >= 2 ? 'text-slate-900' : 'text-slate-600'}">변환 진행</p>
                        </div>
                        <div class="text-center">
                            <div class="w-12 h-12 mx-auto rounded-full ${this.currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'} flex items-center justify-center font-bold mb-2">3</div>
                            <p class="text-sm font-semibold ${this.currentStep >= 3 ? 'text-slate-900' : 'text-slate-600'}">다운로드</p>
                        </div>
                    </div>

                    <!-- 파일 업로드 -->
                    <div class="dropzone" id="forms-dropzone">
                        <div class="text-4xl mb-3">📋</div>
                        <p class="text-lg font-semibold text-slate-900 mb-1">Word 파일을 업로드하세요</p>
                        <p class="text-slate-600 text-sm">DOCX 형식만 지원합니다</p>
                        <input type="file" id="forms-file-input" class="hidden" accept=".docx">
                    </div>

                    <!-- 변환 결과 -->
                    <div id="forms-result" class="hidden bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-green-900 mb-4">✅ 변환 완료</h3>
                        <div id="result-details" class="space-y-2"></div>
                        <div class="mt-4">
                            <button id="download-result-btn" class="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                                📥 다운로드
                            </button>
                        </div>
                    </div>

                    <!-- 이전 요청 목록 -->
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900 mb-4">이전 변환 결과</h3>
                        <div id="forms-list" class="space-y-2"></div>
                    </div>
                </div>
            `;

            this.attachEventListeners();
            this.loadPreviousForms();
        },

        attachEventListeners() {
            const dropzone = document.getElementById('forms-dropzone');
            const fileInput = document.getElementById('forms-file-input');

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

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFile(e.target.files[0]);
                }
            });

            // 다운로드 버튼
            const downloadBtn = document.getElementById('download-result-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => this.downloadResult());
            }
        },

        async handleFile(file) {
            // 파일 타입 확인
            if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                GSync.toast.error('DOCX 형식만 지원합니다');
                return;
            }

            const user = GSync.state.getUser();
            const uploadId = GSync.state.getSession('uploadId');
            const extractedData = GSync.state.getSession('extractedData');

            if (!user || !uploadId) {
                GSync.toast.error('먼저 파일을 업로드하고 데이터를 추출해주세요');
                return;
            }

            // 파일 읽기
            GSync.progress.show('파일을 읽는 중...');

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    // Base64 인코딩
                    const fileBase64 = this._arrayBufferToBase64(e.target.result);

                    // fillDocument API 호출
                    GSync.progress.show('문서를 변환 중입니다...');
                    const result = await GSync.api.fillDocument(
                        user.id,
                        fileBase64,
                        file.name,
                        'docx',
                        uploadId,
                        extractedData
                    );

                    GSync.progress.hide();

                    if (result.success) {
                        this.processingFile = result;
                        this.currentStep = 3;
                        this.showResult(result);
                        GSync.toast.success('문서 변환이 완료되었습니다!');
                    } else {
                        GSync.toast.error(`변환 실패: ${result.error}`);
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

        showResult(result) {
            const resultDiv = document.getElementById('forms-result');
            const detailsDiv = document.getElementById('result-details');

            if (!resultDiv || !detailsDiv) return;

            let html = `
                <div class="space-y-2">
                    <p><strong>파일명:</strong> ${result.fileName || 'unknown'}</p>
                    <p><strong>변환 상태:</strong> 완료</p>
            `;

            if (result.data) {
                if (result.data.filled_fields && Array.isArray(result.data.filled_fields)) {
                    html += `<p><strong>채워진 필드:</strong> ${result.data.filled_fields.length}개</p>`;
                }
                if (result.data.missing_data && Array.isArray(result.data.missing_data)) {
                    if (result.data.missing_data.length > 0) {
                        html += `<p class="text-amber-700"><strong>⚠️ 채우지 못한 필드:</strong> ${result.data.missing_data.join(', ')}</p>`;
                    }
                }
            }

            html += '</div>';
            detailsDiv.innerHTML = html;
            resultDiv.classList.remove('hidden');

            // Render 다시 호출하여 UI 업데이트
            this.render();
        },

        downloadResult() {
            if (!this.processingFile) {
                GSync.toast.error('다운로드할 파일이 없습니다');
                return;
            }

            // 실제 구현에서는 base64 또는 blob URL로 다운로드
            // 여기서는 메시지만 표시
            GSync.toast.info('다운로드 기능은 Tab 5: 다운로드에서 처리됩니다');
            GSync.router.navigateTo('download');
        },

        async loadPreviousForms() {
            try {
                const user = GSync.state.getUser();
                if (!user) return;

                const uploadId = GSync.state.getSession('uploadId');
                if (!uploadId) {
                    document.getElementById('forms-list').innerHTML = '<p class="text-slate-600 text-sm">업로드된 파일이 없습니다</p>';
                    return;
                }

                // Firestore에서 이전 변환 결과 조회
                const { collection, query, orderBy, getDocs } = window;
                const formsRef = collection(window._db, `users/${user.id}/tasks/${uploadId}/forms`);

                const snapshot = await getDocs(formsRef);

                if (snapshot.empty) {
                    document.getElementById('forms-list').innerHTML = '<p class="text-slate-600 text-sm">이전 변환 결과가 없습니다</p>';
                    return;
                }

                let html = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    html += `
                        <div class="card">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="font-semibold text-slate-900">${data.fileName || '알 수 없음'}</p>
                                    <p class="text-sm text-slate-600">
                                        ${data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString('ko-KR') : '날짜 없음'}
                                    </p>
                                </div>
                                <button class="px-3 py-1 bg-blue-100 text-blue-700 rounded font-semibold hover:bg-blue-200">
                                    📥 다운로드
                                </button>
                            </div>
                        </div>
                    `;
                });

                document.getElementById('forms-list').innerHTML = html;
            } catch (error) {
                console.error('Failed to load previous forms:', error);
            }
        },

        _arrayBufferToBase64(buffer) {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }
    };

})(window.GSync = window.GSync || {});
