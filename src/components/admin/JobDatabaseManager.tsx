import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Database, Trash2, Settings, AlertTriangle } from 'lucide-react';

interface RepairStats {
  runsChecked: number;
  relevantRuns: number;
  jobsInMapping: number;
  jobsInDatabase: number;
  jobsNeedingUpdate: number;
  jobsActuallyUpdated: number;
  dryRun: boolean;
}

interface RepairExample {
  id: string;
  oldTitle: string;
  newTitle: string;
  apifyJobId: string;
}

export const JobDatabaseManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [repairStats, setRepairStats] = useState<RepairStats | null>(null);
  const [repairExamples, setRepairExamples] = useState<RepairExample[]>([]);
  const { toast } = useToast();

  const handleRepairTitles = async (dryRun: boolean = true) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('repair-job-titles', {
        body: { dryRun }
      });

      if (error) throw error;

      if (data.success) {
        setRepairStats(data.stats);
        setRepairExamples(data.examples || []);
        
        toast({
          title: dryRun ? "Repair Analysis Complete" : "Repair Complete",
          description: data.message,
        });
      } else {
        throw new Error(data.message || 'Repair failed');
      }
    } catch (error) {
      console.error('Error repairing job titles:', error);
      toast({
        title: "Error",
        description: "Failed to repair job titles. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBadJobs = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cached_jobs')
        .delete()
        .lt('quality_score', 3);

      if (error) throw error;

      toast({
        title: "Cleanup Complete",
        description: "Deleted all jobs with quality score below 3",
      });
    } catch (error) {
      console.error('Error deleting bad jobs:', error);
      toast({
        title: "Error",
        description: "Failed to delete bad jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Job Database Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Repair Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Title Repair</h3>
          <p className="text-sm text-muted-foreground">
            Attempt to fix job titles using recent Apify dataset data
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleRepairTitles(true)}
              disabled={loading}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              {loading ? 'Analyzing...' : 'Analyze (Dry Run)'}
            </Button>
            
            <Button
              onClick={() => handleRepairTitles(false)}
              disabled={loading || !repairStats}
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {loading ? 'Repairing...' : 'Execute Repair'}
            </Button>
          </div>

          {repairStats && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Repair Analysis Results</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Apify Runs Found: <Badge variant="outline">{repairStats.runsChecked}</Badge></div>
                <div>Recent Runs: <Badge variant="outline">{repairStats.relevantRuns}</Badge></div>
                <div>Jobs in Database: <Badge variant="outline">{repairStats.jobsInDatabase}</Badge></div>
                <div>Jobs Needing Update: <Badge variant="destructive">{repairStats.jobsNeedingUpdate}</Badge></div>
                <div>Jobs Actually Updated: <Badge variant="default">{repairStats.jobsActuallyUpdated}</Badge></div>
                <div>Mode: <Badge variant={repairStats.dryRun ? "secondary" : "default"}>{repairStats.dryRun ? "Dry Run" : "Live"}</Badge></div>
              </div>
              
              {repairExamples.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Example Updates:</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {repairExamples.slice(0, 5).map((example, index) => (
                      <div key={index} className="text-xs bg-background p-2 rounded border">
                        <div className="text-red-600">Old: {example.oldTitle}</div>
                        <div className="text-green-600">New: {example.newTitle}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cleanup Section */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold">Database Cleanup</h3>
          <p className="text-sm text-muted-foreground">
            Remove jobs with low quality scores (below 3)
          </p>
          
          <Button
            onClick={handleDeleteBadJobs}
            disabled={loading}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Low Quality Jobs
          </Button>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800">Important Notes:</p>
              <ul className="list-disc list-inside text-yellow-700 mt-1 space-y-1">
                <li>Always run "Analyze" first to see what changes will be made</li>
                <li>Recent Apify datasets may not be available (they expire)</li>
                <li>Quality score validation is now enforced for new jobs</li>
                <li>The search function now filters out invalid job titles automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};