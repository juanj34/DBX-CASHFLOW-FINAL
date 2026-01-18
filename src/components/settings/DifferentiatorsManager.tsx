import { useState } from 'react';
import { Sparkles, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCustomDifferentiators, CustomDifferentiatorInput } from '@/hooks/useCustomDifferentiators';
import { CATEGORY_LABELS, DifferentiatorCategory } from '@/components/roi/valueDifferentiators';
import { Badge } from '@/components/ui/badge';

interface DifferentiatorsManagerProps {
  language: 'en' | 'es';
}

export const DifferentiatorsManager = ({ language }: DifferentiatorsManagerProps) => {
  const { customDifferentiators, loading, saving, createDifferentiator, deleteDifferentiator } = useCustomDifferentiators();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CustomDifferentiatorInput>({
    name: '',
    category: 'custom',
    impactsAppreciation: false,
    appreciationBonus: 0.2,
    tooltip: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'custom',
      impactsAppreciation: false,
      appreciationBonus: 0.2,
      tooltip: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    
    await createDifferentiator(formData);
    setShowCreateDialog(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm(language === 'es' ? '¿Eliminar este diferenciador?' : 'Delete this differentiator?')) {
      await deleteDifferentiator(id);
    }
  };

  const getCategoryColor = (category: DifferentiatorCategory) => {
    switch (category) {
      case 'location': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'unit': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'developer': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'transport': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'financial': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'amenities': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'custom': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-theme-card border-theme-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-theme-accent" />
            <CardTitle className="text-lg font-semibold text-theme-text">
              {language === 'es' ? 'Diferenciadores Personalizados' : 'Custom Value Differentiators'}
            </CardTitle>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            {language === 'es' ? 'Crear' : 'Create'}
          </Button>
        </div>
        <CardDescription className="text-theme-text-muted">
          {language === 'es' 
            ? 'Crea diferenciadores personalizados. Los nombres se traducirán automáticamente.'
            : 'Create custom differentiators. Names will be auto-translated.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-accent" />
          </div>
        ) : customDifferentiators.length === 0 ? (
          <div className="text-center py-8 text-theme-text-muted">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {language === 'es' 
                ? 'No tienes diferenciadores personalizados aún.'
                : 'You don\'t have any custom differentiators yet.'}
            </p>
            <p className="text-xs mt-1">
              {language === 'es' 
                ? 'Crea uno para agregarlo a tus cotizaciones.'
                : 'Create one to add it to your quotes.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {customDifferentiators.map((diff) => (
              <div
                key={diff.id}
                className="flex items-center justify-between p-3 bg-theme-bg-alt rounded-lg border border-theme-border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-theme-text">
                        {diff.name}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${getCategoryColor(diff.category)}`}>
                        {CATEGORY_LABELS[diff.category]?.[language === 'es' ? 'es' : 'en'] || diff.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {diff.impactsAppreciation ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +{diff.appreciationBonus}% {language === 'es' ? 'apreciación' : 'appreciation'}
                        </span>
                      ) : (
                        <span className="text-xs text-theme-text-muted">
                          {language === 'es' ? 'Solo visualización' : 'Display only'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(diff.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  disabled={saving}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-theme-card border-theme-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-theme-text">
                {language === 'es' ? 'Crear Diferenciador' : 'Create Differentiator'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm text-theme-text">
                  {language === 'es' ? 'Nombre' : 'Name'} *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={language === 'es' ? 'ej. Vista a la Piscina' : 'e.g., Pool View'}
                  className="bg-theme-bg-alt border-theme-border text-theme-text"
                />
                <p className="text-xs text-theme-text-muted">
                  {language === 'es' 
                    ? 'Ingresa el nombre en tu idioma preferido. Se traducirá automáticamente.'
                    : 'Enter name in your preferred language. It will be auto-translated.'}
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm text-theme-text">
                  {language === 'es' ? 'Categoría' : 'Category'}
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as DifferentiatorCategory })}
                >
                  <SelectTrigger className="bg-theme-bg-alt border-theme-border text-theme-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-card border-theme-border">
                    {Object.entries(CATEGORY_LABELS).map(([key, labels]) => (
                      <SelectItem key={key} value={key}>
                        {language === 'es' ? labels.es : labels.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Impacts Appreciation */}
              <div className="flex items-center justify-between p-3 bg-theme-bg-alt rounded-lg">
                <div>
                  <div className="text-sm text-theme-text">
                    {language === 'es' ? '¿Impacta Apreciación?' : 'Impacts Appreciation?'}
                  </div>
                  <div className="text-xs text-theme-text-muted">
                    {language === 'es' 
                      ? 'Si está activo, agrega un bono de apreciación.'
                      : 'If active, adds an appreciation bonus.'}
                  </div>
                </div>
                <Switch
                  checked={formData.impactsAppreciation}
                  onCheckedChange={(checked) => setFormData({ ...formData, impactsAppreciation: checked })}
                />
              </div>

              {/* Appreciation Bonus */}
              {formData.impactsAppreciation && (
                <div className="space-y-2 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-theme-text">
                      {language === 'es' ? 'Bono de Apreciación' : 'Appreciation Bonus'}
                    </label>
                    <span className="text-sm text-green-400 font-mono font-medium">
                      +{formData.appreciationBonus.toFixed(1)}%
                    </span>
                  </div>
                  <Slider
                    value={[formData.appreciationBonus * 10]}
                    onValueChange={([value]) => setFormData({ ...formData, appreciationBonus: value / 10 })}
                    min={1}
                    max={10}
                    step={1}
                    className="roi-slider-lime"
                  />
                  <div className="flex justify-between text-xs text-theme-text-muted">
                    <span>0.1%</span>
                    <span>1.0%</span>
                  </div>
                </div>
              )}

              {/* Tooltip/Description */}
              <div className="space-y-2">
                <label className="text-sm text-theme-text">
                  {language === 'es' ? 'Descripción (opcional)' : 'Description (optional)'}
                </label>
                <Input
                  value={formData.tooltip}
                  onChange={(e) => setFormData({ ...formData, tooltip: e.target.value })}
                  placeholder={language === 'es' ? 'Breve explicación...' : 'Brief explanation...'}
                  className="bg-theme-bg-alt border-theme-border text-theme-text"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setShowCreateDialog(false); resetForm(); }}
                className="border-theme-border text-theme-text"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name.trim() || saving}
                className="bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
              >
                {saving 
                  ? (language === 'es' ? 'Creando...' : 'Creating...') 
                  : (language === 'es' ? 'Crear' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
