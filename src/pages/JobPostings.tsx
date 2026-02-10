import { addDoc, collection, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { useMemo, useState } from 'react'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { Card } from '../components/Card'
import { ListState } from '../components/ListState'
import { SectionHeader } from '../components/SectionHeader'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useCollection'
import { db, storage } from '../lib/firebase'
import type {
  FirestoreDoc,
  JobApplication,
  JobPosting,
} from '../types/firestore'
import { sampleJobPostings } from '../data/jobPostings'
import { formatJobDate, isLiveJob } from '../utils/jobPostings'

export function JobPostings() {
  const { user } = useAuth()
  const jobPostingsQuery = useMemo(
    () => query(collection(db, 'JobPosting'), orderBy('postedAt', 'desc')),
    []
  )

  const { data, loading, error } = useCollection<FirestoreDoc<JobPosting>>(jobPostingsQuery)
  const liveJobPostings = useMemo(
    () => (data ?? []).filter(isLiveJob),
    [data]
  )
  const hasLivePostings = liveJobPostings.length > 0

  const displayPostings = useMemo(
    () => (hasLivePostings ? liveJobPostings : sampleJobPostings),
    [hasLivePostings, liveJobPostings]
  )

  const jobApplicationsQuery = useMemo(
    () => query(collection(db, 'jobApplications')),
    []
  )
  const { data: jobApplications = [] } = useCollection<FirestoreDoc<JobApplication>>(
    jobApplicationsQuery
  )
  const appliedJobIds = useMemo(
    () =>
      new Set(
        jobApplications
          .filter((application) => application.applicantId === user?.uid)
          .map((application) => application.jobId)
      ),
    [jobApplications, user?.uid]
  )

  const [selectedJob, setSelectedJob] = useState<FirestoreDoc<JobPosting> | null>(null)
  const [message, setMessage] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [applyStatus, setApplyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  )
  const [applyError, setApplyError] = useState<string | null>(null)

  const resetApplicationForm = () => {
    setMessage('')
    setResumeFile(null)
    setApplyStatus('idle')
    setApplyError(null)
  }

  const handleApply = async () => {
    if (!selectedJob) return
    if (!user) {
      setApplyError('Sign in to apply for this role.')
      return
    }
    if (!resumeFile) {
      setApplyError('Please upload your CV to continue.')
      return
    }

    setApplyStatus('loading')
    setApplyError(null)

    try {
      const storageRef = ref(
        storage,
        `job_applications/${user.uid}/${selectedJob.id}/${resumeFile.name}`
      )
      await uploadBytes(storageRef, resumeFile)
      const resumeUrl = await getDownloadURL(storageRef)

      const payload: Omit<JobApplication, 'id'> = {
        jobId: selectedJob.id,
        jobTitle: selectedJob.jobTitle,
        applicantId: user.uid,
        applicantName: user.displayName || null,
        applicantEmail: user.email || null,
        resumeUrl,
        appliedAt: serverTimestamp(),
      }
      const trimmedMessage = message.trim()
      if (trimmedMessage) {
        payload.message = trimmedMessage
      }

      await addDoc(collection(db, 'jobApplications'), payload)
      setApplyStatus('success')
    } catch (err) {
      setApplyError((err as Error).message || 'Unable to submit application.')
      setApplyStatus('error')
    }
  }

  const closeModal = () => {
    setSelectedJob(null)
    resetApplicationForm()
  }

  if (loading && !hasLivePostings) {
    return (
      <div className="page">
        <SectionHeader
          title="Job Postings"
          subtitle="Opportunities shared by the SJMSOM community."
          accent="Careers"
        />
        <ListState loading error={error} emptyLabel="Looking for new postings..." />
      </div>
    )
  }

  return (
    <div className="page">
      <SectionHeader
        title="Job Postings"
        subtitle="Opportunities shared by the SJMSOM community."
        accent="Careers"
      />

      {error ? (
        <ListState loading={loading} error={error} emptyLabel="Could not load jobs." />
      ) : (
        <>
          {!hasLivePostings ? (
            <p className="meta subtle">
              Showing sample jobs until `JobPosting` documents are available.
            </p>
          ) : null}
          <div className="jobs-grid">
            {displayPostings.map((job) => {
              const alreadyApplied = Boolean(user && appliedJobIds.has(job.id))
              return (
                <Card key={job.id}>
                  <div className="job-card">
                    <header>
                      <p className="meta">{job.company}</p>
                      <h3>{job.jobTitle}</h3>
                    </header>
                    <div className="job-details">
                      <span>{job.domain}</span>
                      <span>{job.workExperience}</span>
                      {job.location ? <span>{job.location}</span> : null}
                    </div>
                    <div className="job-meta-dates">
                      <span>Created on {formatJobDate(job.createdAt ?? job.postedAt)}</span>
                      <span>Closing {formatJobDate(job.closingDate)}</span>
                    </div>
                    <p className="job-description">{job.jobDescription}</p>
                    <div className="job-card-footer">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          if (alreadyApplied) return
                          resetApplicationForm()
                          setSelectedJob(job)
                        }}
                        disabled={alreadyApplied}
                      >
                        {alreadyApplied ? 'Applied' : 'Apply with CV'}
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {selectedJob ? (
        <div className="job-apply-modal">
          <div className="job-apply-panel">
            <header className="job-apply-head">
              <div>
                <p className="meta subtle">{selectedJob.company}</p>
                <h3>{selectedJob.jobTitle}</h3>
                <p className="meta">{selectedJob.domain}</p>
              </div>
              <button type="button" onClick={closeModal} className="btn-ghost">
                Close
              </button>
            </header>
            <label className="job-apply-field">
              <span>Your note</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell us why this role excites you (optional)"
              />
            </label>
            <label className="job-apply-field">
              <span>Upload CV</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {applyError ? <p className="meta accent">{applyError}</p> : null}
            {applyStatus === 'success' ? (
              <p className="meta accent">Application received! We will follow up soon.</p>
            ) : null}
            <div className="job-apply-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={closeModal}
                disabled={applyStatus === 'loading'}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleApply}
                disabled={applyStatus === 'loading'}
              >
                {applyStatus === 'loading' ? 'Sending…' : 'Submit application'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
