import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Download, Upload, TrendingUp, Calendar, Briefcase } from 'lucide-react';

const statusColorMap = {
  'Applied': 'bg-yellow-100 text-yellow-800',
  'Screening': 'bg-purple-100 text-purple-800',
  'Interview Scheduled': 'bg-indigo-100 text-indigo-800',
  'Interviewed': 'bg-indigo-100 text-indigo-800',
  'Technical Test': 'bg-cyan-100 text-cyan-800',
  'Offer': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Withdrawn': 'bg-gray-100 text-gray-800',
  'Follow-up Needed': 'bg-orange-100 text-orange-800',
};

const JobApplicationTracker = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Filter & Sort States
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [sortBy, setSortBy] = useState('dateApplied');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const initialNewApp = {
    company: '',
    position: '',
    location: '',
    platform: 'LinkedIn',
    dateApplied: new Date().toISOString().split('T')[0],
    status: 'Applied',
    salary: '',
    jobUrl: '',
    contactPerson: '',
    notes: '',
    cvVersion: 'Support',
    followUpDate: '',
    lastUpdate: new Date().toISOString().split('T')[0]
  };
  const [newApp, setNewApp] = useState(initialNewApp);

  const statusOptions = ['Applied', 'Screening', 'Interview Scheduled', 'Interviewed', 'Technical Test', 'Offer', 'Rejected', 'Withdrawn', 'Follow-up Needed'];
  const cvVersionOptions = ['Support', 'Infrastructure', 'Custom'];
  const locationTypes = ['Remote', 'Hybrid', 'On-site - Lagos', 'On-site - Ibadan', 'On-site - Abuja', 'International Remote', 'Other'];
  const platformOptions = ['LinkedIn', 'Upwork', 'Indeed', 'Company Website', 'Referral', 'Recruiter Contact', 'Other'];


  // --- Persistence Logic ---

  // Load data from persistent storage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto-save whenever applications change (DEBOUNCED)
  useEffect(() => {
    if (!loading) {
      // Use a debounce timer to avoid saving on every keystroke
      const handler = setTimeout(() => {
        if (applications.length > 0) {
          saveData();
        }
      }, 500); // 500ms debounce time

      // Cleanup function: will cancel the save if applications change before 500ms
      return () => {
        clearTimeout(handler);
      };
    }
  }, [applications]); // Only re-run if applications array changes

  const loadData = async () => {
    try {
      // window.storage is assumed to be available
      const result = await window.storage.get('job-applications'); 
      if (result && result.value) {
        const data = JSON.parse(result.value);
        setApplications(data.applications || []);
        setLastSync(new Date(data.lastSync));
      }
    } catch (error) {
      console.log('No existing data, starting fresh');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    setSyncing(true);
    try {
      const data = {
        applications,
        lastSync: new Date().toISOString()
      };
      // window.storage is assumed to be available
      await window.storage.set('job-applications', JSON.stringify(data)); 
      setLastSync(new Date());
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save data. Please export as backup.');
    } finally {
      setSyncing(false);
    }
  };

  // --- CRUD Operations ---

  const addApplication = () => {
    if (newApp.company && newApp.position) {
      setApplications([...applications, { ...newApp, id: Date.now() }]);
      setNewApp(initialNewApp);
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

  // Simplified: Now only closes the edit state
  const saveEdit = () => {
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Improved: Automatically updates lastUpdate on any field change
  const updateField = (id, field, value) => {
    const today = new Date().toISOString().split('T')[0];
    setApplications(applications.map(app => 
      app.id === id ? { ...app, [field]: value, lastUpdate: today } : app
    ));
  };

  // --- Import/Export ---

  const exportToCSV = () => {
    const headers = ['Company', 'Position', 'Platform', 'Location', 'Date Applied', 'Status', 'Salary', 'Job URL', 'Contact Person', 'CV Version', 'Follow-up Date', 'Notes', 'Last Update'];
    const csvContent = [
      headers.join(','),
      ...applications.map(app => [
        app.company,
        app.position,
        app.platform || 'LinkedIn',
        app.location,
        app.dateApplied,
        app.status,
        app.salary,
        app.jobUrl,
        app.contactPerson,
        app.cvVersion,
        app.followUpDate,
        `"${app.notes?.replace(/"/g, '""') || ''}"`, // Handle quotes in notes for better CSV compatibility
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

  const importFromCSV = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // Basic split, assumes no commas outside of quoted fields (use PapaParse for production)
        const rows = text.split('\n').slice(1); // Skip header
        const imported = rows.filter(row => row.trim()).map(row => {
          // This crude split relies heavily on the export order and format
          const [company, position, platform, location, dateApplied, status, salary, jobUrl, contactPerson, cvVersion, followUpDate, notes] = row.split(',').map(s => s?.trim().replace(/"/g, ''));
          return {
            id: Date.now() + Math.random(),
            company: company,
            position: position,
            platform: platform || 'LinkedIn',
            location: location,
            dateApplied: dateApplied,
            status: status,
            salary: salary,
            jobUrl: jobUrl,
            contactPerson: contactPerson,
            cvVersion: cvVersion,
            followUpDate: followUpDate,
            notes: notes,
            lastUpdate: new Date().toISOString().split('T')[0]
          };
        });
        setApplications([...applications, ...imported]);
        alert(`Imported ${imported.length} applications`);
      };
      reader.readAsText(file);
    }
  };

  // --- Filtering, Sorting, and Stats ---

  let filteredApplications = applications;

  // Apply status filter
  if (filterStatus !== 'All') {
    filteredApplications = filteredApplications.filter(app => app.status === filterStatus);
  }

  // Apply platform filter
  if (filterPlatform !== 'All') {
    // Ensure it correctly handles missing platform field
    filteredApplications = filteredApplications.filter(app => (app.platform || 'LinkedIn') === filterPlatform);
  }

  // Apply search
  if (searchTerm) {
    filteredApplications = filteredApplications.filter(app => 
      app.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Apply sorting
  filteredApplications = [...filteredApplications].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'dateApplied' || sortBy === 'followUpDate') {
      aVal = new Date(aVal || '1970-01-01');
      bVal = new Date(bVal || '1970-01-01');
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    screening: applications.filter(a => a.status === 'Screening').length,
    interview: applications.filter(a => a.status === 'Interview Scheduled' || a.status === 'Interviewed').length,
    technical: applications.filter(a => a.status === 'Technical Test').length,
    offer: applications.filter(a => a.status === 'Offer').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
    thisWeek: applications.filter(a => {
      const appDate = new Date(a.dateApplied);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return appDate >= weekAgo;
    }).length,
    thisMonth: applications.filter(a => {
      const appDate = new Date(a.dateApplied);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return appDate >= monthAgo;
    }).length,
    byPlatform: {
      linkedin: applications.filter(a => (a.platform || 'LinkedIn') === 'LinkedIn').length,
      upwork: applications.filter(a => (a.platform || 'LinkedIn') === 'Upwork').length,
      indeed: applications.filter(a => (a.platform || 'LinkedIn') === 'Indeed').length,
      company: applications.filter(a => (a.platform || 'LinkedIn') === 'Company Website').length,
      other: applications.filter(a => !['LinkedIn', 'Upwork', 'Indeed', 'Company Website'].includes(a.platform || 'LinkedIn')).length
    },
    responseRate: applications.length > 0 
      ? Math.round(((applications.filter(a => !['Applied', 'Rejected', 'Withdrawn'].includes(a.status)).length / applications.length) * 100))
      : 0
  };

  const needsFollowUp = applications.filter(app => {
    if (!app.followUpDate) return false;
    const followUp = new Date(app.followUpDate);
    const today = new Date();
    // Reset time components for accurate date comparison
    today.setHours(0, 0, 0, 0); 
    followUp.setHours(0, 0, 0, 0);

    return followUp <= today && !['Rejected', 'Withdrawn', 'Offer'].includes(app.status);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Job Application Tracker</h1>
              <p className="text-gray-600 mt-1">Olusegun Balogun - Azure/Cloud Roles</p>
              {lastSync && (
                <p className="text-sm text-gray-500 mt-1">
                  {syncing ? '💾 Saving...' : `✅ Last saved: ${lastSync.toLocaleTimeString()}`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <label className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 transition cursor-pointer">
                <Upload size={20} />
                Import CSV
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={importFromCSV} 
                  className="hidden"
                  onClick={(e) => e.target.value = null} // Allows importing the same file again
                />
              </label>
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

          {/* Enhanced Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
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
            <div className="bg-cyan-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">{stats.technical}</div>
              <div className="text-sm text-gray-600">Technical</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.offer}</div>
              <div className="text-sm text-gray-600">Offers</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{stats.responseRate}%</div>
              <div className="text-sm text-gray-600">Response</div>
            </div>
          </div>

          {/* Time-based Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
              <Calendar size={20} className="text-gray-600" />
              <div>
                <div className="font-bold text-gray-800">{stats.thisWeek}</div>
                <div className="text-xs text-gray-600">This Week</div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
              <Briefcase size={20} className="text-gray-600" />
              <div>
                <div className="font-bold text-gray-800">{stats.thisMonth}</div>
                <div className="text-xs text-gray-600">This Month</div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              <div>
                <div className="font-bold text-blue-600">{stats.byPlatform.linkedin}</div>
                <div className="text-xs text-gray-600">LinkedIn</div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
              <TrendingUp size={20} className="text-green-600" />
              <div>
                <div className="font-bold text-green-600">{stats.byPlatform.upwork}</div>
                <div className="text-xs text-gray-600">Upwork</div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-600" />
              <div>
                <div className="font-bold text-purple-600">{stats.byPlatform.indeed}</div>
                <div className="text-xs text-gray-600">Indeed</div>
              </div>
            </div>
          </div>

          {/* Follow-up Alerts */}
          {needsFollowUp.length > 0 && (
            <div className="mt-4 bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
              <p className="font-semibold text-orange-800">⚠️ {needsFollowUp.length} application(s) need follow-up!</p>
              <div className="mt-2 text-sm text-orange-700">
                {needsFollowUp.map(app => (
                  <div key={app.id}>• {app.company} - {app.position} (Due: {app.followUpDate})</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Filter & Search */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
              <input
                type="text"
                placeholder="Company, position, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status Filter</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Status ({applications.length})</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status} ({applications.filter(a => a.status === status).length})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Platform Filter</label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Platforms</option>
                {platformOptions.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dateApplied">Date Applied</option>
                  <option value="company">Company</option>
                  <option value="status">Status</option>
                  <option value="followUpDate">Follow-up Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Showing **{filteredApplications.length}** of **{applications.length}** applications
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
                        // Use the statusColorMap for cleaner styling
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[app.status] || 'bg-gray-100 text-gray-800'}`}>
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
                          {/* saveEdit now only closes the editing state */}
                          <button onClick={saveEdit} className="text-green-600 hover:text-green-900"> 
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
            <p className="text-lg">No applications found. Click "**New Application**" to get started!</p>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-gray-800 mb-2">📋 Job Search Tips</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Target 5-10 applications daily (mix of local and remote)</li>
            <li>• Follow up 1-2 weeks after applying if no response</li>
            <li>• Use "**Support**" CV for support roles, "**Infrastructure**" for engineer roles</li>
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
