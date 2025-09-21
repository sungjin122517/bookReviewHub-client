import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";

// ===== API helper (세션 쿠키 포함) =====
const api = {
  async get(url) {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },
  async post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },
};

// ===== 공통 레이아웃 =====
function Shell({ children }) {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #eee", padding: "12px 16px" }}>
        <Link to="/" style={{ fontWeight: 700, marginRight: 16 }}>BookReviewHub</Link>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/me">Me</Link>
      </header>
      <main style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>{children}</main>
    </div>
  );
}

// ===== 홈(로그인 버튼) =====
function Home() {
  // 배포 시 백엔드 URL이 다르면 환경변수로 넣어도 됨. (개발은 CRA proxy가 처리)
  const base = process.env.REACT_APP_API_BASE || "";

  return (
    <Shell>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Login</h1>
      <p style={{ color: "#666" }}>소셜 로그인을 눌러 인증을 시작하세요.</p>
      <div style={{ display: "grid", gap: 8, marginTop: 12, maxWidth: 360 }}>
        <a
          href={`${base}/oauth2/authorization/kakao`}
          style={{ border: "1px solid #ddd", padding: "12px", borderRadius: 8, textAlign: "center", textDecoration: "none", color: "#111" }}
        >
          카카오로 시작하기
        </a>
        <a
          href={`${base}/oauth2/authorization/naver`}
          style={{ border: "1px solid #ddd", padding: "12px", borderRadius: 8, textAlign: "center", textDecoration: "none", color: "#111" }}
        >
          네이버로 시작하기
        </a>
      </div>
      <hr style={{ margin: "24px 0" }} />
      <p style={{ color: "#777", fontSize: 14 }}>
        성공 후 서버가 <code>/login/success</code> 또는 <code>/onboarding</code>로 리다이렉트합니다.
      </p>
    </Shell>
  );
}

// ===== 로그인 성공 정보 보기 =====
function LoginSuccess() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    api.get("/login/success").then(setData).catch((e) => setErr(String(e)));
  }, []);
  return (
    <Shell>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Login Success</h1>
      {err && <div style={{ color: "crimson" }}>{err}</div>}
      <pre style={{ background: "#fafafa", border: "1px solid #eee", padding: 12, borderRadius: 8, overflow: "auto" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <Link to="/me">내 정보 보기</Link>
    </Shell>
  );
}

// ===== 내 정보 보기 =====
function Me() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    api.get("/me").then(setMe).catch((e) => setErr(String(e)));
  }, []);
  return (
    <Shell>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Me</h1>
      {err && <div style={{ color: "crimson" }}>{err}</div>}
      <pre style={{ background: "#fafafa", border: "1px solid #eee", padding: 12, borderRadius: 8, overflow: "auto" }}>
        {JSON.stringify(me, null, 2)}
      </pre>
      <div style={{ color: "#666", fontSize: 14 }}>
        세션 쿠키(JSESSIONID)가 포함되어야 인증된 사용자로 보입니다.
      </div>
    </Shell>
  );
}

// ===== 온보딩(닉네임 입력) =====
function Onboarding() {
  const [pending, setPending] = useState(null);
  const [nickname, setNickname] = useState("");
  const [userNm, setUserNm] = useState("");
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/onboarding")
      .then((d) => {
        setPending(d);
        if (d && d.suggestedNickname) setNickname(d.suggestedNickname);
        if (d && d.userNm) setUserNm(d.userNm);
      })
      .catch((e) => setErr(String(e)));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      const res = await api.post("/onboarding", { nickname });
      setOk(res);
      setTimeout(() => nav("/me"), 400);
    } catch (e) {
      setErr(String(e));
    }
  };

  return (
    <Shell>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Onboarding</h1>
      {pending && pending.status === "NO_PENDING" && (
        <div style={{ color: "#555" }}>대기 중인 가입 데이터가 없습니다.</div>
      )}
      <form onSubmit={submit} style={{ marginTop: 12, maxWidth: 420 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>사용자 명</label>
          <input
            value={userNm}
            readOnly
            placeholder="사용자 명"
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", background: "#f8f8f8" }}
          />
        </div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>닉네임</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          required
          maxLength={30}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12 }}
        />
        <button type="submit" style={{ padding: "10px 14px", borderRadius: 8, background: "#111", color: "#fff" }}>
          가입 완료
        </button>
        {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}
        {ok && (
          <pre style={{ background: "#fafafa", border: "1px solid #eee", padding: 12, borderRadius: 8, overflow: "auto", marginTop: 8 }}>
            {JSON.stringify(ok, null, 2)}
          </pre>
        )}
      </form>
      <p style={{ color: "#777", fontSize: 12, marginTop: 8 }}>
        서버 세션에 저장된 pendingProfile을 사용합니다.
      </p>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login/success" element={<LoginSuccess />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/me" element={<Me />} />
      </Routes>
    </BrowserRouter>
  );
}