(function(GSync) {
    'use strict';

    const SUGGESTION_QUESTIONS = [
        '등록된 사업의 총 예산을 알려주세요',
        '진행 중인 사업이 몇 개인가요?',
        '주요 협력 기관을 정리해주세요'
    ];

    GSync.tab_briefing = {
        chatHistory: [],

        render() {
            const container = document.getElementById('briefing-container');

            container.innerHTML = `
                <div class="flex flex-col gap-6">
                    <!-- 채팅 영역 -->
                    <div class="bg-white rounded-lg border border-slate-200 p-6" style="height: 400px; overflow-y: auto;">
                        <div id="chat-messages" class="space-y-4">
                            <div class="chat-message assistant">
                                <div class="message-bubble">
                                    안녕하세요! 사업 관련 궁금한 점을 물어보세요. 등록된 데이터를 바탕으로 도움을 드립니다.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 제안된 질문 -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3" id="suggestion-area"></div>

                    <!-- 입력 영역 -->
                    <div class="flex gap-2">
                        <input id="question-input" type="text" placeholder="질문을 입력하세요..."
                            class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <button id="send-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            전송
                        </button>
                    </div>
                </div>
            `;

            this.attachEventListeners();
            this.renderSuggestions();
            this.loadChatHistory();
        },

        attachEventListeners() {
            const sendBtn = document.getElementById('send-btn');
            const input = document.getElementById('question-input');

            sendBtn.addEventListener('click', () => this.askQuestion());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.askQuestion();
                }
            });
        },

        renderSuggestions() {
            const container = document.getElementById('suggestion-area');
            const suggestions = SUGGESTION_QUESTIONS.map((q, i) => `
                <button class="suggestion-btn p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left text-sm font-medium text-slate-700 hover:text-blue-600">
                    💡 ${q}
                </button>
            `).join('');

            container.innerHTML = suggestions;

            // 추천 질문 클릭
            document.querySelectorAll('.suggestion-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const question = e.target.textContent.replace('💡 ', '');
                    document.getElementById('question-input').value = question;
                    this.askQuestion();
                });
            });
        },

        async askQuestion() {
            const input = document.getElementById('question-input');
            const question = input.value.trim();

            if (!question) {
                GSync.toast.warning('질문을 입력해주세요');
                return;
            }

            const user = GSync.state.getUser();
            const projectId = GSync.state.getCurrentProjectId();

            if (!user) {
                GSync.toast.error('로그인이 필요합니다');
                return;
            }

            // 사용자 메시지 표시
            this.addMessageToChat('user', question);
            input.value = '';

            // API 호출
            GSync.progress.show('AI가 답변을 생성 중입니다...');

            try {
                const result = await GSync.api.briefDocument(
                    user.id,
                    question,
                    this.chatHistory,
                    projectId
                );

                GSync.progress.hide();

                if (result.success) {
                    // 어시스턴트 응답 추가
                    const answer = result.answer || '죄송합니다. 응답을 생성할 수 없습니다.';
                    this.addMessageToChat('assistant', answer);

                    // 대화 기록 업데이트
                    this.chatHistory.push({ role: 'user', content: question });
                    this.chatHistory.push({ role: 'assistant', content: answer });
                    GSync.state.setSession('briefingHistory', this.chatHistory);
                } else {
                    GSync.toast.error(`오류: ${result.error}`);
                    this.addMessageToChat('assistant', '죄송합니다. 오류가 발생했습니다: ' + result.error);
                }
            } catch (error) {
                GSync.progress.hide();
                GSync.toast.error(`오류: ${error.message}`);
                this.addMessageToChat('assistant', '죄송합니다. 네트워크 오류가 발생했습니다.');
            }
        },

        addMessageToChat(role, content) {
            const messagesContainer = document.getElementById('chat-messages');

            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${role}`;

            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = content;

            messageDiv.appendChild(bubble);
            messagesContainer.appendChild(messageDiv);

            // 자동 스크롤
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },

        loadChatHistory() {
            // sessionStorage에서 대화 기록 로드
            const history = GSync.state.getSession('briefingHistory');
            if (history && Array.isArray(history)) {
                this.chatHistory = history;
            } else {
                this.chatHistory = [];
            }
        }
    };

})(window.GSync = window.GSync || {});
