
console.log('--- Environment Verification ---');
const publicKey = process.env.VITE_STRIPE_PUBLIC_KEY;
const secretKey = process.env.STRIPE_SECRET_KEY;

console.log(`VITE_STRIPE_PUBLIC_KEY: ${publicKey ? publicKey.substring(0, 8) + '...' : 'UNDEFINED'}`);
console.log(`STRIPE_SECRET_KEY:      ${secretKey ? secretKey.substring(0, 8) + '...' : 'UNDEFINED'}`);

if (publicKey && publicKey.startsWith('pk_test')) {
    console.warn('WARNING: VITE_STRIPE_PUBLIC_KEY is a TEST key.');
} else if (publicKey && publicKey.startsWith('pk_live')) {
    console.log('SUCCESS: VITE_STRIPE_PUBLIC_KEY is a LIVE key.');
}

if (secretKey && secretKey.startsWith('sk_test')) {
    console.warn('WARNING: STRIPE_SECRET_KEY is a TEST key.');
} else if (secretKey && secretKey.startsWith('sk_live')) {
    console.log('SUCCESS: STRIPE_SECRET_KEY is a LIVE key.');
}
console.log('--------------------------------');
