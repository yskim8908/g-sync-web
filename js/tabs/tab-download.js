(function(GSync) {
    'use strict';

    GSync.tab_download = {
        render() {
            const container = document.getElementById('download-container');

            // 현재 사업 확인
            const projectId = GSync.state.getCurrentProjectId();
            if (!projectId) {
                container.innerHTML = '<div class="bg-blue-50 border border-blue-200 rounded-lg p-4"><p class="text-blue-700">먼저 사업을 선택해주세요</p></div>';
                return;
            }

            container.innerHTML = `
                <div class="space-y-6">
                    <!-- 다운로드 가능한 파일 목록 -->
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900 mb-4">📋 생성된 문서</h3>
                        <div id="downloads-list" class="space-y-2"></div>
                    </div>

                    <!-- 이력 -->
                    <div>
                        <h3 class="text-lg font-semibold text-slate-900 mb-4">📜 다운로드 이력</h3>
                        <div id="downloads-history" class="space-y-2"></div>
                    </div>
                </div>
            `;

            this.loadDownloads();
        },

        async loadDownloads() {
            try {
                const user = GSync.state.getUser();
                const projectId = GSync.state.getCurrentProjectId();

                if (!user || !projectId) {
                    return;
                }

                // 생성된 문서 목록
                await this.loadFilesList(user.id, projectId);

                // 다운로드 이력
                await this.loadDownloadHistory(user.id, projectId);

            } catch (error) {
                console.error('Failed to load downloads:', error);
            }
        },

        async loadFilesList(userId, projectId) {
            try {
                const { collection, getDocs } = window;
                const formsRef = collection(window._db, `users/${userId}/tasks/${projectId}/forms`);
                const snapshot = await getDocs(formsRef);

                const container = document.getElementById('downloads-list');

                if (snapshot.empty) {
                    container.innerHTML = '<div class="text-slate-600 text-sm bg-slate-50 border border-slate-200 rounded p-4">생성된 문서가 없습니다. 서식 채우기 탭에서 문서를 변환하세요.</div>';
                    return;
                }

                let html = '';
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const createdAt = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString('ko-KR') : '날짜 없음';
                    const fileName = data.fileName || `문서_${doc.id}`;

                    html += `
                        <div class="card hover:shadow-lg transition-shadow">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <p class="font-semibold text-slate-900">📄 ${fileName}</p>
                                    <p class="text-sm text-slate-600">${createdAt}</p>
                                    ${data.data && data.data.filled_fields ? `
                                        <p class="text-xs text-slate-500 mt-1">채워진 필드: ${data.data.filled_fields.length}개</p>
                                    ` : ''}
                                </div>
                                <button class="download-btn px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors" data-doc-id="${doc.id}" data-file-name="${fileName}">
                                    ⬇️ 다운로드
                                </button>
                            </div>
                        </div>
                    `;
                });

                container.innerHTML = html;

                // 다운로드 버튼 이벤트
                document.querySelectorAll('.download-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const docId = e.target.dataset.docId;
                        const fileName = e.target.dataset.fileName;
                        this.downloadFile(userId, projectId, docId, fileName);
                    });
                });

            } catch (error) {
                console.error('Failed to load files list:', error);
                const container = document.getElementById('downloads-list');
                container.innerHTML = '<div class="text-red-600 text-sm">오류: 파일 목록을 불러올 수 없습니다.</div>';
            }
        },

        async downloadFile(userId, projectId, docId, fileName) {
            try {
                GSync.progress.show('파일을 준비 중입니다...');

                const { doc, getDoc } = window;
                const docRef = doc(window._db, `users/${userId}/tasks/${projectId}/forms/${docId}`);
                const docSnap = await getDoc(docRef);

                GSync.progress.hide();

                if (!docSnap.exists()) {
                    GSync.toast.error('파일을 찾을 수 없습니다');
                    return;
                }

                const data = docSnap.data();

                // fileContent가 Base64라고 가정
                if (data.fileContent) {
                    this._downloadBase64(data.fileContent, fileName || 'document.docx');
                } else if (data.fileUrl) {
                    // 또는 Cloud Storage URL일 수 있음
                    this._downloadFromUrl(data.fileUrl, fileName);
                } else {
                    GSync.toast.error('파일 내용을 찾을 수 없습니다');
                }

                // 다운로드 이력에 기록
                await this.recordDownload(userId, projectId, fileName);
                GSync.toast.success('다운로드 완료!');

            } catch (error) {
                GSync.progress.hide();
                console.error('Download error:', error);
                GSync.toast.error(`다운로드 오류: ${error.message}`);
            }
        },

        _downloadBase64(base64, fileName) {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = fileName || 'document.docx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Base64 download error:', error);
                throw error;
            }
        },

        _downloadFromUrl(url, fileName) {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'document';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        async recordDownload(userId, projectId, fileName) {
            try {
                const { collection, addDoc, serverTimestamp } = window;
                const downloadsRef = collection(window._db, `users/${userId}/tasks/${projectId}/downloads`);

                await addDoc(downloadsRef, {
                    fileName,
                    downloadedAt: serverTimestamp(),
                    status: 'success'
                });

                // UI 업데이트
                await this.loadDownloadHistory(userId, projectId);
            } catch (error) {
                console.error('Failed to record download:', error);
            }
        },

        async loadDownloadHistory(userId, projectId) {
            try {
                const { collection, getDocs, orderBy, query, limit } = window;
                const downloadsRef = collection(window._db, `users/${userId}/tasks/${projectId}/downloads`);

                const snapshot = await getDocs(downloadsRef);

                const container = document.getElementById('downloads-history');

                if (snapshot.empty) {
                    container.innerHTML = '<div class="text-slate-600 text-sm bg-slate-50 border border-slate-200 rounded p-4">다운로드 이력이 없습니다.</div>';
                    return;
                }

                let html = '';
                const entries = [];

                snapshot.forEach(doc => {
                    const data = doc.data();
                    entries.push({
                        fileName: data.fileName || '알 수 없음',
                        downloadedAt: data.downloadedAt ? new Date(data.downloadedAt.toDate()) : new Date(),
                        status: data.status || 'unknown'
                    });
                });

                // 최신순 정렬
                entries.sort((a, b) => b.downloadedAt - a.downloadedAt);

                // 최근 10개만 표시
                entries.slice(0, 10).forEach(entry => {
                    const timeStr = entry.downloadedAt.toLocaleString('ko-KR');
                    html += `
                        <div class="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0">
                            <div>
                                <p class="text-sm font-medium text-slate-900">${entry.fileName}</p>
                                <p class="text-xs text-slate-500">${timeStr}</p>
                            </div>
                            <span class="px-2 py-1 text-xs font-semibold rounded ${entry.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">
                                ${entry.status === 'success' ? '✅ 완료' : '⏳ 진행중'}
                            </span>
                        </div>
                    `;
                });

                container.innerHTML = html || '<div class="text-slate-600 text-sm">이력이 없습니다.</div>';

            } catch (error) {
                console.error('Failed to load download history:', error);
            }
        }
    };

})(window.GSync = window.GSync || {});
