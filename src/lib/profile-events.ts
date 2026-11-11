/** Fired on window after the signed-in user's name or photo changes, so the app shell refreshes. */
export const PROFILE_UPDATED_EVENT = "nexusflow:profile-updated";

export function announceProfileUpdated() {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}
