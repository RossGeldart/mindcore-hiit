
import React from 'react';
import { Menu, Lock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const HamburgerMenu = ({ items, isPremium, onLogout }) => {
  const { signOut } = useAuth();

  const handleLogoutClick = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await signOut();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64 mt-2">
        <DropdownMenuLabel>Menu</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
           const showLock = item.isPremiumOnly && !isPremium;
           const Icon = showLock ? Lock : item.icon;
           
           return (
              <DropdownMenuItem 
                key={item.id} 
                onClick={item.action}
                className="cursor-pointer gap-3 py-3"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{item.label}</span>
              </DropdownMenuItem>
           );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogoutClick}
          className="cursor-pointer gap-3 py-3 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HamburgerMenu;
