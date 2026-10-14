'use client'

import { LimelightNav } from "@/components/ui/limelight-nav";
import { LayoutDashboard, Sparkles, ShieldCheck, Wallet, Activity } from 'lucide-react';

const studioNavItems = [
  { id: 'overview', icon: <LayoutDashboard />, label: 'Overview', onClick: () => console.log('Overview') },
  { id: 'persona', icon: <Sparkles />, label: 'My Persona', onClick: () => console.log('Persona') },
  { id: 'privacy', icon: <ShieldCheck />, label: 'Privacy Vault', onClick: () => console.log('Privacy') },
  { id: 'earnings', icon: <Wallet />, label: 'Earnings', onClick: () => console.log('Earnings') },
  { id: 'activity', icon: <Activity />, label: 'Match Activity', onClick: () => console.log('Activity') },
];

export interface StudioNavigationProps {
  activeIndex?: number;
  onTabChange?: (index: number) => void;
}

const StudioNavigation = ({ activeIndex = 0, onTabChange }: StudioNavigationProps) => {
  return (
    <LimelightNav
      className="bg-secondary/40 dark:bg-card/50 dark:border-accent/50 rounded-xl h-11 px-1 shadow-sm"
      iconContainerClassName="p-3"
      items={studioNavItems}
      activeIndex={activeIndex}
      onTabChange={onTabChange}
    />
  );
};

export { StudioNavigation };

const Default = () => {
  return <LimelightNav />;
};

export { Default };
export default StudioNavigation;
