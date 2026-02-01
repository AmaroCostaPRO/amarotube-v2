import { GlobalChat } from '@/components/features/social/GlobalChat';
import { InteractionFeed } from '@/components/features/social/InteractionFeed';

export function SocialSidebar() {
  return (
    <aside className="sticky top-0 h-fit space-y-6 hidden xl:flex flex-col" data-aos="fade-left">
      <GlobalChat />
      <InteractionFeed />
    </aside>
  );
}
