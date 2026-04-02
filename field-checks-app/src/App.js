import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';

// Modern Navigation component with improved styling
const Navigation = () => (
  <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg border-b border-blue-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <div className="flex-shrink-0 flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
              <span className="text-blue-600 font-bold text-sm">D</span>
            </div>
            <h1 className="text-xl font-bold text-white">DRMIS Field</h1>
          </div>
          <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
            <Link to="/dashboard" className="text-white hover:bg-blue-800 hover:bg-opacity-50 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link to="/field-checks/new" className="text-blue-100 hover:text-white hover:bg-blue-800 hover:bg-opacity-50 inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Check
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-blue-800 bg-opacity-50 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-100 text-sm">Online</span>
          </div>
          <button className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md transition-all duration-200 transform hover:scale-105">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync
          </button>
        </div>
      </div>
    </div>
  </nav>
);

// Modern Dashboard component with enhanced UI
const Dashboard = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <Navigation />
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Field Check Dashboard</h2>
            <p className="mt-2 text-gray-600">Manage and monitor field damage assessments</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last sync</p>
            <p className="text-lg font-semibold text-gray-900">2 minutes ago</p>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 text-white">
                <p className="text-sm font-medium opacity-90">Pending Sync</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>0% from last hour</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 text-white">
                <p className="text-sm font-medium opacity-90">Today's Checks</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Same as yesterday</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4 text-white">
                <p className="text-sm font-medium opacity-90">This Week</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              <span>-100% from last week</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-4">
            <div className="flex items-center">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4 text-white">
                <p className="text-sm font-medium opacity-90">Status</p>
                <p className="text-2xl font-bold">Online</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="flex items-center text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link to="/field-checks/new" className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl p-6 text-white transition-all duration-200 transform hover:scale-105 hover:shadow-xl">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 rounded-lg p-3 group-hover:bg-opacity-30 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">New Field Check</p>
                  <p className="text-sm opacity-90">Start damage assessment</p>
                </div>
              </div>
            </Link>
            
            <button className="group relative bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl p-6 text-gray-700 hover:text-blue-700 transition-all duration-200 transform hover:scale-105 hover:shadow-xl">
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-lg p-3 group-hover:bg-blue-100 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">View All Checks</p>
                  <p className="text-sm text-gray-500 group-hover:text-blue-600">Browse assessments</p>
                </div>
              </div>
            </button>
            
            <button className="group relative bg-white border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 rounded-xl p-6 text-gray-700 hover:text-green-700 transition-all duration-200 transform hover:scale-105 hover:shadow-xl">
              <div className="flex items-center">
                <div className="bg-gray-100 rounded-lg p-3 group-hover:bg-green-100 transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Sync Status</p>
                  <p className="text-sm text-gray-500 group-hover:text-green-600">View sync queue</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</button>
        </div>
        <div className="p-8 text-center">
          <div className="bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No recent field checks</h4>
          <p className="text-gray-600 mb-6">Start by creating your first field check assessment</p>
          <Link to="/field-checks/new" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create First Field Check
          </Link>
        </div>
      </div>
    </main>
  </div>
);

// Enhanced Field Check Form component with modern design
const FieldCheckForm = () => {
  const [selectedRoofDamage, setSelectedRoofDamage] = useState('');
  const [selectedWallDamage, setSelectedWallDamage] = useState('');
  const [gpsLocation, setGpsLocation] = useState({ latitude: '', longitude: '' });

  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <Navigation />
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">New Field Check</h2>
            <p className="mt-2 text-gray-600">Complete the form below to assess damage</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">Draft</span>
            <span className="text-sm text-gray-500">Auto-saved 2 min ago</span>
          </div>
        </div>
      </div>

      <form className="space-y-6">
        {/* Enhanced Asset Information */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Asset Information
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="asset-type" className="block text-sm font-semibold text-gray-700">Asset Type</label>
                <select id="asset-type" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white">
                  <option>Select asset type...</option>
                  <option>Education</option>
                  <option>Health</option>
                  <option>Shelter</option>
                  <option>Infrastructure</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="asset-id" className="block text-sm font-semibold text-gray-700">Asset ID</label>
                <input type="text" id="asset-id" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" placeholder="Enter asset ID..." />
              </div>
              <div className="space-y-2">
                <label htmlFor="asset-name" className="block text-sm font-semibold text-gray-700">Asset Name</label>
                <input type="text" id="asset-name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" placeholder="Enter asset name..." />
              </div>
              <div className="space-y-2">
                <label htmlFor="council" className="block text-sm font-semibold text-gray-700">Area Council</label>
                <select id="council" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white">
                  <option>Select council...</option>
                  <option>Port Vila</option>
                  <option>Luganville</option>
                  <option>Tafea</option>
                  <option>Penama</option>
                  <option>Malampa</option>
                  <option>Shefa</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced GPS Location */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              GPS Location
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-4">
              <div className="space-y-2">
                <label htmlFor="latitude" className="block text-sm font-semibold text-gray-700">Latitude</label>
                <input 
                  type="text" 
                  id="latitude" 
                  value={gpsLocation.latitude}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700" 
                  placeholder="Auto-captured..." 
                  readOnly 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="longitude" className="block text-sm font-semibold text-gray-700">Longitude</label>
                <input 
                  type="text" 
                  id="longitude" 
                  value={gpsLocation.longitude}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700" 
                  placeholder="Auto-captured..." 
                  readOnly 
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                type="button" 
                onClick={() => setGpsLocation({ latitude: '-17.7333', longitude: '168.3167' })}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Capture GPS Location
              </button>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                <span>GPS accuracy: ±5 meters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Damage Assessment */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Damage Assessment
            </h3>
          </div>
          <div className="p-6">
            
            {/* Enhanced Roof Damage */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                Roof Damage
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { condition: 'intact', percentage: '0%', color: 'green', label: 'Intact', desc: 'No visible damage' },
                  { condition: 'minor', percentage: '20%', color: 'yellow', label: 'Minor', desc: 'Some sheets loose' },
                  { condition: 'major', percentage: '60%', color: 'orange', label: 'Major', desc: 'Large sections missing' },
                  { condition: 'destroyed', percentage: '100%', color: 'red', label: 'Destroyed', desc: 'Complete loss' }
                ].map((damage) => (
                  <div 
                    key={damage.condition} 
                    onClick={() => setSelectedRoofDamage(damage.condition)}
                    className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                      selectedRoofDamage === damage.condition 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <input 
                        type="radio" 
                        name="roof-damage" 
                        checked={selectedRoofDamage === damage.condition}
                        onChange={() => setSelectedRoofDamage(damage.condition)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <p className="text-sm font-semibold text-gray-900">{damage.label}</p>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full bg-${damage.color}-100 text-${damage.color}-800`}>
                            {damage.percentage}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{damage.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Wall Damage */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Wall Damage
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { condition: 'intact', percentage: '0%', color: 'green', label: 'Intact', desc: 'Minor cracks only' },
                  { condition: 'minor', percentage: '15%', color: 'yellow', label: 'Minor', desc: 'Some holes' },
                  { condition: 'major', percentage: '50%', color: 'orange', label: 'Major', desc: 'Partial collapse' },
                  { condition: 'destroyed', percentage: '100%', color: 'red', label: 'Destroyed', desc: 'Complete failure' }
                ].map((damage) => (
                  <div 
                    key={damage.condition} 
                    onClick={() => setSelectedWallDamage(damage.condition)}
                    className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                      selectedWallDamage === damage.condition 
                        ? 'border-purple-500 bg-purple-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <input 
                        type="radio" 
                        name="wall-damage" 
                        checked={selectedWallDamage === damage.condition}
                        onChange={() => setSelectedWallDamage(damage.condition)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300" 
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <p className="text-sm font-semibold text-gray-900">{damage.label}</p>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full bg-${damage.color}-100 text-${damage.color}-800`}>
                            {damage.percentage}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{damage.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Notes */}
            <div className="space-y-2">
              <label htmlFor="damage-notes" className="block text-sm font-semibold text-gray-700">Damage Notes</label>
              <textarea 
                id="damage-notes" 
                rows={4} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                placeholder="Enter detailed damage observations, specific areas affected, etc..." 
              />
            </div>
          </div>
        </div>

        {/* Enhanced Photos */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Photo Documentation
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { type: 'roof', icon: '🏠', label: 'Roof', desc: 'Take photo of roof damage' },
                { type: 'wall', icon: '🧱', label: 'Wall', desc: 'Take photo of wall damage' },
                { type: 'overall', icon: '📷', label: 'Overall', desc: 'Take wide shot of building' },
                { type: 'interior', icon: '🏢', label: 'Interior', desc: 'Take photo of interior damage' }
              ].map((photo) => (
                <div key={photo.type} className="group">
                  <div className="relative">
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group-hover:shadow-md">
                      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{photo.icon}</div>
                      <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{photo.label}</p>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-blue-500 text-white rounded-full p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">{photo.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Form Actions */}
        <div className="flex justify-between items-center bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <button type="button" className="inline-flex items-center px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Save Draft
            </button>
            <span className="text-sm text-gray-500">Auto-saves every 30 seconds</span>
          </div>
          <div className="flex items-center space-x-3">
            <button type="button" className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-all duration-200 transform hover:scale-105">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit Field Check
            </button>
          </div>
        </div>
      </form>
    </main>
  </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/field-checks/new" element={<FieldCheckForm />} />
      </Routes>
    </Router>
  );
}

export default App;
