import { useState } from 'react';
import { POST_KINDS, postsApi, type CanPost, type Post, type PostKind } from './api';
import { postsClient } from './client';
import { KIND_LABEL, MAX_CHARS, PROBLEM_TEXT, REPORT_PROBLEM, SAFETY_NOTE, ageText, cannotPostText } from './postText';

interface Props {
  posts: Post[];
  canPost: CanPost;
  /** Reload the newspaper after a change (new post, delete, report). */
  onChanged: () => void;
}

/** Community News → Local news written by Verified Residents (requirement.md v1.28 §14). */
export function LocalNews({ posts, canPost, onChanged }: Props) {
  const [writing, setWriting] = useState(false);
  const why = cannotPostText(canPost);
  return (
    <div>
      {canPost.allowed ? (
        writing ? (
          <Composer
            onDone={(posted) => {
              setWriting(false);
              if (posted) onChanged();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setWriting(true)}
            className="mb-3 w-full rounded-2xl bg-emerald-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98]"
          >
            ✏️ Write a post
          </button>
        )
      ) : (
        why && <p className="mb-3 rounded-2xl bg-white px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">{why}</p>
      )}
      {posts.length === 0 ? (
        <p className="text-sm text-slate-500">No local news yet. Be the first to share something!</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <PostItem key={p.id} post={p} onChanged={onChanged} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Composer({ onDone }: { onDone: (posted: boolean) => void }) {
  const [kind, setKind] = useState<PostKind>('talk');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      const r = await postsApi.create(postsClient(), kind, body);
      if (r.ok) onDone(true);
      else setError(PROBLEM_TEXT[r.problem] ?? 'Could not post.');
    } catch (e) {
      setError(`Could not post: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="mb-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <div className="mb-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kind of post">
        {POST_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${kind === k ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {KIND_LABEL[k].icon} {KIND_LABEL[k].label}
          </button>
        ))}
      </div>
      {kind === 'safety' && <p className="mb-2 rounded-xl bg-rose-50 px-2 py-1.5 text-xs text-rose-800">🚨 {SAFETY_NOTE}</p>}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX_CHARS))}
        placeholder={KIND_LABEL[kind].hint}
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 p-2 text-sm outline-none focus:border-emerald-400"
        autoFocus
      />
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
        <span>No links, phone numbers or addresses. Shown for 3 days.</span>
        <span>
          {body.length}/{MAX_CHARS}
        </span>
      </div>
      {error && <p className="mt-2 rounded-xl bg-amber-50 px-2 py-1.5 text-xs text-amber-800">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => onDone(false)} className="flex-1 rounded-xl bg-slate-100 py-2 text-sm text-slate-600">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={sending || body.trim().length === 0}
          className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {sending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}

function PostItem({ post, onChanged }: { post: Post; onChanged: () => void }) {
  const [thanked, setThanked] = useState(post.thanked);
  const [thanks, setThanks] = useState(post.thanks);
  const [menu, setMenu] = useState(false);
  const [reported, setReported] = useState(post.reported);
  const [note, setNote] = useState<string | null>(null);
  const k = KIND_LABEL[post.kind];
  const thank = async () => {
    if (thanked || post.mine) return;
    setThanked(true);
    setThanks((n) => n + 1);
    try {
      await postsApi.thank(postsClient(), post.id);
    } catch {
      setThanked(false);
      setThanks((n) => n - 1);
    }
  };
  return (
    <li className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
        <span className="rounded-full bg-slate-100 px-1.5 py-px font-semibold text-slate-600">
          {k.icon} {k.label}
        </span>
        <span className="font-semibold text-slate-700">{post.nickname}</span>
        <span>· {ageText(post.days_ago)}</span>
        <button type="button" onClick={() => setMenu((m) => !m)} aria-label="More" className="ml-auto rounded-full px-1.5 text-slate-400">
          ⋯
        </button>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{post.body}</p>
      {post.kind === 'safety' && <p className="mt-1 text-[11px] text-rose-700">In an emergency, call 911.</p>}
      <div className="mt-2 flex items-center gap-2">
        {!(post.mine && thanks === 0) && (
        <button
          type="button"
          onClick={() => void thank()}
          disabled={post.mine}
          aria-pressed={thanked}
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${thanked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} disabled:opacity-60`}
        >
          👍 {thanks > 0 ? thanks : ''} {post.mine ? '' : thanked ? 'Thanked' : 'Thanks'}
        </button>
        )}
        {menu &&
          (post.mine ? (
            <button
              type="button"
              onClick={() => void postsApi.remove(postsClient(), post.id).then(onChanged)}
              className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700"
            >
              Delete my post
            </button>
          ) : (
            <button
              type="button"
              disabled={reported}
              onClick={() => {
                setReported(true);
                void postsApi.report(postsClient(), post.id).then((problem) => {
                  if (problem) {
                    setReported(false);
                    setNote(REPORT_PROBLEM[problem] ?? 'Could not report this post.');
                  } else onChanged();
                });
              }}
              className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 disabled:opacity-60"
            >
              {reported ? 'Reported' : 'Report'}
            </button>
          ))}
      </div>
      {note && <p className="mt-1 text-[11px] text-amber-700">{note}</p>}
    </li>
  );
}
