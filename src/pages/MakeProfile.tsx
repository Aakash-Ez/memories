import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../components/Card'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useAuth } from '../context/AuthContext'
import { db, storage, auth } from '../lib/firebase'
import { useDocument } from '../hooks/useDocument'
import type { FirestoreDoc, UserProfile } from '../types/firestore'
import {
  defaultKeyQAFields,
  type KeyQAField,
  keyQAFieldsByBatch,
} from '../data/keyQAFields'
import { PROFESSIONAL_INTEREST_AREAS } from '../data/professionalDetails'
import { isCurrentBatch } from '../data/batchStatus'
import { normalizeProfileValue, profileValueForRender } from '../utils/profileValues'

type FormState = Record<string, string>

export function MakeProfile() {
  const { user } = useAuth()
  const userRef = useMemo(() => doc(db, 'users', user!.uid), [user])
  const { data: profile, loading, error } = useDocument<FirestoreDoc<UserProfile>>(userRef)
  const [form, setForm] = useState<FormState>({ name: '', nickname: '' })
  const [fieldConfig, setFieldConfig] = useState<KeyQAField[]>(defaultKeyQAFields)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const tempPreviewRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [professionalDetails, setProfessionalDetails] = useState({
    currentCompany: '',
    currentRole: '',
    linkedinURL: '',
    interestAreas: [] as string[],
  })

  useEffect(() => {
    if (profile) {
      const batchKey = profile.batch || 'SOM25'
      const rawKeyQA = profile.KeyQA ?? {}
      const hasKeyQA = Object.keys(rawKeyQA).length > 0
      const baseFields = keyQAFieldsByBatch[batchKey] ?? defaultKeyQAFields
      const dynamicFields: KeyQAField[] = hasKeyQA
        ? Object.entries(rawKeyQA).map(([storedLabel, entry]) => {
            const matchingField = baseFields.find((field) => field.name === entry.Name)
            return {
              label: matchingField?.label ?? storedLabel,
              name: entry.Name,
              key: entry.Key,
              placeholder: matchingField?.placeholder,
              type: matchingField?.type,
              rows: matchingField?.rows,
            }
          })
        : baseFields
      const sortedFields = [...dynamicFields]
        .sort((a, b) => a.key - b.key)
        .filter((field) => field.name !== 'photoURL')
      setFieldConfig(sortedFields)
      const fieldValues = sortedFields.reduce<Record<string, string>>((acc, field) => {
        const value = profile[field.name as keyof UserProfile]
        acc[field.name] = normalizeProfileValue(value)
        return acc
      }, {})
      setForm({
        name: profile.name || '',
        nickname: profile.nickname || '',
        ...fieldValues,
      })
      if (!photoFile) {
        setPhotoPreview(profile.photoURL || null)
      }
      setProfessionalDetails({
        currentCompany: profile.currentCompany || '',
        currentRole: profile.currentRole || '',
        linkedinURL: profile.linkedinURL || '',
        interestAreas: profile.interestAreas ?? [],
      })
    }
  }, [profile, photoFile])

  const showProfessionalDetails = Boolean(profile && !isCurrentBatch(profile.batch))

  const toggleInterestArea = (area: string) => {
    setProfessionalDetails((prev) => {
      const exists = prev.interestAreas.includes(area)
      return {
        ...prev,
        interestAreas: exists
          ? prev.interestAreas.filter((item) => item !== area)
          : [...prev.interestAreas, area],
      }
    })
  }

  useEffect(
    () => () => {
      if (tempPreviewRef.current) {
        URL.revokeObjectURL(tempPreviewRef.current)
        tempPreviewRef.current = null
      }
    },
    []
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setPhotoFile(file)
    if (tempPreviewRef.current) {
      URL.revokeObjectURL(tempPreviewRef.current)
    }
    if (file) {
      const nextPreview = URL.createObjectURL(file)
      tempPreviewRef.current = nextPreview
      setPhotoPreview(nextPreview)
    } else {
      tempPreviewRef.current = null
      setPhotoPreview(profile?.photoURL || null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setSaving(true)
    setStatusMessage(null)
    setSaveError(null)

    try {
      let nextPhotoURL = profile?.photoURL || null
      if (photoFile) {
        const fileRef = ref(storage, `profile_pictures/${user.uid}`)
        await uploadBytes(fileRef, photoFile)
        nextPhotoURL = await getDownloadURL(fileRef)
      }

      const payload: Partial<UserProfile> = {
        name: form.name,
        nickname: form.nickname || undefined,
        photoURL: nextPhotoURL ?? undefined,
        ...fieldConfig.reduce<Partial<Record<string, string>>>((acc, field) => {
          const value = (form[field.name] || '').trim()
          if (value) {
            acc[field.name] = value
          }
          return acc
        }, {}),
        currentCompany: professionalDetails.currentCompany.trim() || "",
        currentRole: professionalDetails.currentRole.trim() || "",
        linkedinURL: professionalDetails.linkedinURL.trim() || "",
        interestAreas:
          professionalDetails.interestAreas.length > 0
            ? professionalDetails.interestAreas
            : [],
      }

      await updateDoc(userRef, payload)
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: form.name || undefined,
          photoURL: nextPhotoURL || undefined,
        })
      }

      setStatusMessage('Profile updated!')
      setPhotoFile(null)
    } catch (err) {
      console.error(err)
      setSaveError(err instanceof Error ? err.message : 'Unable to update profile right now.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <ListState loading error={null} emptyLabel="Loading your profile…" />
  }

  if (error) {
    return <ListState loading={false} error={error} emptyLabel="Unable to load profile." />
  }

  if (!profile) {
    return <ListState loading={false} error={null} emptyLabel="Profile not found." />
  }

  return (
    <div className="page">
      <SectionHeader
        title="Make My Profile"
        subtitle="Keep your SJMSOM story up to date."
        accent="Profile"
      />

      <Card>
    <div className="profile-hero">
          <div
            className="profile-hero-image"
            role="button"
            tabIndex={0}
            aria-label="Change profile photo"
            onClick={triggerFileInput}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                triggerFileInput()
              }
            }}
          >
            {photoPreview ? (
              <img src={photoPreview} alt={profile.name} loading="lazy" />
            ) : (
              <div className="profile-avatar fallback">
                {profile.name?.[0] || 'S'}
              </div>
            )}
            <div className="image-overlay">Click to change</div>
          </div>
          <div className="profile-hero-body">
            <p className="profile-label">This is you</p>
            <h3>{form.name || profile.name}</h3>
            <div className="tag-row">
              {fieldConfig.slice(0, 2).map((field) => (
                <span className="tag-pill" key={field.name}>
                  {form[field.name] ||
                    profileValueForRender(
                      profile[field.name as keyof UserProfile],
                      field.placeholder
                    )}
                </span>
              ))}
            </div>
          </div>
        </div>

        <form className="auth-form profile-update-form" onSubmit={handleSubmit}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="sr-only"
          />

          <label className="auth-field">
            Full name
            <input
              type="text"
              value={form.name || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="How do people know you?"
            />
          </label>
          <label className="auth-field">
            Nickname
            <input
              type="text"
              value={form.nickname || ''}
              onChange={(event) => setForm((prev) => ({ ...prev, nickname: event.target.value }))}
              placeholder="Optional"
            />
          </label>
          {fieldConfig.map((field) => (
            <label className="auth-field" key={field.name}>
              {field.label}
              {field.type === 'textarea' ? (
                <textarea
                  rows={field.rows ?? 3}
                  value={form[field.name] || ''}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [field.name]: event.target.value }))
                  }
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type="text"
                  value={form[field.name] || ''}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [field.name]: event.target.value }))
                  }
                  placeholder={field.placeholder}
                />
            )}
          </label>
        ))}
        {showProfessionalDetails ? (
          <div className="professional-section">
            <h3>Professional details</h3>
            <p className="meta subtle">Available only for alumni batches</p>
            <label className="auth-field">
              Current company
              <input
                type="text"
                value={professionalDetails.currentCompany}
                onChange={(event) =>
                  setProfessionalDetails((prev) => ({
                    ...prev,
                    currentCompany: event.target.value,
                  }))
                }
                placeholder="Where are you working now?"
              />
            </label>
            <label className="auth-field">
              Current role
              <input
                type="text"
                value={professionalDetails.currentRole}
                onChange={(event) =>
                  setProfessionalDetails((prev) => ({
                    ...prev,
                    currentRole: event.target.value,
                  }))
                }
                placeholder="What is your role title?"
              />
            </label>
            <label className="auth-field">
              LinkedIn URL
              <input
                type="url"
                value={professionalDetails.linkedinURL}
                onChange={(event) =>
                  setProfessionalDetails((prev) => ({
                    ...prev,
                    linkedinURL: event.target.value,
                  }))
                }
                placeholder="https://linkedin.com/in/you"
              />
            </label>
            <div className="professional-interest">
              <p className="auth-field-label">Interest areas</p>
              <div className="interest-grid">
                {PROFESSIONAL_INTEREST_AREAS.map((area) => (
                  <button
                    type="button"
                    key={area}
                    className={`tag-pill tag-suggestion ${
                      professionalDetails.interestAreas.includes(area)
                        ? 'tag-selected'
                        : ''
                    }`}
                    onClick={() => toggleInterestArea(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
          {statusMessage ? <p className="state-pill">{statusMessage}</p> : null}
          {saveError ? <p className="state-pill state-error">{saveError}</p> : null}
          <div className="auth-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
