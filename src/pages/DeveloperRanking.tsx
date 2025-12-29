import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateTrustScore, getTierInfo, Developer } from '@/components/roi/developerTrustScore';
import { TierBadge } from '@/components/roi/TierBadge';
import { DeveloperInfoModal } from '@/components/roi/DeveloperInfoModal';
import { Building2, Trophy, ChevronUp, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SortField = 'rank' | 'name' | 'score';
type SortDirection = 'asc' | 'desc';

const DeveloperRanking: React.FC = () => {
  useDocumentTitle('Developer Ranking');
  const { language } = useLanguage();
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const fetchDevelopers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .order('name');

      if (!error && data) {
        setDevelopers(data as Developer[]);
      }
      setLoading(false);
    };

    fetchDevelopers();
  }, []);

  // Calculate scores and sort
  const rankedDevelopers = React.useMemo(() => {
    const withScores = developers.map(dev => ({
      ...dev,
      trustScore: calculateTrustScore(dev),
      tier: getTierInfo(calculateTrustScore(dev)),
    }));

    // Sort by score descending to assign ranks
    const sortedByScore = [...withScores].sort((a, b) => b.trustScore - a.trustScore);
    const withRanks = sortedByScore.map((dev, index) => ({
      ...dev,
      rank: index + 1,
    }));

    // Apply user sorting
    return withRanks.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'score':
          comparison = b.trustScore - a.trustScore;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [developers, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4" /> 
      : <ChevronDown className="w-4 h-4" />;
  };

  const handleRowClick = (developerId: string) => {
    setSelectedDeveloperId(developerId);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'es' ? 'Ranking de Developers' : 'Developer Ranking'}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {language === 'es' 
              ? 'Clasificación basada en nuestro sistema de Trust Score ponderado'
              : 'Ranking based on our weighted Trust Score system'
            }
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead 
                  className="w-20 cursor-pointer"
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center gap-1">
                    Rank
                    <SortIcon field="rank" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Developer
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead className="w-48">Tier</TableHead>
                <TableHead 
                  className="w-32 text-right cursor-pointer"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Score
                    <SortIcon field="score" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedDevelopers.map((dev) => (
                <TableRow 
                  key={dev.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(dev.id)}
                >
                  <TableCell>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted font-bold text-lg">
                      #{dev.rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {dev.logo_url ? (
                        <img 
                          src={dev.logo_url} 
                          alt={dev.name}
                          className="w-10 h-10 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{dev.name}</p>
                        {dev.flagship_project && (
                          <p className="text-xs text-muted-foreground">{dev.flagship_project}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TierBadge score={dev.trustScore} variant="default" />
                  </TableCell>
                  <TableCell className="text-right">
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: dev.tier.color }}
                    >
                      {dev.trustScore.toFixed(1)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-semibold mb-3 text-foreground">
            {language === 'es' ? 'Guía de Tiers' : 'Tier Guide'}
          </h3>
          <div className="flex flex-wrap gap-4">
            {[
              { score: 9.5, label: language === 'es' ? 'Lujo, Seguridad Total' : 'Luxury, Total Security' },
              { score: 8.5, label: language === 'es' ? 'Sólido, Sin fallos' : 'Solid, No failures' },
              { score: 7.0, label: language === 'es' ? 'Ideal para inversión agresiva' : 'Ideal for aggressive investment' },
              { score: 5.5, label: language === 'es' ? 'Promedio de mercado' : 'Market average' },
              { score: 4.0, label: language === 'es' ? 'Requiere análisis' : 'Requires analysis' },
            ].map(({ score, label }) => (
              <div key={score} className="flex items-center gap-2">
                <TierBadge score={score} variant="compact" showTooltip={false} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Developer Modal */}
      <DeveloperInfoModal
        developerId={selectedDeveloperId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default DeveloperRanking;