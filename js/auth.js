(function(GSync) {
    'use strict';

    // index.html의 module 스크립트에서 window._* 형태로 노출된 Firestore 함수를 가져옴
    const {
        _collection: collection,
        _query: query,
        _where: where,
        _getDocs: getDocs,
        _addDoc: addDoc,
        _serverTimestamp: serverTimestamp
    } = window;

    GSync.auth = {
        // 로그인 처리 (Firebase Authentication 사용)
        async login(email, password) {
            try {
                if (!email || !password) {
                    throw new Error('이메일과 비밀번호를 입력해주세요');
                }

                // Firebase Authentication으로 로그인
                const { _signInWithEmailAndPassword: signInWithEmailAndPassword } = window;
                const userCredential = await signInWithEmailAndPassword(
                    window._auth,
                    email,
                    password
                );

                const authUser = userCredential.user;

                // Firestore에서 추가 정보 조회
                const usersRef = collection(window._db, 'users');
                const q = query(usersRef, where('email', '==', email));
                const snapshot = await getDocs(q);

                let userData = {
                    id: authUser.uid,
                    email: authUser.email,
                    name: authUser.displayName || '',
                    department: ''
                };

                if (!snapshot.empty) {
                    const fsData = snapshot.docs[0].data();
                    userData.department = fsData.department || '';
                }

                GSync.state.setUser(userData);
                return { success: true, user: userData };

            } catch (error) {
                console.error('Login error:', error);
                let errorMsg = error.message;
                if (error.code === 'auth/user-not-found') {
                    errorMsg = '등록되지 않은 이메일입니다';
                } else if (error.code === 'auth/wrong-password') {
                    errorMsg = '비밀번호가 맞지 않습니다';
                }
                return { success: false, error: errorMsg };
            }
        },

        // 회원가입 처리 (Firebase Authentication + Firestore)
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

                // Firebase Authentication에 사용자 계정 생성
                const {
                    _createUserWithEmailAndPassword: createUserWithEmailAndPassword,
                    _updateProfile: updateProfile
                } = window;

                const userCredential = await createUserWithEmailAndPassword(
                    window._auth,
                    email,
                    password
                );

                const authUser = userCredential.user;

                // Firebase Auth의 displayName 업데이트
                await updateProfile(authUser, {
                    displayName: name
                });

                // Firestore에 사용자 정보 저장 (uid로 문서 생성)
                const usersRef = collection(window._db, 'users');
                const { _setDoc: setDoc, _doc: doc } = window;

                await setDoc(doc(usersRef, authUser.uid), {
                    uid: authUser.uid,
                    name,
                    email,
                    department,
                    createdAt: serverTimestamp(),
                    status: 'active'
                });

                return { success: true, userId: authUser.uid };

            } catch (error) {
                console.error('Signup error:', error);
                let errorMsg = error.message;
                if (error.code === 'auth/email-already-in-use') {
                    errorMsg = '이미 등록된 이메일입니다';
                } else if (error.code === 'auth/invalid-email') {
                    errorMsg = '유효하지 않은 이메일입니다';
                } else if (error.code === 'auth/weak-password') {
                    errorMsg = '비밀번호가 너무 약합니다';
                }
                return { success: false, error: errorMsg };
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
