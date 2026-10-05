import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";
import VedaProvider from "@/components/veda/VedaProvider";
import Link from "next/link";
import { Home, PieChart, Package, BookOpen, FileText, Settings } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoDeva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-noto-deva" });
const notoKan = Noto_Sans_Kannada({ subsets: ["kannada"], variable: "--font-noto-kan" });

export const metadata: Metadata = {
  title: "Veda - AI Merchant Copilot",
  description: "Hands-free voice assistant for shopkeepers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoDeva.variable} ${notoKan.variable} antialiased min-h-screen flex flex-col md:flex-row bg-background`}>
        <VedaProvider>
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-64 flex-col bg-surface border-r border-primary-100 p-4">
            <div className="text-primary-800 font-bold text-2xl mb-8 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500"></div>
              Veda
            </div>
            <nav className="flex flex-col gap-2">
              <NavLink href="/" icon={<Home size={20}/>} text="Dashboard" />
              <NavLink href="/insights" icon={<PieChart size={20}/>} text="Insights" />
              <NavLink href="/inventory" icon={<Package size={20}/>} text="Inventory" />
              <NavLink href="/udhaar" icon={<BookOpen size={20}/>} text="Udhaar" />
              <NavLink href="/schemes" icon={<FileText size={20}/>} text="Schemes" />
              <NavLink href="/settings" icon={<Settings size={20}/>} text="Settings" />
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 pb-20 md:pb-0 relative h-screen overflow-y-auto">
            {children}
          </div>

          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-primary-100 flex items-center justify-around z-30 px-2">
            <MobileNavLink href="/" icon={<Home size={24}/>} />
            <MobileNavLink href="/insights" icon={<PieChart size={24}/>} />
            <MobileNavLink href="/inventory" icon={<Package size={24}/>} />
            <MobileNavLink href="/udhaar" icon={<BookOpen size={24}/>} />
            <MobileNavLink href="/schemes" icon={<FileText size={24}/>} />
          </nav>
        </VedaProvider>
      </body>
    </html>
  );
}

function NavLink({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary-50 text-ink transition-colors touch-target">
      <span className="text-primary-600">{icon}</span>
      <span className="font-medium">{text}</span>
    </Link>
  );
}

function MobileNavLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="p-3 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors touch-target flex items-center justify-center">
      {icon}
    </Link>
  );
}
