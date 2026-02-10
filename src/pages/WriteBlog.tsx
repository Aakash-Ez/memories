import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { SectionHeader } from '../components/SectionHeader'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import { BLOG_CATEGORIES } from '../data/blogCategories'
import type { BlogPost } from '../types/firestore'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function WriteBlog() {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(BLOG_CATEGORIES[0])
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => setBody(editor.getHTML()),
  })

  useEffect(() => {
    const stored = window.localStorage.getItem('blogDraft')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setTitle(parsed.title || '')
        setBody(parsed.body || '')
        if (parsed.category && BLOG_CATEGORIES.includes(parsed.category)) {
          setCategory(parsed.category)
        }
        if (parsed.savedAt) {
          setDraftSavedAt(parsed.savedAt)
        }
        if (editor) {
          editor.commands.setContent(parsed.body || '')
        }
      } catch {
        window.localStorage.removeItem('blogDraft')
      }
    }
  }, [editor])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      setError('Sign in to write a blog post.')
      return
    }
    setStatus('sending')
    setError(null)
    try {
      const htmlBody = editor ? editor.getHTML() : body
      const payload: Omit<BlogPost, 'id'> = {
        title: title.trim(),
        body: htmlBody.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email || 'SJMSOM student',
        category,
        createdAt: serverTimestamp(),
      }
      await addDoc(collection(db, 'blogs'), payload)
      setStatus('success')
      setTitle('')
      setBody('')
      window.localStorage.removeItem('blogDraft')
      setDraftSavedAt(null)
    } catch (err) {
      setError((err as Error).message || 'Unable to post blog.')
      setStatus('error')
    }
  }

  const saveDraft = () => {
    const stored = {
      title,
      body: editor ? editor.getHTML() : body,
      category,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem('blogDraft', JSON.stringify(stored))
    setDraftSavedAt(stored.savedAt)
  }

  return (
    <div className="page">
      <SectionHeader
        title="Write a blog"
        subtitle="Share updates, reflections, or recommendations."
        accent="Campus"
      />
      <Card>
        <form className="auth-form profile-update-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            Blog title
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give your blog a hook"
              required
            />
          </label>
          <label className="auth-field">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="category-select"
            >
              {BLOG_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="auth-field">
            Body
            <EditorContent editor={editor} className="editor-content" />
          </label>
          <div className="editor-toolbar">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              Bold
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              Italic
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              Bullet
            </button>
          </div>
          {error ? <p className="state-pill state-error">{error}</p> : null}
          {status === 'success' ? (
            <p className="state-pill">Blog posted successfully!</p>
          ) : null}
          {draftSavedAt ? (
            <p className="meta subtle">Draft saved at {new Date(draftSavedAt).toLocaleTimeString()}</p>
          ) : null}
          <div className="auth-actions">
            <button className="btn-primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Publishing…' : 'Publish blog'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={saveDraft}
              disabled={status === 'sending'}
            >
              Save draft
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
