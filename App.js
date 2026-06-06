import { useState, useEffect, useRef } from "react";

// ── tiny helpers ──────────────────────────────────────────────────────────────
const MODEL_NAME = "ai model"; // routed 
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// fake persisted store (in-memory
const store = {
  user: null,
  resume: null,
  analysis: null,
  coverLetter: null,
  jobs: [],
  savedJobs: [],
};

// ── colour tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#0f0e17",
  panel: "#1a1828",
  card: "#211f35",
  border: "#2e2b48",
  accent: "#7c5cfc",
  accent2: "#5ce1fc",
  accent3: "#fc5c7d",
  text: "#e8e6f0",
  muted: "#8884a8",
  success: "#5cfca3",
  warn: "#fcb45c",
};

// ── reusable tiny components ──────────────────────────────────────────────────
const Btn = ({ children, onClick, color = C.accent, small, disabled, full, outline }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: outline ? "transparent" : color,
      border: `2px solid ${color}`,
      color: outline ? color : "#fff",
      padding: small ? "6px 14px" : "10px 22px",
      borderRadius: 10,
      fontFamily: "inherit",
      fontSize: small ? 13 : 15,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      width: full ? "100%" : undefined,
      transition: "all .18s",
      letterSpacing: ".3px",
    }}
  >
    {children}
  </button>
);

const Input = ({ label, value, onChange, placeholder, type = "text", textarea, rows = 3 }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ color: C.muted, fontSize: 13, marginBottom: 5, fontWeight: 600 }}>{label}</div>}
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={inputStyle}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    )}
  </div>
);

const inputStyle = {
  width: "100%",
  background: C.card,
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  color: C.text,
  padding: "10px 14px",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
};

const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: C.card,
      border: `1.5px solid ${C.border}`,
      borderRadius: 14,
      padding: 20,
      ...style,
    }}
  >
    {children}
  </div>
);

const Badge = ({ children, color = C.accent }) => (
  <span
    style={{
      background: color + "22",
      color,
      border: `1px solid ${color}44`,
      borderRadius: 6,
      padding: "3px 9px",
      fontSize: 12,
      fontWeight: 700,
    }}
  >
    {children}
  </span>
);

const Progress = ({ value, color = C.accent, label }) => (
  <div style={{ marginBottom: 10 }}>
    {label && (
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ color: C.text, fontSize: 13 }}>{label}</span>
        <span style={{ color, fontSize: 13, fontWeight: 700 }}>{value}%</span>
      </div>
    )}
    <div style={{ background: C.border, borderRadius: 99, height: 8 }}>
      <div
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: 99,
          height: 8,
          transition: "width .8s ease",
        }}
      />
    </div>
  </div>
);

const Spinner = () => (
  <div style={{ textAlign: "center", padding: 30, color: C.muted }}>
    <div
      style={{
        display: "inline-block",
        width: 36,
        height: 36,
        border: `4px solid ${C.border}`,
        borderTop: `4px solid ${C.accent}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <div style={{ marginTop: 10, fontSize: 13 }}>AI is thinking…</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 22 }}>
    <h2 style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: 0 }}>{children}</h2>
    {sub && <p style={{ color: C.muted, margin: "5px 0 0", fontSize: 14 }}>{sub}</p>}
  </div>
);

// ── call  API (used as AI backbone) ──────────────────────────────────
async function callAI(prompt) {
  const res = await fetch("AIzaSyAILgWwlPRBSn-sWbcm-dSllMbdkSW0ctU", 
    {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map((b) => b.text || "").join("\n") || "";
}

// ── PAGES ─────────────────────────────────────────────────────────────────────

// ── 1. Auth ───────────────────────────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState("");
  const [interest, setInterest] = useState("");
  const [err, setErr] = useState("");

  function handle() {
    if (!email || !password) return setErr("Email and password required.");
    if (mode === "register" && !name) return setErr("Name required.");
    const user = {
      name: name || email.split("@")[0],
      email,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      careerInterest: interest,
    };
    store.user = user;
    onAuth(user);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Segoe UI', sans-serif",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: `linear-gradient(135deg,${C.accent},${C.accent2})`,
              borderRadius: 16,
              padding: "10px 20px",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 26 }}>🤖</span>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: 1 }}>
              Smart Job Agent
            </span>
          </div>
          <p style={{ color: C.muted, margin: 0, fontSize: 14 }}>
            Your  career assistant 🚀
          </p>
        </div>

        <Card>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  background: mode === m ? C.accent : "transparent",
                  border: `2px solid ${mode === m ? C.accent : C.border}`,
                  borderRadius: 10,
                  color: mode === m ? "#fff" : C.muted,
                  fontFamily: "inherit",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <Input label="Full Name" value={name} onChange={setName} placeholder="e.g.  Ali" />
          )}
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" />
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
          {mode === "register" && (
            <>
              <Input
                label="Your Skills (comma separated)"
                value={skills}
                onChange={setSkills}
                placeholder="React, Python, SQL…"
              />
              <Input
                label="Career Interest"
                value={interest}
                onChange={setInterest}
                placeholder="e.g. Frontend Developer"
              />
            </>
          )}

          {err && (
            <div style={{ color: C.accent3, fontSize: 13, marginBottom: 12, background: C.accent3 + "15", padding: "8px 12px", borderRadius: 8 }}>
              ⚠️ {err}
            </div>
          )}

          <Btn full onClick={handle}>
            {mode === "login" ? "🔑 Login" : "✨ Create Account"}
          </Btn>

          <p style={{ color: C.muted, textAlign: "center", fontSize: 13, marginTop: 14, marginBottom: 0 }}>
          
          </p>
        </Card>
      </div>
    </div>
  );
}

// ── 2. Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const stats = [
    { icon: "🛠️", label: "Your Skills", value: user.skills?.length || 0, color: C.accent },
    { icon: "📄", label: "Resume Score", value: store.analysis?.score || "—", color: C.success },
    { icon: "💼", label: "Jobs Found", value: store.jobs?.length || 0, color: C.accent2 },
    { icon: "🎯", label: "Best Match", value: store.analysis?.score ? store.analysis.score + "%" : "—", color: C.warn },
    { icon: "✉️", label: "Cover Letters", value: store.coverLetter ? 1 : 0, color: C.accent3 },
  ];

  return (
    <div>
      <SectionTitle
        children={`👋 Welcome back, ${user.name}!`}
        sub="Here's your career overview at a glance."
      />

      {/* stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14, marginBottom: 28 }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ textAlign: "center", padding: 18 }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ color: s.color, fontWeight: 900, fontSize: 22 }}>{s.value}</div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* quick tips */}
      <Card style={{ background: `linear-gradient(135deg,${C.accent}22,${C.accent2}11)` }}>
        <div style={{ fontWeight: 800, color: C.text, marginBottom: 12, fontSize: 16 }}>🗺️ Suggested Workflow</div>
        {[
          ["1", "Build your Resume", "📝"],
          ["2", "Analyze & Score it", "📊"],
          ["3", "Search Real Jobs", "🔍"],
          ["4", "Check Job Match %", "🎯"],
          ["5", "Generate Cover Letter", "✉️"],
        ].map(([n, t, e]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: C.accent,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 900,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {n}
            </div>
            <span style={{ color: C.text, fontSize: 14 }}>
              {e} {t}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── 3. Resume Builder ─────────────────────────────────────────────────────────
function ResumeBuilder() {
  const [form, setForm] = useState({
    name: store.user?.name || "",
    email: store.user?.email || "",
    phone: "",
    education: "",
    skills: store.user?.skills?.join(", ") || "",
    experience: "",
    projects: "",
    certifications: "",
  });
  const [result, setResult] = useState(store.resume || null);
  const [loading, setLoading] = useState(false);

  const f = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  async function generate() {
    setLoading(true);
    try {
      const genAI = `You are a professional resume writer. Generate a clean, well-structured resume text based on these details:
Name: ${form.name}
Email: ${form.email}
Phone: ${form.phone}
Education: ${form.education}
Skills: ${form.skills}
Experience: ${form.experience}
Projects: ${form.projects}
Certifications: ${form.certifications}

Create a professional resume with sections: Professional Summary, Skills, Experience, Education, Projects, Certifications.
Keep it concise and ATS-friendly. Format with clear section headers using === markers.`;

      const text = await callAI(prompt);
      const resume = { ...form, generated: text };
      store.resume = resume;
      setResult(resume);
    } catch (e) {
      setResult({ error: "" });
    }
    setLoading(false);
  }

  return (
    <div>
      <SectionTitle children="📝 Resume Builder" sub="Fill in your details and let AI generate your resume!" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input label="Full Name" value={form.name} onChange={f("name")} placeholder="Ahmed Ali" />
        <Input label="Email" value={form.email} onChange={f("email")} placeholder="ahmed@email.com" />
        <Input label="Phone" value={form.phone} onChange={f("phone")} placeholder="+92 300 1234567" />
        <Input label="Skills (comma separated)" value={form.skills} onChange={f("skills")} placeholder="React, Python, SQL" />
      </div>
      <Input label="Education" value={form.education} onChange={f("education")} textarea rows={2} placeholder="BS Computer Science, XYZ University, 2024" />
      <Input label="Experience" value={form.experience} onChange={f("experience")} textarea rows={3} placeholder="Software Intern at ABC Company (6 months)..." />
      <Input label="Projects" value={form.projects} onChange={f("projects")} textarea rows={2} placeholder="E-commerce website using MERN stack..." />
      <Input label="Certifications" value={form.certifications} onChange={f("certifications")} placeholder="AWS Cloud, Meta React Certificate..." />

      <Btn onClick={generate} disabled={loading} color={C.accent}>
        {loading ? "⏳ Generating…" : "✨ Generate Resume with AI"}
      </Btn>

      {loading && <Spinner />}

      {result && !loading && (
        <Card style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontWeight: 800, color: C.text, fontSize: 16 }}>📄 Your Generated Resume</span>
            <Badge color={C.success}>✅ Ready</Badge>
          </div>
          {result.error ? (
            <div style={{ color: C.accent3 }}>{result.error}</div>
          ) : (
            <pre
              style={{
                color: C.text,
                fontSize: 13,
                whiteSpace: "pre-wrap",
                lineHeight: 1.7,
                background: C.panel,
                padding: 16,
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                maxHeight: 400,
                overflowY: "auto",
              }}
            >
              {result.generated}
            </pre>
          )}
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <Btn small color={C.accent2} onClick={() => navigator.clipboard.writeText(result.generated || "")}>
              📋 Copy
            </Btn>
            <Badge color={C.warn}>💾 Saved to profile</Badge>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── 4. Resume Analyzer ────────────────────────────────────────────────────────
function ResumeAnalyzer() {
  const [input, setInput] = useState(store.resume?.generated || "");
  const [result, setResult] = useState(store.analysis || null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const prompt = `Analyze this resume and respond ONLY with a JSON object (no markdown, no backticks):
{
  "score": <number 0-100>,
  "technicalSkills": ["skill1","skill2",...],
  "softSkills": ["skill1","skill2",...],
  "missingSkills": ["skill1","skill2",...],
  "strengths": ["point1","point2",...],
  "weaknesses": ["point1","point2",...],
  "summary": "<2 sentence feedback>"
}

Resume:
${input.substring(0, 2000)}`;

      const raw = await callAI(prompt);
      // strip possible markdown fences
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      store.analysis = parsed;
      setResult(parsed);
    } catch (e) {
      setResult({ error: "Could not parse AI response. Try again!" });
    }
    setLoading(false);
  }

  return (
    <div>
      <SectionTitle children="📊 Resume Analyzer" sub="Paste your resume and get an AI-powered score!" />

      <Input
        label="Paste your resume text here"
        value={input}
        onChange={setInput}
        textarea
        rows={8}
        placeholder="Paste resume content here or use the generated one from Resume Builder..."
      />

      <Btn onClick={analyze} disabled={loading || !input.trim()} color={C.accent3}>
        {loading ? "⏳ Analyzing…" : "🔬 Analyze Resume"}
      </Btn>

      {loading && <Spinner />}

      {result && !loading && (
        <div style={{ marginTop: 20 }}>
          {result.error ? (
            <Card><div style={{ color: C.accent3 }}>{result.error}</div></Card>
          ) : (
            <>
              {/* score */}
              <Card style={{ marginBottom: 14, textAlign: "center", background: `linear-gradient(135deg,${C.accent}33,${C.panel})` }}>
                <div style={{ fontSize: 14, color: C.muted, marginBottom: 6 }}>Resume Score</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: result.score >= 70 ? C.success : result.score >= 50 ? C.warn : C.accent3 }}>
                  {result.score}
                </div>
                <div style={{ color: C.muted, fontSize: 13 }}>out of 100</div>
                <Progress value={result.score} color={result.score >= 70 ? C.success : C.warn} />
                {result.summary && <p style={{ color: C.text, fontSize: 14, margin: "10px 0 0" }}>{result.summary}</p>}
              </Card>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <SkillList title="🛠️ Technical Skills" items={result.technicalSkills} color={C.accent2} />
                <SkillList title="🤝 Soft Skills" items={result.softSkills} color={C.accent} />
                <SkillList title="✅ Strengths" items={result.strengths} color={C.success} />
                <SkillList title="⚠️ Missing Skills" items={result.missingSkills} color={C.warn} />
              </div>

              {result.weaknesses?.length > 0 && (
                <SkillList title="❌ Weaknesses" items={result.weaknesses} color={C.accent3} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SkillList({ title, items = [], color }) {
  return (
    <Card>
      <div style={{ fontWeight: 800, color, marginBottom: 10, fontSize: 14 }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 13 }}>None found</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {items.map((i, idx) => (
            <Badge key={idx} color={color}>{i}</Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
// ── 5. Job Search ─────────────────────────────────────────────────────────────
function JobSearch() {
  const [query, setQuery] = useState(store.user?.careerInterest || "");
  const [jobs, setJobs] = useState(store.jobs || []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const PER_PAGE = 4;

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // Use AI to generate realistic fake job listings (since JSearch needs real API key)
      const prompt = `Generate 10 realistic job listings for "${query}" as JSON array. No markdown, no backticks, ONLY the JSON array.
Each object:
{
  "id": "<unique string>",
  "title": "<job title>",
  "company": "<company name>",
  "location": "<city, country>",
  "type": "<Full-time|Part-time|Remote|Contract>",
  "salary": "<salary range>",
  "skills": ["skill1","skill2","skill3"],
  "description": "<2-3 sentence job description>",
  "postedDays": <1-30>
}`;

      const raw = await callAI(prompt);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      store.jobs = parsed;
      setJobs(parsed);
      setPage(1);
    } catch (e) {
      // fallback demo jobs
      const demo = Array.from({ length: 8 }, (_, i) => ({
        id: `job_${i}`,
        title: query + " Developer",
        company: ["TechCorp", "InnoSoft", "DevHub", "CloudBase", "StackFirm", "ByteLabs", "CodeNest", "NetBridge"][i],
        location: ["Karachi", "Lahore", "Remote", "Dubai", "London"][i % 5],
        type: ["Full-time", "Remote", "Part-time", "Contract"][i % 4],
        salary: `$${(3 + i) * 1000}–$${(5 + i) * 1000}/mo`,
        skills: ["React", "Node.js", "MongoDB"].slice(0, (i % 3) + 1),
        description: "Exciting opportunity to work on cutting-edge projects.",
        postedDays: i + 1,
      }));
      store.jobs = demo;
      setJobs(demo);
    }
    setLoading(false);
  }

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.type?.toLowerCase().includes(filter));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div>
      <SectionTitle children="🔍 Job Search" sub="Search real jobs powered by AI-generated listings!" />

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <Input
            value={query}
            onChange={setQuery}
            placeholder="e.g. React Developer, Data Scientist…"
          />
        </div>
        <Btn onClick={search} disabled={loading}>
          {loading ? "…" : "Search"}
        </Btn>
      </div>

      {/* filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "full-time", "remote", "part-time", "contract"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            style={{
              padding: "5px 14px",
              background: filter === f ? C.accent : "transparent",
              border: `1.5px solid ${filter === f ? C.accent : C.border}`,
              borderRadius: 8,
              color: filter === f ? "#fff" : C.muted,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {paged.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{
                width: 34,
                height: 34,
                background: page === i + 1 ? C.accent : C.card,
                border: `1.5px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
                fontFamily: "inherit",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <div style={{ color: C.muted, marginTop: 10 }}>Search for jobs to see results here!</div>
        </Card>
      )}
    </div>
  );
}

function JobCard({ job }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>{job.title}</div>
          <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>
            🏢 {job.company} · 📍 {job.location}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <Badge color={job.type === "Remote" ? C.success : C.accent}>{job.type}</Badge>
          {job.salary && <Badge color={C.warn}>{job.salary}</Badge>}
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
          <p style={{ color: C.text, fontSize: 13, lineHeight: 1.6, margin: "0 0 10px" }}>{job.description}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {job.skills?.map((s, i) => <Badge key={i} color={C.accent2}>{s}</Badge>)}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>Posted {job.postedDays} days ago</div>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Btn small outline onClick={() => setOpen(!open)}>{open ? "▲ Less" : "▼ Details"}</Btn>
        <Btn small color={C.success} onClick={() => store.savedJobs.push(job)}>⭐ Save</Btn>
        <Btn small color={C.accent2}>🔗 Apply</Btn>
      </div>
    </Card>
  );
}

// ── 6. Job Matching ───────────────────────────────────────────────────────────
function JobMatching() {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);

  const userSkills = store.user?.skills || [];
  const jobs = store.jobs || [];

  function calcLocal() {
    if (!jobs.length) return;
    const results = jobs.slice(0, 6).map((job) => {
      const jobSkills = job.skills || [];
      const matched = userSkills.filter((s) =>
        jobSkills.some((js) => js.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(js.toLowerCase()))
      );
      const missing = jobSkills.filter(
        (js) => !userSkills.some((s) => s.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(s.toLowerCase()))
      );
      const pct = jobSkills.length ? Math.round((matched.length / jobSkills.length) * 100) : 50;
      return { ...job, matchPct: pct, matched, missing };
    }).sort((a, b) => b.matchPct - a.matchPct);
    setMatches(results);
  }

  async function aiMatch() {
    if (!jobs.length || !userSkills.length) return;
    setLoading(true);
    try {
      const prompt = `You are a career matcher. Given user skills and job listings, return JSON array of match results. No markdown, ONLY JSON array.
User Skills: ${userSkills.join(", ")}
Jobs (first 5):
${jobs.slice(0, 5).map((j, i) => `${i}. ${j.title} at ${j.company} - Skills: ${j.skills?.join(", ")}`).join("\n")}

For each job, return:
{"title":"...","company":"...","matchPct":<0-100>,"matched":["skill1"],"missing":["skill2"],"recommendation":"<one sentence why this is a good/bad fit>"}`;

      const raw = await callAI(prompt);
      const clean = raw.replace(/```json|```/g, "").trim();
      setMatches(JSON.parse(clean));
    } catch {
      calcLocal();
    }
    setLoading(false);
  }

  return (
    <div>
      <SectionTitle children="🎯 Job Matching" sub="See how well your skills match job requirements!" />

      {userSkills.length > 0 ? (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>Your Skills</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {userSkills.map((s, i) => <Badge key={i} color={C.accent}>{s}</Badge>)}
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: C.warn, fontSize: 14 }}>⚠️ No skills found. Go to Profile to add your skills first!</div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Btn onClick={calcLocal} disabled={!jobs.length} color={C.accent2} outline>⚡ Quick Match</Btn>
        <Btn onClick={aiMatch} disabled={loading || !jobs.length || !userSkills.length}>
          {loading ? "⏳ Matching…" : "🤖 AI Match"}
        </Btn>
      </div>

      {!jobs.length && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40 }}>💼</div>
          <div style={{ color: C.muted, marginTop: 10 }}>Search for jobs first on the Job Search page!</div>
        </Card>
      )}

      {loading && <Spinner />}

      {matches && !loading && (
        <div>
          {matches.map((m, i) => (
            <Card key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>{m.title}</div>
                  <div style={{ color: C.muted, fontSize: 13 }}>🏢 {m.company}</div>
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: m.matchPct >= 70 ? C.success + "22" : m.matchPct >= 40 ? C.warn + "22" : C.accent3 + "22",
                    border: `3px solid ${m.matchPct >= 70 ? C.success : m.matchPct >= 40 ? C.warn : C.accent3}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    color: m.matchPct >= 70 ? C.success : m.matchPct >= 40 ? C.warn : C.accent3,
                    fontSize: 15,
                  }}
                >
                  {m.matchPct}%
                </div>
              </div>

              <Progress
                value={m.matchPct}
                color={m.matchPct >= 70 ? C.success : m.matchPct >= 40 ? C.warn : C.accent3}
              />

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
                {m.matched?.length > 0 && (
                  <div>
                    <div style={{ color: C.success, fontSize: 12, fontWeight: 700, marginBottom: 5 }}>✅ Matched</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {m.matched.map((s, j) => <Badge key={j} color={C.success}>{s}</Badge>)}
                    </div>
                  </div>
                )}
                {m.missing?.length > 0 && (
                  <div>
                    <div style={{ color: C.warn, fontSize: 12, fontWeight: 700, marginBottom: 5 }}>⚠️ Missing</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {m.missing.map((s, j) => <Badge key={j} color={C.warn}>{s}</Badge>)}
                    </div>
                  </div>
                )}
              </div>

              {m.recommendation && (
                <p style={{ color: C.muted, fontSize: 13, margin: "10px 0 0", lineHeight: 1.5 }}>
                  💡 {m.recommendation}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 7. Cover Letter ───────────────────────────────────────────────────────────
function CoverLetter() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [letter, setLetter] = useState(store.coverLetter || "");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!jobTitle || !company) return;
    setLoading(true);
    try {
      const resume = store.resume;
      const prompt = `Write a professional cover letter for:
Job Title: ${jobTitle}
Company: ${company}
Job Description: ${jobDesc}

Applicant Info:
Name: ${resume?.name || store.user?.name || "Applicant"}
Skills: ${resume?.skills || store.user?.skills?.join(", ") || "various skills"}
Experience: ${resume?.experience || "relevant experience"}
Education: ${resume?.education || "relevant education"}

Write a warm, professional 3-paragraph cover letter. Address it to "Hiring Manager". Sign off with the applicant's name.`;

      const text = await callAI(prompt);
      store.coverLetter = text;
      setLetter(text);
    } catch {
      setLetter("AI generation failed. Please try again!");
    }
    setLoading(false);
  }

  return (
    <div>
      <SectionTitle children="✉️ Cover Letter Generator" sub="Generate a tailored cover letter for any job!" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input label="Job Title" value={jobTitle} onChange={setJobTitle} placeholder="Frontend Developer" />
        <Input label="Company Name" value={company} onChange={setCompany} placeholder="TechCorp Inc." />
      </div>
      <Input
        label="Job Description (optional)"
        value={jobDesc}
        onChange={setJobDesc}
        textarea
        rows={3}
        placeholder="Paste the job description here for a more tailored letter…"
      />

      <Btn onClick={generate} disabled={loading || !jobTitle || !company} color={C.accent3}>
        {loading ? "⏳ Generating…" : "✉️ Generate Cover Letter"}
      </Btn>

      {loading && <Spinner />}

      {letter && !loading && (
        <Card style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontWeight: 800, color: C.text, fontSize: 16 }}>📨 Your Cover Letter</span>
            <Badge color={C.success}>✅ Generated</Badge>
          </div>
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={14}
            style={{ ...inputStyle, fontFamily: "Georgia, serif", fontSize: 14, lineHeight: 1.8 }}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <Btn small color={C.accent2} onClick={() => navigator.clipboard.writeText(letter)}>
              📋 Copy
            </Btn>
            <Badge color={C.muted}>✏️ Editable above</Badge>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── 8. Profile ────────────────────────────────────────────────────────────────
function ProfilePage({ user, setUser }) {
  const [form, setForm] = useState({ ...user });
  const [skillInput, setSkillInput] = useState(user.skills?.join(", ") || "");
  const [saved, setSaved] = useState(false);

  function save() {
    const updated = { ...form, skills: skillInput.split(",").map((s) => s.trim()).filter(Boolean) };
    store.user = updated;
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <SectionTitle children="👤 My Profile" sub="Manage your personal information and career preferences." />

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Full Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
          <Input label="Email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
        </div>
        <Input label="Skills (comma separated)" value={skillInput} onChange={setSkillInput} placeholder="React, Python, SQL…" />
        <Input label="Career Interest" value={form.careerInterest || ""} onChange={(v) => setForm((p) => ({ ...p, careerInterest: v }))} placeholder="e.g. Full Stack Developer" />
        <Input
          label="Education"
          value={form.education || ""}
          onChange={(v) => setForm((p) => ({ ...p, education: v }))}
          textarea
          rows={2}
          placeholder="BS Computer Science…"
        />
        <Input
          label="Experience"
          value={form.experience || ""}
          onChange={(v) => setForm((p) => ({ ...p, experience: v }))}
          textarea
          rows={2}
          placeholder="Internship, jobs…"
        />

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Btn onClick={save} color={C.success}>💾 Save Profile</Btn>
          {saved && <Badge color={C.success}>✅ Saved!</Badge>}
        </div>
      </Card>

      {store.savedJobs?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 12 }}>⭐ Saved Jobs</div>
          {store.savedJobs.map((j, i) => (
            <Card key={i} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: C.text, fontWeight: 700 }}>{j.title}</div>
                <div style={{ color: C.muted, fontSize: 13 }}>{j.company} · {j.location}</div>
              </div>
              <Badge color={C.accent}>{j.type}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
const PAGES = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "builder", label: "Resume Builder", icon: "📝" },
  { id: "analyzer", label: "Analyzer", icon: "📊" },
  { id: "jobs", label: "Job Search", icon: "🔍" },
  { id: "matching", label: "Job Match", icon: "🎯" },
  { id: "cover", label: "Cover Letter", icon: "✉️" },
  { id: "profile", label: "Profile", icon: "👤" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) return <AuthPage onAuth={(u) => { store.user = u; setUser(u); }} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard user={user} />;
      case "builder": return <ResumeBuilder />;
      case "analyzer": return <ResumeAnalyzer />;
      case "jobs": return <JobSearch />;
      case "matching": return <JobMatching />;
      case "cover": return <CoverLetter />;
      case "profile": return <ProfilePage user={user} setUser={(u) => { store.user = u; setUser(u); }} />;
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        color: C.text,
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        button:hover { opacity: 0.88; }
      `}</style>

      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 210 : 58,
          background: C.panel,
          borderRight: `1.5px solid ${C.border}`,
          display: "flex",
          flexDirection: "column",
          transition: "width .25s ease",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* logo */}
        <div
          style={{
            padding: sidebarOpen ? "18px 16px 14px" : "18px 10px 14px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>🤖</span>
          {sidebarOpen && (
            <span style={{ fontWeight: 900, fontSize: 14, color: C.text, whiteSpace: "nowrap" }}>
              Smart Job<br />
              <span style={{ color: C.accent }}>Agent</span>
            </span>
          )}
        </div>

        {/* nav */}
        <nav style={{ flex: 1, padding: "10px 8px" }}>
          {PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPage(p.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                marginBottom: 4,
                background: page === p.id ? C.accent + "30" : "transparent",
                border: `1.5px solid ${page === p.id ? C.accent + "60" : "transparent"}`,
                borderRadius: 10,
                color: page === p.id ? C.accent : C.muted,
                fontFamily: "inherit",
                fontWeight: page === p.id ? 800 : 500,
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                whiteSpace: "nowrap",
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{p.icon}</span>
              {sidebarOpen && <span>{p.label}</span>}
            </button>
          ))}
        </nav>

        {/* user info */}
        {sidebarOpen && (
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: `linear-gradient(135deg,${C.accent},${C.accent2})`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: C.text, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name}
                </div>
                <div
                  style={{ color: C.muted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => { store.user = null; setUser(null); }}
              style={{
                width: "100%",
                marginTop: 10,
                padding: "6px",
                background: "transparent",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.muted,
                fontFamily: "inherit",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: 24,
          overflowY: "auto",
          maxHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

