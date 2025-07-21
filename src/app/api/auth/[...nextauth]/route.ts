import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// ✅ 환경변수 확인 로그
console.log("✅ GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "설정됨" : "미설정");
console.log("✅ GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "설정됨" : "미설정");
console.log("✅ NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "설정됨" : "미설정");

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "",
  
  pages: {
    signIn: '/auth/login',
  },

  // ✅ 로그인 시도 및 세션 로그 확인 콜백
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log("🔐 로그인 시도됨:", { user: user.email, account: account?.provider });
      return true;
    },
    async jwt({ token, account }: any) {
      console.log("🔑 JWT 콜백 실행:", { 
        hasAccount: !!account, 
        hasAccessToken: !!account?.access_token,
        provider: account?.provider 
      });
      
      // Google Calendar 토큰을 JWT에 저장
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        console.log("📦 토큰 저장됨:", {
          hasAccessToken: !!token.accessToken,
          hasRefreshToken: !!token.refreshToken
        });
      }
      return token;
    },
    async session({ session, token }: any) {
      console.log("📦 세션 콜백 실행:", { 
        user: session.user?.email,
        hasAccessToken: !!token.accessToken
      });
      
      // 세션에 토큰 추가 (Google Calendar API용)
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).provider = token.provider;
      
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      console.log("🔄 리디렉션:", { url, baseUrl });
      
      // 로그인 또는 로그아웃 후 리디렉션 처리
      if (url.startsWith("/")) {
        // 상대 URL인 경우 baseUrl과 결합
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        // 같은 도메인인 경우 해당 URL로 이동
        return url;
      }
      
      // callbackUrl 파라미터가 있으면 그곳으로 이동
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const callbackUrl = urlParams.get('callbackUrl');
      if (callbackUrl && callbackUrl.startsWith('/')) {
        return `${baseUrl}${callbackUrl}`;
      }
      
      // 기본값: 메인 페이지로 이동
      return `${baseUrl}/`;
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
