'use client'

import React from 'react'

export default function Hero() {
    return (
        <section
            className={`relative h-screen flex items-center justify-center overflow-hidden bg-white`}
        >
            <div className="dynamic-accent bg-gradient-to-r from-blue-500 to-purple-500 top-1/4 left-1/4" />
            <div className="dynamic-accent bg-gradient-to-r from-pink-500 to-blue-500 bottom-1/4 right-1/4 animation-delay-200" />

            <div className="px-4 text-center animate-fade-in">
                <h1 className="mb-6 text-5xl font-extrabold md:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                    VeloBot
                </h1>
                <p className="mb-12 text-xl text-gray-600 md:text-2xl">
                    Manage your server with ease
                </p>
                <button className="px-8 py-4 text-lg font-medium text-white rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-transform transform hover:scale-105">
                    Get Started
                </button>
            </div>
        </section>
    )
}