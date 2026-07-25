'use client';

import React from 'react';
import { StatsCard } from '@/components/common/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  CalendarDays, Truck, RotateCcw, Wallet, Box, MapPin, Users, Bookmark,
  TrendingUp, ChevronRight, CloudRain, Info,
  Calendar, ChevronDown
} from 'lucide-react';
import Link from 'next/link';

// Mock Data for Charts
const revenueData = [
  { date: '21 May', amount: 5000 },
  { date: '22 May', amount: 10000 },
  { date: '23 May', amount: 12000 },
  { date: '24 May', amount: 8000 },
  { date: '25 May', amount: 18000 },
  { date: '26 May', amount: 15000 },
  { date: '27 May', amount: 22000 }
];

const profitLossData = [
  { date: '21 May', profit: 12000, expense: 8000 },
  { date: '22 May', profit: 15000, expense: 9000 },
  { date: '23 May', profit: 10000, expense: 11000 },
  { date: '24 May', profit: 18000, expense: 10000 },
  { date: '25 May', profit: 22000, expense: 12000 }
];

const inventoryData = [
  { name: 'Available', value: 1247, color: '#10b981' }, // Emerald
  { name: 'Reserved', value: 1358, color: '#3b82f6' },  // Blue
  { name: 'Damaged', value: 245, color: '#ef4444' },    // Red
  { name: 'Repair', value: 312, color: '#f59e0b' },     // Amber
  { name: 'Others', value: 490, color: '#6b7280' }      // Gray
];

export function DashboardView() {
  return (
    <div className="space-y-6 pb-12">

      {/* DASHBOARD OVERVIEW BANNER */}
      <div className="bg-gradient-to-r from-[#8a5a32] to-[#b37542] dark:from-[#734a29] dark:to-[#8a5a32] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-md">
        {/* Decorative Circle Background */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Left Side: Welcome Text */}
        <div className="relative z-10 mb-6 md:mb-0">
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-white mb-2 tracking-tight">
            Dashboard Overview <span className="inline-block ml-1">👋</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base font-medium max-w-lg">
            Welcome back, Kuldeep! Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Date Picker Button */}
            <button className="flex-1 sm:flex-none flex items-center justify-between gap-3 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-medium transition-colors backdrop-blur-sm border border-white/10 shadow-sm">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="opacity-90" />
                <span className="text-sm">18 May, 2025</span>
              </div>
              <ChevronDown size={16} className="opacity-70 ml-2" />
            </button>

            {/* Weather Alert Button */}
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-medium transition-colors backdrop-blur-sm border border-white/10 shadow-sm" title="Light Rain Expected">
              <CloudRain size={18} className="opacity-90" />
              <span className="text-sm">32°C, Jaipur</span>
            </button>
          </div>
        </div>
      </div>

      {/* ROW 1: 7 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard title="Today's Events" value="3" subtitle="+2.4%" icon={CalendarDays} colorTheme="warning" />
        <StatsCard title="Today's Dispatch" value="8" subtitle="Active" icon={Truck} colorTheme="blue" />
        <StatsCard title="Today's Returns" value="5" subtitle="Action Needed" icon={RotateCcw} colorTheme="orange" />
        <StatsCard title="Pending Payments" value="₹ 2,45,000" subtitle="Critical" icon={Wallet} colorTheme="error" />
        <StatsCard title="Available Stock" value="12,458" subtitle="+1.2%" icon={Box} colorTheme="success" />
        <StatsCard title="Material At Site" value="4,820" subtitle="Normal" icon={MapPin} colorTheme="yellow" />
        <StatsCard title="Staff Present" value="86%" subtitle="On Time" icon={Users} colorTheme="purple" />
      </div>

      {/* ROW 2: Analytics & Warehouse Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-start pb-4 space-y-0">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Revenue Overview</h3>
              <p className="text-2xl font-bold font-display mt-2">₹ 18,75,000</p>
              <p className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                <TrendingUp size={14} className="mr-1" /> + 24.5% <span className="text-muted-foreground ml-1">vs Last Month</span>
              </p>
            </div>
            <select className="text-xs bg-muted border border-border rounded-md px-2 py-1 outline-none">
              <option>This Month</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="h-56 mt-4 w-full relative flex items-end">
              {/* Fake X-axis Grid */}
              <div className="absolute inset-0 border-b border-border pointer-events-none"></div>
              
              {/* SVG Area Chart */}
              <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8a5a32" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8a5a32" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path
                  d="M0,45 C15,40 25,35 40,25 C55,15 65,30 80,10 C90,0 95,5 100,5 L100,50 L0,50 Z"
                  fill="url(#colorRevenue)"
                />
                <path
                  d="M0,45 C15,40 25,35 40,25 C55,15 65,30 80,10 C90,0 95,5 100,5"
                  fill="none"
                  stroke="#8a5a32"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Profit & Loss Overview */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-start pb-4 space-y-0">
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Profit & Loss Overview</h3>
              <p className="text-2xl font-bold font-display mt-2">₹ 6,45,000</p>
              <p className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                <TrendingUp size={14} className="mr-1" /> + 18.7% <span className="text-muted-foreground ml-1">vs Last Month</span>
              </p>
            </div>
            <select className="text-xs bg-muted border border-border rounded-md px-2 py-1 outline-none">
              <option>This Month</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-end space-x-4 mb-2">
              <div className="flex items-center text-[10px] text-muted-foreground font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></div> Profit</div>
              <div className="flex items-center text-[10px] text-muted-foreground font-medium"><div className="w-2 h-2 rounded-full bg-primary mr-1"></div> Expense</div>
            </div>
            <div className="h-44 flex items-end justify-between px-2 pb-2 pt-6 relative">
              {/* Fake grid lines */}
              <div className="absolute left-0 right-0 bottom-1/3 h-px bg-border"></div>
              <div className="absolute left-0 right-0 bottom-2/3 h-px bg-border"></div>
              <div className="absolute left-0 right-0 top-0 h-px bg-border"></div>
              
              {/* Tailwind CSS Bars */}
              {[40, 70, 45, 90, 60].map((val, idx) => (
                <div key={idx} className="flex flex-col justify-end h-full w-10 mx-2 relative z-10 group">
                  <div className="flex w-full items-end justify-center space-x-1 h-full">
                    <div className="bg-emerald-500 w-3 rounded-t-sm hover:opacity-80 transition-opacity" style={{ height: `${val}%` }}></div>
                    <div className="bg-primary w-3 rounded-t-sm hover:opacity-80 transition-opacity" style={{ height: `${val - 20}%` }}></div>
                  </div>
                  <div className="text-[9px] text-muted-foreground text-center pt-2 border-t border-border mt-1">Day {idx+1}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Summary */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
            <h3 className="text-sm font-bold text-foreground tracking-wide uppercase">Warehouse Summary</h3>
            <Link href="/warehouses" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>At Site</TableHead>
                  <TableHead>Damaged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell>Main Warehouse</TableCell><TableCell>1,845</TableCell><TableCell>662</TableCell><TableCell>338</TableCell><TableCell className="text-error">23</TableCell></TableRow>
                <TableRow><TableCell>Jaipur Warehouse</TableCell><TableCell>1,247</TableCell><TableCell>472</TableCell><TableCell>239</TableCell><TableCell className="text-error">18</TableCell></TableRow>
                <TableRow><TableCell>Ajmer Warehouse</TableCell><TableCell>560</TableCell><TableCell>213</TableCell><TableCell>135</TableCell><TableCell className="text-error">10</TableCell></TableRow>
                <TableRow><TableCell>Jodhpur Warehouse</TableCell><TableCell>745</TableCell><TableCell>312</TableCell><TableCell>198</TableCell><TableCell className="text-error">7</TableCell></TableRow>
                <TableRow className="font-bold border-t-2"><TableCell>Total</TableCell><TableCell>4,397</TableCell><TableCell>1,659</TableCell><TableCell>910</TableCell><TableCell className="text-error">58</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: Inventory Flow & Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Inventory Status (Donut) */}
        <Card className="xl:col-span-3">
          <CardHeader className="pb-6">
            <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="w-full h-40 relative mb-2 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="15" opacity="0.2" />
                  
                  {/* Segments (stroke-dasharray="circumference") circumference = 2 * pi * r = 251.2 */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="15" strokeDasharray="140 251.2" strokeDashoffset="0" className="hover:opacity-80 transition-opacity cursor-pointer" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="15" strokeDasharray="60 251.2" strokeDashoffset="-140" className="hover:opacity-80 transition-opacity cursor-pointer" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#8a5a32" strokeWidth="15" strokeDasharray="25 251.2" strokeDashoffset="-200" className="hover:opacity-80 transition-opacity cursor-pointer" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="15" strokeDasharray="15 251.2" strokeDashoffset="-225" className="hover:opacity-80 transition-opacity cursor-pointer" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="15" strokeDasharray="11.2 251.2" strokeDashoffset="-240" className="hover:opacity-80 transition-opacity cursor-pointer" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-muted-foreground font-semibold">Total Items</span>
                  <span className="text-xl font-bold font-display text-foreground">3,652</span>
                </div>
              </div>
              
              <div className="w-full grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] font-medium mt-4">
                {inventoryData.map((item, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }}></div> 
                    {item.name} <span className="text-muted-foreground ml-1">({Math.round((item.value / 3652) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material Movement Flow */}
        <Card className="xl:col-span-5 relative overflow-hidden">
          <CardHeader className="pb-8">
            <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Material Movement Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center px-2 md:px-6 mt-4 relative">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-1/2 z-0"></div>

              {/* Steps */}
              {[
                { label: 'Available', val: '12k', icon: Box, color: 'bg-emerald-500 text-white border-emerald-500' },
                { label: 'Reserved', val: '5.6k', icon: Bookmark, color: 'bg-blue-500 text-white border-blue-500' },
                { label: 'Loading', val: '1.2k', icon: Truck, color: 'bg-orange-500 text-white border-orange-500' },
                { label: 'Dispatch', val: '8.4k', icon: Truck, color: 'bg-primary text-white border-primary' },
                { label: 'At Site', val: '4.8k', icon: MapPin, color: 'bg-yellow-500 text-white border-yellow-500' },
                { label: 'Return', val: '1.2k', icon: RotateCcw, color: 'bg-red-500 text-white border-red-500' },
              ].map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center group">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-4 border-card shadow-sm transition-transform group-hover:scale-110 ${step.color}`}>
                    <step.icon size={14} className="md:w-4 md:h-4" />
                  </div>
                  <div className="text-center mt-2 bg-card px-1">
                    <p className="text-[9px] md:text-[10px] font-semibold text-muted-foreground">{step.label}</p>
                    <p className="text-[11px] md:text-[12px] font-bold text-foreground mt-0.5">{step.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Calendar Widget */}
        <Card className="xl:col-span-4 flex flex-col">
          <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
            <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Event Calendar</CardTitle>
            <Link href="/calendar" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 bg-muted/50 rounded-lg p-1 border border-border">
                <button className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                <button className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
                <span className="text-[12px] font-bold px-2">May 2025 <span className="text-[10px] ml-1">▼</span></span>
              </div>
              <div className="flex bg-muted/50 rounded-lg p-1 border border-border text-[11px] font-semibold">
                <button className="px-3 py-1 rounded bg-[#8a5a32] text-white shadow-sm">Month</button>
                <button className="px-3 py-1 rounded text-muted-foreground hover:text-foreground">Week</button>
                <button className="px-3 py-1 rounded text-muted-foreground hover:text-foreground">Day</button>
              </div>
            </div>

            <div className="flex flex-1 gap-4">
              {/* Left: Mini Calendar */}
              <div className="w-1/2">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-[9px] font-bold text-muted-foreground uppercase">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
                  {/* Previous Month */}
                  <div className="py-1 text-muted-foreground/40">27</div>
                  <div className="py-1 text-muted-foreground/40">28</div>
                  <div className="py-1 text-muted-foreground/40">29</div>
                  <div className="py-1 text-muted-foreground/40">30</div>
                  {/* Current Month */}
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">1</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">2</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">3</div>

                  <div className="py-1 hover:bg-muted rounded cursor-pointer">4</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">5</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">6</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">7</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">8</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">9</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">10</div>

                  <div className="py-1 hover:bg-muted rounded cursor-pointer">11</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">12</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">13</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">14</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">15</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">16</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">17</div>

                  <div className="py-1 hover:bg-muted rounded cursor-pointer">18</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">19</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">20</div>
                  <div className="py-1 bg-[#8a5a32] text-white rounded shadow-sm font-bold cursor-pointer">21</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">22</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">23</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">24</div>

                  <div className="py-1 hover:bg-muted rounded cursor-pointer">25</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">26</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">27</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">28</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">29</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">30</div>
                  <div className="py-1 hover:bg-muted rounded cursor-pointer">31</div>
                </div>
              </div>

              {/* Right: Upcoming Events List */}
              <div className="w-1/2 flex flex-col space-y-3 overflow-y-auto pr-1">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">21 May</p>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[12px] font-bold text-foreground leading-tight">Sharma Wedding</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Royal Heritage Resort, Jaipur</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 px-1.5 py-0.5 rounded">10:00 AM</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">22 May</p>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[12px] font-bold text-foreground leading-tight">Gupta Wedding</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Dream City Lawn, Ajmer</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-500 px-1.5 py-0.5 rounded">04:00 PM</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">23 May</p>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[12px] font-bold text-foreground leading-tight">Meena Reception</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Krishna Palace, Nagaur</p>
                    </div>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-500 px-1.5 py-0.5 rounded">07:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ROW 4: Bookings, Timeline, Weather, AI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Recent Bookings (col-span-2) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
            <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Recent Bookings</CardTitle>
            <Link href="/bookings" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <Table className="whitespace-nowrap">
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-primary">BK-2025-1058</TableCell>
                  <TableCell className="font-semibold">Rakesh Sharma</TableCell>
                  <TableCell>21 May 2025</TableCell>
                  <TableCell>Jaipur</TableCell>
                  <TableCell className="text-right font-medium">₹ 2,85,000</TableCell>
                  <TableCell className="text-right"><StatusBadge status="At Site" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-primary">BK-2025-1057</TableCell>
                  <TableCell className="font-semibold">Mukesh Gupta</TableCell>
                  <TableCell>22 May 2025</TableCell>
                  <TableCell>Ajmer</TableCell>
                  <TableCell className="text-right font-medium">₹ 3,40,000</TableCell>
                  <TableCell className="text-right"><StatusBadge status="Confirmed" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-primary">BK-2025-1056</TableCell>
                  <TableCell className="font-semibold">Suresh Meena</TableCell>
                  <TableCell>23 May 2025</TableCell>
                  <TableCell>Nagaur</TableCell>
                  <TableCell className="text-right font-medium">₹ 1,95,000</TableCell>
                  <TableCell className="text-right"><StatusBadge status="Loading" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-primary">BK-2025-1055</TableCell>
                  <TableCell className="font-semibold">Mahesh Jangid</TableCell>
                  <TableCell>24 May 2025</TableCell>
                  <TableCell>Jodhpur</TableCell>
                  <TableCell className="text-right font-medium">₹ 2,10,000</TableCell>
                  <TableCell className="text-right"><StatusBadge status="Confirmed" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-primary">BK-2025-1054</TableCell>
                  <TableCell className="font-semibold">Pooja Choudhary</TableCell>
                  <TableCell>25 May 2025</TableCell>
                  <TableCell>Sikar</TableCell>
                  <TableCell className="text-right font-medium">₹ 1,75,000</TableCell>
                  <TableCell className="text-right"><StatusBadge status="Pending" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dispatch Timeline */}
        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Dispatch Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border z-0"></div>

              <div className="relative z-10">
                <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-500 border-4 border-card flex items-center justify-center"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[13px] font-bold text-foreground leading-tight">Loaded <span className="text-[10px] text-emerald-500 font-medium ml-1">12 Events</span></p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Materials loaded in warehouse</p>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">10:00 AM</span>
                </div>
              </div>

              <div className="relative z-10">
                <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-blue-500 border-4 border-card flex items-center justify-center"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[13px] font-bold text-foreground leading-tight">In Transit <span className="text-[10px] text-blue-500 font-medium ml-1">6 Events</span></p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Materials are on the way</p>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">01:30 PM</span>
                </div>
              </div>

              <div className="relative z-10">
                <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-yellow-500 border-4 border-card flex items-center justify-center"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[13px] font-bold text-foreground leading-tight">At Site <span className="text-[10px] text-yellow-500 font-medium ml-1">18 Events</span></p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Materials reached at site</p>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">05:10 PM</span>
                </div>
              </div>

              <div className="relative z-10">
                <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-600 border-4 border-card flex items-center justify-center"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[13px] font-bold text-muted-foreground leading-tight">Completed <span className="text-[10px] font-medium ml-1">9 Events</span></p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Event completed successfully</p>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground">10:00 PM</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather & AI Alerts Stack */}
        <div className="flex flex-col gap-4">

          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase flex items-center">
                <CloudRain size={16} className="mr-2 text-blue-500" /> Weather Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Jaipur, Rajasthan</p>
              <h2 className="text-3xl font-display font-bold text-foreground mb-1">32°C</h2>
              <p className="text-[12px] text-muted-foreground mb-3">Light Rain Expected<br />21 May 2025</p>
              <Link href="#" className="text-[11px] text-primary font-medium hover:underline">View Full Forecast &rarr;</Link>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase flex items-center">
                <span className="text-primary mr-2">✦</span> AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start text-[12px] text-foreground font-medium">
                  <Info size={14} className="mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  3 items are low in stock.
                </li>
                <li className="flex items-start text-[12px] text-foreground font-medium">
                  <Info size={14} className="mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  2 bookings need advance payment.
                </li>
                <li className="flex items-start text-[12px] text-foreground font-medium">
                  <Info size={14} className="mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  1 event has weather risk.
                </li>
              </ul>
              <Link href="#" className="text-[11px] text-primary font-medium hover:underline mt-4 inline-block">View All Suggestions &rarr;</Link>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* ROW 5: Pending Dispatch, Returns, Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pending Dispatch */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
            <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Pending Dispatch</CardTitle>
            <Link href="/dispatches" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch ID</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>DIS-2025-208</TableCell>
                  <TableCell>Sharma Wedding</TableCell>
                  <TableCell>21 May</TableCell>
                  <TableCell><StatusBadge status="Ready" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>DIS-2025-207</TableCell>
                  <TableCell>Gupta Wedding</TableCell>
                  <TableCell>22 May</TableCell>
                  <TableCell><StatusBadge status="In Progress" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>DIS-2025-206</TableCell>
                  <TableCell>Meena Reception</TableCell>
                  <TableCell>23 May</TableCell>
                  <TableCell><StatusBadge status="Pending" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Returns */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
            <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Pending Returns</CardTitle>
            <Link href="/returns" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>RET-2025-110</TableCell>
                  <TableCell>Verma Wedding</TableCell>
                  <TableCell>20 May</TableCell>
                  <TableCell><StatusBadge status="Pending" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>RET-2025-109</TableCell>
                  <TableCell>Patel Wedding</TableCell>
                  <TableCell>19 May</TableCell>
                  <TableCell><StatusBadge status="In Transit" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>RET-2025-108</TableCell>
                  <TableCell>Khandelwal Event</TableCell>
                  <TableCell>18 May</TableCell>
                  <TableCell><StatusBadge status="Pending" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-4 space-y-0">
            <CardTitle className="text-sm font-bold text-foreground tracking-wide uppercase">Upcoming Tasks</CardTitle>
            <Link href="/tasks" className="text-[11px] text-muted-foreground hover:text-primary">View all &rarr;</Link>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="space-y-4">
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-3 rounded text-primary focus:ring-primary border-border" />
                <div>
                  <p className="text-[12px] font-medium text-foreground">Check inventory for upcoming events</p>
                  <p className="text-[10px] text-error font-semibold mt-0.5">Today</p>
                </div>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-3 rounded text-primary focus:ring-primary border-border" />
                <div>
                  <p className="text-[12px] font-medium text-foreground">Follow up pending payments</p>
                  <p className="text-[10px] text-blue-500 font-semibold mt-0.5">Tomorrow</p>
                </div>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-3 rounded text-primary focus:ring-primary border-border" />
                <div>
                  <p className="text-[12px] font-medium text-foreground">Schedule warehouse maintenance</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">24 May 2025</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
