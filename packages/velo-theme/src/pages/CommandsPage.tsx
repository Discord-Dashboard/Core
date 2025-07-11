import CommandsSection from '../components/commands/CommandsSection'
import React from "react";
import {Space_Grotesk} from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const space = Space_Grotesk({
    subsets: ['latin'],
    weight: ['400','600','700'],
    variable: '--font-space-grotesk',
})

export default function Page() {
    return (
        <html>
            <body className={space.className}>
            <div className="dynamic-accent w-56 h-56 opacity-20 bg-gradient-to-tr from-pink-500 to-purple-500 top-1/4 right-1/3 animation-delay-200" />
            <div className="dynamic-accent w-64 h-64 opacity-20 bg-gradient-to-r from-purple-500 to-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/3 animation-delay-300" />

                <Navbar />
                <CommandsSection />
                <Footer />
            </body>
        </html>
    )
}