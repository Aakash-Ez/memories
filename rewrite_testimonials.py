# -*- coding: utf-8 -*-
from pathlib import Path
path = Path('src/pages/ProfileDetail.tsx')
data = path.read_text(encoding='latin-1')
prefix = '      <SectionHeader title="Testimonials" subtitle="Words shared by the community." />'
start = data.find(prefix)
if start == -1:
    raise SystemExit('prefix not found')
end = data.find('\n      {selected ? (', start)
if end == -1:
    raise SystemExit('selected block not found')
newblock = '''      <SectionHeader title="Testimonials" subtitle="Words shared by the community." />
      {testimonials.data.length === 0 ? (
        <ListState
          loading={testimonials.loading}
          error={testimonials.error}
          emptyLabel="No testimonials yet."
        />
      ) : (
        <div className="testimonial-stack">
          {testimonials.data.map((note) => (
            <Card key={note.id}>
              <div className="testimonial-panel">
                <div className="testimonial-panel-body">
                  <div className="testimonial-writer">
                    <div className="writer-avatar-wrapper">
                      {usersById[note.writer]?.photoURL ? (
                        <img
                          src={usersById[note.writer].photoURL}
                          alt={usersById[note.writer].name}
                        />
                      ) : (
                        <span>{usersById[note.writer]?.name?.[0] or 'S'}</span>
                      )}
                    </div>
                    <div>
                      <p className="testimonial-writer-name">
                        {usersById[note.writer]?.name or 'Anonymous'}
                      </p>
                      <p className="testimonial-meta-quiet">
                        From {usersById[note.writer]?.nickname or 'the batch'}
                      </p>
                    </div>
                  </div>
                  <p className="testimonial-text">
                    "{note.testimonial?.replace(/[\u201c\u201d]/g, '\"')}"
                  </p>
                </div>
                <div className="testimonial-panel-foot">
                  <div>
                    {note.rank ? (
                      <span className="badge badge-soft">Rank {note.rank}</span>
                    ) : None}
                    {note.approved ? (
                      <span className="badge badge-soft badge-success">
                        Approved
                      </span>
                    ) : None}
                  </div>
                  {note.reactions ? (
                    <div className="reaction-row">
                      {Object.entries(note.reactions)
                        .slice(0, 6)
                        .map(([userId, reaction]) => (
                          <span
                            key={`${note.id}-${userId}`}
                            className="reaction-pill"
                            title={`Reacted: ${usersById[userId]?.name or 'Someone'}`}
                          >
                            {reaction}
                          </span>
                        ))}
                    </div>
                  ) : None}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
'''
data = data[:start] + newblock + data[end:]
path.write_text(data, encoding='latin-1')
