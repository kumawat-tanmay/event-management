'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Home,
  CalendarDays,
  Users,
  UserCircle,
  FileText,
  Bookmark,
  CalendarCheck,
  Warehouse,
  Box,
  Truck,
  RotateCcw,
  UserCog,
  Briefcase,
  Car,
  Wallet,
  BarChart3,
  Settings,
  ChevronDown,
  X,
  PieChart,
  ClipboardList,
  Building2,
  Sliders,
  ShieldCheck,
  CreditCard,
  Building,
  User,
  ShoppingBag,
  ListOrdered,
  ReceiptText,
  BookOpen,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  MessageCircle,
  Images
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { WarehouseSwitcher } from './WarehouseSwitcher';

interface NavLink {
  name: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  children?: NavLink[];
}

const erpNavLinks: NavLink[] = [
  { name: 'Dashboard', href: '/', icon: Home, permission: 'dashboard.view' },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays, permission: 'operations.view' },
  { name: 'Messages', href: '/chat', icon: MessageSquare },
  {
    name: 'CRM & Parties',
    href: '/crm-group',
    icon: Users,
    permission: 'crm.view',
    children: [
      { name: 'Customers', href: '/crm/customers', icon: UserCircle, permission: 'crm.view' },
      { name: 'Leads', href: '/crm/leads', icon: Users, permission: 'crm.view' },
      { name: 'Site Visits', href: '/crm/site-visits', icon: Building, permission: 'crm.view' },
    ]
  },
  {
    name: 'Sales & Bookings',
    href: '/sales-group',
    icon: Bookmark,
    permission: 'bookings.view',
    children: [
      { name: 'Quotations', href: '/operations/quotations', icon: FileText, permission: 'quotations.view' },
      { name: 'Bookings', href: '/operations/bookings', icon: BookOpen, permission: 'bookings.view' },
      { name: 'Reservation', href: '/operations/reservation', icon: Bookmark, permission: 'bookings.view' },
    ]
  },
  {
    name: 'Event Execution',
    href: '/events-group',
    icon: CalendarCheck,
    permission: 'operations.view',
    children: [
      { name: 'Events List', href: '/events/list', icon: CalendarDays, permission: 'operations.view' },
      { name: 'Event Planning', href: '/events/planner', icon: ClipboardList, permission: 'operations.view' },
      { name: 'Packing & Dispatch', href: '/events/packing', icon: Box, permission: 'operations.view' },
      { name: 'Site Verification', href: '/events/verification', icon: ShieldCheck, permission: 'operations.view' },
      { name: 'Return & Damages', href: '/events/return', icon: RotateCcw, permission: 'operations.view' },
    ]
  },
  {
    name: 'Inventory',
    href: '/inventory-group',
    icon: Box,
    permission: 'inventory.view',
    children: [
      { name: 'Items', href: '/inventory/items', icon: Box, permission: 'inventory.view' },
      { name: 'Categories', href: '/inventory/categories', icon: ClipboardList, permission: 'inventory.view' },
      { name: 'Ledger', href: '/inventory/ledger', icon: FileText, permission: 'inventory.view' },
    ]
  },
  {
    name: 'HR & Payroll',
    href: '/hr-group',
    icon: UserCog,
    permission: 'hr.view',
    children: [
      { name: 'Team / Staff', href: '/hr/team', icon: Users, permission: 'hr.view' },
      { name: 'Payroll', href: '/hr/payroll', icon: Wallet, permission: 'hr.view' },
    ]
  },
  {
    name: 'Accounts & Finance',
    href: '/accounts-group',
    icon: Wallet,
    permission: 'finance.view',
    children: [
      { name: 'Payments', href: '/accounts/payments', icon: CreditCard, permission: 'finance.view' },
      { name: 'Expenses', href: '/accounts/expenses', icon: ReceiptText, permission: 'finance.view' },
    ]
  },
  {
    name: 'Asset & Fleet',
    href: '/fleet-group',
    icon: Truck,
    permission: 'warehouses.view',
    children: [
      { name: 'Vehicles', href: '/fleet/vehicles', icon: Car, permission: 'warehouses.view' },
      { name: 'Maintenance', href: '/fleet/maintenance', icon: Settings, permission: 'warehouses.view' },
    ]
  },
  {
    name: 'Analytics',
    href: '/reports-group',
    icon: PieChart,
    permission: 'reports.view',
    children: [
      { name: 'Business Overview', href: '/reports/overview', icon: TrendingUp, permission: 'reports.view' },
      { name: 'Event Profitability', href: '/reports/event-profitability', icon: BarChart3, permission: 'reports.view' },
    ]
  },
  {
    name: 'Settings',
    href: '/settings-group',
    icon: Settings,
    permission: 'users.view',
    children: [
      { name: 'Profile', href: '/settings/profile', icon: UserCircle },
      { name: 'Company', href: '/settings/company', icon: Building2 },
      { name: 'Users', href: '/settings/users', icon: Users, permission: 'users.view' },
      { name: 'Roles & Permissions', href: '/settings/roles', icon: ShieldCheck, permission: 'roles.view' },
      { name: 'Preferences', href: '/settings/preferences', icon: Sliders },
    ]
  },
];

const isLinkActive = (href: string, pathname: string, siblings: NavLink[] = []) => {
  if (pathname === href) return true;
  if (href === '/') return false;

  if (pathname.startsWith(href)) {
    const hasBetterSiblingMatch = siblings.some(sib =>
      sib.href !== href &&
      pathname.startsWith(sib.href) &&
      sib.href.length > href.length
    );
    return !hasBetterSiblingMatch;
  }
  return false;
};

export interface SideNavBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideNavBar({ isOpen, onClose }: SideNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>(['CRM & Parties']);

  // Filter links based on required permissions
  const authorizedLinks = React.useMemo(() => {
    return erpNavLinks.filter(link => {
      if (link.permission && !hasPermission(link.permission)) return false;
      return true;
    }).map(link => {
      if (link.children) {
        const authChildren = link.children.filter(child => {
          if (child.permission && !hasPermission(child.permission)) return false;
          return true;
        });
        return { ...link, children: authChildren };
      }
      return link;
    }).filter(link => {
      // Hide parent if all its originally existing children were filtered out
      const originalLink = erpNavLinks.find(l => l.name === link.name);
      const originalHadChildren = originalLink && originalLink.children && originalLink.children.length > 0;
      if (originalHadChildren && (!link.children || link.children.length === 0)) return false;
      return true;
    });
  }, [hasPermission]);

  // Automatically open sub-menu if child route is active
  useEffect(() => {
    authorizedLinks.forEach(item => {
      if (item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))) {
        setOpenSubMenus(prev => {
          if (!prev.includes(item.name)) return [item.name];
          return prev;
        });
      }
    });
  }, [pathname, authorizedLinks]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen w-72 max-w-[85vw] bg-card/95 backdrop-blur-md z-50 transition-transform duration-300 ease-in-out flex flex-col p-6 border-r border-border/50 shadow-xl",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>

        {/* Header: Brand + Close */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-foreground tracking-tight truncate max-w-[140px]">Krishna</div>
              <div className="text-[9px] font-bold text-primary uppercase tracking-widest">Tent & Events ERP</div>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden text-muted-foreground hover:text-error transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warehouse Switcher */}
        <div className="mb-4">
          <WarehouseSwitcher />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {authorizedLinks.map((link) => {
            const children = link.children;
            const hasChildren = children && children.length > 0;
            const isExpanded = openSubMenus.includes(link.name);
            const isActive = isLinkActive(link.href, pathname, authorizedLinks);
            const isChildActive = children?.some(child => isLinkActive(child.href, pathname, children) || pathname.startsWith(child.href + '/'));
            const Icon = link.icon;

            return (
              <div key={link.name} className="flex flex-col gap-1">
                {hasChildren ? (
                  <button
                    onClick={() => {
                      const isCurrentlyExpanded = openSubMenus.includes(link.name);
                      if (!isCurrentlyExpanded) {
                        setOpenSubMenus([link.name]);
                        if (!isChildActive && children && children.length > 0) {
                          router.push(children[0].href);
                          if (typeof window !== 'undefined' && window.innerWidth < 768) {
                            onClose();
                          }
                        }
                      } else {
                        setOpenSubMenus([]);
                      }
                    }}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full cursor-pointer",
                      isChildActive || isActive
                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 transition-transform duration-300",
                      isChildActive || isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )} />
                    <span className="text-sm font-semibold flex-1 text-left">{link.name}</span>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      isExpanded ? "rotate-180" : ""
                    )} />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 768) onClose();
                    }}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:translate-x-1",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm border-l-4 border-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )} />
                    <span className="text-sm font-semibold flex-1">{link.name}</span>
                  </Link>
                )}

                {/* Sub-menu Items */}
                {hasChildren && isExpanded && (
                  <div className="flex flex-col gap-1 ml-4 pl-4 border-l border-border/50 my-1 animate-in slide-in-from-top-2 duration-300">
                    {children?.map(child => {
                      const childActive = isLinkActive(child.href, pathname, children) || pathname.startsWith(child.href + '/');
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.innerWidth < 768) onClose();
                          }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:translate-x-1",
                            childActive
                              ? "text-primary bg-primary/5"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                          )}
                        >
                          <ChildIcon className="w-4 h-4" />
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
