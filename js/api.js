(function(GSync) {
    'use strict';

    GSync.api = {
        /**
         * Cloud Function을 HTTP POST로 호출
         */
        async call(functionName, payload, timeout = 30000) {
            const url = GSync.config.cloud.functionUrl(functionName);

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
                }

                return await response.json();

            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error(`${functionName} 요청 타임아웃 (${timeout / 1000}초 초과)`);
                }
                throw error;
            }
        },

        /**
         * extractData - 파일에서 데이터 추출
         */
        async extractData(userId, fileName, fileBase64, fileType) {
            const payload = {
                userId,
                fileName,
                fileBase64,
                fileType
            };

            return this.call('extractData', payload, GSync.config.timeout.extract);
        },

        /**
         * updateUploadData - 추출된 데이터 업데이트
         */
        async updateUploadData(userId, uploadId, extractedData) {
            const payload = {
                userId,
                uploadId,
                extractedData
            };

            return this.call('updateUploadData', payload, GSync.config.timeout.update);
        },

        /**
         * fillDocument - 서식 문서 채우기
         */
        async fillDocument(userId, fileBase64, fileName, formType, uploadId, extractedData) {
            const payload = {
                userId,
                fileBase64,
                fileName,
                formType
            };

            if (uploadId) {
                payload.uploadId = uploadId;
            }

            if (extractedData) {
                payload.extractedData = extractedData;
            }

            return this.call('fillDocument', payload, GSync.config.timeout.fill);
        },

        /**
         * briefDocument - AI 사업 브리핑
         */
        async briefDocument(userId, question, chatHistory, projectId) {
            const payload = {
                userId,
                question,
                chatHistory: chatHistory || []
            };

            if (projectId) {
                payload.projectId = projectId;
            }

            return this.call('briefDocument', payload, GSync.config.timeout.briefing);
        },

        /**
         * deleteProjectData - 사업 데이터 삭제
         */
        async deleteProjectData(userId, projectId) {
            const payload = {
                userId,
                projectId
            };

            return this.call('deleteProjectData', payload, GSync.config.timeout.delete);
        },

        /**
         * mergeUploadData - 복수 파일 병합
         */
        async mergeUploadData(userId, sourceUploadId, targetUploadId) {
            const payload = {
                userId,
                sourceUploadId,
                targetUploadId
            };

            return this.call('mergeUploadData', payload, GSync.config.timeout.update);
        }
    };

})(window.GSync = window.GSync || {});
