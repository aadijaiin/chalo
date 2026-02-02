import api from '@/lib/axios';

export const signup = async payload => {
	const {data} = await api.post('/auth/register/', payload);
	return data;
};

export const signin = async payload => {
	const {data} = await api.post('/auth/login/', payload);
	return data;
};

export const forgotPasswordValidateEmail = async payload => {
	const {data} = await api.post('auth/password-reset/request/', payload);
	return data;
};

export const ForgotPasswordValidateOTP = async payload => {
	const {data} = await api.post('auth/password-reset/verify-otp/', payload);
	return data;
};

export const resetPassword = async payload => {
	const {data} = await api.post(
		'auth/password-reset/change-password/',
		payload,
	);
	return data;
};
