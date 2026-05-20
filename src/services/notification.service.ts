import { sendToUser } from "@/lib/onesignal";
import { CLIENT_URL } from "@/config/env";

const BASE_URL = CLIENT_URL;

export async function notifyKycApproved(userId: string): Promise<void> {
  await sendToUser(userId, {
    title: "🎉 You're verified! Start listing equipment",
    message: "Your identity has been approved by our team. You can now create listings and start earning.",
    url: `${BASE_URL}/equipment/new`,
    data: { type: "kyc_approved" },
  });
}

export async function notifyKycRejected(userId: string, reason: string): Promise<void> {
  await sendToUser(userId, {
    title: "⚠️ Identity verification needs attention",
    message: `Your document was not accepted: ${reason.slice(0, 100)}. Please re-upload.`,
    url: `${BASE_URL}/profile`,
    data: { type: "kyc_rejected", reason },
  });
}
