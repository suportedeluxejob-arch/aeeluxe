import "server-only"
import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
	if (_stripe) return _stripe
	const stripeKey = process.env.STRIPE_SECRET_KEY
	if (!stripeKey) {
		throw new Error("STRIPE_SECRET_KEY não definido")
	}
	_stripe = new Stripe(stripeKey, {
		apiVersion: "2024-11-20.acacia",
	})
	return _stripe
}
