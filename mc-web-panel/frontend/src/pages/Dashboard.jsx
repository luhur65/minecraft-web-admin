import { useEffect, useState } from 'react';
import { Activity, Server, Cpu, MemoryStick, Users } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const [data, setData] = useState({ status: 'offline', stats: { cpu: '0.00', ram: '0.00%' }, onlinePlayers: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/status');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action) => {
    try {
      setLoading(true);
      if (action === 'stop') {
         // Graceful stop via RCON first if possible, but fallback/direct via systemctl
         await api.post('/command', { command: 'stop' }).catch(() => {});
      }
      await api.post('/server/action', { action });
      setTimeout(fetchStatus, 5000);
    } catch (err) {
      alert(`Failed to ${action} server`);
      setLoading(false);
    }
  };

  if (loading && !data.status) return <div>Loading...</div>;

  const isOnline = data.status === 'online';

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <Activity size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Status</p>
            <p className="text-2xl font-semibold capitalize">{data.status}</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-orange-500/20 text-orange-400">
            <Users size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Online Players</p>
            <p className="text-2xl font-semibold">{data.onlinePlayers || 0}</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
            <Cpu size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">CPU Usage</p>
            <p className="text-2xl font-semibold">{data.stats?.cpu}%</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center space-x-4">
          <div className="p-3 rounded-full bg-purple-500/20 text-purple-400">
            <MemoryStick size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-sm">RAM Usage</p>
            <p className="text-2xl font-semibold">{data.stats?.ram}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 flex items-center"><Server className="mr-2" /> Power Controls</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => handleAction('start')}
            disabled={isOnline || loading}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded font-medium transition"
          >
            Start
          </button>
          <button
            onClick={() => handleAction('restart')}
            disabled={loading}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded font-medium transition"
          >
            Restart
          </button>
          <button
            onClick={() => handleAction('stop')}
            disabled={!isOnline || loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded font-medium transition"
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}
