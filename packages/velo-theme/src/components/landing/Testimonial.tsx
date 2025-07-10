import React from 'react'
import Image from 'next/image'

export default function Testimonial() {
    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 md:px-8">
                <div className="bg-white p-12 rounded-xl shadow-sm animate-fade-in">
                    <blockquote className="mb-8 text-lg italic text-gray-800">
                        “Velo Theme transformed how I manage my community. Clean, powerful, and beautifully designed.”
                    </blockquote>
                    <footer className="flex items-center">
                        <Image
                            src="/velo-theme/sarah.jpg"
                            alt="Sarah Johnson"
                            width={40}
                            height={40}
                            className="rounded-full mr-4"
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
                            <p className="text-sm text-gray-600">Community Manager @GamingHub</p>
                        </div>
                    </footer>
                </div>
            </div>
        </section>
    )
}