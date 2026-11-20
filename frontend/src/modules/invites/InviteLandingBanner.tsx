import { useEffect } from 'react';
import { landingText } from './inviteText';
import { useInvites } from './liveStore';

/** First visit through an invite link: "<nickname> invited you to build <community> together". */
export function InviteLandingBanner() {
  const landing = useInvites((s) => s.landing);
  const loadLanding = useInvites((s) => s.loadLanding);
  useEffect(() => {
    void loadLanding();
  }, [loadLanding]);
  if (!landing) return null;
  return (
    <p className="mb-2 rounded-2xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
      <span aria-hidden>💌 </span>
      {landingText(landing)}
    </p>
  );
}
