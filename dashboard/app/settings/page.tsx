'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, CreditCard, Shield, Trash2, Save } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { Sidebar } from '../../components/dashboard/sidebar'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="glass-strong border-b border-border p-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-text-secondary mt-2">Manage your account settings and preferences</p>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">First Name</label>
                        <Input placeholder="John" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Last Name</label>
                        <Input placeholder="Doe" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input type="email" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Company</label>
                      <Input placeholder="Acme Inc." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bio</label>
                      <textarea
                        className="w-full min-h-[100px] rounded-lg border border-border bg-surface px-4 py-3 text-base placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Email notifications', description: 'Receive email updates about your projects' },
                      { label: 'Project updates', description: 'Get notified when projects are updated' },
                      { label: 'Task assignments', description: 'Notifications when tasks are assigned to you' },
                      { label: 'Weekly reports', description: 'Receive weekly project summary reports' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-4 rounded-lg bg-surface border border-border">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-text-secondary">{item.description}</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5 rounded border-border" defaultChecked />
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-6">Current Plan</h2>
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Pro Plan</h3>
                        <p className="text-text-secondary">$29/month</p>
                      </div>
                      <Button variant="secondary">Change Plan</Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>✓ Unlimited projects</p>
                      <p>✓ Unlimited analyses</p>
                      <p>✓ Priority support</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                  <div className="p-4 rounded-lg bg-surface border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-text-secondary">Expires 12/25</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Update</Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <Input type="password" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <Input type="password" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <Input type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-danger">Danger Zone</h2>
                  <div className="p-4 rounded-lg bg-danger/10 border border-danger/20">
                    <p className="text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <Button variant="danger" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

