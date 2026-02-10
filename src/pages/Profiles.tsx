import { collection, orderBy, query } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CachedImage } from '../components/CachedImage'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import {
  defaultKeyQAFields,
  keyQAFieldsByBatch,
} from '../data/keyQAFields'
import { profileValueForRender } from '../utils/profileValues'
import { PROFESSIONAL_INTEREST_AREAS } from '../data/professionalDetails'
import type { FirestoreDoc, UserProfile } from '../types/firestore'

type GroupedProfiles = {
  batch: string
  profiles: FirestoreDoc<UserProfile>[]
}

export function Profiles() {
  const profilesQuery = useMemo(
    () => query(collection(db, 'users'), orderBy('createdAt', 'desc')),
    []
  )

  const { data, loading, error } = useCollection<FirestoreDoc<UserProfile>>(
    profilesQuery
  )
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [companyFilter, setCompanyFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [interestFilter, setInterestFilter] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data
      .filter((profile) => {
        if (!term) return true
        return [profile.name, profile.nickname]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(term))
      })
      .filter((profile) => {
        const companyTerm = companyFilter.trim().toLowerCase()
        if (companyTerm) {
          const company = profile.currentCompany?.toLowerCase() || ''
          if (!company.includes(companyTerm)) {
            return false
          }
        }
        const roleTerm = roleFilter.trim().toLowerCase()
        if (roleTerm) {
          const role = profile.currentRole?.toLowerCase() || ''
          if (!role.includes(roleTerm)) {
            return false
          }
        }
        if (interestFilter) {
          const interests = profile.interestAreas ?? []
          if (!interests.includes(interestFilter)) {
            return false
          }
        }
        return true
      })
  }, [data, search, companyFilter, roleFilter, interestFilter])

  const grouped = useMemo<GroupedProfiles[]>(() => {
    const buckets = filtered.reduce<Record<string, FirestoreDoc<UserProfile>[]>>(
      (acc, profile) => {
        const batch = profile.batch || 'Unassigned'
        if (!acc[batch]) acc[batch] = []
        acc[batch].push(profile)
        return acc
      },
      {}
    )

    return Object.entries(buckets)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([batch, profiles]) => ({
        batch,
        profiles,
      }))
  }, [filtered])

  return (
    <div className="page">
      <SectionHeader
        title="Profiles"
        subtitle="Search by name and explore each batch."
        accent="Memories"
      />

      <div className="profiles-toolbar">
        <div className="search-field">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type a name"
          />
        </div>
        <div className="profiles-meta">
          <span>{filtered.length} students</span>
          <span>{grouped.length} batches</span>
        </div>
      </div>
      <div className="profiles-filters">
        <label>
          Company
          <input
            type="search"
            placeholder="Filter by company"
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
          />
        </label>
        <label>
          Role
          <input
            type="search"
            placeholder="Filter by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          />
        </label>
        <label>
          Interest area
          <select
            value={interestFilter}
            onChange={(event) => setInterestFilter(event.target.value)}
          >
            <option value="">All</option>
            {PROFESSIONAL_INTEREST_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <ListState
          loading={loading}
          error={error}
          emptyLabel="No profiles yet."
        />
      ) : (
        <div className="batch-stack">
          {grouped.map((group) => (
            <section key={group.batch} className="batch-section">
              <button
                type="button"
                className="batch-header"
                onClick={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [group.batch]: !prev[group.batch],
                  }))
                }
              >
                <div>
                  <h3>{group.batch}</h3>
                  <span>{group.profiles.length} students</span>
                </div>
                <span className="batch-toggle">
                  {collapsed[group.batch] ? 'Show' : 'Hide'}
                </span>
              </button>
              {!collapsed[group.batch] ? (
                <div className="profiles-grid">
                  {group.profiles.map((profile) => (
                    <Link
                      to={`/profiles/${profile.id}`}
                      className="profile-card-modern"
                      key={profile.id}
                    >
                      <div className="profile-card-header">
                        {profile.photoURL ? (
                          <CachedImage
                            src={profile.photoURL}
                            alt={profile.name}
                            className="profile-avatar"
                          />
                        ) : (
                          <div className="profile-avatar fallback">
                            {profile.name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="profile-name">{profile.name}</p>
                          {profile.nickname ? (
                            <span className="profile-nickname">
                              "{profile.nickname}"
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {(() => {
                        const fields =
                          keyQAFieldsByBatch[profile.batch || 'SOM25'] ||
                          defaultKeyQAFields
                        const batchFields = [...fields].sort((a, b) => a.key - b.key)
                        const bodyFields = batchFields.slice(0, 2)
                        const footerField = batchFields[2] ?? batchFields[0]
                        return (
                          <>
                            <div className="profile-card-body">
                              {bodyFields.map((field) => (
                                <p key={field.key}>
                                  <span>{field.label}</span>
                                  <strong>
                                    {profileValueForRender(
                                      profile[field.name as keyof UserProfile]
                                    )}
                                  </strong>
                                </p>
                              ))}
                            </div>
                            <div className="profile-card-footer">
                                <span>
                                  {profileValueForRender(
                                    profile[footerField.name as keyof UserProfile],
                                    footerField.label
                                  )}
                                </span>
                              <span className="profile-pill">View profile</span>
                            </div>
                          </>
                        )
                      })()}
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
