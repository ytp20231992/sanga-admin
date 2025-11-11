// auth-guard.js
// 관리자 대시보드 접근 제어

// ============================================
// Configuration
// ============================================
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const ADMIN_KAKAO_ID = 'YOUR_ADMIN_KAKAO_ID';

// Kakao SDK 설정
const KAKAO_JS_KEY = 'YOUR_KAKAO_JS_KEY'; // 카카오 JavaScript 키

// ============================================
// 초기화
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Kakao SDK 초기화
  if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
    Kakao.init(KAKAO_JS_KEY);
  }

  // 인증 확인
  await checkAuth();
});

// ============================================
// 인증 확인
// ============================================
async function checkAuth() {
  const adminToken = localStorage.getItem('admin_token');
  const adminKakaoId = localStorage.getItem('admin_kakao_id');

  // 1. 로컬 스토리지 체크
  if (!adminToken || !adminKakaoId) {
    showLoginScreen();
    return;
  }

  // 2. 관리자 ID 검증
  if (adminKakaoId !== ADMIN_KAKAO_ID) {
    alert('관리자 권한이 없습니다.');
    logout();
    return;
  }

  // 3. 토큰 유효성 검증 (Supabase API 호출)
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-manage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        admin_kakao_id: adminKakaoId,
        action: 'get_stats'
      }),
    });

    if (!response.ok) {
      throw new Error('인증 실패');
    }

    // 인증 성공 - 대시보드 표시
    showDashboard();
    updateAdminInfo();

  } catch (error) {
    console.error('인증 오류:', error);
    alert('세션이 만료되었습니다. 다시 로그인해주세요.');
    logout();
  }
}

// ============================================
// 로그인 화면 표시
// ============================================
function showLoginScreen() {
  document.body.innerHTML = `
    <div style="
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    ">
      <div style="
        background: white;
        padding: 48px;
        border-radius: 24px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
        width: 90%;
      ">
        <h1 style="
          font-size: 28px;
          color: #667eea;
          margin-bottom: 12px;
        ">🏠 SanGa Pro</h1>
        <p style="
          color: #666;
          margin-bottom: 32px;
          font-size: 16px;
        ">관리자 대시보드</p>

        <div style="
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        ">
          <p style="
            color: #666;
            font-size: 14px;
            line-height: 1.6;
          ">
            관리자만 접근할 수 있습니다.<br>
            카카오 계정으로 로그인하세요.
          </p>
        </div>

        <button id="kakaoLoginBtn" style="
          width: 100%;
          padding: 16px;
          background: #FEE500;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <span>카카오 로그인</span>
        </button>
      </div>
    </div>
  `;

  // 카카오 로그인 버튼 이벤트
  document.getElementById('kakaoLoginBtn').addEventListener('click', loginWithKakao);
}

// ============================================
// 카카오 로그인
// ============================================
function loginWithKakao() {
  if (typeof Kakao === 'undefined') {
    alert('카카오 SDK 로딩 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  Kakao.Auth.login({
    success: function(authObj) {
      console.log('카카오 로그인 성공:', authObj);
      getUserInfo();
    },
    fail: function(err) {
      console.error('카카오 로그인 실패:', err);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  });
}

// ============================================
// 사용자 정보 가져오기
// ============================================
function getUserInfo() {
  Kakao.API.request({
    url: '/v2/user/me',
    success: function(response) {
      console.log('사용자 정보:', response);

      const kakaoId = response.id.toString();

      // 관리자 ID 확인
      if (kakaoId !== ADMIN_KAKAO_ID) {
        alert('❌ 관리자 권한이 없습니다.\n\n등록된 관리자만 접근할 수 있습니다.');
        Kakao.Auth.logout();
        return;
      }

      // 로컬 스토리지에 저장
      localStorage.setItem('admin_kakao_id', kakaoId);
      localStorage.setItem('admin_token', Kakao.Auth.getAccessToken());
      localStorage.setItem('admin_name', response.kakao_account?.profile?.nickname || '관리자');

      // 대시보드로 이동
      window.location.reload();
    },
    fail: function(error) {
      console.error('사용자 정보 가져오기 실패:', error);
      alert('사용자 정보를 가져올 수 없습니다.');
    }
  });
}

// ============================================
// 대시보드 표시
// ============================================
function showDashboard() {
  // 원래 HTML이 표시됨 (로그인 화면이 아닌 경우)
  document.body.style.display = 'block';
}

// ============================================
// 관리자 정보 업데이트
// ============================================
function updateAdminInfo() {
  const adminName = localStorage.getItem('admin_name') || '관리자';
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) {
    adminNameEl.textContent = `${adminName} 님`;
  }
}

// ============================================
// 로그아웃
// ============================================
function logout() {
  // Kakao 로그아웃
  if (typeof Kakao !== 'undefined' && Kakao.Auth.getAccessToken()) {
    Kakao.Auth.logout(() => {
      console.log('카카오 로그아웃 완료');
    });
  }

  // 로컬 스토리지 클리어
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_kakao_id');
  localStorage.removeItem('admin_name');

  // 로그인 화면으로
  window.location.reload();
}

// ============================================
// 전역 함수 노출
// ============================================
window.adminLogout = logout;
