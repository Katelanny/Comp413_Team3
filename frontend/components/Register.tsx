import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Logo from './Logo'
import { User, Stethoscope } from 'lucide-react'

interface RegisterProps {
  onNavigateToLogin: () => void;
}

const Register = ({ onNavigateToLogin }: RegisterProps) => {
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');

  return (
    <main className="min-h-screen w-full flex bg-white text-neutral-900 font-sans p-4 gap-4">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-20">
        <h1 className='text-4xl font-light italic text-neutral-300 absolute top-10 left-10 font-serif'>Lesion Tracker</h1>
        <div className="w-full max-w-sm flex flex-col items-center gap-8">

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="mb-2">
              <Logo />
            </div>
            <h1 className="font-sans text-5xl tracking-tight">
              Create account
            </h1>
            <p className="text-neutral-500 text-sm font-serif italic">
              Sign up to get started
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all placeholder:text-neutral-400"
                />
              </div>
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all placeholder:text-neutral-400"
                />
              </div>
            </div>
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
              className="mt-4 w-full py-3.5 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:cursor-pointer"
            >
              Create account
            </button>
          </form>

          <div className="flex flex-col items-center gap-4 text-sm text-neutral-500">
            <p>
              Already have an account?{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                Log in
              </button>
            </p>
          </div>

        </div>
      </div>

      <div className="hidden lg:block w-1/2 h-[calc(100vh-2rem)] relative rounded-3xl overflow-hidden">
        <Image
          src="/login-splash.jpg"
          alt="Register Splash"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </main>
  )
}

export default Register