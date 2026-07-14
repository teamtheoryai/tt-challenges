import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api.js';

const STATUS_LABEL = {
  uploaded: 'Queued',
  processing: 'Processing…',
  processed: 'Processed',
  failed: 'Failed',
};

export default function Documents() {
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState('');
  const fileRef = useRef();

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: () => api('/api/orgs') });

  // Documents move through the pipeline on their own — poll so status updates
  // land without a refresh.
  const { data: docs, error } = useQuery({
    queryKey: ['documents', orgId],
    queryFn: () => api(`/api/documents${orgId ? `?orgId=${orgId}` : ''}`),
    refetchInterval: 4000,
  });

  const upload = useMutation({
    mutationFn: async ({ file, orgId }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('orgId', orgId);
      return api('/api/documents', { method: 'POST', body: form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['orgs'] });
      if (fileRef.current) fileRef.current.value = '';
    },
  });

  const portcos = (orgs ?? []).filter((o) => o.kind === 'portco');

  return (
    <div>
      <h2>Documents</h2>

      <form
        className="upload-row"
        onSubmit={(e) => {
          e.preventDefault();
          const file = fileRef.current?.files?.[0];
          const target = e.target.elements.uploadOrg.value;
          if (file && target) upload.mutate({ file, orgId: target });
        }}
      >
        <select name="uploadOrg" defaultValue="">
          <option value="" disabled>
            Upload to…
          </option>
          {portcos.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <input ref={fileRef} type="file" accept=".md,.txt,text/markdown,text/plain" />
        <button type="submit" disabled={upload.isPending}>
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </button>
        {upload.error && <span className="error">{upload.error.message}</span>}
      </form>

      <div className="filter-row">
        <label className="muted">Filter:</label>
        <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
          <option value="">All visible</option>
          {(orgs ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error.message}</p>}
      <table className="doc-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Org</th>
            <th>Status</th>
            <th>Chunks</th>
            <th>Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {(docs ?? []).map((d) => (
            <tr key={d.id}>
              <td>{d.title}</td>
              <td>{d.org_slug?.toUpperCase()}</td>
              <td>
                <span className={`badge ${d.status}`}>{STATUS_LABEL[d.status] ?? d.status}</span>
                {d.error && <div className="error small">{d.error}</div>}
              </td>
              <td>{d.chunk_count}</td>
              <td className="muted">{new Date(d.uploaded_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {docs && docs.length === 0 && <p className="muted">No documents visible.</p>}
    </div>
  );
}
