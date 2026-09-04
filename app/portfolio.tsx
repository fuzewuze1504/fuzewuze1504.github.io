"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Code,
  ExternalLink,
  GraduationCap,
  Menu,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

const SUPABASE_URL = "https://yoqrjrqhnghdentkqhxs.supabase.co";
const SUPABASE_KEY = "sb_publishable__PJ-SXvQ8Jz2SUF3rqdRTA_hd-DREP-";
const SESSION_KEY = "portfolio_admin_session";

type Activity = {
  id: number;
  title: string;
  type: string;
  description: string;
  tools: string;
  learnings: string;
  evidenceUrl: string;
  thumbnailUrl: string;
  completedOn: string;
  createdAt: string;
};
type ActivityRow = {
  id: number;
  title: string;
  type: string;
  description: string;
  tools: string;
  learnings: string;
  evidence_url: string;
  thumbnail_url: string;
  completed_on: string;
  created_at: string;
};
type ActivityForm = Omit<Activity, "id" | "createdAt">;
type Session = {
  access_token: string;
  refresh_token?: string;
  user?: { email?: string };
};
type ActivityComment = {
  id: number;
  activity_id: number;
  visitor_name: string;
  comment: string;
  created_at: string;
};
type SiteFeedback = {
  id: number;
  visitor_name: string;
  feedback: string;
  created_at: string;
};

const emptyForm: ActivityForm = {
  title: "",
  type: "Activity",
  description: "",
  tools: "",
  learnings: "",
  evidenceUrl: "",
  thumbnailUrl: "",
  completedOn: new Date().toISOString().slice(0, 10),
};

function fromRow(row: ActivityRow): Activity {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    description: row.description ?? "",
    tools: row.tools ?? "",
    learnings: row.learnings ?? "",
    evidenceUrl: row.evidence_url ?? "",
    thumbnailUrl: row.thumbnail_url ?? "",
    completedOn: row.completed_on,
    createdAt: row.created_at,
  };
}
function toRow(form: ActivityForm) {
  return {
    title: form.title.trim(),
    type: form.type,
    description: form.description.trim(),
    tools: form.tools.trim(),
    learnings: form.learnings.trim(),
    thumbnail_url: form.thumbnailUrl.trim(),
    evidence_url: form.evidenceUrl.trim(),
    completed_on: form.completedOn,
  };
}
function displayDate(value: string, withTime = false) {
  const date = new Date(withTime ? value : `${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}
function apiHeaders(session?: Session | null) {
  return {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

export default function Portfolio() {
  const [items, setItems] = useState<Activity[]>([]);
  const [form, setForm] = useState<ActivityForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [feedback, setFeedback] = useState<SiteFeedback[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<
    Record<number, { name: string; text: string }>
  >({});
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [message, setMessage] = useState("");

  async function loadActivities() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/activities?select=*&order=created_at.desc,id.desc`,
        { headers: apiHeaders(), cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setItems((data as ActivityRow[]).map(fromRow));
    } catch {
      setMessage(
        "Hindi ma-load ang activities. Refresh the page to try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/activity_comments?select=*&order=created_at.asc`,
        { headers: apiHeaders(), cache: "no-store" },
      );
      const data = await response.json();
      if (response.ok) setComments(data as ActivityComment[]);
    } catch {
      /* Comments remain unavailable without blocking the portfolio. */
    }
  }

  async function loadFeedback(activeSession: Session) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/site_feedback?select=*&order=created_at.desc`,
        { headers: apiHeaders(activeSession), cache: "no-store" },
      );
      const data = await response.json();
      if (response.ok) setFeedback(data as SiteFeedback[]);
    } catch {
      /* Feedback inbox remains empty until it can be loaded. */
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const saved = JSON.parse(stored) as Session;
        setSession(saved);
        loadFeedback(saved);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    loadActivities();
    loadComments();
  }, []);

  const counts = useMemo(
    () => ({
      all: items.length,
      activities: items.filter((item) => item.type === "Activity").length,
      projects: items.filter((item) => item.type === "Project").length,
    }),
    [items],
  );

  function update<K extends keyof ActivityForm>(
    key: K,
    value: ActivityForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function requestAdd() {
    if (!session) return setLoginOpen(true);
    setEditingId(null);
    setForm({
      ...emptyForm,
      completedOn: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  }
  function startEdit(item: Activity) {
    if (!session) return;
    const { id, createdAt, ...values } = item;
    void createdAt;
    setEditingId(id);
    setForm(values);
    setOpen(true);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: apiHeaders(),
          body: JSON.stringify({
            email: values.get("email"),
            password: values.get("password"),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error_description || data.msg || "Invalid login.");
      const nextSession: Session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      loadFeedback(nextSession);
      setLoginOpen(false);
      setMessage("Admin mode enabled. You can now manage activities.");
    } catch (error) {
  const errorText =
    error instanceof Error ? error.message.toLowerCase() : "";

  setMessage(
    errorText.includes("invalid login credentials")
      ? "Incorrect email or password."
      : "Unable to log in. Please try again.",
  );
    } finally {
      setSaving(false);
    }
  }
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setFeedback([]);
    setMessage("Logged out. Portfolio is now in view-only mode.");
  }

  async function submitComment(event: FormEvent, activityId: number) {
    event.preventDefault();
    const draft = commentDrafts[activityId] ?? { name: "", text: "" };
    if (draft.name.trim().length < 2 || draft.text.trim().length < 3) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/activity_comments`,
        {
          method: "POST",
          headers: { ...apiHeaders(), Prefer: "return=minimal" },
          body: JSON.stringify({
            activity_id: activityId,
            visitor_name: draft.name.trim(),
            comment: draft.text.trim(),
          }),
        },
      );
      if (!response.ok) throw new Error();
      setCommentDrafts((current) => ({
        ...current,
        [activityId]: { name: "", text: "" },
      }));
      await loadComments();
      setMessage("Comment submitted.");
    } catch {
      setMessage("Hindi na-submit ang comment. Please try again.");
    } finally {
      setSaving(false);
    }
  }

 async function submitFeedback(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (feedbackSent) return;

  setSaving(true);
  setFeedbackStatus("Sending feedback...");

  const form = event.currentTarget;
  const values = new FormData(form);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/site_feedback`,
      {
        method: "POST",
        headers: {
          ...apiHeaders(),
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          visitor_name: String(
            values.get("visitor_name") ?? "",
          ).trim(),
          feedback: String(values.get("feedback") ?? "").trim(),
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Feedback submission failed.");
    }

    form.reset();
    setFeedbackSent(true);
    setFeedbackStatus("Feedback sent successfully. Thank you!");
    setMessage("Feedback sent successfully.");
  } catch {
    setFeedbackStatus(
      "Feedback was not sent. Please try again.",
    );
  } finally {
    setSaving(false);
  }
}

  async function deleteComment(id: number) {
    if (!session || !window.confirm("Delete this comment?")) return;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/activity_comments?id=eq.${id}`,
      { method: "DELETE", headers: apiHeaders(session) },
    );
    if (response.ok)
      setComments((current) => current.filter((entry) => entry.id !== id));
  }

  async function deleteFeedback(id: number) {
    if (!session || !window.confirm("Delete this feedback?")) return;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/site_feedback?id=eq.${id}`,
      { method: "DELETE", headers: apiHeaders(session) },
    );
    if (response.ok)
      setFeedback((current) => current.filter((entry) => entry.id !== id));
  }

async function uploadThumbnail(file: File) {
  if (!session) {
    setLoginOpen(true);
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    setMessage("JPG, PNG, or WebP image lamang ang puwede.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setMessage("Masyadong malaki ang image. Maximum size is 5 MB.");
    return;
  }

  setUploadingImage(true);
  setMessage("Uploading image...");

  try {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/activity-thumbnails/${fileName}`,
      {
        method: "POST",
        headers: {
          ...apiHeaders(session),
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: file,
      },
    );

    if (!response.ok) {
      throw new Error("Image upload failed.");
    }

    const publicUrl =
      `${SUPABASE_URL}/storage/v1/object/public/` +
      `activity-thumbnails/${fileName}`;

    setForm((current) => ({
      ...current,
      thumbnailUrl: publicUrl,
    }));

    setMessage("Image uploaded successfully.");
  } catch {
    setMessage("Hindi na-upload ang image. Please try again.");
  } finally {
    setUploadingImage(false);
  }
}
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session) return setLoginOpen(true);
    setSaving(true);
    setMessage("");
    const url = editingId
      ? `${SUPABASE_URL}/rest/v1/activities?id=eq.${editingId}`
      : `${SUPABASE_URL}/rest/v1/activities`;
    try {
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { ...apiHeaders(session), Prefer: "return=representation" },
        body: JSON.stringify(toRow(form)),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Hindi na-save ang activity.");
      await loadActivities();
      setOpen(false);
      setMessage(
        editingId ? "Activity updated." : "Activity saved to Supabase.",
      );
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Something went wrong.";
      if (/jwt|token/i.test(text)) {
        logout();
        setLoginOpen(true);
      }
      setMessage(text);
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Activity) {
    if (
      !session ||
      !window.confirm(`Delete “${item.title}”? This cannot be undone.`)
    )
      return;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/activities?id=eq.${item.id}`,
      { method: "DELETE", headers: apiHeaders(session) },
    );
    if (response.ok) {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage("Activity deleted.");
    } else setMessage("Hindi na-delete ang activity. Try logging in again.");
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#home">
          CA<span>.</span>
        </a>
        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <Menu />
        </button>
        <div
          className={`nav-links ${menuOpen ? "show" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          <a href="#about">About</a>
          <a href="#works">Activities</a>
          <a href="#skills">Skills</a>
          <a href="#feedback">Feedback</a>
          <a href="#contact">Contact</a>
          {session ? (
            <>
              <button className="small-add" onClick={requestAdd}>
                <Plus size={16} /> Add activity
              </button>
              <button className="nav-login" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <button className="nav-login" onClick={() => setLoginOpen(true)}>
              Admin login
            </button>
          )}
        </div>
      </nav>

      <section className="hero shell" id="home">
        <div className="hero-copy">
          <p className="eyebrow">BSIT STUDENT · ACADEMIC PORTFOLIO</p>
          <h1>
            Learning by
            <br />
            <span>building.</span>
          </h1>
          <p className="intro">
            Hi, I’m <strong>Carl Anthony Eguizabal</strong>. This portfolio
            documents my activities, projects, and progress for{" "}
            <strong>IT ELECTIVE 1 (Web Fundamental)</strong>.
          </p>
          <div className="hero-actions">
            {session ? (
              <button className="primary" onClick={requestAdd}>
                <Plus size={18} /> Add new activity
              </button>
            ) : (
              <button className="primary" onClick={() => setLoginOpen(true)}>
                Admin login
              </button>
            )}
            <a className="secondary" href="#works">
              View my work
            </a>
          </div>
        </div>
        <div className="portrait">
          <img src="/profile.jpg" alt="Carl Anthony Eguizabal" />
        </div>
      </section>

      <section className="section shell" id="about">
        <div className="section-heading">
          <span>01</span>
          <h2>About me</h2>
        </div>
        <div className="about-grid">
          <p className="about-lead">
            I’m a 2ND-YEAR BSIT student who enjoys learning about technology,
            programming, and web design. This portfolio shows how my skills
            improve through every school output.
          </p>
          <dl className="student-info">
            <div>
              <dt>School</dt>
              <dd>BESTLINK COLLEGE OF THE PHILIPPINES</dd>
            </div>
            <div>
              <dt>Program & Year</dt>
              <dd>BSIT · 2nd Year</dd>
            </div>
            <div>
              <dt>Section</dt>
              <dd>MV-21010</dd>
            </div>
            <div>
              <dt>Professor</dt>
              <dd>Mari Laynesa</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section works-section" id="works">
        <div className="shell">
          <div className="section-heading">
            <span>02</span>
            <h2>Activities & projects</h2>
          </div>
          <div className="work-toolbar">
            <div className="stats">
              <span>
                <b>{counts.all}</b> Total
              </span>
              <span>
                <b>{counts.activities}</b> Activities
              </span>
              <span>
                <b>{counts.projects}</b> Projects
              </span>
            </div>
            {session && (
              <button className="primary" onClick={requestAdd}>
                <Plus size={18} /> Add new
              </button>
            )}
          </div>
          {message && <div className="notice">{message}</div>}
          {loading ? (
            <div className="empty-state">Loading your work…</div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={36} />
              <h3>Your work will appear here.</h3>
              <p>
                {session
                  ? "Add your first completed activity. The saved date and time will be recorded automatically."
                  : "No activities have been published yet."}
              </p>
              {session && (
                <button className="secondary" onClick={requestAdd}>
                  Add first activity
                </button>
              )}
            </div>
          ) : (
            <div className="work-grid">
              {items.map((item, index) => {
                const itemComments = comments.filter(
                  (entry) => entry.activity_id === item.id,
                );
                const draft = commentDrafts[item.id] ?? { name: "", text: "" };
                return (
                  <article className="work-card" key={item.id}>
                    <div className="card-top">
                      <span className="work-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="type-pill">{item.type}</span>
                    </div>

{item.thumbnailUrl &&
  (item.evidenceUrl ? (
    <a
      className="activity-thumbnail"
      href={item.evidenceUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${item.title}`}
    >
      <img
        src={item.thumbnailUrl}
        alt={`${item.title} thumbnail`}
      />
    </a>
  ) : (
    <div className="activity-thumbnail">
      <img
        src={item.thumbnailUrl}
        alt={`${item.title} thumbnail`}
      />
    </div>
  ))}

                    <h3>{item.title}</h3>
                    <p>{item.description || "No description added."}</p>
                    {item.tools && (
                      <div className="tags">
                        {item.tools.split(",").map((tool) => (
                          <span key={tool}>{tool.trim()}</span>
                        ))}
                      </div>
                    )}
                    {item.learnings && (
                      <div className="learning">
                        <strong>What I learned</strong>
                        <p>{item.learnings}</p>
                      </div>
                    )}
                    <div className="date-row">
                      <CalendarDays size={15} />
                      <span>Completed {displayDate(item.completedOn)}</span>
                    </div>
                    <div className="saved-date">
                      Saved {displayDate(item.createdAt, true)}
                    </div>
                    {(item.evidenceUrl || session) && (
                      <div className="card-actions">
                        {item.evidenceUrl && (
                          <a
                            href={item.evidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={15} /> View output
                          </a>
                        )}
                        {session && (
                          <>
                            <button onClick={() => startEdit(item)}>
                              <Pencil size={15} /> Edit
                            </button>
                            <button
                              className="delete"
                              onClick={() => remove(item)}
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <div className="comments">
                      <div className="comments-title">
                        <strong>Comments</strong>
                        <span>{itemComments.length}</span>
                      </div>
                      {itemComments.length > 0 && (
                        <div className="comment-list">
                          {itemComments.map((entry) => (
                            <div className="comment" key={entry.id}>
                              <div>
                                <strong>{entry.visitor_name}</strong>
                                <time>
                                  {displayDate(entry.created_at, true)}
                                </time>
                              </div>
                              <p>{entry.comment}</p>
                              {session && (
                                <button
                                  className="text-delete"
                                  onClick={() => deleteComment(entry.id)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <form
                        className="comment-form"
                        onSubmit={(event) => submitComment(event, item.id)}
                      >
                        <input
                          aria-label="Your name"
                          placeholder="Your name"
                          minLength={2}
                          maxLength={60}
                          required
                          value={draft.name}
                          onChange={(event) =>
                            setCommentDrafts((current) => ({
                              ...current,
                              [item.id]: { ...draft, name: event.target.value },
                            }))
                          }
                        />
                        <textarea
                          aria-label="Comment"
                          placeholder="Add a comment about this activity…"
                          minLength={3}
                          maxLength={1000}
                          rows={2}
                          required
                          value={draft.text}
                          onChange={(event) =>
                            setCommentDrafts((current) => ({
                              ...current,
                              [item.id]: { ...draft, text: event.target.value },
                            }))
                          }
                        />
                        <button className="comment-submit" disabled={saving}>
                          Add a comment
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section shell" id="skills">
        <div className="section-heading">
          <span>03</span>
          <h2>Skills I’m building</h2>
        </div>
        <div className="skill-list">
          {["HTML", "CSS", "C++", "Figma", "GitHub", "Problem Solving"].map(
            (skill, i) => (
              <div key={skill}>
                <span>0{i + 1}</span>
                {skill}
                <em>{i < 2 ? "Learning" : "Familiar"}</em>
              </div>
            ),
          )}
        </div>
      </section>
      <section className="reflection">
        <div className="shell">
          <GraduationCap />
          <p>
            “Every activity is a record of progress—not just a requirement
            completed.”
          </p>
        </div>
      </section>
      <section className="section shell feedback-section" id="feedback">
        <div className="section-heading">
          <span>04</span>
          <h2>Website feedback</h2>
        </div>
        <div className="feedback-grid">
          <div>
            <p className="about-lead">
              Have a suggestion about this portfolio? Leave a private message.
              Only the portfolio owner can read it.
            </p>
          </div>
          <form className="feedback-form" onSubmit={submitFeedback}>
            <label>
              Your name
              <input
                name="visitor_name"
                minLength={2}
                maxLength={60}
                required
                placeholder="Enter your name"
              />
            </label>
            <label>
              Your feedback
              <textarea
                name="feedback"
                minLength={3}
                maxLength={1000}
                rows={5}
                required
                placeholder="What can I improve?"
              />
            </label>
            <button
  className="primary"
  disabled={saving || feedbackSent}
>
  {saving
    ? "Sending..."
    : feedbackSent
      ? "Feedback sent"
      : "Send feedback"}
</button>


{feedbackStatus && (
  <p className={feedbackSent ? "form-success" : "form-status"}>
    {feedbackStatus}
  </p>
)}

          </form>
        </div>
        {session && (
          <div className="feedback-inbox">
            <div className="comments-title">
              <strong>Private feedback inbox</strong>
              <span>{feedback.length}</span>
            </div>
            {feedback.length === 0 ? (
              <p className="inbox-empty">No feedback received yet.</p>
            ) : (
              <div className="feedback-list">
                {feedback.map((entry) => (
                  <article key={entry.id}>
                    <div>
                      <strong>{entry.visitor_name}</strong>
                      <time>{displayDate(entry.created_at, true)}</time>
                    </div>
                    <p>{entry.feedback}</p>
                    <button
                      className="text-delete"
                      onClick={() => deleteFeedback(entry.id)}
                    >
                      Delete
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      <footer id="contact">
        <div className="shell footer-inner">
          <div>
            <p className="eyebrow">LET&apos;S CONNECT</p>
          <h2>
  <a
    href="https://mail.google.com/mail/?view=cm&fs=1&to=eguizabalcarl77@gmail.com"
    target="_blank"
    rel="noopener noreferrer"
  >
    eguizabalcarl77@gmail.com
  </a>
</h2>
          </div>

          <div className="footer-links">
            <a href="tel:+639451973528">0945 197 3528</a>

<a
  href="https://mail.google.com/mail/?view=cm&fs=1&to=eguizabalcarl77@gmail.com"
  target="_blank"
  rel="noopener noreferrer"
>
  Email
</a>
            <a
              href="https://github.com/fuzewuze1504"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>

            <a
              href="https://www.facebook.com/kal.el.666172"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
          </div>
        </div>
      </footer>
      {open && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">PORTFOLIO RECORD</p>
                <h2 id="form-title">
                  {editingId ? "Edit activity" : "Add new activity"}
                </h2>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X />
              </button>
            </div>
            <form onSubmit={submit}>
              <label>
                Activity or project title *
                <input
                  required
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Example: Personal Portfolio Website"
                />
              </label>
              <div className="form-row">
                <label>
                  Type
                  <select
                    value={form.type}
                    onChange={(e) => update("type", e.target.value)}
                  >
                    <option>Activity</option>
                    <option>Project</option>
                    <option>Quiz</option>
                    <option>Laboratory</option>
                  </select>
                </label>
                <label>
                  Date completed *
                  <input
                    required
                    type="date"
                    value={form.completedOn}
                    onChange={(e) => update("completedOn", e.target.value)}
                  />
                </label>
              </div>
              <label>
                Short description
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="What did you create or accomplish?"
                  rows={3}
                />
              </label>
              <label>
                Tools used
                <input
                  value={form.tools}
                  onChange={(e) => update("tools", e.target.value)}
                  placeholder="HTML, CSS, VS Code (separate with commas)"
                />
              </label>
              <label>
                What I learned
                <textarea
                  value={form.learnings}
                  onChange={(e) => update("learnings", e.target.value)}
                  placeholder="Write a short reflection about this output."
                  rows={3}
                />
              </label>
              <label>
                Output link (optional)
                <input
                  type="url"
                  value={form.evidenceUrl}
                  onChange={(e) => update("evidenceUrl", e.target.value)}
                  placeholder="https://github.com/... or Google Drive link"
                />
              </label>

               <label>
  Activity thumbnail (optional)
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    disabled={uploadingImage}
    onChange={(event) => {
      const file = event.target.files?.[0];

      if (file) {
        void uploadThumbnail(file);
      }
    }}
  />
</label>

{uploadingImage && (
  <p className="upload-status">Uploading image...</p>
)}

{form.thumbnailUrl && (
  <div className="thumbnail-preview">
    <img
      src={form.thumbnailUrl}
      alt="Activity thumbnail preview"
    />
    <span>Image uploaded successfully.</span>
  </div>
)}

              <p className="auto-note">
                <Save size={15} /> The date and time you save this record will
                be added automatically.
              </p>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button className="primary" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Save activity"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {loginOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setLoginOpen(false)
          }
        >
          <section
            className="modal login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">OWNER ACCESS</p>
                <h2 id="login-title">Admin login</h2>
              </div>
              <button onClick={() => setLoginOpen(false)} aria-label="Close">
                <X />
              </button>
            </div>
            <p className="login-help">
              Use the email and password you created in Supabase.
            </p>
            <form onSubmit={login}>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </label> 
              {message && (
  <p
    role="alert"
    style={{
      color: "#ff7b7b",
      fontSize: "14px",
      margin: "10px 0 0",
    }}
  >
    {message}
  </p>
)}
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setLoginOpen(false)}
                >
                  Cancel
                </button>
                <button className="primary" disabled={saving}>
                  {saving ? "Logging in…" : "Log in"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
