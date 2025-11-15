import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

// Stripe será inicializado dentro do handler para evitar erro em tempo de build

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const { sessionId, userId } = await request.json()

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "Missing sessionId or userId" }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    })

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
    }

    const priceId = session.line_items?.data[0]?.price?.id

    const tierMap: Record<string, string> = {
      price_1SEJqf5I63txB0RGffH4TL4q: "prata",
      price_1SEJrb5I63txB0RGmEzQuWdw: "gold",
      price_1SEJsm5I63txB0RGwaobzeyd: "platinum",
      price_1SEJtR5I63txB0RGvcbpNBay: "diamante",
    }

    const tier = priceId ? tierMap[priceId] : null

    if (!tier) {
      console.error("Unknown price ID:", priceId)
      return NextResponse.json({ error: "Unknown subscription tier" }, { status: 400 })
    }

    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await updateDoc(userRef, {
      level: tier,
      subscription: {
        tier,
        status: "active",
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        currentPeriodEnd: new Date(session.expires_at * 1000),
        updatedAt: new Date(),
      },
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      tier,
      message: "Subscription verified and user level updated",
    })
  } catch (error) {
    console.error("Error verifying checkout:", error)
    return NextResponse.json({ error: "Failed to verify checkout session" }, { status: 500 })
  }
}
