import { sendToUser } from "@/lib/onesignal";
import { CLIENT_URL } from "@/config/env";

const BASE_URL = CLIENT_URL;

export async function notifyKycApproved(userId: string): Promise<void> {
  await sendToUser(userId, {
    title: "You're verified — start listing equipment",
    message: "Your identity has been approved by our team. You can now create listings and start earning.",
    url: `${BASE_URL}/equipment/new`,
    data: { type: "kyc_approved" },
  });
}

export async function notifyKycRejected(userId: string, reason: string): Promise<void> {
  await sendToUser(userId, {
    title: "Identity verification needs attention",
    message: `Your document was not accepted: ${reason.slice(0, 100)}. Please re-upload.`,
    url: `${BASE_URL}/profile`,
    data: { type: "kyc_rejected", reason },
  });
}

export async function notifyEquipmentApproved(
  ownerId: string,
  title: string,
  equipmentId: string
): Promise<void> {
  await sendToUser(ownerId, {
    title: "Listing approved",
    message: `"${title}" is approved. Turn on visibility in My Listings when you're ready.`,
    url: `${BASE_URL}/dashboard/listings?highlight=${equipmentId}`,
    data: { type: "equipment_approved", equipmentId },
  });
}

export async function notifyEquipmentRejected(
  ownerId: string,
  title: string,
  note: string,
  equipmentId: string
): Promise<void> {
  await sendToUser(ownerId, {
    title: "Listing needs changes",
    message: `"${title}" was not approved: ${note.slice(0, 120)}. Edit and resubmit from My Listings.`,
    url: `${BASE_URL}/dashboard/listings?highlight=${equipmentId}`,
    data: { type: "equipment_rejected", note, equipmentId },
  });
}

export async function notifyReviewApproved(
  ownerId: string,
  type: string,
  reviewerName: string,
  targetLabel: string,
  options?: { equipmentId?: string | null; reviewId?: string }
): Promise<void> {
  const highlight = options?.reviewId ? `?highlight=${options.reviewId}` : "";
  const url =
    type === "EQUIPMENT" && options?.equipmentId
      ? `${BASE_URL}/equipment/${options.equipmentId}${highlight}`
      : `${BASE_URL}/users/${ownerId}${highlight}`;

  await sendToUser(ownerId, {
    title: type === "EQUIPMENT" ? "Listing review published" : "Profile review published",
    message: `A review from ${reviewerName} about "${targetLabel}" is now visible.`,
    url,
    data: { type: "review_approved" },
  });
}
