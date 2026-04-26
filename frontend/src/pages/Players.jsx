import { useState, useEffect } from 'react';
import { UserX, Shield, ShieldOff, Skull } from 'lucide-react';
import api from '../api';

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    try {
      const res = await api.get('/players');
      setPlayers(res.data.players || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (player, action) => {
    if (!window.confirm(`Are you sure you want to ${action} ${player}?`)) return;
    try {
      const cmd = `${action} ${player}`;
      await api.post('/command', { command: cmd });
      alert(`Executed ${action} on ${player}`);
      fetchPlayers();
    } catch (err) {
      alert(`Failed to ${action} ${player}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Online Players ({players.length})</h2>
        <button onClick={fetchPlayers} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700">Refresh</button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-400">Loading...</div>
        ) : players.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No players online</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-400">Player Name</th>
                <th className="px-6 py-4 font-medium text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {players.map((p, i) => (
                <tr key={i} className="hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 flex items-center space-x-3">
                    <img src={`https://minotar.net/helm/${p}/32.png`} alt={p} className="w-8 h-8 rounded" />
                    <span className="font-medium">{p}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleAction(p, 'op')} title="Op" className="p-2 text-yellow-500 hover:bg-yellow-500/20 rounded">
                      <Shield size={18} />
                    </button>
                    <button onClick={() => handleAction(p, 'deop')} title="Deop" className="p-2 text-gray-400 hover:bg-gray-600 rounded">
                      <ShieldOff size={18} />
                    </button>
                    <button onClick={() => handleAction(p, 'kick')} title="Kick" className="p-2 text-orange-500 hover:bg-orange-500/20 rounded">
                      <UserX size={18} />
                    </button>
                    <button onClick={() => handleAction(p, 'ban')} title="Ban" className="p-2 text-red-500 hover:bg-red-500/20 rounded">
                      <Skull size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
