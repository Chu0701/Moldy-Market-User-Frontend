export const walletRootKey = (userId) => ['wallet', userId]
export const myWalletKey = (userId) => ['wallet', userId, 'balance']
export const myWalletTransactionsKey = (userId) => ['wallet', userId, 'transactions']
export const myWithdrawalsKey = (userId) => ['wallet', userId, 'withdrawals']
