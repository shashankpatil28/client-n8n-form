"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Receipt, PlusCircle, LayoutDashboard, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Clients",
    items: [
      {
        name: "Contracts",
        href: "/dashboard/contracts",
        icon: FileText,
      },
      {
        name: "New Contract",
        href: "/dashboard/contracts/new",
        icon: Plus,
      },
    ],
  },
  {
    name: "Invoices",
    items: [
      {
        name: "All Invoices",
        href: "/dashboard/invoices",
        icon: Receipt,
      },
      {
        name: "Create Invoice",
        href: "/dashboard/invoices/new",
        icon: PlusCircle,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r flex flex-col sticky top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navigation.map((section) => (
          <div key={section.name}>
            <h2 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.name}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground flex-shrink-0">
        <p>Contract & Invoice Management</p>
      </div>
    </aside>
  );
}
