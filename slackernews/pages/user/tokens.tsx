import React, { useState, FormEvent } from 'react';
import type { GetServerSidePropsContext } from "next";
import { loadSession } from "../../lib/session";
import { listApiTokens, ApiToken } from "../../lib/apiToken";
import cookies from 'next-cookies';
import Layout from "../../components/layout";
import moment from 'moment';

interface GeneratedToken {
  token: ApiToken;
  jwt: string;
}

interface PageProps {
  initialTokens: ApiToken[];
}

export default function Page({ initialTokens }: PageProps) {
  const [tokens, setTokens] = useState<ApiToken[]>(initialTokens);
  const [newTokenName, setNewTokenName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<GeneratedToken | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/user/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName.trim() }),
      });

      if (res.status === 201) {
        const data: GeneratedToken = await res.json();
        setGeneratedToken(data);
        setNewTokenName('');
        // Optimistically append the newly created token to local state
        setTokens(prev => [data.token, ...prev]);
      } else {
        alert('Failed to generate token');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating token');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return;

    try {
      const res = await fetch(`/api/user/tokens?id=${tokenId}`, {
        method: 'DELETE',
      });

      if (res.status === 204) {
        setTokens(tokens.filter(t => t.id !== tokenId));
      } else {
        alert('Failed to revoke token');
      }
    } catch (err) {
      console.error(err);
      alert('Error revoking token');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Token copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <div>
      <h2>API Tokens</h2>
      <p className="text-muted">
        Generate API tokens to authenticate the SlackerNews CLI and other programmatic clients.
        Tokens are displayed only once upon creation — copy them immediately.
      </p>

      {generatedToken && (
        <div className="alert alert-warning mb-4">
          <h5 className="alert-heading">Token Generated</h5>
          <p className="mb-2">
            <strong>Warning:</strong> This token will not be shown again. Copy it now.
          </p>
          <div className="input-group mb-2">
            <input
              type="text"
              className="form-control font-monospace"
              value={generatedToken.jwt}
              readOnly
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={() => copyToClipboard(generatedToken.jwt)}
            >
              Copy
            </button>
          </div>
          <button
            className="btn btn-sm btn-outline-dark"
            onClick={() => setGeneratedToken(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Generate New Token</h5>
          <form onSubmit={handleGenerate}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Token name (e.g., 'CLI on MacBook')"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                required
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isGenerating || !newTokenName.trim()}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {tokens.length === 0 ? (
        <p className="text-muted">No API tokens. Generate one above to get started.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>Last Used</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                <td>{token.name}</td>
                <td>{moment(token.createdAt).format('LLL')}</td>
                <td>
                  {token.lastUsedAt
                    ? moment(token.lastUsedAt).format('LLL')
                    : 'Never'}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRevoke(token.id)}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

Page.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  );
};

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const c = cookies(ctx);
  const sess = await loadSession(c.auth);
  if (!sess) {
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
      props: {},
    };
  }

  const tokens = await listApiTokens(sess.user.id);

  return {
    props: {
      initialTokens: tokens,
    },
  };
}
