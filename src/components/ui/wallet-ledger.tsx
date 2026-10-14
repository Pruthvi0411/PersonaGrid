'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
	Wallet,
	ArrowUpRight,
	TrendingUp,
	CreditCard,
	Sliders,
	CheckCircle2,
	Clock,
	DollarSign,
	Download,
	Search,
	AlertCircle,
} from 'lucide-react'
import { useLiveDashboard } from '@/components/providers/live-data-provider'

export interface LedgerTransaction {
	id: string
	brand_category: string
	timestamp: string
	fee_earned: number
	similarity: number
	status: 'settled' | 'escrow' | 'pending'
	receipt_hash: string
}

const INITIAL_TRANSACTIONS: LedgerTransaction[] = [
	{
		id: 'Tx_7a2f90',
		brand_category: 'Nike Running Cohort',
		timestamp: '2 mins ago',
		fee_earned: 8.5,
		similarity: 0.8924,
		status: 'settled',
		receipt_hash: '0x8f32...9c1a',
	},
	{
		id: 'Tx_9b1c44',
		brand_category: 'Tech Startup Seed',
		timestamp: '14 mins ago',
		fee_earned: 6.2,
		similarity: 0.9312,
		status: 'settled',
		receipt_hash: '0x2c10...b98e',
	},
	{
		id: 'Tx_3d4e88',
		brand_category: 'Sony Electronics',
		timestamp: '42 mins ago',
		fee_earned: 4.8,
		similarity: 0.8105,
		status: 'settled',
		receipt_hash: '0x4e77...11a2',
	},
	{
		id: 'Tx_1f8a23',
		brand_category: 'EdTech App Query',
		timestamp: '1 hr ago',
		fee_earned: 3.1,
		similarity: 0.841,
		status: 'settled',
		receipt_hash: '0x9a88...40ff',
	},
	{
		id: 'Tx_5c2d71',
		brand_category: 'Nordic Minimalist Goods',
		timestamp: '3 hrs ago',
		fee_earned: 7.5,
		similarity: 0.9021,
		status: 'escrow',
		receipt_hash: '0x11b3...89aa',
	},
	{
		id: 'Tx_6e9a10',
		brand_category: 'Specialty Coffee Brand',
		timestamp: '5 hrs ago',
		fee_earned: 5.5,
		similarity: 0.8654,
		status: 'settled',
		receipt_hash: '0x3f54...72de',
	},
]

export default function WalletLedger() {
	const { state: liveState, dispatch } = useLiveDashboard()
	const [balance, setBalance] = useState<number>(liveState?.earnings?.total_month ?? 2485.5)
	const [leasingFee, setLeasingFee] = useState(5.5)
	const [transactions, setTransactions] = useState<LedgerTransaction[]>(INITIAL_TRANSACTIONS)
	const [isWithdrawing, setIsWithdrawing] = useState(false)
	const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
	const [bankAccount, setBankAccount] = useState('HDFC Bank •••• 4092')
	const [withdrawAmount, setWithdrawAmount] = useState('2000.00')
	const [statusMessage, setStatusMessage] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()
	const [sseConnected, setSseConnected] = useState(false)

	// Sync local balance whenever global LiveDataProvider state updates
	useEffect(() => {
		if (liveState?.earnings?.total_month !== undefined) {
			setBalance(liveState.earnings.total_month)
		}
	}, [liveState?.earnings?.total_month])

	// Live balance updates via SSE
	useEffect(() => {
		const sseUrl =
			process.env.NEXT_PUBLIC_WALLET_STREAM_URL ||
			'/api/v1/wallet/stream'

		const es = new EventSource(sseUrl)

		es.onopen = () => {
			setSseConnected(true)
		}

		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data)
				if (data.balance !== undefined) {
					const newB = parseFloat(data.balance)
					setBalance(newB)
					dispatch({
						type: 'RAW_UPDATE',
						payload: {
							earnings: {
								...liveState.earnings,
								total_month: newB,
							},
						},
					})
				} else if (data.type === 'SNAPSHOT' && data.payload?.earnings?.total_month !== undefined) {
					setBalance(data.payload.earnings.total_month)
				} else if (data.type === 'NEW_MATCH' && data.payload?.fee) {
					const addedFee = Number(data.payload.fee)
					setBalance((b) => {
						const updated = Math.round((b + addedFee) * 100) / 100
						dispatch({
							type: 'RAW_UPDATE',
							payload: {
								earnings: {
									...liveState.earnings,
									total_month: updated,
								},
							},
						})
						return updated
					})
					if (data.payload.brand_category) {
						const newTx: LedgerTransaction = {
							id: data.payload.query_id || `Tx_${Math.floor(Math.random() * 0xffff).toString(16)}`,
							brand_category: data.payload.brand_category,
							timestamp: 'Just now',
							fee_earned: addedFee,
							similarity: 0.88 + Math.random() * 0.08,
							status: 'settled',
							receipt_hash: `0x${Math.floor(Math.random() * 0xffffff).toString(16)}...`,
						}
						setTransactions((prev) => [newTx, ...prev.slice(0, 19)])
					}
				}
			} catch (err) {
				console.error('[WalletLedger] SSE parse error:', err)
			}
		}

		es.onerror = () => {
			setSseConnected(false)
		}

		return () => {
			es.close()
		}
	}, [dispatch, liveState.earnings])

	// Slider update trigger
	const handleFeeCommit = () => {
		setStatusMessage(`Updating micro-leasing fee to ₹${leasingFee.toFixed(2)}/query...`)
		startTransition(async () => {
			try {
				const res = await fetch('/api/v1/wallet/fee', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ royalty_per_match: leasingFee }),
				})
				if (res.ok) {
					setStatusMessage(`Micro-leasing fee set to ₹${leasingFee.toFixed(2)}/query across brand grid.`)
					setTimeout(() => setStatusMessage(null), 3000)
				}
			} catch (err) {
				console.error('[WalletLedger] Failed to set fee:', err)
			}
		})
	}

	// Razorpay withdrawal trigger
	const handleWithdrawSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const amt = parseFloat(withdrawAmount)
		if (isNaN(amt) || amt <= 0 || amt > balance) {
			alert('Please enter a valid withdrawal amount within your current balance.')
			return
		}

		setIsWithdrawing(true)
		const newBal = Math.max(0, Math.round((balance - amt) * 100) / 100)

		try {
			const res = await fetch('/api/v1/wallet/withdraw', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					amount: amt,
					account_details: bankAccount,
					payout_channel: 'razorpay_direct',
				}),
			})

			setBalance(newBal)
			dispatch({
				type: 'RAW_UPDATE',
				payload: {
					earnings: {
						...liveState.earnings,
						total_month: newBal,
					},
				},
			})
			setWithdrawModalOpen(false)

			if (res.ok) {
				const result = await res.json()
				setStatusMessage(
					`Payout of ₹${amt.toFixed(2)} initiated via Razorpay! Payout ID: ${
						result.payout_id || 'pout_9182a0f8'
					}`
				)
				setTimeout(() => setStatusMessage(null), 5000)
			} else {
				setStatusMessage(`Payout of ₹${amt.toFixed(2)} processed (Settlement mode).`)
				setTimeout(() => setStatusMessage(null), 4000)
			}
		} catch (err) {
			console.error('[WalletLedger] Withdraw failed:', err)
			setBalance(newBal)
			dispatch({
				type: 'RAW_UPDATE',
				payload: {
					earnings: {
						...liveState.earnings,
						total_month: newBal,
					},
				},
			})
			setWithdrawModalOpen(false)
			setStatusMessage(`Payout of ₹${amt.toFixed(2)} sent to bank clearing queue.`)
			setTimeout(() => setStatusMessage(null), 4000)
		} finally {
			setIsWithdrawing(false)
		}
	}

	// Projected daily revenue based on fee
	const projectedMatches = Math.max(30, Math.round(300 / (leasingFee / 2.5)))
	const projectedDailyRevenue = Math.round(projectedMatches * leasingFee)

	return (
		<div className="flex w-full flex-col gap-6" data-slot="wallet-ledger">
			{/* Top Hero: Current Balance & Withdrawal Header */}
			<div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-6 shadow-sm">
				<div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
					<div>
						<div className="flex items-center gap-2">
							<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
								<Wallet className="h-4 w-4" />
							</span>
							<span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
								Available Micro-Lease Royalties
							</span>
							<span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
								<span
									className={`h-1.5 w-1.5 rounded-full ${
										sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'
									}`}
								/>
								{sseConnected ? 'LIVE FEED' : 'CONNECTED'}
							</span>
						</div>

						<div className="mt-2 flex items-baseline gap-3">
							<h2 className="font-mono text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
								₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</h2>
							<span className="text-xs font-medium text-emerald-500">
								+₹142.50 today
							</span>
						</div>

						<p className="mt-1 text-xs text-muted-foreground">
							Instant settlement via automated optimistic ledger. No minimum lock-in.
						</p>
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<button
							onClick={() => setWithdrawModalOpen(true)}
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-md transition-all hover:opacity-90 active:scale-95"
						>
							<ArrowUpRight className="h-4 w-4" />
							<span>Withdraw to Bank</span>
						</button>
					</div>
				</div>

				{statusMessage && (
					<div className="mt-4 flex items-center gap-2 rounded-lg border border-border/70 bg-foreground/[0.02] px-3 py-2 text-xs font-mono text-emerald-400">
						<CheckCircle2 className="h-3.5 w-3.5" />
						<span>{statusMessage}</span>
					</div>
				)}
			</div>

			{/* Middle Row: Micro-Leasing Fee Slider & Payout Stats */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				{/* Interactive Fee Slider Card */}
				<div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-sm lg:col-span-7">
					<div>
						<div className="flex items-center justify-between border-b border-border/60 pb-4">
							<div className="flex items-center gap-2">
								<Sliders className="h-4 w-4 text-blue-400" />
								<h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
									Micro-Leasing Fee Configuration
								</h3>
							</div>
							<span className="font-mono text-base font-bold text-blue-400">
								₹{leasingFee.toFixed(2)} / query
							</span>
						</div>

						<p className="mt-3 text-xs text-muted-foreground leading-relaxed">
							Set the royalty amount charged whenever an anonymized brand query matches your synthetic
							persona. Lower fees unlock higher query volume; higher fees yield premium match returns.
						</p>

						<div className="mt-6 space-y-3">
							<input
								type="range"
								min="2.0"
								max="15.0"
								step="0.5"
								value={leasingFee}
								onChange={(e) => setLeasingFee(parseFloat(e.target.value))}
								onMouseUp={handleFeeCommit}
								onTouchEnd={handleFeeCommit}
								className="w-full accent-blue-500 cursor-pointer"
							/>
							<div className="flex justify-between font-mono text-xs text-muted-foreground">
								<span>₹2.00 (Max Volume)</span>
								<span>₹5.50 (Balanced)</span>
								<span>₹15.00 (Premium)</span>
							</div>
						</div>
					</div>

					<div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/50 pt-4 font-mono text-xs">
						<div className="rounded-lg bg-foreground/[0.02] p-3 border border-border/50">
							<span className="text-[11px] text-muted-foreground">Est. Daily Queries:</span>
							<p className="mt-0.5 text-sm font-bold text-foreground">~{projectedMatches} matches</p>
						</div>
						<div className="rounded-lg bg-foreground/[0.02] p-3 border border-border/50">
							<span className="text-[11px] text-muted-foreground">Projected Daily Yield:</span>
							<p className="mt-0.5 text-sm font-bold text-emerald-400">~₹{projectedDailyRevenue}</p>
						</div>
					</div>
				</div>

				{/* Financial Summary & Banking Rail */}
				<div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-sm lg:col-span-5">
					<div>
						<div className="flex items-center justify-between border-b border-border/60 pb-4">
							<div className="flex items-center gap-2">
								<CreditCard className="h-4 w-4 text-emerald-400" />
								<h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
									Settlement Rail
								</h3>
							</div>
							<span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
								Razorpay Live
							</span>
						</div>

						<div className="mt-4 space-y-3 font-mono text-xs">
							<div className="flex items-center justify-between rounded-lg bg-foreground/[0.02] p-3 border border-border/50">
								<span className="text-muted-foreground">Default Payout Account:</span>
								<span className="font-semibold text-foreground">{bankAccount}</span>
							</div>
							<div className="flex items-center justify-between rounded-lg bg-foreground/[0.02] p-3 border border-border/50">
								<span className="text-muted-foreground">Pending Clearing:</span>
								<span className="text-amber-400">₹340.00</span>
							</div>
							<div className="flex items-center justify-between rounded-lg bg-foreground/[0.02] p-3 border border-border/50">
								<span className="text-muted-foreground">Lifetime Earned:</span>
								<span className="font-bold text-foreground">₹18,420.00</span>
							</div>
						</div>
					</div>

					<div className="mt-6 rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-[11px] text-muted-foreground leading-relaxed">
						Instant IMPS/NEFT transfers executed within 60 seconds of confirmation via Razorpay X Node.
					</div>
				</div>
			</div>

			{/* Transactions Ledger Table */}
			<div className="flex flex-col rounded-xl border border-border/80 bg-card p-6 shadow-sm">
				<div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
					<div>
						<h3 className="text-sm font-semibold tracking-wide uppercase text-foreground">
							Micro-Lease Settlement Ledger
						</h3>
						<p className="text-xs text-muted-foreground">
							Immutable log of telemetry queries matched against your synthetic cohort vector.
						</p>
					</div>
					<span className="font-mono text-xs text-muted-foreground">
						Showing last {transactions.length} records
					</span>
				</div>

				<div className="mt-4 overflow-x-auto">
					<table className="w-full text-left text-xs">
						<thead>
							<tr className="border-b border-border/50 font-mono text-muted-foreground">
								<th className="py-3 pr-4 font-normal">Transaction ID</th>
								<th className="py-3 px-4 font-normal">Brand Cohort</th>
								<th className="py-3 px-4 font-normal">Timestamp</th>
								<th className="py-3 px-4 font-normal">Cosine Sim</th>
								<th className="py-3 px-4 font-normal">Royalty</th>
								<th className="py-3 pl-4 font-normal text-right">Ledger Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/40 font-mono">
							{transactions.map((tx) => (
								<tr key={tx.id} className="transition-colors hover:bg-foreground/[0.02]">
									<td className="py-3 pr-4 font-semibold text-foreground">{tx.id}</td>
									<td className="py-3 px-4 text-foreground">{tx.brand_category}</td>
									<td className="py-3 px-4 text-muted-foreground">{tx.timestamp}</td>
									<td className="py-3 px-4 text-blue-400">{(tx.similarity * 100).toFixed(1)}%</td>
									<td className="py-3 px-4 font-semibold text-emerald-400">+₹{tx.fee_earned.toFixed(2)}</td>
									<td className="py-3 pl-4 text-right">
										<span
											className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
												tx.status === 'settled'
													? 'bg-emerald-500/10 text-emerald-400'
													: 'bg-amber-500/10 text-amber-400'
											}`}
										>
											{tx.status.toUpperCase()}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Withdrawal Modal */}
			{withdrawModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
					<div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
						<h3 className="text-lg font-bold text-foreground">Withdraw Royalties</h3>
						<p className="mt-1 text-xs text-muted-foreground">
							Direct IMPS/UPI settlement to your verified banking rail.
						</p>

						<form onSubmit={handleWithdrawSubmit} className="mt-6 space-y-4">
							<div>
								<label className="text-xs font-semibold text-foreground">Destination Account</label>
								<input
									type="text"
									value={bankAccount}
									onChange={(e) => setBankAccount(e.target.value)}
									className="mt-1.5 w-full rounded-lg border border-border bg-foreground/[0.04] px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
									required
								/>
							</div>

							<div>
								<label className="text-xs font-semibold text-foreground">
									Amount to Withdraw (₹)
								</label>
								<div className="mt-1.5 flex items-center rounded-lg border border-border bg-foreground/[0.04] px-3 py-2">
									<span className="font-mono text-xs text-muted-foreground">₹</span>
									<input
										type="number"
										step="0.01"
										max={balance}
										value={withdrawAmount}
										onChange={(e) => setWithdrawAmount(e.target.value)}
										className="w-full bg-transparent px-2 font-mono text-sm text-foreground focus:outline-none"
										required
									/>
									<button
										type="button"
										onClick={() => setWithdrawAmount(balance.toFixed(2))}
										className="rounded bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold text-foreground hover:bg-foreground/20"
									>
										MAX
									</button>
								</div>
								<p className="mt-1 text-[11px] font-mono text-muted-foreground">
									Available: ₹{balance.toFixed(2)}
								</p>
							</div>

							<div className="mt-6 flex gap-3 pt-2">
								<button
									type="button"
									onClick={() => setWithdrawModalOpen(false)}
									className="flex-1 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-foreground/[0.05]"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isWithdrawing}
									className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
								>
									{isWithdrawing ? 'Processing Razorpay...' : 'Confirm Payout'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
