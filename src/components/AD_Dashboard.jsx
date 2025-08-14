import React, { useState } from 'react';
import { Search, Mail, FileText, Building, Wrench, Printer, Home, FileCheck, Eye, BarChart, Users, Settings } from 'lucide-react';
import AD_Sidebar from './AD_Sidebar';

const AD_Dashboard = () => {
  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastname");

  const sidebarItems = [
    { name: 'Dashboard', icon: Home, active: true },
    { name: 'PPE Entry Form', icon: FileCheck, active: false },
    { name: 'Inspection', icon: Eye, active: false },
    { name: 'Report', icon: BarChart, active: false },
    { name: 'Account Management', icon: Users, active: false },
    { name: 'Manage Tables', icon: Settings, active: false }
  ];

  const metrics = [
    { title: 'Total PAR Items', value: '1,056', subtitle: '+36 items added since Last Year', trend: 'up' },
    { title: 'Total ICS (Semi-Expendable) Items', value: '1,056', subtitle: '+36 items added since Last Year', trend: 'up' },
    { title: 'Buildings and Structures', value: '—', subtitle: '', trend: 'neutral' },
    { title: 'Pending MFC Tagging', value: '57', subtitle: '+52 Items still not tagged', trend: 'up' },
    { title: 'Unreleased PAR/ICS', value: '1,056', subtitle: 'Awaiting department acknowledgment', trend: 'neutral' },
    { title: 'Items for Reassignment/Disposal', value: '—', subtitle: '', trend: 'neutral' },
    { title: 'Repair & Lost Reports This Month', value: '—', subtitle: '— Reports — Lost reports', trend: 'neutral' },
    { title: 'Total Users / Departments', value: '345 Users', subtitle: '57 Departments', trend: 'neutral' }
  ];

  const quickLinks = [
    { name: 'Property Assignment', icon: Mail, color: 'bg-blue-800' },
    { name: 'PAR and ICS', icon: FileText, color: 'bg-blue-800' },
    { name: 'Building and Structures', icon: Building, color: 'bg-blue-800' },
    { name: 'Log Repair / Lost Item', icon: Wrench, color: 'bg-blue-800' },
    { name: 'Generate Reports', icon: Printer, color: 'bg-blue-800' }
  ];

  const recentActivity = [
    {
      date: '12/07/2025',
      name: 'Angelo Aban',
      office: 'Office of the Mayor',
      activity: 'Description'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AD_Sidebar />

      {/* Main content area */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">GSO Admin Dashboard</h1>
          <p className="text-gray-600">Hi, {firstName} {lastName}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{metric.title}</h3>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
              {metric.subtitle && (
                <p className="text-xs text-gray-500">{metric.subtitle}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickLinks.map((link, index) => (
              <div key={index} className={`${link.color} rounded-lg p-6 text-white cursor-pointer hover:opacity-90 transition-opacity`}>
                <div className="flex flex-col items-center text-center">
                  <link.icon className="h-8 w-8 mb-3" />
                  <span className="text-sm font-medium">{link.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Office/Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.office}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AD_Dashboard;