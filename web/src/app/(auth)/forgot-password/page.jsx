'use client';
import React, {useState, useEffect} from 'react';
import {toast} from 'sonner';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {forgotPasswordSchema} from '@/lib/validators/forgotPassword.schema';
import {forgotPasswordValidateEmail} from '@/services/auth.service';
import {Button} from '@/components/ui/button';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ShieldIcon from '@mui/icons-material/Shield';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ButtonLoader from '@/components/ui/buttonLoader';
import {ForgotPasswordValidateOTP} from '@/services/auth.service';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
const ForgotPasswordEmail = () => {
	const [showOtpForm, setShowOtpForm] = useState(false);
	const [otp, setOtp] = useState(Array(6).fill(''));
	const [verifyingOtp, setVerifyingOtp] = useState(false);
	const [resetId, setResetId] = useState('');
	const [resending, setResending] = useState(false);
	const RESEND_TIME = 120;

	const [resendTimer, setResendTimer] = useState(RESEND_TIME);

	const router = useRouter();

	const handleResendOtp = async () => {
		if (!canResend || resending) return;

		try {
			setResending(true);

			await forgotPasswordValidateEmail({
				email: getValues('email'),
			});

			setOtp(Array(6).fill(''));
			setResendTimer(RESEND_TIME);
			toast.success('OTP resent successfully');
		} catch {
			toast.error('Failed to resend OTP');
		} finally {
			setResending(false);
		}
	};

	const canResend = resendTimer === 0;

	useEffect(() => {
		if (!showOtpForm) return;
		if (resendTimer === 0) return;

		const interval = setInterval(() => {
			setResendTimer(prev => prev - 1);
		}, 1000);

		return () => clearInterval(interval);
	}, [showOtpForm, resendTimer]);

	const {
		register,
		handleSubmit,
		getValues,
		formState: {errors, isSubmitting},
	} = useForm({
		resolver: zodResolver(forgotPasswordSchema),
	});
	const onSubmit = async data => {
		try {
			const res = await forgotPasswordValidateEmail(data);
			setResetId(res.reset_id[0]);
			setShowOtpForm(true);
			setResendTimer(RESEND_TIME);
			toast.success('OTP sent successfully!');
		} catch {}
	};
	const handleOtpChange = (value, index) => {
		if (!/^\d?$/.test(value)) return;

		const newOtp = [...otp];
		newOtp[index] = value;
		setOtp(newOtp);

		if (value && index < 5) {
			document.getElementById(`otp-${index + 1}`)?.focus();
		}
	};

	useEffect(() => {
		if (showOtpForm) {
			setTimeout(() => {
				document.getElementById('otp-0')?.focus();
			}, 100);
		}
	}, [showOtpForm]);

	const handleOtpKeyDown = (e, index) => {
		if (e.key === 'Backspace' && !otp[index] && index > 0) {
			document.getElementById(`otp-${index - 1}`)?.focus();
		}
	};

	const handleVerifyOtp = async e => {
		e.preventDefault();
		const finalOtp = otp.join('');

		if (finalOtp.length !== 6) {
			toast.error('Please enter complete OTP');
			return;
		}

		console.log('OTP:', finalOtp);
		try {
			setVerifyingOtp(true);
			await ForgotPasswordValidateOTP({
				otp: finalOtp,
				id: resetId,
			});
			setVerifyingOtp(false);
			router.push(`reset-password?id=${resetId}`);

			toast.success('OTP verified successfully');
		} catch {
			setVerifyingOtp(false);
		}
	};

	return (
		<main className="flex-1 flex items-center justify-center px-6 py-12">
			<div className="w-full max-w-md">
				<div className="dark:bg-card bg-white rounded-3xl shadow-xl shadow-earth/5 border border-sage/10 p-8 md:p-12">
					<div className="text-center mb-10">
						<div className="w-16 h-16 bg-sage/10 rounded-2xl text-3xl flex items-center justify-center mx-auto mb-6">
							<LockResetOutlinedIcon htmlColor="#8DA399" fontSize="large" />
						</div>
						<h1 className="text-3xl font-extrabold text-earth mb-3">
							Forgot your password?
						</h1>
						<p className="text-earth/60 text-sm leading-relaxed">
							Enter your email address and we will send you a link to reset your
							password.
						</p>
					</div>
					<form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
						<div>
							<label
								className="block text-sm font-semibold text-earth/80 mb-2"
								htmlFor="email"
							>
								Email Address
							</label>
							<input
								disabled={showOtpForm}
								{...register('email')}
								className="w-full px-4 py-3 rounded-xl border border-sage/40 text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
								id="email"
								placeholder="alex@example.com"
								required=""
								type="email"
							/>
							{errors.email && (
								<p className="text-red-500 text-sm mt-1">
									{errors.email.message}
								</p>
							)}
						</div>
						<div className="pt-2">
							<Button
								disabled={isSubmitting || showOtpForm}
								type="submit"
								className={`w-full h-14 bg-primary-foreground hover:bg-primary-foreground text-white font-bold rounded-xl shadow-lg shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
									showOtpForm && 'hidden'
								}`}
							>
								{isSubmitting ? (
									<>
										<ButtonLoader />
										<span>Sending OTP...</span>{' '}
									</>
								) : (
									'Send OTP'
								)}
							</Button>
						</div>
					</form>
					{showOtpForm && (
						<form
							className="space-y-6 pt-6 border-t border-sage/10"
							onSubmit={handleVerifyOtp}
						>
							<div>
								<label className="block text-sm font-semibold text-earth/80 text-center mb-5">
									Enter 6-digit Verification Code
								</label>
								<div className="grid grid-cols-6 gap-2">
									{otp.map((digit, index) => (
										<input
											disabled={verifyingOtp}
											key={index}
											id={`otp-${index}`}
											type="text"
											inputMode="numeric"
											maxLength={1}
											value={digit}
											onChange={e => handleOtpChange(e.target.value, index)}
											onKeyDown={e => handleOtpKeyDown(e, index)}
											className="w-full h-14 text-center text-xl font-bold rounded-xl border border-sage/40 text-earth focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
										/>
									))}
								</div>
							</div>
							<Button
								className="w-full h-14 bg-primary-foreground hover:bg-primary-foreground text-white font-bold rounded-xl shadow-lg shadow-primary-foreground/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
								type="submit"
								disabled={verifyingOtp}
							>
								{verifyingOtp ? (
									<>
										<ButtonLoader />
										<span>Verifying OTP...</span>
									</>
								) : (
									'Verify OTP'
								)}
							</Button>
							<div className="text-center">
								{resending ? (
									<div className="inline-flex items-center gap-2 text-sage font-bold">
										<ButtonLoader />
										<span>Resending...</span>
									</div>
								) : (
									<Button
										type="button"
										onClick={handleResendOtp}
										disabled={!canResend}
										className={`text-sage font-bold transition-colors ml-1 bg-card hover:bg-card
        ${!canResend ? 'opacity-50 cursor-not-allowed' : 'hover:text-earth'}`}
									>
										Resend OTP{' '}
										{!canResend && (
											<span className="text-earth/40 font-normal">
												({Math.floor(resendTimer / 60)}:
												{String(resendTimer % 60).padStart(2, '0')})
											</span>
										)}
									</Button>
								)}
							</div>
						</form>
					)}
					<div className="text-center pt-4">
						<Link
							className="inline-flex items-center gap-2 text-sage font-bold hover:text-earth transition-colors text-sm"
							href="/signin"
							replace
						>
							<ArrowBackOutlinedIcon />
							Back to Login
						</Link>
					</div>
				</div>
				<div className="mt-8 flex flex-wrap justify-center gap-8 text-xs text-earth/40 uppercase tracking-widest font-bold">
					<div className="flex items-center gap-2">
						<ShieldIcon />
						Secure Encryption
					</div>
					<div className="flex items-center gap-2">
						<span className="material-symbols-outlined text-sm">
							<VerifiedUserIcon />
						</span>
						Trusted Service
					</div>
				</div>
			</div>
		</main>
	);
};

export default ForgotPasswordEmail;
