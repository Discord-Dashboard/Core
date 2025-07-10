import React from 'react'

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
        <span className="mb-6 block text-xl font-bold text-gray-900">
          Velo<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">Theme</span>
        </span>
                <div className="mb-6 flex justify-center space-x-8">
                    {['Home','Features','Pricing','Docs','Support'].map(link => (
                        <a key={link} href="#" className="text-gray-500 hover:text-gray-900 transition">
                            {link}
                        </a>
                    ))}
                </div>
                <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} Velo Theme. All rights reserved.
                </p>
            </div>
        </footer>
    )
}