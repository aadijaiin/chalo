import {Suspense} from 'react';
import ResetPasswordClient from './ResetPasswordClient';
import ButtonLoader from '@/components/ui/buttonLoader';

export default function Page() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-screen">
					<ButtonLoader />
				</div>
			}
		>
			<ResetPasswordClient />
		</Suspense>
	);
}
