import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Activity, TrendingUp, Search, Trash2, 
  Shield, ArrowLeft, Loader2, MoreHorizontal, Mail, Calendar, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card border border-border rounded-xl p-6 shadow-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <div className="text-3xl font-bold text-foreground">{value}</div>
  </motion.div>
);

const AdminDashboard = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorkouts: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Users from Edge Function (to get emails and auth data)
      const { data: userData, error: userError } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'listUsers' }
      });

      if (userError) throw userError;

      // 2. Fetch Profiles (to get names/roles)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profileError) throw profileError;

      // 3. Fetch Aggregate Stats
      const { count: workoutCount } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true });

      const { count: subCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trialing', 'lifetime']);

      // Merge Auth Data with Profile Data
      const authUsers = userData?.users || [];
      const safeProfiles = profiles || [];
      
      const mergedUsers = authUsers.map(u => {
        const profile = safeProfiles.find(p => p.id === u.id);
        return {
          ...u,
          full_name: profile?.full_name || 'Unknown',
          role: profile?.role || 'user',
          avatar_url: profile?.avatar_url
        };
      });

      setUsers(mergedUsers);
      setStats({
        totalUsers: mergedUsers.length,
        totalWorkouts: workoutCount || 0,
        activeSubscriptions: subCount || 0
      });

    } catch (error) {
      console.error('Admin fetch error:', error);
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: error.message || "An unknown error occurred"
      });
      // Set empty state to avoid crashes
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      // 1. Perform the deletion via specific 'delete-user' Edge Function
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id }
      });

      if (error) throw new Error(error.message);
      
      // Check for application level error from the function
      if (data && data.error) {
        throw new Error(data.error);
      }

      // 2. Immediate Optimistic Update upon success
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setStats(prev => ({
        ...prev,
        totalUsers: Math.max(0, prev.totalUsers - 1)
      }));

      toast({
        title: "User deleted",
        description: "The user account and associated data have been removed."
      });

    } catch (error) {
      console.error("Deletion error:", error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message || "Could not delete user. Check permissions."
      });
      
      // Refresh data to ensure UI is in sync with DB
      fetchData(); 
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const initiateDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Manage users and view system analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Super Admin Mode
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers} 
            icon={Users} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="Total Workouts Logged" 
            value={stats.totalWorkouts} 
            icon={Activity} 
            color="bg-green-500" 
          />
          <StatCard 
            title="Active Subscriptions" 
            value={stats.activeSubscriptions} 
            icon={Crown} 
            color="bg-orange-500" 
          />
        </div>

        {/* Users Table Section */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold">User Management</h2>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-primary">{user.full_name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.full_name}</div>
                          <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => initiateDelete(user)}
                            disabled={user.id === currentUser.id}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No users found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              <span className="font-bold text-foreground"> {userToDelete?.email} </span>
              and remove their data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;