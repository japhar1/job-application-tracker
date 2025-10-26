import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Download, Filter } from 'lucide-react';

const JobApplicationTracker = () => {
  const [applications, setApplications] = useState([
    {
      id: 1,
      company: 'Example Tech',
      position: 'Azure Support Engineer',
      location: 'Remote',
      dateApplied: '2024-10-20',
      status: 'Applied',
      salary: '$60k-80k',
      jobUrl: 'https://example.com/jobs',
      contactPerson: 'John Doe',
      notes: 'Follows up in 2 weeks',
      cvVersion: 'Support',
      followUpDate: '2024-11-03',
      lastUpdate: '2024-10-20'
    }
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [newApp, setNewApp] = useState({
    company: '',
    position: '',
    location: '',
    dateApplied: new Date().toISOString().split('T')[0],
    status: 'Applied',
    salary: '',
    jobUrl: '',
    contactPerson: '',
    notes: '',
    cvVersion: 'Support',
    followUpDate: '',
    lastUpdate: new Date().toISOString().split('T')[0]
  });

  const statusOptions = ['Applied', 'Screening', 'Interview Scheduled', 'Interviewed', 'Offer', 'Rejected', 'Withdrawn', 'Follow-up Needed'];
  const cvVersionOptions = ['Support', 'Infrastructure', 'Custom'];
  const locationTypes = ['Remote', 'Hybrid', 'On-site - Lagos', 'On-site - Ibadan', 'Other'];

  const addApplication = () => {
    if (newApp.company && newApp.position) {
      setApplications([...applications, { ...newApp, id: Date.now() }]);
      setNewApp({
        company: '',
        position: '',
        location: '',
        dateApplied: new Date().toISOString().split('T')[0],
        status: 'Applied',
        salary: '',
        jobUrl: '',
        contactPerson: '',
        notes: '',
        cvVersion: 'Support',
        followUpDate: '',
        lastUpdate: new Date().toISOString().split('T')[0]
      });
      setIsAdding(false);
    }
  };

  const deleteApplication = (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      setApplications(applications.filter(app => app.id !== id));
    }
  };

  const startEdit = (app) => {
    setEditingId(app.id);
  };

  const saveEdit = (id) => {
    setApplications(applications.map(app => 
      app.id === id ? { ...app, lastUpdate: new Date().toISOString().split('T')[0] } : app
    ));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const updateField = (id, field, value) => {
    setApplications(applications.map(app => 
      app.id === id ? { ...app, [field]: value } : app
    ));
  };

  const exportToCSV = () => {
    const headers = ['Company', 'Position', 'Location', 'Date Applied', 'Status', 'Salary', 'Job URL', 'Contact Person', 'CV Version', 'Follow-up Date', 'Notes', 'Last Update'];
    const csvContent = [
      headers.join(','),
      ...applications.map(app => [
        app.company,
        app.position,
        app.location,
        app.dateApplied,
        app.status,
        app.salary,
        app.jobUrl,
        app.contactPerson,
        app.cvVersion,
        app.followUpDate,
        `"${app.notes}"`,
        app.lastUpdate
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job_applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredApplications = filterStatus === 'All' 
    ? applications 
    : applications.filter(app => app.status === filterStatus);

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    screening: applications.filter(a => a.status === 'Screening').length,
    interview: applications.filter(a => a.status === 'Interview Scheduled' || a.status === 'Interviewed').length,
    offer: applications.filter(a => a.status === 'Offer').length,
    rejected: applications.filter(a => a.status === 'Rejected').length
  };

  const needsFollowUp = applications.filter(app => {
    if (!app.followUpDate) return false;
    const followUp = new Date(app.followUpDate);
    const today = new Date();
    return followUp <= today && !['Rejected', 'Withdrawn', 'Offer'].includes(app.status);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Job Application Tracker</h1>
              <p className="text-gray-600 mt-1">Olusegun Balogun - Azure/Cloud Roles</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
              >
                <Plus size={20} />
                New Application
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition"
              >
                <Download size={20} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.applied}</div>
              <div className="text-sm text-gray-600">Applied</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.screening}</div>
              <div className="text-sm text-gray-600">Screening</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{stats.interview}</div>
              <div className="text-sm text-gray-600">Interview</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.offer}</div>
              <div className="text-sm text-gray-600">Offers</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
          </div>

          {/* Follow-up Alerts */}
          {needsFollowUp.length > 0 && (
            <div className="mt-4 bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
              <p className="font-semibold text-orange-800">⚠️ {needsFollowUp.length} application(s) need follow-up!</p>
              <div className="mt-2 text-sm text-orange-700">
                {needsFollowUp.map(app => (
                  <div key={app.id}>• {app.company} - {app.position}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-600" />
            <label className="text-gray-700 font-medium">Filter by Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Applications ({applications.length})</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status} ({applications.filter(a => a.status === status).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add New Application Form */}
        {isAdding && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Application</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Company Name *"
                value={newApp.company}
                onChange={(e) => setNewApp({...newApp, company: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Position Title *"
                value={newApp.position}
                onChange={(e) => setNewApp({...newApp, position: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newApp.location}
                onChange={(e) => setNewApp({...newApp, location: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Location</option>
                {locationTypes.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
              <input
                type="date"
                value={newApp.dateApplied}
                onChange={(e) => setNewApp({...newApp, dateApplied: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Salary Range"
                value={newApp.salary}
                onChange={(e) => setNewApp({...newApp, salary: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="url"
                placeholder="Job URL"
                value={newApp.jobUrl}
                onChange={(e) => setNewApp({...newApp, jobUrl: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Contact Person"
                value={newApp.contactPerson}
                onChange={(e) => setNewApp({...newApp, contactPerson: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newApp.cvVersion}
                onChange={(e) => setNewApp({...newApp, cvVersion: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {cvVersionOptions.map(cv => <option key={cv} value={cv}>{cv} CV</option>)}
              </select>
              <input
                type="date"
                placeholder="Follow-up Date"
                value={newApp.followUpDate}
                onChange={(e) => setNewApp({...newApp, followUpDate: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="Notes"
                value={newApp.notes}
                onChange={(e) => setNewApp({...newApp, notes: e.target.value})}
                className="border border-gray-300 rounded px-3 py-2 md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={addApplication}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Add Application
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CV</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow-up</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === app.id ? (
                        <input
                          type="text"
                          value={app.company}
                          onChange={(e) => updateField(app.id, 'company', e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{app.company}</div>
                          {app.jobUrl && (
                            <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                              View Job
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingId === app.id ? (
                        <input
                          type="text"
                          value={app.position}
                          onChange={(e) => updateField(app.id, 'position', e.target.value)}
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{app.position}</div>
                      )}
                      {app.salary && <div className="text-xs text-gray-500">{app.salary}</div>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === app.id ? (
                        <select
                          value={app.location}
                          onChange={(e) => updateField(app.id, 'location', e.target.value)}
                          className="border rounded px-2 py-1 w-full text-sm"
                        >
                          {locationTypes.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-900">{app.location}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === app.id ? (
                        <input
                          type="date"
                          value={app.dateApplied}
                          onChange={(e) => updateField(app.id, 'dateApplied', e.target.value)}
                          className="border rounded px-2 py-1"
                        />
                      ) : (
                        app.dateApplied
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {editingId === app.id ? (
                        <select
                          value={app.status}
                          onChange={(e) => updateField(app.id, 'status', e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${app.status === 'Applied' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${app.status === 'Screening' ? 'bg-purple-100 text-purple-800' : ''}
                          ${app.status === 'Interview Scheduled' || app.status === 'Interviewed' ? 'bg-indigo-100 text-indigo-800' : ''}
                          ${app.status === 'Offer' ? 'bg-green-100 text-green-800' : ''}
                          ${app.status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                          ${app.status === 'Withdrawn' ? 'bg-gray-100 text-gray-800' : ''}
                          ${app.status === 'Follow-up Needed' ? 'bg-orange-100 text-orange-800' : ''}
                        `}>
                          {app.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === app.id ? (
                        <select
                          value={app.cvVersion}
                          onChange={(e) => updateField(app.id, 'cvVersion', e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {cvVersionOptions.map(cv => <option key={cv} value={cv}>{cv}</option>)}
                        </select>
                      ) : (
                        app.cvVersion
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {editingId === app.id ? (
                        <input
                          type="date"
                          value={app.followUpDate}
                          onChange={(e) => updateField(app.id, 'followUpDate', e.target.value)}
                          className="border rounded px-2 py-1"
                        />
                      ) : (
                        <span className={app.followUpDate && new Date(app.followUpDate) <= new Date() ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                          {app.followUpDate || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === app.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(app.id)} className="text-green-600 hover:text-green-900">
                            <Save size={18} />
                          </button>
                          <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-900">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(app)} className="text-blue-600 hover:text-blue-900">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => deleteApplication(app.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No applications found. Click "New Application" to get started!</p>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-gray-800 mb-2">📋 Job Search Tips</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Target 5-10 applications daily (mix of local and remote)</li>
            <li>• Follow up 1-2 weeks after applying if no response</li>
            <li>• Use "Support" CV for support roles, "Infrastructure" for engineer roles</li>
            <li>• Customize your CV for each application when possible</li>
            <li>• Track which CV version you sent for consistency in interviews</li>
            <li>• Set follow-up reminders to stay proactive</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationTracker;
