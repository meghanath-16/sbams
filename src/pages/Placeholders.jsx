import React from 'react';

const placeholderPages = {
  Buildings: () => (<div className="p-4"><h2>🏢 Buildings Management</h2><p className="text-muted">Module coming soon...</p></div>),
  Rooms: () => (<div className="p-4"><h2>🚪 Rooms Management</h2><p className="text-muted">Module coming soon...</p></div>),
  EnergyLogs: () => (<div className="p-4"><h2>⚡️ Energy Usage Logs</h2><p className="text-muted">Module coming soon...</p></div>),
  Maintenance: () => (<div className="p-4"><h2>🔧 Maintenance Requests</h2><p className="text-muted">Module coming soon...</p></div>)
};

export const { Buildings, Rooms, EnergyLogs, Maintenance } = placeholderPages;
