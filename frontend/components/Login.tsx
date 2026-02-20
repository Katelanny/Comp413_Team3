import React from 'react'
import Image from 'next/image'
import { useState } from 'react'
import { User, Stethoscope } from 'lucide-react'
import Logo from './Logo'

interface LoginProps {
    onNavigateToRegister: () => void;
}

const Login = ({ onNavigateToRegister }: LoginProps) => {
    const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');

    return (
        <main className="min-h-screen w-full flex bg-white text-neutral-900 font-sans p-4 gap-4">
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-20">
                <div className="absolute top-10 left-10 flex items-center gap-3">
                    <Logo />
                    <h1 className="text-4xl font-light italic text-neutral-300 font-serif">Lesion Tracker</h1>
                </div>
                <div className="w-full max-w-sm flex flex-col items-center gap-8">

                    <div className="flex flex-col items-center gap-4 text-center">
                        <h1 className="font-sans text-5xl tracking-tight">
                            Welcome back
                        </h1>
                        <p className="text-neutral-500 text-sm font-serif italic">
                            Login to your account to continue
                        </p>
                    </div>

                    <div className="flex bg-neutral-100 p-1 rounded-xl w-full max-w-[300px] relative">
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${userType === 'patient' ? 'left-1' : 'left-[50%]'}`}
                        />
                        <button
                            type="button"
                            onClick={() => setUserType('patient')}
                            className={`flex-1 relative z-10 py-2 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${userType === 'patient' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            <User size={16} />
                            Patient
                        </button>
                        <button
                            type="button"
                            onClick={() => setUserType('doctor')}
                            className={`flex-1 relative z-10 py-2 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${userType === 'doctor' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            <Stethoscope size={16} />
                            Doctor
                        </button>
                    </div>

                    <form className="flex flex-col w-full gap-4">
                        <div className="group space-y-1">
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all placeholder:text-neutral-400"
                            />
                        </div>
                        <div className="space-y-1">
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all placeholder:text-neutral-400"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-4 w-full py-3.5 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:cursor-pointer"
                        >
                            Log in
                        </button>
                    </form>
                </div>
            </div>

            <div className="hidden lg:block w-1/2 h-[calc(100vh-2rem)] relative rounded-3xl overflow-hidden">
                <Image
                    src="/login-splash.jpg"
                    alt="Login Splash"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/10" />
            </div>
        </main>
    )
}

export default Login