// 카카오 OAuth 2.0 (Authorization Code)
// 키가 없는 경우 폴백 모드(ENABLE_KAKAO_FALLBACK=true)로 동작합니다.
const axios = require('axios');

const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_PROFILE_URL = 'https://kapi.kakao.com/v2/user/me';

function getAuthorizeUrl(state) {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;
  if (!clientId || !redirectUri) return null;
  const u = new URL(KAKAO_AUTH_URL);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('redirect_uri', redirectUri);
  if (state) u.searchParams.set('state', state);
  return u.toString();
}

async function exchangeCodeForToken(code) {
  const { data } = await axios.post(
    KAKAO_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_API_KEY,
      redirect_uri: process.env.KAKAO_REDIRECT_URI,
      code,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data; // { access_token, refresh_token, ... }
}

async function fetchProfile(accessToken) {
  const { data } = await axios.get(KAKAO_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    kakaoId: String(data.id),
    nickname: data.kakao_account?.profile?.nickname || `카카오${data.id}`,
  };
}

const isEnabled = () => !!process.env.KAKAO_REST_API_KEY && !!process.env.KAKAO_REDIRECT_URI;
const fallbackEnabled = () => process.env.ENABLE_KAKAO_FALLBACK === 'true';

module.exports = { getAuthorizeUrl, exchangeCodeForToken, fetchProfile, isEnabled, fallbackEnabled };
