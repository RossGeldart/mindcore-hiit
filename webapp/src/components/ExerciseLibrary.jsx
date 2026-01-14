import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Badge } from '@/components/ui/badge';

const ExerciseLibrary = ({ onBack }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to load exercises from the database.');
    } finally {
      setLoading(false);
    }
  };

  // Group exercises by equipment
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const eq = exercise.equipment || 'Uncategorized';
    if (!acc[eq]) acc[eq] = [];
    acc[eq].push(exercise);
    return acc;
  }, {});

  const filteredGroups = Object.keys(groupedExercises).reduce((acc, key) => {
    const filtered = groupedExercises[key].filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) acc[key] = filtered;
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto w-full flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 hover:bg-muted">
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Exercise Database
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading exercises from Supabase...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p>{error}</p>
            <Button onClick={fetchExercises} variant="outline" className="mt-4 border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40">
              Try Again
            </Button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid gap-8">
              {Object.keys(filteredGroups).length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No exercises found matching your search.</p>
              ) : (
                Object.entries(filteredGroups).map(([equipment, groupExercises]) => (
                  <div key={equipment} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                    <h2 className="text-lg font-bold text-primary mb-4 capitalize flex items-center gap-2">
                      {equipment}
                      <Badge variant="secondary" className="ml-2 text-xs font-normal bg-muted text-muted-foreground">
                        {groupExercises.length}
                      </Badge>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupExercises.map((ex) => (
                        <div key={ex.id} className="flex items-center p-3 rounded-lg bg-background hover:bg-muted transition-colors text-sm text-foreground border border-border">
                          <span className="font-medium">{ex.name}</span>
                          {ex.category && (
                            <span className="ml-auto text-xs text-muted-foreground capitalize">{ex.category}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ExerciseLibrary;