import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  MessageSquare,
  BarChart3,
  Settings as SettingsIcon,
  Phone,
  Upload,
  Target,
  MessageCircle,
  Volume2,
  Monitor,
  PhoneCall,
  Megaphone,
  Send
} from 'lucide-react';

const navigation = [
  { name: 'Contact Campaigns', href: '/contact-campaigns', icon: Users },
  { name: 'Live Calls', href: '/live-calls', icon: Phone },
  { name: 'Call Analytics', href: '/calls-analytics', icon: BarChart3 },
  { name: 'Campaign Timing', href: '/campaign-timing', icon: BarChart3 },
  { name: 'Campaign Manager', href: '/campaign-manager', icon: Megaphone },
  { name: 'Dashboard', href: '/campaign-dashboard', icon: Home },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
  { name: 'App Settings', href: '/enhanced-settings', icon: Upload },
  { name: 'WhatsApp Bulk', href: '/whatsapp-bulk', icon: Send },
  { name: 'WhatsApp Chats', href: '/whatsapp-chats', icon: MessageCircle },
  // { name: 'WhatsApp Messaging', href: '/whatsapp-messaging', icon: MessageSquare },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <PhoneCall className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl font-bold">LabsCheck AI</span>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === '/contact-campaigns' && location === '/');
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                  isActive
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}