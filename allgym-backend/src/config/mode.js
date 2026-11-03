// 데모 모드: 인증 코드 화면 표시, 테스트 코드 000000 허용, 역할 전환 허용.
// 로컬 개발에서는 항상 켜지고, 운영(NODE_ENV=production)에서는 DEMO_MODE=true일 때만 켜짐.
// 실제 회원 정보를 다루는 운영 서버에서는 반드시 끌 것.
const isDemoMode = () => process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true';

module.exports = { isDemoMode };
