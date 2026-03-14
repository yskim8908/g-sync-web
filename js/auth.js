(function(GSync) {
    'use strict';

    const { collection, query, where, getDocs, addDoc, serverTimestamp } = window;

    GSync.auth = {
        // 로그인 처리
        async login(email, password) {
            try {
                if (!email || !password) {
                    throw new Error('이메일과 비밀번호를 입력해주세요');
                }

                // Firestore에서 사용자 조회
                const usersRef = collection(window._db, 'users');
                const q = query(usersRef, where('email', '==', email));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    throw new Error('등록되지 않은 이메일입니다');
                }

                const userDoc = snapshot.docs[0];
                const userData = userDoc.data();

                // 비밀번호 확인 (TODO: 실제로는 bcrypt 사용 필요)
                if (userData.password !== password) {
                    throw new Error('비밀번호가 맞지 않습니다');
                }

                // 로그인 성공 - 상태 저장
                const user = {
                    id: userDoc.id,
                    email: userData.email,
                    name: userData.name || '',
                    department: userData.department || ''
                };

                GSync.state.setUser(user);
                return { success: true, user };

            } catch (error) {
                console.error('Login error:', error);
                return { success: false, error: error.message };
            }
        },

        // 회원가입 처리
        async signup(name, email, password, passwordConfirm, department) {
            try {
                // 입력 검증
                if (!name || !email || !password || !passwordConfirm || !department) {
                    throw new Error('모든 항목을 입력해주세요');
                }

                if (password !== passwordConfirm) {
                    throw new Error('비밀번호가 맞지 않습니다');
                }

                if (password.length < 6) {
                    throw new Error('비밀번호는 최소 6자 이상이어야 합니다');
                }

                // 중복 이메일 확인
                const usersRef = collection(window._db, 'users');
                const q = query(usersRef, where('email', '==', email));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    throw new Error('이미 등록된 이메일입니다');
                }

                // Firestore에 사용자 저장
                const result = await addDoc(usersRef, {
                    name,
                    email,
                    password, // TODO: bcrypt로 암호화
                    department,
                    createdAt: serverTimestamp(),
                    status: 'active'
                });

                return { success: true, userId: result.id };

            } catch (error) {
                console.error('Signup error:', error);
                return { success: false, error: error.message };
            }
        }
    };

    // === UI 이벤트 핸들러 (index.html) ===
    if (document.getElementById('login-btn')) {
        document.getElementById('tab-login-btn').addEventListener('click', () => {
            document.getElementById('login-tab').classList.remove('hidden');
            document.getElementById('signup-tab').classList.add('hidden');
            document.getElementById('tab-login-btn').classList.add('bg-blue-600', 'text-white');
            document.getElementById('tab-login-btn').classList.remove('bg-slate-200', 'text-slate-700');
            document.getElementById('tab-signup-btn').classList.remove('bg-blue-600', 'text-white');
            document.getElementById('tab-signup-btn').classList.add('bg-slate-200', 'text-slate-700');
        });

        document.getElementById('tab-signup-btn').addEventListener('click', () => {
            document.getElementById('signup-tab').classList.remove('hidden');
            document.getElementById('login-tab').classList.add('hidden');
            document.getElementById('tab-signup-btn').classList.add('bg-blue-600', 'text-white');
            document.getElementById('tab-signup-btn').classList.remove('bg-slate-200', 'text-slate-700');
            document.getElementById('tab-login-btn').classList.remove('bg-blue-600', 'text-white');
            document.getElementById('tab-login-btn').classList.add('bg-slate-200', 'text-slate-700');
        });

        // 로그인 버튼
        document.getElementById('login-btn').addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            document.getElementById('login-btn').disabled = true;
            document.getElementById('login-btn').textContent = '로그인 중...';

            const result = await GSync.auth.login(email, password);

            if (result.success) {
                GSync.toast.success('로그인 성공!');
                setTimeout(() => {
                    window.location.href = 'app.html';
                }, 500);
            } else {
                GSync.toast.error(result.error);
                document.getElementById('login-btn').disabled = false;
                document.getElementById('login-btn').textContent = '로그인';
            }
        });

        // 회원가입 버튼
        document.getElementById('signup-btn').addEventListener('click', async () => {
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const department = document.getElementById('signup-department').value;
            const password = document.getElementById('signup-password').value;
            const passwordConfirm = document.getElementById('signup-password-confirm').value;

            document.getElementById('signup-btn').disabled = true;
            document.getElementById('signup-btn').textContent = '가입 중...';

            const result = await GSync.auth.signup(name, email, password, passwordConfirm, department);

            if (result.success) {
                GSync.toast.success('회원가입 완료! 로그인해주세요.');
                setTimeout(() => {
                    document.getElementById('tab-login-btn').click();
                    document.getElementById('signup-name').value = '';
                    document.getElementById('signup-email').value = '';
                    document.getElementById('signup-department').value = '';
                    document.getElementById('signup-password').value = '';
                    document.getElementById('signup-password-confirm').value = '';
                }, 500);
            } else {
                GSync.toast.error(result.error);
            }

            document.getElementById('signup-btn').disabled = false;
            document.getElementById('signup-btn').textContent = '회원가입';
        });
    }

})(window.GSync = window.GSync || {});
