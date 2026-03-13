import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#FFBB28', '#00C49F', '#0088FE', '#FF8042', '#8884d8', '#82ca9d'];

const EnergyAnalytics = ({ logs, user }) => {
  // 1. Process Daily Usage (Last 7 days or all days in data)
  const processDailyData = () => {
    const dailyMap = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      dailyMap[date] = (dailyMap[date] || 0) + Number(log.energyUsed);
    });
    return Object.entries(dailyMap).map(([date, energy]) => ({ date, energy: energy.toFixed(2) })).reverse().slice(-7);
  };

  // 2. Process Monthly Usage
  const processMonthlyData = () => {
    const monthlyMap = {};
    logs.forEach(log => {
      const monthYear = new Date(log.timestamp).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyMap[monthYear] = (monthlyMap[monthYear] || 0) + Number(log.energyUsed);
    });
    return Object.entries(monthlyMap).map(([month, energy]) => ({ month, energy: energy.toFixed(2) })).reverse();
  };

  // 3. Process Room Comparison (Only for Admins/Staff)
  const processRoomData = () => {
    const roomMap = {};
    logs.forEach(log => {
      const roomNum = log.roomId?.roomNumber || 'Unknown';
      roomMap[roomNum] = (roomMap[roomNum] || 0) + Number(log.energyUsed);
    });
    return Object.entries(roomMap).map(([room, energy]) => ({ room, energy: Number(energy.toFixed(2)) }));
  };

  const dailyData = processDailyData();
  const monthlyData = processMonthlyData();
  const roomData = processRoomData();

  return (
    <div className="row g-4 mb-5">
      {/* Daily Usage Chart */}
      <div className="col-12 col-lg-6">
        <div className="glass-card p-4 h-100 shadow-sm border-0 transition-hover">
          <h6 className="fw-bold mb-4 text-muted text-uppercase small">Daily Energy Consumption (kWh)</h6>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                  formatter={(val) => [`${val} kWh`, 'Energy']}
                />
                <Legend />
                <Line type="monotone" dataKey="energy" stroke="#FFBB28" strokeWidth={3} dot={{ fill: '#FFBB28', r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Usage Chart */}
      <div className="col-12 col-lg-6">
        <div className="glass-card p-4 h-100 shadow-sm border-0 transition-hover">
          <h6 className="fw-bold mb-4 text-muted text-uppercase small">Monthly Energy Consumption (kWh)</h6>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                />
                <Bar dataKey="energy" fill="#00C49F" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Room Comparison (Only for non-residents) */}
      {user.role !== 'Resident' && (
        <div className="col-12">
          <div className="glass-card p-4 shadow-sm border-0 transition-hover">
            <h6 className="fw-bold mb-4 text-muted text-uppercase small">Room Consumption Distribution</h6>
            <div className="row align-items-center">
              <div className="col-md-6">
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={roomData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="energy"
                        nameKey="room"
                      >
                        {roomData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-md-6">
                <div className="table-responsive">
                    <table className="table table-borderless align-middle mb-0">
                        <tbody>
                            {roomData.map((item, i) => (
                                <tr key={i}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="rounded-circle me-2" style={{width: 12, height: 12, backgroundColor: COLORS[i % COLORS.length]}}></div>
                                            <span className="small fw-bold">Room {item.room}</span>
                                        </div>
                                    </td>
                                    <td className="text-end fw-bold">{item.energy} kWh</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyAnalytics;
