"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import SessionProvider from "./SessionProvider";

const NAV_PRINCIPAL = [
  {
    href: "/admin/reservas", label: "Agenda",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  },
  {
    href: "/admin/servicios", label: "Servicios",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm2.122-8.485a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/></svg>
  },
  {
    href: "/admin/bloqueos", label: "Bloqueos",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
  },
  {
    href: "/admin/peluqueros", label: "Equipo",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.196-3.796M9 20H4v-2a4 4 0 015.196-3.796M15 7a4 4 0 11-8 0 4 4 0 018 0zM21 12a3 3 0 11-6 0 3 3 0 016 0zM9 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  },
];

const NAV_MAS = [
  {
    href: "/admin/horarios", label: "Horarios",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  },
  {
    href: "/admin/cuenta", label: "Cuenta",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4"/><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
  },
];

const TODOS = [...NAV_PRINCIPAL, ...NAV_MAS];

function AdminNav() {
  const pathname = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);
  if (pathname === "/admin/login") return null;

  const enMas = NAV_MAS.some(n => n.href === pathname);

  return (
    <>
      {/* Top bar — solo desktop */}
      <nav className="hidden sm:block bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center h-14 gap-1">
          <span className="font-bold text-gray-900 text-sm mr-3">Panel</span>
          <div className="w-px h-5 bg-gray-200 mr-2" />
          <div className="flex gap-0.5 flex-1">
            {TODOS.map(n => {
              const active = pathname === n.href;
              return (
                <Link key={n.href} href={n.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    active ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {n.icon}
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span>Salir</span>
          </button>
        </div>
      </nav>

      {/* Bottom nav — solo mobile */}
      <>
        {/* Backdrop */}
        {masAbierto && (
          <div
            className="sm:hidden fixed inset-0 z-20"
            onClick={() => setMasAbierto(false)}
          />
        )}

        {/* Sheet "Más" */}
        {masAbierto && (
          <div className="sm:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-100 rounded-t-2xl shadow-lg px-2 py-3">
            {NAV_MAS.map(n => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMasAbierto(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                    active ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {n.icon}
                  <span className="font-medium text-sm">{n.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => { setMasAbierto(false); signOut({ callbackUrl: "/admin/login" }); }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              <span className="font-medium text-sm">Salir</span>
            </button>
          </div>
        )}

        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100">
          <div className="flex items-stretch h-16">
            {NAV_PRINCIPAL.map(n => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMasAbierto(false)}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    active ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  <div className={`p-1 rounded-lg ${active ? "bg-gray-100" : ""}`}>
                    {n.icon}
                  </div>
                  <span className="text-[10px] font-medium leading-none">{n.label}</span>
                </Link>
              );
            })}

            {/* Botón Más */}
            <button
              onClick={() => setMasAbierto(v => !v)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                masAbierto || enMas ? "text-gray-900" : "text-gray-400"
              }`}
            >
              <div className={`p-1 rounded-lg ${masAbierto || enMas ? "bg-gray-100" : ""}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                  <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
              </div>
              <span className="text-[10px] font-medium leading-none">Más</span>
            </button>
          </div>
        </nav>
      </>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6">{children}</main>
      </div>
    </SessionProvider>
  );
}
