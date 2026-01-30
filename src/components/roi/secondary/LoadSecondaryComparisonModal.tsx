import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderOpen, Search, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { SecondaryComparison } from '@/hooks/useSecondaryComparisons';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { formatCurrency } from '@/components/roi/currencyUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LoadSecondaryComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparisons: SecondaryComparison[];
  loading: boolean;
  onLoad: (comparison: SecondaryComparison) => void;
  onDelete: (id: string) => void;
  language?: 'en' | 'es';
}

export const LoadSecondaryComparisonModal = ({
  open,
  onOpenChange,
  comparisons,
  loading,
  onLoad,
  onDelete,
  language = 'es',
}: LoadSecondaryComparisonModalProps) => {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const t = language === 'es' ? {
    title: 'Cargar Comparación',
    searchPlaceholder: 'Buscar por título...',
    noComparisons: 'No hay comparaciones guardadas',
    createFirst: 'Crea tu primera comparación para verla aquí',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    confirmDelete: '¿Eliminar comparación?',
    confirmDeleteDesc: 'Esta acción no se puede deshacer.',
    ago: 'hace',
  } : {
    title: 'Load Comparison',
    searchPlaceholder: 'Search by title...',
    noComparisons: 'No saved comparisons',
    createFirst: 'Create your first comparison to see it here',
    delete: 'Delete',
    cancel: 'Cancel',
    confirmDelete: 'Delete comparison?',
    confirmDeleteDesc: 'This action cannot be undone.',
    ago: 'ago',
  };

  const filteredComparisons = comparisons.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-theme-card border-theme-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-theme-text flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-theme-accent" />
              {t.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="pl-10 bg-theme-bg border-theme-border text-theme-text"
              />
            </div>

            {/* List */}
            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredComparisons.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 mx-auto text-theme-text-muted mb-3" />
                  <p className="text-theme-text font-medium">{t.noComparisons}</p>
                  <p className="text-sm text-theme-text-muted mt-1">{t.createFirst}</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredComparisons.map(comparison => (
                    <Card
                      key={comparison.id}
                      className="p-3 bg-theme-bg/50 border-theme-border hover:border-theme-accent/50 cursor-pointer transition-colors group"
                      onClick={() => {
                        onLoad(comparison);
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-theme-text truncate">
                            {comparison.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">
                              {formatCurrency(comparison.secondary_inputs.purchasePrice, 'AED', 1)}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] ${
                                comparison.rental_mode === 'airbnb' 
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              }`}
                            >
                              {comparison.rental_mode === 'airbnb' ? '🏖️ Airbnb' : '🏠 Long-Term'}
                            </Badge>
                            <span className="text-[10px] text-theme-text-muted flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(comparison.updated_at), { 
                                addSuffix: true,
                                locale: language === 'es' ? es : enUS 
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-theme-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(comparison.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <ChevronRight className="w-4 h-4 text-theme-text-muted group-hover:text-theme-accent transition-colors" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-theme-card border-theme-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-theme-text">{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription className="text-theme-text-muted">
              {t.confirmDeleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-theme-border text-theme-text">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
