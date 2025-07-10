'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from "@discord-dashboard/auth"

export default function Navbar() {
    const [open, setOpen] = useState(false)
    const auth = useAuth();

    return (
        <nav className="sticky top-0 bg-white/10 backdrop-blur-lg z-50 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <span className="text-xl font-bold text-gray-900">
          Velo
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Theme
          </span>
        </span>
                <div className="hidden md:flex space-x-8">
                    <a
                        key={"home"}
                        href="/"
                        className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition"
                    >
                        Home
                    </a>
                    <a
                        key={"manage-guilds"}
                        href="/guilds"
                        className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition"
                    >
                        Manage Guilds
                    </a>
                    <a
                        key={"commands"}
                        href="/commands"
                        className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-blue-600 transition"
                    >
                        Commands
                    </a>
                </div>
                <div className="relative">
                    <button
                        onClick={()=>setOpen(o=>!o)}
                        className="h-8 w-8 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Image
                            src="/velo-theme/avatar.jpg"
                            alt="User avatar"
                            width={32}
                            height={32}
                            className="object-cover"
                        />
                    </button>
                    {open && (
                        <div className="absolute right-0 mt-2 w-48 bg-white ring-1 ring-gray-200 rounded-md shadow-lg">
                            {['Your Profile','Settings','Sign out'].map(item=>(
                                <a
                                    key={item}
                                    href="#"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                                >
                                    {item}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}