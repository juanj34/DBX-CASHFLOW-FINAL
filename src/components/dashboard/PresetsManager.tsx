import { useState } from "react";
import { TrendingUp, Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppreciationPresets, PresetValues, AppreciationPreset } from "@/hooks/useAppreciationPresets";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const defaultFormData = {
  name: "",
  constructionAppreciation: 12,
  growthAppreciation: 8,
  matureAppreciation: 4,
  growthPeriodYears: 5,
  rentGrowthRate: 4,
};

const PresetsManager = () => {
  const { t } = useLanguage();
  const { presets, loading, saving, savePreset, updatePreset, deletePreset } = useAppreciationPresets();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<AppreciationPreset | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const resetFormData = () => setFormData(defaultFormData);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: t('nameRequired'),
        description: t('pleaseEnterPresetName'),
        variant: "destructive",
      });
      return;
    }

    const values: PresetValues = {
      constructionAppreciation: formData.constructionAppreciation,
      growthAppreciation: formData.growthAppreciation,
      matureAppreciation: formData.matureAppreciation,
      growthPeriodYears: formData.growthPeriodYears,
      rentGrowthRate: formData.rentGrowthRate,
    };

    const success = await savePreset(formData.name, values);
    if (success) {
      setCreateOpen(false);
      resetFormData();
    }
  };

  const handleEdit = (preset: AppreciationPreset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      constructionAppreciation: preset.construction_appreciation,
      growthAppreciation: preset.growth_appreciation,
      matureAppreciation: preset.mature_appreciation,
      growthPeriodYears: preset.growth_period_years,
      rentGrowthRate: preset.rent_growth_rate ?? 4,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPreset || !formData.name.trim()) {
      toast({
        title: t('nameRequired'),
        description: t('pleaseEnterPresetName'),
        variant: "destructive",
      });
      return;
    }

    const values: PresetValues = {
      constructionAppreciation: formData.constructionAppreciation,
      growthAppreciation: formData.growthAppreciation,
      matureAppreciation: formData.matureAppreciation,
      growthPeriodYears: formData.growthPeriodYears,
      rentGrowthRate: formData.rentGrowthRate,
    };

    const success = await updatePreset(editingPreset.id, formData.name, values);
    if (success) {
      setEditOpen(false);
      setEditingPreset(null);
      resetFormData();
    }
  };

  const handleDelete = async (id: string) => {
    await deletePreset(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-theme-accent/20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-theme-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-theme-text">{t('appreciationPresets')}</h2>
            <p className="text-theme-text-muted">{t('appreciationPresetsDesc')}</p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90 gap-2">
              <Plus className="w-4 h-4" />
              {t('createPreset')}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-theme-card border-theme-border text-theme-text">
            <DialogHeader>
              <DialogTitle className="text-theme-text">{t('createAppreciationPreset')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs text-theme-text-muted">{t('presetName')}</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('presetNamePlaceholder')}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-theme-text-muted">{t('constructionAppreciation')} (%)</label>
                  <Input
                    type="number"
                    value={formData.constructionAppreciation}
                    onChange={(e) => setFormData(prev => ({ ...prev, constructionAppreciation: parseFloat(e.target.value) || 0 }))}
                    className="bg-theme-bg border-theme-border text-theme-text"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-theme-text-muted">{t('growthAppreciation')} (%)</label>
                  <Input
                    type="number"
                    value={formData.growthAppreciation}
                    onChange={(e) => setFormData(prev => ({ ...prev, growthAppreciation: parseFloat(e.target.value) || 0 }))}
                    className="bg-theme-bg border-theme-border text-theme-text"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-theme-text-muted">{t('matureAppreciation')} (%)</label>
                  <Input
                    type="number"
                    value={formData.matureAppreciation}
                    onChange={(e) => setFormData(prev => ({ ...prev, matureAppreciation: parseFloat(e.target.value) || 0 }))}
                    className="bg-theme-bg border-theme-border text-theme-text"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-theme-text-muted">{t('growthPeriod')} ({t('years')})</label>
                  <Input
                    type="number"
                    value={formData.growthPeriodYears}
                    onChange={(e) => setFormData(prev => ({ ...prev, growthPeriodYears: parseInt(e.target.value) || 5 }))}
                    className="bg-theme-bg border-theme-border text-theme-text"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs text-theme-text-muted">{t('rentGrowthRate')} (%)</label>
                  <Input
                    type="number"
                    value={formData.rentGrowthRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, rentGrowthRate: parseFloat(e.target.value) || 0 }))}
                    className="bg-theme-bg border-theme-border text-theme-text"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="border-theme-border text-theme-text hover:bg-theme-card-alt"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={saving}
                  className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('savePreset')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-theme-accent" />
        </div>
      ) : presets.length === 0 ? (
        <div className="text-center py-12 bg-theme-card rounded-xl border border-theme-border">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-theme-text-muted" />
          <h3 className="text-lg font-medium text-theme-text mb-2">{t('noPresetsYet')}</h3>
          <p className="text-theme-text-muted mb-4">{t('createFirstPreset')}</p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('createYourFirstPreset')}
          </Button>
        </div>
      ) : (
        <div className="bg-theme-card rounded-xl border border-theme-border overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="text-left text-xs font-medium text-theme-text-muted p-4">{t('name')}</th>
                <th className="text-center text-xs font-medium text-theme-text-muted p-4">{t('constructionPercent')}</th>
                <th className="text-center text-xs font-medium text-theme-text-muted p-4">{t('growthPercent')}</th>
                <th className="text-center text-xs font-medium text-theme-text-muted p-4">{t('maturePercent')}</th>
                <th className="text-center text-xs font-medium text-theme-text-muted p-4">{t('growthPeriod')}</th>
                <th className="text-center text-xs font-medium text-theme-text-muted p-4">{t('rentGrowth')}</th>
                <th className="text-right text-xs font-medium text-theme-text-muted p-4">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((preset) => (
                <tr key={preset.id} className="border-b border-theme-border last:border-0 hover:bg-theme-card-alt">
                  <td className="p-4">
                    <span className="font-medium text-theme-text">{preset.name}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-theme-accent font-medium">{preset.construction_appreciation}%</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-theme-accent-secondary font-medium">{preset.growth_appreciation}%</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-theme-text">{preset.mature_appreciation}%</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-theme-text">{preset.growth_period_years} {t('yrs')}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-theme-text">{preset.rent_growth_rate ?? 0}%</span>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(preset)}
                      className="text-theme-text-muted hover:text-theme-accent-secondary hover:bg-theme-accent-secondary/10 h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(preset.id)}
                      className="text-theme-text-muted hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open);
        if (!open) {
          setEditingPreset(null);
          resetFormData();
        }
      }}>
        <DialogContent className="bg-theme-card border-theme-border text-theme-text">
          <DialogHeader>
            <DialogTitle className="text-theme-text">{t('editAppreciationPreset')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-xs text-theme-text-muted">{t('presetName')}</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('presetNamePlaceholder')}
                className="bg-theme-bg border-theme-border text-theme-text"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-theme-text-muted">{t('constructionAppreciation')} (%)</label>
                <Input
                  type="number"
                  value={formData.constructionAppreciation}
                  onChange={(e) => setFormData(prev => ({ ...prev, constructionAppreciation: parseFloat(e.target.value) || 0 }))}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-theme-text-muted">{t('growthAppreciation')} (%)</label>
                <Input
                  type="number"
                  value={formData.growthAppreciation}
                  onChange={(e) => setFormData(prev => ({ ...prev, growthAppreciation: parseFloat(e.target.value) || 0 }))}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-theme-text-muted">{t('matureAppreciation')} (%)</label>
                <Input
                  type="number"
                  value={formData.matureAppreciation}
                  onChange={(e) => setFormData(prev => ({ ...prev, matureAppreciation: parseFloat(e.target.value) || 0 }))}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-theme-text-muted">{t('growthPeriod')} ({t('years')})</label>
                <Input
                  type="number"
                  value={formData.growthPeriodYears}
                  onChange={(e) => setFormData(prev => ({ ...prev, growthPeriodYears: parseInt(e.target.value) || 5 }))}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs text-theme-text-muted">{t('rentGrowthRate')} (%)</label>
                <Input
                  type="number"
                  value={formData.rentGrowthRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rentGrowthRate: parseFloat(e.target.value) || 0 }))}
                  className="bg-theme-bg border-theme-border text-theme-text"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                className="border-theme-border text-theme-text hover:bg-theme-card-alt"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={saving}
                className="bg-theme-accent text-theme-accent-foreground hover:bg-theme-accent/90"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('updatePreset')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresetsManager;
