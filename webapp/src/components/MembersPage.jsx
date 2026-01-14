
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import MemberCard from '@/components/MemberCard';
import { Loader2, Users, Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const MembersPage = ({ onMemberClick }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (fetchError) throw fetchError;

      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError("Failed to load members. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => 
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-black tracking-tight">Members</h1>
        </div>
        
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
                placeholder="Search members..." 
                className="pl-9 bg-muted/50 border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {loading ? (
         <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground text-sm">Loading community...</p>
         </div>
      ) : error ? (
         <div className="flex flex-col items-center justify-center py-8 text-center px-4 bg-destructive/5 rounded-xl border border-destructive/20">
             <AlertCircle className="w-8 h-8 text-destructive mb-2" />
             <p className="text-destructive mb-4 font-medium">{error}</p>
             <Button variant="outline" onClick={fetchMembers} size="sm">Retry</Button>
         </div>
      ) : (
         <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {filteredMembers.length} {filteredMembers.length === 1 ? 'Member' : 'Members'}
            </p>
            
            {filteredMembers.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {filteredMembers.map(member => (
                        <MemberCard 
                            key={member.id} 
                            member={member} 
                            onClick={onMemberClick} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No members found matching "{searchTerm}"</p>
                </div>
            )}
         </div>
      )}
    </div>
  );
};

export default MembersPage;
