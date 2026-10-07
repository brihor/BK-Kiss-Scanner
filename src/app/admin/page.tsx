"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "@/components/announcement-popup.css";

type Announcement = {
  id: string;
  title: string;
  message: string;
  buttonText: string | null;
  buttonUrl: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [status, setStatus] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const messageRef = useRef<HTMLDivElement | null>(null);

  const syncMessage = () => {
    setMessage(messageRef.current?.innerHTML ?? "");
  };

  const runFormat = (command: string, value?: string) => {
    const editor = messageRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, value);
    syncMessage();
  };

  const addBulletList = () => {
    const editor = messageRef.current;
    if (!editor) return;

    editor.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) return;

    const selectedText = selection.toString().trim();

    if (selectedText) {
      const lines = selectedText
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) return;

      const ul = document.createElement("ul");
      ul.style.listStyleType = "disc";
      ul.style.paddingLeft = "1.5rem";
      ul.style.margin = "0.5rem 0";

      for (const line of lines) {
        const li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      }

      range.deleteContents();
      range.insertNode(ul);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(ul);
      newRange.collapse(false);
      selection.addRange(newRange);
    } else {
      const ul = document.createElement("ul");
      ul.style.listStyleType = "disc";
      ul.style.paddingLeft = "1.5rem";
      ul.style.margin = "0.5rem 0";

      const li = document.createElement("li");
      li.appendChild(document.createElement("br"));
      ul.appendChild(li);

      range.insertNode(ul);

      const newRange = document.createRange();
      newRange.selectNodeContents(li);
      newRange.collapse(true);

      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    syncMessage();
  };

  const addLink = () => {
    const url = window.prompt("Enter the full link (https://...)");
    if (!url) return;

    const cleanUrl = url.trim();

    if (!/^https?:\/\//i.test(cleanUrl)) {
      setStatus("Links must begin with http:// or https://");
      return;
    }

    runFormat("createLink", cleanUrl);
  };

  const loadAnnouncements = async () => {
    try {
      const response = await fetch("/api/admin/announcements", {
        cache: "no-store",
      });

      if (!response.ok) {
        setAuthorized(false);
        return;
      }

      const data = await response.json();
      setAnnouncements(data.announcements ?? []);
      setAuthorized(true);
    } catch {
      setStatus("Unable to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const publishAnnouncement = async (event: FormEvent) => {
    event.preventDefault();

    const editor = messageRef.current;
    const currentMessage = editor?.innerHTML.trim() ?? "";
    const currentText = editor?.innerText.trim() ?? "";

    if (!title.trim() || !currentText) {
      setStatus("Headline and message are required.");
      return;
    }

    // Keep state synchronized, but publish the editor's CURRENT HTML directly.
    setMessage(currentMessage);

    setPublishing(true);
    setStatus("");

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          message: currentMessage,
          buttonText: buttonText.trim() || null,
          buttonUrl: buttonUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Unable to publish announcement.");
        return;
      }

      setTitle("");
      setMessage("");
      if (messageRef.current) {
        messageRef.current.innerHTML = "";
      }
      setButtonText("");
      setButtonUrl("");
      setStatus("Announcement published successfully.");
      await loadAnnouncements();
    } catch {
      setStatus("Unable to publish announcement.");
    } finally {
      setPublishing(false);
    }
  };



  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-4xl text-center text-gray-400">
          Loading Admin...
        </div>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="rounded-2xl border border-red-900/60 bg-zinc-950 p-8 text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-3 text-gray-400">
            This area is available to scanner administrators only.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-xl border border-red-500/70 bg-zinc-900 px-6 py-3 font-semibold text-white"
          >
            BACK TO SCANNER
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col items-start gap-4">
<button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center text-lg font-extrabold text-yellow-400 animate-pulse drop-shadow-[0_0_6px_rgba(250,204,21,0.8)] hover:text-yellow-300"
          >
            ↩ Back to Scanner
          </button>
          <div>
            
            <h1 className="mt-1 text-3xl font-bold">
              Announcement Admin
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Create and manage scanner announcements.
            </p>
          </div>

          
        </div>

        <section className="relative overflow-hidden rounded-2xl border border-red-900/70 bg-zinc-950 p-5 shadow-[0_0_35px_rgba(239,68,68,0.08)] sm:p-7">
          <div
            className="pointer-events-none absolute inset-x-16 top-0 h-px bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.9)]"
            aria-hidden="true"
          />

          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/40 bg-red-950/30 text-xl shadow-[0_0_18px_rgba(239,68,68,0.15)]">
              📣
            </div>

            <div>
              <h2 className="text-xl font-bold">New Announcement</h2>
              <p className="text-sm text-gray-500">
                This will appear inside the scanner for users who have
                not dismissed it.
              </p>
            </div>
          </div>

          <form onSubmit={publishAnnouncement} className="space-y-5">
            <div>
              <label
                htmlFor="announcement-title"
                className="mb-2 block text-sm font-semibold text-gray-300"
              >
                HEADLINE
              </label>
              <input
                id="announcement-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                placeholder="Example: Important Scanner Update 🚨"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.12)]"
              />
            </div>

            <div>
              <label
                htmlFor="announcement-message"
                className="mb-2 block text-sm font-semibold text-gray-300"
              >
                MESSAGE
              </label>
              <div className="mb-2 flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-black/40 p-2">
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runFormat("bold")}
                  className="min-w-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-bold text-white transition hover:border-red-500"
                  title="Bold"
                >
                  B
                </button>

                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runFormat("italic")}
                  className="min-w-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 italic text-white transition hover:border-red-500"
                  title="Italic"
                >
                  I
                </button>

                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runFormat("underline")}
                  className="min-w-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 underline text-white transition hover:border-red-500"
                  title="Underline"
                >
                  U
                </button>

                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runFormat("justifyCenter")}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white transition hover:border-red-500"
                  title="Center"
                >
                  ≡ Center
                </button>

                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={addBulletList}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white transition hover:border-red-500"
                  title="Bulleted list"
                >
                  • List
                </button>

                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={addLink}
                  className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white transition hover:border-red-500"
                  title="Insert link"
                >
                  🔗 Link
                </button>
              </div>

              <div
                ref={messageRef}
                id="announcement-message"
                contentEditable
                suppressContentEditableWarning
                onInput={syncMessage}
                data-placeholder="Type your announcement here..."
                className="min-h-[170px] w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition empty:before:pointer-events-none empty:before:text-zinc-600 empty:before:content-[attr(data-placeholder)] focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.12)]"
              />

              <div className="mt-1 text-right text-xs text-zinc-600">
                {messageRef.current?.innerText.length ?? 0}/2000
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="button-text"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  OPTIONAL BUTTON TEXT
                </label>
                <input
                  id="button-text"
                  value={buttonText}
                  onChange={(event) => setButtonText(event.target.value)}
                  maxLength={40}
                  placeholder="Example: VIEW DETAILS"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="button-url"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  OPTIONAL BUTTON LINK
                </label>
                <input
                  id="button-url"
                  value={buttonUrl}
                  onChange={(event) => setButtonUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500"
                />
              </div>
            </div>

            {status && (
              <p className="rounded-xl border border-zinc-800 bg-black/40 px-4 py-3 text-sm text-gray-300">
                {status}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                disabled={!title.trim() && !message.trim()}
                className="relative overflow-hidden rounded-xl border border-zinc-600 bg-zinc-900 px-6 py-4 text-base font-bold tracking-wide text-white transition hover:border-red-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                👁 PREVIEW ANNOUNCEMENT
              </button>

              <button
                type="submit"
                disabled={publishing}
                className="relative overflow-hidden rounded-xl border border-red-500 bg-red-600 px-6 py-4 text-base font-bold tracking-wide text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  className="pointer-events-none absolute inset-x-[12%] bottom-[-3px] h-2 rounded-full bg-red-400 blur-md"
                  aria-hidden="true"
                />
                <span className="relative">
                  {publishing ? "PUBLISHING..." : "PUBLISH ANNOUNCEMENT →"}
                </span>
              </button>
            </div>
          </form>
        </section>

        <section className="mt-7 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Announcements</h2>
            <p className="mt-1 text-sm text-gray-500">
              Most recently published scanner announcement.
            </p>
          </div>

          {announcements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-gray-500">
              No announcements have been published yet.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-white">
                        {announcement.title}
                      </h3>
                    </div>

                    <p className="mt-2 line-clamp-2 text-sm text-gray-400">
                      {announcement.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {previewOpen && (
        <div
          className="bk-announcement-backdrop bk-announcement-visible"
          role="presentation"
        >
          <section
            className="bk-announcement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bk-preview-announcement-title"
          >
            <div className="bk-announcement-top-glow" />
            <div className="bk-announcement-side-glow bk-announcement-side-left" />
            <div className="bk-announcement-side-glow bk-announcement-side-right" />

            <div className="bk-announcement-mic-wrap" aria-hidden="true">
              <img
                src="/announcement-assets/announcement-mic.png"
                alt=""
                className="bk-announcement-mic"
              />
            </div>

            <button
              type="button"
              className="bk-announcement-close"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close announcement preview"
            >
              ×
            </button>

            <div className="bk-announcement-brand">
              <div className="bk-announcement-icon-wrap">
                <div className="bk-announcement-icon-pulse" />
                <div className="bk-announcement-icon">📣</div>
              </div>

              <div>
                <div className="bk-announcement-brand-name">
                  BK KiSS Scanner
                </div>
                <div className="bk-announcement-label">
                  ANNOUNCEMENT
                </div>
              </div>
            </div>

            <div className="bk-announcement-divider" />

            <h2
              id="bk-preview-announcement-title"
              className="bk-announcement-title"
            >
              {title.trim() || "Announcement Headline"}
            </h2>

            <div className="bk-announcement-message-box">
              <div className="bk-announcement-message whitespace-pre-wrap">
                {message ? (
                  <div dangerouslySetInnerHTML={{ __html: message }} />
                ) : (
                  "Your announcement message will appear here."
                )}
              </div>
            </div>

            {buttonText.trim() && buttonUrl.trim() && (
              <a
                href={buttonUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="bk-announcement-link"
              >
                {buttonText.trim()} →
              </a>
            )}
          </section>
        </div>
      )}

    </main>
  );
}
