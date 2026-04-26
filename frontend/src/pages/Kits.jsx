import { useState } from 'react';
import api from '../api';

export default function Kits() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);

  const giveKit = async (kit) => {
    if (!target) return alert('Please enter a target player name');
    setLoading(true);
    try {
      await api.post('/kits', { target, kit });
      alert(`Starter kit given to ${target}`);
      setTarget('');
    } catch (err) {
      alert('Failed to give kit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Starter Kits</h2>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-lg">
        <div className="mb-6">
          <label className="block mb-2 text-sm text-gray-300">Target Player</label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Player username"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="space-y-4">
          <div className="p-4 border border-gray-700 rounded-lg flex justify-between items-center bg-gray-900/50">
            <div>
              <h3 className="font-medium text-lg text-blue-400">Basic Starter Kit</h3>
              <p className="text-sm text-gray-400">Iron Sword, Iron Pickaxe, 16 Apples</p>
            </div>
            <button
              onClick={() => giveKit('starter')}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition"
            >
              Give Kit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
