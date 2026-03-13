import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaBuilding, FaDoorOpen, FaBolt, FaWrench, FaExclamationTriangle, FaChartLine, FaHistory, FaBullseye } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import ResidentDashboard from '../components/ResidentDashboard';
import MaintenanceStaffDashboard from '../components/MaintenanceStaffDashboard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const [stats, setStats] = useState({
    buildings: 0,
    rooms: 0,
    energy: 0,
    maintenance: 0,
    recentAlerts: [],
    energyTrend: [],
    buildingRooms: [],
    activityFeed: []
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [bRes, rRes, eRes, mRes] = await Promise.all([
        axios.get('/api/buildings', { headers }),
        axios.get('/api/rooms', { headers }),
        axios.get('/api/energylogs', { headers }),
        axios.get('/api/maintenance', { headers })
      ]);

      // Process Energy Trend (Last 7 entries)
      const trend = eRes.data.slice(0, 7).map(log => ({
        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        energy: Number(log.energyUsed)
      })).reverse();

      // Process Building Distribution
      const buildingMap = {};
      rRes.data.forEach(room => {
        const bName = room.buildingId?.name || 'Other';
        buildingMap[bName] = (buildingMap[bName] || 0) + 1;
      });
      const distribution = Object.entries(buildingMap).map(([name, value]) => ({ name, value }));

      // Process Activity Feed
      const combined = [
        ...mRes.data.map(m => ({ ...m, type: 'maintenance', time: new Date(m.requestDate) })),
        ...eRes.data.slice(0, 10).map(e => ({ ...e, type: 'energy', time: new Date(e.timestamp) }))
      ].sort((a,b) => b.time - a.time).slice(0, 8);

      const totalEnergy = eRes.data.reduce((sum, log) => sum + Number(log.energyUsed), 0);
      const pendingMaint = mRes.data.filter(req => req.status === 'Pending');

      setStats({
        buildings: bRes.data.length,
        rooms: rRes.data.length,
        energy: totalEnergy.toFixed(2),
        maintenance: pendingMaint.length,
        recentAlerts: pendingMaint.slice(0, 5),
        energyTrend: trend,
        buildingRooms: distribution,
        activityFeed: combined
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      const socket = io('http://localhost:5000');
      socket.on('NewMaintenance', () => fetchDashboardData());
      socket.on('MaintenanceUpdate', () => fetchDashboardData());
      socket.on('NewEnergyLog', () => fetchDashboardData());
      
      const interval = setInterval(fetchDashboardData, 60000);
      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }
  }, [token, fetchDashboardData]);

  if (user.role === 'Resident') {
    return (
      <div className="container-fluid py-4 fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-0">Personal Dashboard</h2>
            <p className="text-muted small mb-0">Welcome back, {user.name}</p>
          </div>
          <div className="badge bg-primary fs-6 p-2 px-3 rounded-pill shadow-sm">Resident Access</div>
        </div>
        <ResidentDashboard user={user} token={token} />
      </div>
    );
  }

  if (user.role === 'MaintenanceStaff') {
    return (
      <div className="container-fluid py-4 fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-0">Staff Dashboard</h2>
            <p className="text-muted small mb-0">Welcome back, {user.name}</p>
          </div>
          <div className="badge bg-primary fs-6 p-2 px-3 rounded-pill shadow-sm">Maintenance Hub</div>
        </div>
        <MaintenanceStaffDashboard user={user} token={token} />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Buildings', count: stats.buildings, icon: <FaBuilding />, border: 'primary' },
    { title: 'Total Rooms', count: stats.rooms, icon: <FaDoorOpen />, border: 'success' },
    { title: 'Energy Logs', count: `${stats.energy} kWh`, icon: <FaBolt />, border: 'warning' },
    { title: 'Pending Tasks', count: stats.maintenance, icon: <FaWrench />, border: 'danger' },
  ];

  return (
    <div className="container-fluid py-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
           <h2 className="fw-bold text-dark mb-1">Administrative Center</h2>
           <p className="text-muted small mb-0">Real-time building operations and system monitoring</p>
        </div>
        <div className="badge bg-white text-primary border border-primary fs-6 p-2 px-4 rounded-pill shadow-sm">Admin: {user.name}</div>
      </div>

      {/* Top Stats Cards */}
      <div className="row g-4 mb-5">
        {statCards.map((stat, idx) => (
          <div className="col-12 col-sm-6 col-xl-3" key={idx}>
            <div className={`glass-card h-100 p-4 border-start border-4 border-${stat.border} shadow-sm transition-hover`}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted fw-bold text-uppercase extra-small mb-1">{stat.title}</h6>
                  <h2 className="mb-0 fw-bold">{stat.count}</h2>
                </div>
                <div className={`fs-1 text-${stat.border} opacity-50`}>{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-5">
        {/* Energy Trend Widget */}
        <div className="col-lg-8">
            <div className="glass-card p-4 h-100 shadow-sm">
                <h6 className="fw-bold mb-4 d-flex align-items-center">
                    <FaChartLine className="me-2 text-warning" /> Live Energy Pulse (kWh)
                </h6>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={stats.energyTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="time" hide={false} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                            />
                            <Line type="monotone" dataKey="energy" stroke="#FFBB28" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Building Stats Widget */}
        <div className="col-lg-4">
            <div className="glass-card p-4 h-100 shadow-sm">
                <h6 className="fw-bold mb-4 d-flex align-items-center">
                    <FaBullseye className="me-2 text-primary" /> Building Distribution
                </h6>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={stats.buildingRooms}
                                cx="50%" cy="50%"
                                innerRadius={60} outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.buildingRooms.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-2">
                    {stats.buildingRooms.map((b, i) => (
                        <div key={i} className="d-flex justify-content-between small mb-1">
                            <span>{b.name}</span>
                            <span className="fw-bold">{b.value} Rooms</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="row g-4">
        {/* System Activity Feed */}
        <div className="col-lg-7">
            <div className="glass-card p-4 h-100 shadow-sm">
                <h6 className="fw-bold mb-4 d-flex align-items-center">
                    <FaHistory className="me-2 text-info" /> System Activity Feed
                </h6>
                <div className="activity-list">
                    {stats.activityFeed.length > 0 ? (
                        stats.activityFeed.map((item, i) => (
                            <div key={i} className="d-flex align-items-start mb-4">
                                <div className={`p-2 rounded-circle me-3 ${item.type === 'maintenance' ? 'bg-danger-subtle' : 'bg-warning-subtle'}`}>
                                    {item.type === 'maintenance' ? <FaWrench className="text-danger small"/> : <FaBolt className="text-warning small"/>}
                                </div>
                                <div className="flex-grow-1 border-bottom border-light pb-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h6 className="small fw-bold mb-0">
                                            {item.type === 'maintenance' ? 'Maint. Request' : 'Energy Logged'}
                                        </h6>
                                        <span className="extra-small text-muted">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="extra-small text-muted mb-0 mt-1">
                                        {item.type === 'maintenance' ? item.description : `Room ${item.roomId?.roomNumber}: ${item.energyUsed}kWh`}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5 text-muted small">No recent activity detected.</div>
                    )}
                </div>
            </div>
        </div>

        {/* Recent Alerts */}
        <div className="col-lg-5">
            <div className="glass-card p-4 h-100 shadow-sm border-top border-4 border-danger">
                <h6 className="fw-bold mb-4 d-flex align-items-center">
                    <FaExclamationTriangle className="me-2 text-danger" /> Critical Operations
                </h6>
                <div className="list-group list-group-flush">
                    {stats.recentAlerts.length > 0 ? (
                        stats.recentAlerts.map(alert => (
                            <div key={alert._id} className="list-group-item bg-transparent px-0 py-3 border-light">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="text-truncate me-3">
                                        <div className="fw-bold small">{alert.description}</div>
                                        <div className="text-muted extra-small">Room {alert.roomId?.roomNumber || 'N/A'} - {new Date(alert.requestDate).toLocaleDateString()}</div>
                                    </div>
                                    <span className="badge bg-danger-subtle text-danger rounded-pill extra-small px-3">Pending</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-5 text-muted small">Systems optimal. No pending alerts.</div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
