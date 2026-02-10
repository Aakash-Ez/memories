import { collection, orderBy, query } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/Card'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import type { FirestoreDoc, BlogPost } from '../types/firestore'
import { BLOG_CATEGORIES } from '../data/blogCategories'

export function Blogs() {
  const blogsQuery = useMemo(
    () => query(collection(db, 'blogs'), orderBy('createdAt', 'desc')),
    []
  )
  const { data, loading, error } = useCollection<FirestoreDoc<BlogPost>>(blogsQuery)

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filteredBlogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return data.filter((blog) => {
      const matchesCategory = categoryFilter ? blog.category === categoryFilter : true
      if (!matchesCategory) return false
      if (!term) return true
      const titleMatch = blog.title?.toLowerCase().includes(term)
      const authorMatch = blog.authorName?.toLowerCase().includes(term)
      return titleMatch || authorMatch
    })
  }, [data, searchTerm, categoryFilter])

  return (
    <div className="page">
      <SectionHeader
        title="Student blogs"
        subtitle="Read stories, club notes, and campus updates."
        accent="Campus"
      />
      <div className="profiles-toolbar">
        <div className="search-field">
          <span>Search</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title or author"
          />
        </div>
        <div className="profiles-meta">
          <span>{filteredBlogs.length} posts</span>
          <span>
            <Link to="/write-blog" className="nav-link">
              Write a blog
            </Link>
          </span>
        </div>
      </div>
      <div className="profiles-filters">
        <label>
          Category
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">All</option>
            {BLOG_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && !data.length ? (
        <ListState loading error={null} emptyLabel="Loading blogs…" />
      ) : error ? (
        <ListState loading={false} error={error} emptyLabel="Unable to load blogs." />
      ) : filteredBlogs.length === 0 ? (
        <ListState loading={false} error={null} emptyLabel="No blogs found." />
      ) : (
        <div className="jobs-grid">
          {filteredBlogs.map((blog) => (
            <Card key={blog.id}>
              <div className="job-card blog-card">
                <header>
                  <p className="meta">{blog.category}</p>
                  <h3>{blog.title}</h3>
                  <p className="meta subtle">By {blog.authorName}</p>
                </header>
                <p className="job-description">{blog.body}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
