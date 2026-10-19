import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json'; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    auth.onAuthStateChanged(setUser);
  }, []);

  const fetchSites = async (token: string) => {
    const res = await fetch('/api/v1/sites', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setSites(await res.json());
  };

  useEffect(() => {
    if (user) user.getIdToken().then(fetchSites);
  }, [user]);

  const addSite = async () => {
    const token = await user.getIdToken();
    const res = await fetch('/api/v1/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ domain })
    });
    if (res.ok) {
        setDomain('');
        fetchSites(token);
    }
  };

  if (!user) return <button onClick={() => signInWithPopup(auth, provider)}>Sign In</button>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">ShieldCaptcha Dashboard</h1>
      <button onClick={() => signOut(auth)}>Sign Out</button>
      <div className="my-4">
        <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" className="border p-2" />
        <button onClick={addSite} className="bg-blue-500 text-white p-2">Add Site</button>
      </div>
      <ul>
        {sites.map(s => <li key={s.id}>{s.domain} - Key: {s.siteKey}</li>)}
      </ul>
    </div>
  );
}
